import { admin } from './firebase'

type LockResult = { allowed: boolean; retryAfter?: number }

/**
 * Atomically acquires a lock for `key`. Prevents double-submission while a
 * request is in flight, and enforces a cooldown only after a SUCCESSFUL run.
 * Call releaseCooldown() when the request finishes (success or failure) -
 * but only if acquireCooldown() returned allowed: true.
 */
export async function acquireCooldown(
  key: string,
  cooldownSeconds: number,
  maxProcessingSeconds = 240
): Promise<LockResult> {
  const ref = admin.firestore().doc(`rateLimits/${key}`)
  const now = Date.now()

  return admin.firestore().runTransaction(async (tx) => {
    const doc = await tx.get(ref)

    if (doc.exists) {
      const data = doc.data()!

      if (data.status === 'pending') {
        const pendingElapsed = (now - data.pendingSince) / 1000
        if (pendingElapsed < maxProcessingSeconds) {
          return { allowed: false, retryAfter: Math.ceil(maxProcessingSeconds - pendingElapsed) }
        }
      } else if (data.status === 'cooldown') {
        const elapsed = (now - data.lastRequest) / 1000
        if (elapsed < cooldownSeconds) {
          return { allowed: false, retryAfter: Math.ceil(cooldownSeconds - elapsed) }
        }
      }
    }

    tx.set(ref, { status: 'pending', pendingSince: now })
    return { allowed: true }
  })
}

export async function releaseCooldown(key: string, success: boolean): Promise<void> {
  const ref = admin.firestore().doc(`rateLimits/${key}`)
  if (success) {
    await ref.set({ status: 'cooldown', lastRequest: Date.now() })
  } else {
    await ref.delete().catch(() => {})
  }
}
