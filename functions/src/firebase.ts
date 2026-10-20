import * as admin from 'firebase-admin'
import { config } from './config'

/**
 * Parses FIREBASE_SERVICE_ACCOUNT. Accepts either the raw JSON of the
 * service account key, or that same JSON encoded as base64 (handy if your
 * hosting panel mangles quotes or newlines in env values).
 */
function parseServiceAccount(raw: string): admin.ServiceAccount {
  const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')
  try {
    return JSON.parse(text) as admin.ServiceAccount
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON (or base64-encoded JSON).')
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(parseServiceAccount(config.firebaseServiceAccount)),
  })
}

export { admin }