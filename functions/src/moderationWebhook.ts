import type { Request, Response } from 'express'
import { createHash, timingSafeEqual } from 'crypto'
import { admin } from './firebase'
import { config } from './config'
import { destroyCloudinaryAsset } from './cloudinaryClient'
import { deactivateAccountCore } from './accountActions'

interface ModerationResultItem {
  kind: string
  status: 'approved' | 'rejected' | 'pending'
}

const MAX_SIGNATURE_AGE_SECONDS = 2 * 60 * 60 // Cloudinary's own default

async function findCourseFileDoc(uid: string, courseId: string, publicId: string) {
  const filesRef = admin.firestore()
    .collection('users').doc(uid)
    .collection('courses').doc(courseId)
    .collection('files')
  const snap = await filesRef.where('publicId', '==', publicId).limit(1).get()
  return snap.empty ? null : snap.docs[0]
}

/**
 * Verifies Cloudinary's notification signature: hash(rawBody + timestamp + apiSecret).
 * Cloudinary signs with SHA-1 or SHA-256 depending on account settings, and
 * with the API secret of the key pair that triggered the notification, so we
 * accept either algorithm and either of our two secrets.
 */
function isValidSignature(rawBody: string, timestamp: string, signature: string): boolean {
  const ts = Number(timestamp)
  if (!Number.isFinite(ts)) return false
  if (Math.abs(Date.now() / 1000 - ts) > MAX_SIGNATURE_AGE_SECONDS) return false

  const secrets = [config.cloudinary.webhookApiSecret, config.cloudinary.apiSecret]
  const provided = Buffer.from(signature, 'utf8')

  for (const secret of secrets) {
    for (const algo of ['sha1', 'sha256'] as const) {
      const expected = Buffer.from(
        createHash(algo).update(rawBody + timestamp + secret).digest('hex'),
        'utf8'
      )
      if (expected.length === provided.length && timingSafeEqual(expected, provided)) return true
    }
  }
  return false
}

export async function cloudinaryModerationWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.get('x-cld-signature')
  const timestamp = req.get('x-cld-timestamp')
  if (!signature || !timestamp) { res.status(400).send('Missing signature headers'); return }

  const rawBody = Buffer.isBuffer(req.rawBody)
    ? req.rawBody.toString('utf8')
    : JSON.stringify(req.body)

  if (!isValidSignature(rawBody, timestamp, signature)) {
    console.warn('cloudinaryModerationWebhook: invalid signature, ignoring')
    res.status(401).send('Invalid signature')
    return
  }

  try {
    const { public_id, moderation_status, moderation_response } = req.body as {
      public_id: string
      moderation_status: 'approved' | 'rejected' | 'pending'
      moderation_response?: ModerationResultItem[]
    }
    if (!public_id) { res.status(400).send('Missing public_id'); return }

    const parts = public_id.split('/')
    const isProfile = parts[0] === 'users' && parts[2]?.startsWith('profile_')
    const isCourseFile = parts[0] === 'users' && parts[2] === 'courses'

    if (!isProfile && !isCourseFile) {
      console.warn('Unrecognized public_id pattern, ignoring:', public_id)
      res.status(200).send('ignored')
      return
    }

    const uid = parts[1]
    const db = admin.firestore()

    if (moderation_status === 'approved') {
      if (isProfile) {
        await db.doc(`users/${uid}`).update({ photoModerationStatus: 'approved' })
      } else {
        const courseId = parts[3]
        const fileDoc = await findCourseFileDoc(uid, courseId, public_id)
        await fileDoc?.ref.update({ moderationStatus: 'approved' })
      }
      res.status(200).send('ok')
      return
    }

    if (moderation_status !== 'rejected') {
      res.status(200).send('ok') // still pending
      return
    }

    // ── rejected ───────────────────────────────────────────────────────
    const failedChecks = (moderation_response ?? [])
      .filter((m) => m.status === 'rejected')
      .map((m) => m.kind)
    const isMalware = failedChecks.includes('perception_point')

    let rejectedFileName: string | undefined

    if (isProfile) {
      await destroyCloudinaryAsset(public_id, 'image', true).catch((e) =>
        console.error('Failed to delete rejected profile photo:', e)
      )
      await db.doc(`users/${uid}`).update({
        photoModerationStatus: 'rejected',
        photoURL: null,
        photoPublicId: null,
      })
    } else {
      const courseId = parts[3]
      const fileDoc = await findCourseFileDoc(uid, courseId, public_id)
      if (fileDoc) {
        const data = fileDoc.data() as { fileType?: string; fileSizeBytes?: number; fileName?: string }
        rejectedFileName = data.fileName
        const resourceType = ['png', 'jpg', 'jpeg'].includes(data.fileType ?? '') ? 'image' : 'raw'
        await destroyCloudinaryAsset(public_id, resourceType, true).catch((e) =>
          console.error('Failed to delete rejected course file:', e)
        )
        await fileDoc.ref.delete()
        await db.doc(`users/${uid}/courses/${courseId}`).update({
          fileCount: admin.firestore.FieldValue.increment(-1),
        })
        if (data.fileSizeBytes) {
          await db.doc(`users/${uid}`).update({
            storageUsed: admin.firestore.FieldValue.increment(-data.fileSizeBytes),
          })
        }
      }
    }

    // Notify the user in-app for non-malware rejections (explicit content, etc).
    // Malware cases already get an email via deactivateAccountCore, so we skip
    // a duplicate toast notification there.
    if (!isMalware) {
      await db.collection(`users/${uid}/notifications`).add({
        type: 'content_rejected',
        context: isProfile ? 'profile_photo' : 'course_file',
        fileName: rejectedFileName ?? null,
        createdAt: Date.now(),
        read: false,
      })
    }

    if (isMalware) {
      await deactivateAccountCore(uid, 'security_flag')
    }

    res.status(200).send('ok')
  } catch (err) {
    console.error('cloudinaryModerationWebhook error:', err)
    res.status(200).send('error-logged')
  }
}
