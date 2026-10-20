import type { Request, Response, NextFunction } from 'express'
import { createHash, timingSafeEqual } from 'crypto'
import * as admin from 'firebase-admin'
import { config } from './config'

// Express doesn't keep the raw request body by default. The Cloudinary
// webhook signature check needs it (server.ts fills it in).
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      rawBody?: Buffer
    }
  }
}

// ── CORS ─────────────────────────────────────────────────────────────────
// Only the origins in ALLOWED_ORIGINS may call the API from a browser.
// Requests with no Origin header (cron jobs, webhooks, email-link clicks)
// are not browser cross-origin calls and pass through.
export function cors(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin
  if (origin && (config.allowedOrigins.includes('*') || config.allowedOrigins.includes(origin))) {
    res.set('Access-Control-Allow-Origin', origin)
    res.set('Vary', 'Origin')
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.set('Access-Control-Max-Age', '600')
  }
  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }
  next()
}

// ── Firebase ID token auth ───────────────────────────────────────────────
// On success the verified uid is available as res.locals.uid.
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized. Please log in and try again.' })
    return
  }
  try {
    const decoded = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1])
    res.locals.uid = decoded.uid
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired session. Please log in again.' })
  }
}

export function getUid(res: Response): string {
  return res.locals.uid as string
}

// ── Cron secret auth ─────────────────────────────────────────────────────
// Cron jobs call /internal/* with the header: x-cron-secret: <CRON_SECRET>
function sha256(value: string): Buffer {
  return createHash('sha256').update(value).digest()
}

export function requireCron(req: Request, res: Response, next: NextFunction): void {
  const provided = req.get('x-cron-secret') ?? ''
  if (!provided || !timingSafeEqual(sha256(provided), sha256(config.cronSecret))) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}
