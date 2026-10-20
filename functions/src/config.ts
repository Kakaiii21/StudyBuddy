import 'dotenv/config'

/**
 * Central configuration. Every address and secret comes from environment
 * variables, so moving domains later means editing a value in hPanel and
 * restarting the app - no code changes.
 */

const REQUIRED = [
  'FIREBASE_SERVICE_ACCOUNT',
  'API_BASE_URL',
  'FRONTEND_URL',
  'CRON_SECRET',
  'GROQ_API_KEY',
  'RESEND_API_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'CLOUDINARY_WEBHOOK_API_KEY',
  'CLOUDINARY_WEBHOOK_API_SECRET',
] as const

const missing = REQUIRED.filter((k) => !process.env[k]?.trim())
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
}

function env(name: string, fallback = ''): string {
  return (process.env[name] ?? fallback).trim()
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

function list(value: string): string[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

const frontendUrl = stripTrailingSlash(env('FRONTEND_URL'))
const apiBaseUrl = stripTrailingSlash(env('API_BASE_URL'))

export const config = {
  port: Number(env('PORT', '3000')),
  nodeEnv: env('NODE_ENV', 'production'),

  /** Where the backend lives (used in email links and the Cloudinary webhook URL). */
  apiBaseUrl,
  /** Where users land (email logo/buttons, redirects after email confirm/cancel). */
  frontendUrl,
  /** Sites allowed to call this API (CORS). Defaults to the frontend URL. */
  allowedOrigins: list(env('ALLOWED_ORIGINS', frontendUrl)).map(stripTrailingSlash),

  supportEmail: env('SUPPORT_EMAIL', 'support@studybuddyph.site'),
  emailFrom: env('EMAIL_FROM', 'Study Buddy <support@studybuddyph.site>'),

  firebaseServiceAccount: env('FIREBASE_SERVICE_ACCOUNT'),
  cronSecret: env('CRON_SECRET'),

  groqApiKey: env('GROQ_API_KEY'),
  resendApiKey: env('RESEND_API_KEY'),

  cloudinary: {
    cloudName: env('CLOUDINARY_CLOUD_NAME'),
    apiKey: env('CLOUDINARY_API_KEY'),
    apiSecret: env('CLOUDINARY_API_SECRET'),
    webhookApiKey: env('CLOUDINARY_WEBHOOK_API_KEY'),
    webhookApiSecret: env('CLOUDINARY_WEBHOOK_API_SECRET'),
  },

  /** Max upload size in bytes (matches the 10MB limit in the frontend). */
  maxUploadBytes: Number(env('MAX_UPLOAD_MB', '10')) * 1024 * 1024,

  /**
   * Hosts the server is allowed to download course files from when the
   * frontend sends a fileUrl (prevents the server being used to fetch
   * arbitrary URLs).
   */
  allowedFileHosts: list(env('ALLOWED_FILE_HOSTS', 'res.cloudinary.com')),
}

/** Build a link into the frontend, e.g. frontendLink('/?emailUpdated=true'). */
export function frontendLink(path = '/'): string {
  return `${config.frontendUrl}${path.startsWith('/') ? path : `/${path}`}`
}

/** Build a link to this backend, e.g. apiLink('/confirmEmailChange?token=abc'). */
export function apiLink(path: string): string {
  return `${config.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`
}