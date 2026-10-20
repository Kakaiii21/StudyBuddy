// Plain Express handlers. They are registered as routes in server.ts.
import type { Request, Response } from 'express'
import { admin } from './firebase'
import Busboy from 'busboy'
import axios from 'axios'
import { config, apiLink, frontendLink } from './config'
import { getUid } from './middleware'
import { extractText } from './extractText'
import { acquireCooldown, releaseCooldown } from './rateLimit'
import { createTicket, cancelTicket, dispatchNext } from './queue'
import { estimateMaxItems, getTextSample, detectSourceLang, estimateTokens } from './promptBuilder'
import { emailTemplate, actionButton } from './emailHelpers'
import { sendEmail } from './mailer'
import { deactivateAccountCore } from './accountActions'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** An error that should be reported to the client with a specific status. */
class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

type Mode = 'quiz' | 'flashcard'
const ALLOWED_FILE_TYPES = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt']
const MAX_ITEMS = 50
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface UploadInput {
  fileBuffer: Buffer
  fileType: string
  fileName?: string
  mode: Mode
  numItems: number
}

function parseMultipart(req: Request): Promise<UploadInput> {
  return new Promise((resolve, reject) => {
    const bb = Busboy({
      headers: req.headers,
      defParamCharset: 'utf8',
      limits: { fileSize: config.maxUploadBytes, files: 1 },
    })
    let fileType = ''
    let fileNameFromFile: string | undefined
    let fileNameField: string | undefined
    let mode: Mode = 'quiz'
    let numItems = 10
    let tooLarge = false
    const chunks: Buffer[] = []

    bb.on('file', (_field: string, stream: NodeJS.ReadableStream, info: { filename: string }) => {
      fileNameFromFile = info.filename
      fileType = info.filename.split('.').pop()?.toLowerCase() ?? ''
      stream.on('data', (chunk: Buffer) => chunks.push(chunk))
      stream.on('limit', () => { tooLarge = true })
    })
    bb.on('field', (name: string, value: string) => {
      if (name === 'mode' && (value === 'quiz' || value === 'flashcard')) mode = value
      if (name === 'numItems') { const n = parseInt(value, 10); if (!isNaN(n)) numItems = n }
      if (name === 'fileName' && value) fileNameField = value
    })
    bb.on('finish', () => {
      if (tooLarge) {
        return reject(new HttpError(400, `File size exceeds ${Math.round(config.maxUploadBytes / 1024 / 1024)}MB. Please upload a smaller file.`))
      }
      if (chunks.length === 0) return reject(new HttpError(400, 'No file found in request'))
      resolve({
        fileBuffer: Buffer.concat(chunks),
        fileType,
        fileName: fileNameField ?? fileNameFromFile,
        mode,
        numItems,
      })
    })
    bb.on('error', reject)
    req.pipe(bb)
  })
}

function assertAllowedFileUrl(rawUrl: string): void {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new HttpError(400, 'Invalid fileUrl.')
  }
  if (url.protocol !== 'https:' || !config.allowedFileHosts.includes(url.hostname)) {
    throw new HttpError(400, 'File location is not allowed.')
  }
}

async function readUpload(req: Request): Promise<UploadInput> {
  const contentType = req.headers['content-type'] || ''

  if (contentType.includes('multipart/form-data')) {
    return parseMultipart(req)
  }

  if (contentType.includes('application/json')) {
    const body = (req.body ?? {}) as {
      fileUrl?: string
      fileType?: string
      fileName?: string
      mode?: string
      numItems?: number
    }
    if (!body.fileUrl || !body.fileType) throw new HttpError(400, 'fileUrl and fileType are required.')
    if (body.mode !== undefined && body.mode !== 'quiz' && body.mode !== 'flashcard') {
      throw new HttpError(400, 'Invalid mode.')
    }
    assertAllowedFileUrl(body.fileUrl)

    let data: ArrayBuffer
    try {
      const response = await axios.get(body.fileUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxContentLength: config.maxUploadBytes,
        maxRedirects: 3,
        beforeRedirect: (options: { hostname?: string }) => {
          if (!config.allowedFileHosts.includes(String(options.hostname))) {
            throw new Error('Redirect to a disallowed host')
          }
        },
      })
      data = response.data
    } catch {
      throw new HttpError(400, 'Could not download the file. Please try again.')
    }

    return {
      fileBuffer: Buffer.from(data),
      fileType: body.fileType.toLowerCase(),
      fileName: body.fileName,
      mode: (body.mode as Mode) ?? 'quiz',
      numItems: body.numItems ?? 10,
    }
  }

  throw new HttpError(400, 'Unsupported content type.')
}

