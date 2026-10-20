// IMPORTANT: config and firebase must load first (env vars + admin init).
import { config } from './config'
import './firebase'
import express, { type Request, type Response, type NextFunction } from 'express'
import { cors, requireAuth, requireCron } from './middleware'
import {
  enqueueStudyMaterial,
  cancelStudyMaterialTicket,
  sendPasswordReset,
  sendVerificationEmail,
  checkEmailStatus,
  sendChangeEmail,
  confirmEmailChange,
  cancelEmailChange,
  deactivateAccount,
  reactivateAccount,
  runDispatch,
  runCheckTaskDeadlines,
  runWarnPendingDeletions,
  runCleanupDeactivatedAccounts,
} from './index'
import { deleteCloudinaryAsset } from './deleteCloudinaryAsset'
import { cloudinaryModerationWebhook } from './moderationWebhook'

const app = express()

// Hostinger sits behind a proxy; trust it so req.ip / protocol are correct.
app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use(cors)

// Parse JSON bodies and keep the raw bytes (needed to verify the Cloudinary
// webhook signature). Multipart uploads are NOT parsed here; Busboy reads
// the request stream itself in enqueueStudyMaterial.
app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      ;(req as Request).rawBody = buf
    },
  })
)

// Wrap async handlers so a thrown error never crashes the process.
type Handler = (req: Request, res: Response) => Promise<void> | void
const h =
  (fn: Handler) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next)
  }

// ── Health check ─────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true })
})

// ── Public / user routes ─────────────────────────────────────────────────
app.post('/enqueueStudyMaterial', requireAuth, h(enqueueStudyMaterial))
app.post('/cancelStudyMaterialTicket', requireAuth, h(cancelStudyMaterialTicket))
app.post('/sendPasswordReset', h(sendPasswordReset))
app.post('/sendVerificationEmail', h(sendVerificationEmail))
app.post('/checkEmailStatus', h(checkEmailStatus))
app.post('/sendChangeEmail', requireAuth, h(sendChangeEmail))
app.get('/confirmEmailChange', h(confirmEmailChange))
app.get('/cancelEmailChange', h(cancelEmailChange))
app.post('/deactivateAccount', requireAuth, h(deactivateAccount))
app.post('/reactivateAccount', requireAuth, h(reactivateAccount))
app.post('/deleteCloudinaryAsset', requireAuth, h(deleteCloudinaryAsset))
app.post('/cloudinaryModerationWebhook', h(cloudinaryModerationWebhook))

// ── Cron-driven routes (replace Firebase schedules and Firestore triggers) ─
// Call these from hPanel > Cron Jobs with:
//   curl -fsS -X POST -H "x-cron-secret: $CRON_SECRET" --max-time 120 <API_BASE_URL>/internal/<name>
const cronRoute =
  (name: string, run: () => Promise<unknown>) =>
  [
    requireCron,
    h(async (_req, res) => {
      const started = Date.now()
      const result = await run()
      console.log(`[cron] ${name} finished in ${Date.now() - started}ms`)
      res.status(200).json({ ok: true, result: result ?? null })
    }),
  ] as const

app.post('/internal/dispatch', ...cronRoute('dispatch', runDispatch))
app.post('/internal/check-deadlines', ...cronRoute('check-deadlines', runCheckTaskDeadlines))
app.post('/internal/warn-deletions', ...cronRoute('warn-deletions', runWarnPendingDeletions))
app.post('/internal/cleanup', ...cronRoute('cleanup', runCleanupDeactivatedAccounts))

// ── 404 + error handling ─────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err)
  if (res.headersSent) return
  const message = err instanceof Error ? err.message : 'Internal server error'
  res.status(500).json({ error: message })
})

// Don't let a stray rejected promise take the whole app down.
process.on('unhandledRejection', (reason) => console.error('unhandledRejection:', reason))
process.on('uncaughtException', (err) => console.error('uncaughtException:', err))

app.listen(config.port, () => {
  console.log(`Study Buddy API listening on port ${config.port}`)
  console.log(`API_BASE_URL=${config.apiBaseUrl} FRONTEND_URL=${config.frontendUrl}`)
  console.log(`Allowed origins: ${config.allowedOrigins.join(', ')}`)
})