function errorStatus(err: unknown): number {
  return err instanceof HttpError ? err.status : 500
}

/** Safely reads an error's `code` (e.g. 'auth/user-not-found') from an unknown value. */
function errorCode(e: unknown): string | undefined {
  return typeof e === 'object' && e !== null && 'code' in e
    ? String((e as { code: unknown }).code)
    : undefined
}

// ── ENQUEUE (fast: extracts text, validates, creates ticket, returns) ───────
export async function enqueueStudyMaterial(req: Request, res: Response): Promise<void> {
  const callerUid = getUid(res)
  const cooldownKey = `generateStudyMaterial:${callerUid}`
  let lockAcquired = false
  let succeeded = false

  try {
    const cooldown = await acquireCooldown(cooldownKey, 120)
    if (!cooldown.allowed) {
      res.status(429).json({
        error: `Please wait ${cooldown.retryAfter}s before generating again.`,
        retryAfter: cooldown.retryAfter,
      })
      return
    }
    lockAcquired = true

    const { fileBuffer, fileType, fileName, mode, numItems } = await readUpload(req)

    if (!ALLOWED_FILE_TYPES.includes(fileType)) {
      res.status(400).json({ error: 'Unsupported file type. Please upload PDF, DOC, DOCX, PPT, PPTX, or TXT.' })
      return
    }
    if (!Number.isInteger(numItems) || numItems < 1 || numItems > MAX_ITEMS) {
      res.status(400).json({ error: `Number of items must be between 1 and ${MAX_ITEMS}.` })
      return
    }

    const rawText = await extractText(fileBuffer, fileType)
    if (!rawText || rawText.trim().length < 50) {
      res.status(400).json({ error: 'Could not extract enough text from the file.' })
      return
    }

    const estimatedMax = estimateMaxItems(rawText, mode)
    if (numItems > estimatedMax) {
      res.status(400).json({
        error: `The file may not have enough content for ${numItems} ${mode === 'quiz' ? 'questions' : 'flashcards'}. Try ${estimatedMax} or fewer.`,
        suggested_max: estimatedMax,
      })
      return
    }

    const textSample = getTextSample(rawText)
    const sourceLang = detectSourceLang(textSample)

    const estimatedTokens = estimateTokens(textSample)
    const MAX_SAFE_INPUT_TOKENS = 6000
    if (estimatedTokens > MAX_SAFE_INPUT_TOKENS) {
      res.status(400).json({ error: 'This file has too much text to process in one request. Try a shorter file.' })
      return
    }

    const { ticketId, position } = await createTicket({
      userId: callerUid,
      mode,
      numItems,
      textSample,
      sourceLang,
      fileName,
      estimatedTokens,
    })

    succeeded = true
    res.status(200).json({ ticketId, position })

    // Best-effort speed-up. The cron job (/internal/dispatch) is the safety net.
    dispatchNext().catch((e) => console.error('dispatchNext error:', e))
  } catch (err: unknown) {
    console.error('enqueueStudyMaterial error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    if (!res.headersSent) res.status(errorStatus(err)).json({ error: message })
  } finally {
    // Only release a lock WE took. (Releasing after a 429 would wipe the
    // active cooldown and let the user skip it.)
    if (lockAcquired) {
      await releaseCooldown(cooldownKey, succeeded)
    }
  }
}

// ── CANCEL ────────────────────────────────────────────────────────────────
export async function cancelStudyMaterialTicket(req: Request, res: Response): Promise<void> {
  try {
    const { ticketId } = (req.body ?? {}) as { ticketId?: string }
    if (!ticketId) { res.status(400).json({ error: 'ticketId is required.' }); return }

    const result = await cancelTicket(ticketId, getUid(res))
    if (!result.ok) { res.status(400).json({ error: result.reason }); return }
    res.status(200).json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
}

// ── SEND PASSWORD RESET ──────────────────────────────────────────────────────
export async function sendPasswordReset(req: Request, res: Response): Promise<void> {
  try {
    const { email } = (req.body ?? {}) as { email?: string }
    if (!email) {
      res.status(400).json({ error: 'Email is required', code: 'auth/invalid-email' })
      return
    }

    try {
      await admin.auth().getUserByEmail(email)
    } catch (e: unknown) {
      if (errorCode(e) === 'auth/user-not-found') {
        res.status(404).json({ error: 'Email not found.', code: 'auth/user-not-found' })
        return
      }
      res.status(400).json({ error: 'Invalid email format.', code: 'auth/invalid-email' })
      return
    }

    const resetLink = await admin.auth().generatePasswordResetLink(email, {
      url: frontendLink('/'),
    })
    await sendEmail({
      to: email,
      subject: 'Reset your Study Buddy password',
      html: emailTemplate(`
        <p style="font-size:16px; margin-bottom:8px;">Hello there! 👋</p>
        <p style="font-size:15px; line-height:1.6; color:#444;">
          We received a request to reset the password for your <strong style="color:#195791;">Study Buddy</strong> account associated with <strong style="color:#195791;">${email}</strong>.
        </p>
        <p style="font-size:15px; line-height:1.6; color:#444;">Click the button below to reset your password. This link will expire shortly.</p>
        ${actionButton(resetLink, 'Reset Password')}
      `),
    })
    res.status(200).json({ success: true })
  } catch (err: unknown) {
    console.error('sendPasswordReset error:', err)
    const error = err as { code?: string; message?: string }
    res.status(500).json({
      error: error.message || 'Internal server error',
      code: error.code || 'auth/unknown',
    })
  }
}

// ── SEND VERIFICATION EMAIL ──────────────────────────────────────────────────
export async function sendVerificationEmail(req: Request, res: Response): Promise<void> {
  const { email } = (req.body ?? {}) as { email?: string }
  if (!email) { res.status(400).json({ error: 'Email is required' }); return }

  const cooldownKey = `sendVerificationEmail:${email}`
  let lockAcquired = false
  let succeeded = false
  try {
    const cooldown = await acquireCooldown(cooldownKey, 60)
    if (!cooldown.allowed) {
      res.status(429).json({
        error: `Please wait ${cooldown.retryAfter}s before requesting another verification email.`,
        code: 'auth/too-many-requests',
      })
      return
    }
    lockAcquired = true

    const verifyLink = await admin.auth().generateEmailVerificationLink(email, {
      url: frontendLink('/'),
    })
    await sendEmail({
      to: email,
      subject: 'Verify your Study Buddy email',
      html: emailTemplate(`
        <p style="font-size:16px; margin-bottom:8px;">Hello there! 👋</p>
        <p style="font-size:15px; line-height:1.6; color:#444;">
          Thanks for signing up for <strong style="color:#195791;">Study Buddy</strong>! Please verify your email address <strong style="color:#195791;">${email}</strong> to get started.
        </p>
        ${actionButton(verifyLink, 'Verify Email')}
      `),
    })
    succeeded = true
    res.status(200).json({ success: true })
  } catch (err: unknown) {
    console.error('sendVerificationEmail error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  } finally {
    if (lockAcquired) {
      await releaseCooldown(cooldownKey, succeeded)
    }
  }
}

// ── CHECK EMAIL STATUS ───────────────────────────────────────────────────────
export async function checkEmailStatus(req: Request, res: Response): Promise<void> {
  try {
    const { email } = (req.body ?? {}) as { email?: string }
    if (!email) { res.status(400).json({ error: 'Email is required' }); return }

    try {
      const userRecord = await admin.auth().getUserByEmail(email)
      res.status(200).json({ exists: true, verified: userRecord.emailVerified })
    } catch {
      res.status(200).json({ exists: false, verified: false })
    }
  } catch (err: unknown) {
    console.error('checkEmailStatus error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
}

// ── SEND CHANGE EMAIL (requires a Firebase ID token; uid comes from the token) ─
export async function sendChangeEmail(req: Request, res: Response): Promise<void> {
  try {
    const uid = getUid(res)
    const { newEmail } = (req.body ?? {}) as { newEmail?: string }
    if (!newEmail) { res.status(400).json({ error: 'newEmail is required' }); return }
    if (!EMAIL_REGEX.test(newEmail)) {
      res.status(400).json({ error: 'Invalid email format.', code: 'auth/invalid-email' })
      return
    }

    const userRecord = await admin.auth().getUser(uid)
    if (!userRecord.email) { res.status(400).json({ error: 'User has no email' }); return }

    try {
      const existing = await admin.auth().getUserByEmail(newEmail)
      if (existing.uid !== uid) {
        res.status(400).json({ error: 'This email is already in use by another account.', code: 'auth/email-already-in-use' })
        return
      }
    } catch (e: unknown) {
      if (errorCode(e) !== 'auth/user-not-found') throw e
    }

    await admin.firestore().doc(`users/${uid}`).update({ pendingEmail: newEmail })

    const crypto = await import('crypto')

    const verifyToken = crypto.randomBytes(32).toString('hex')
    const cancelToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = Date.now() + 1000 * 60 * 60

    await admin.firestore().doc(`emailChangeTokens/${verifyToken}`).set({
      uid,
      newEmail,
      oldEmail: userRecord.email,
      cancelToken,
      expiresAt,
    })

    await admin.firestore().doc(`emailCancelTokens/${cancelToken}`).set({
      uid,
      newEmail,
      oldEmail: userRecord.email,
      verifyToken,
      expiresAt,
    })

    const verifyLink = apiLink(`/confirmEmailChange?token=${verifyToken}`)
    const cancelLink = apiLink(`/cancelEmailChange?token=${cancelToken}`)

    await sendEmail({
      to: newEmail,
      subject: 'Verify your new Study Buddy email',
      html: emailTemplate(`
        <p style="font-size:16px; margin-bottom:8px;">Hello there! 👋</p>
        <p style="font-size:15px; line-height:1.6; color:#444;">
          We received a request to update the email address on your <strong style="color:#195791;">Study Buddy</strong> account to <strong style="color:#195791;">${newEmail}</strong>.
        </p>
        <p style="font-size:15px; line-height:1.6; color:#444;">Click the button below to verify your new email address. This link expires in 1 hour.</p>
        ${actionButton(verifyLink, 'Verify New Email')}
      `),
    })

    await sendEmail({
      to: userRecord.email,
      subject: 'Your Study Buddy email address is being changed',
      html: emailTemplate(`
        <p style="font-size:16px; margin-bottom:8px;">Hello there! 👋</p>
        <p style="font-size:15px; line-height:1.6; color:#444;">
          A request was made to change the email on your <strong style="color:#195791;">Study Buddy</strong> account to <strong style="color:#195791;">${newEmail}</strong>.
        </p>
        <p style="font-size:15px; line-height:1.6; color:#444;">
          If this was you, no action is needed — just verify via the email sent to <strong>${newEmail}</strong>.
        </p>
        <p style="font-size:15px; line-height:1.6; color:#444;">
          If you did <strong>not</strong> request this, click below to cancel the change and keep your current email.
        </p>
        ${actionButton(cancelLink, 'Cancel Email Change')}
      `),
    })

    res.status(200).json({ success: true })
  } catch (err: unknown) {
    console.error('sendChangeEmail error:', err)
    const error = err as { code?: string; message?: string }
    res.status(500).json({
      error: error.message || 'Internal server error',
      code: error.code || 'auth/unknown',
    })
  }
}

// ── CONFIRM CHANGE EMAIL ─────────────────────────────────────────────────────
export async function confirmEmailChange(req: Request, res: Response): Promise<void> {
  const token = typeof req.query.token === 'string' ? req.query.token : ''

  if (!token) {
    res.status(400).send('Missing token.')
    return
  }

  try {
    const tokenDoc = await admin.firestore().doc(`emailChangeTokens/${token}`).get()

    if (!tokenDoc.exists) {
      res.status(400).send('Invalid or already used verification link.')
      return
    }

    const { uid, newEmail, oldEmail, cancelToken, expiresAt } = tokenDoc.data()!

    if (Date.now() > expiresAt) {
      await tokenDoc.ref.delete()
      res.status(400).send('This verification link has expired. Please request a new one.')
      return
    }

    await admin.auth().updateUser(uid, { email: newEmail, emailVerified: true })

    await admin.firestore().doc(`users/${uid}`).update({
      email: newEmail,
      pendingEmail: admin.firestore.FieldValue.delete(),
    })

    if (cancelToken) {
      await admin.firestore().doc(`emailCancelTokens/${cancelToken}`).update({
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
        confirmed: true,
      })
    }

    await tokenDoc.ref.delete()

    if (oldEmail && cancelToken) {
      const cancelLink = apiLink(`/cancelEmailChange?token=${cancelToken}`)

      await sendEmail({
        to: oldEmail,
        subject: 'Your Study Buddy email has been changed',
        html: emailTemplate(`
          <p style="font-size:16px; margin-bottom:8px;">Heads up! ⚠️</p>
          <p style="font-size:15px; line-height:1.6; color:#444;">
            The email on your <strong style="color:#195791;">Study Buddy</strong> account has been changed from <strong style="color:#195791;">${oldEmail}</strong> to <strong style="color:#195791;">${newEmail}</strong>.
          </p>
          <p style="font-size:15px; line-height:1.6; color:#444;">
            If this was you, no action is needed.
          </p>
          <p style="font-size:15px; line-height:1.6; color:#444;">
            If you did <strong>not</strong> do this, click below to revert to your original email immediately. This link is valid for <strong>7 days</strong>.
          </p>
          ${actionButton(cancelLink, 'Undo Email Change')}
        `),
      }).catch((e) => console.error('confirmEmailChange: failed to notify old email:', e))
    }

    res.redirect(frontendLink('/?emailUpdated=true'))
  } catch (err) {
    console.error('confirmEmailChange error:', err)
    res.status(500).send('Something went wrong. Please try again.')
  }
}

// ── CANCEL EMAIL CHANGE ──────────────────────────────────────────────────────
export async function cancelEmailChange(req: Request, res: Response): Promise<void> {
  const token = typeof req.query.token === 'string' ? req.query.token : ''

  if (!token) {
    res.status(400).send('Missing token.')
    return
  }

  try {
    const cancelDoc = await admin.firestore().doc(`emailCancelTokens/${token}`).get()

    if (!cancelDoc.exists) {
      res.redirect(frontendLink('/?cancelResult=already-used'))
      return
    }

    const { uid, oldEmail, verifyToken, expiresAt, confirmed } = cancelDoc.data()!

    if (Date.now() > expiresAt) {
      await cancelDoc.ref.delete()
      res.redirect(frontendLink('/?cancelResult=expired'))
      return
    }

    if (confirmed) {
      await admin.auth().updateUser(uid, {
        email: oldEmail,
        emailVerified: true,
      })

      await admin.firestore().doc(`users/${uid}`).update({
        email: oldEmail,
        pendingEmail: admin.firestore.FieldValue.delete(),
      })
    } else {
      await admin.firestore().doc(`users/${uid}`).update({
        pendingEmail: admin.firestore.FieldValue.delete(),
      })

      if (verifyToken) {
        await admin.firestore().doc(`emailChangeTokens/${verifyToken}`).delete()
      }
    }

    await cancelDoc.ref.delete()

    res.redirect(frontendLink('/?cancelResult=success'))
  } catch (err) {
    console.error('cancelEmailChange error:', err)
    res.status(500).send('Something went wrong. Please try again.')
  }
}

// ── DEACTIVATE ACCOUNT ───────────────────────────────────────────────────────
export async function deactivateAccount(_req: Request, res: Response): Promise<void> {
  try {
    await deactivateAccountCore(getUid(res), 'self')
    res.status(200).json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
}

// ── REACTIVATE ACCOUNT ───────────────────────────────────────────────────────
export async function reactivateAccount(_req: Request, res: Response): Promise<void> {
  try {
    const uid = getUid(res)
    const userRef = admin.firestore().doc(`users/${uid}`)
    const snap = await userRef.get()
    const data = snap.data()
    if (data?.status !== 'deactivated') { res.status(400).json({ error: 'Account is not deactivated.' }); return }

    if (data.deactivationReason === 'security_flag') {
      res.status(403).json({
        error: `This account was paused for a security review. Please contact ${config.supportEmail} to reactivate.`,
      })
      return
    }

    const thirtyDaysMs = 1000 * 60 * 60 * 24 * 30
    if (Date.now() - data.deactivatedAt > thirtyDaysMs) {
      res.status(410).json({ error: 'Reactivation window has expired.' })
      return
    }
    await userRef.update({
      status: 'active',
      deactivatedAt: admin.firestore.FieldValue.delete(),
      deactivationReason: admin.firestore.FieldValue.delete(),
      deletionWarningsSent: admin.firestore.FieldValue.delete(),
    })
    res.status(200).json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
}

// ── Cron runners (called from /internal/* routes in server.ts) ───────────────
export async function runDispatch() {
  const processed = await dispatchNext()
  return { processed }
}
export { runCheckTaskDeadlines } from './checkTaskDeadlines'
export { runWarnPendingDeletions, runCleanupDeactivatedAccounts } from './cleanup'