import { admin } from './firebase'

const NOTIFY_LEAD_MS = 60 * 60 * 1000 // notify 1 hour before the deadline
// Cron runs every ~5 minutes; the window is wider so a late/missed run still
// catches tasks. Duplicates are prevented by the `notifiedAt` field.
const CHECK_WINDOW_MS = 15 * 60 * 1000
const PH_OFFSET_MS = 8 * 60 * 60 * 1000

// Task deadlines are stored as "YYYY-MM-DDTHH:MM" (or with seconds) with NO
// timezone info — they're always meant to be Philippines local time (UTC+8).
// On a server, new Date() would read that string as UTC, so we force +08:00.
function parseDeadlineAsPHTime(deadline: string): number {
  // Already has explicit timezone info (Z or +/-HH:MM) — trust it as-is.
  if (/Z$|[+-]\d{2}:\d{2}$/.test(deadline)) {
    return new Date(deadline).getTime()
  }
  const withSeconds = deadline.length <= 16 ? `${deadline}:00` : deadline
  return new Date(`${withSeconds}+08:00`).getTime()
}

// Formats an epoch time as a PH-local "YYYY-MM-DDTHH:MM" string, the same
// shape the deadlines are stored in, so they can be compared as strings.
function toPHLocalMinute(ms: number): string {
  return new Date(ms + PH_OFFSET_MS).toISOString().slice(0, 16)
}

// ── CHECK TASK DEADLINES ──────────────────────────────────────────────────
// Called every ~5 minutes by POST /internal/check-deadlines. Finds tasks whose
// "due in 1 hour" mark fell inside the recent window and that haven't been
// notified yet, then pushes via FCM to every device the owner registered.
//
// The Firestore query only fetches tasks whose deadline is in the matching
// range (instead of scanning every non-done task of every user).
// REQUIRES a collection-group index on tasks.deadline (see firestore.indexes.json).
export async function runCheckTaskDeadlines() {
  const now = Date.now()

  // deadline - 1h must be in [now - window, now]  =>  deadline in [now + 1h - window, now + 1h]
  const lower = toPHLocalMinute(now + NOTIFY_LEAD_MS - CHECK_WINDOW_MS)
  const upper = `${toPHLocalMinute(now + NOTIFY_LEAD_MS)}:59` // :59 so "HH:MM:SS" values at the edge are included

  const snap = await admin.firestore()
    .collectionGroup('tasks')
    .where('deadline', '>=', lower)
    .where('deadline', '<=', upper)
    .get()

  console.log(`[checkTaskDeadlines] ${snap.size} candidate tasks in range ${lower} .. ${upper}`)

  const windowStart = now - CHECK_WINDOW_MS
  const windowEnd = now
  let notified = 0

  for (const taskDoc of snap.docs) {
    const task = taskDoc.data() as {
      name?: string
      deadline?: string
      uid?: string
      status?: string
      notifiedAt?: number | null
    }

    if (task.status === 'done') continue
    if (task.notifiedAt) continue // already notified for this task
    if (!task.deadline) continue

    // users/{uid}/tasks/{taskId}: fall back to the path if `uid` isn't on the doc.
    const uid = task.uid ?? taskDoc.ref.parent.parent?.id
    if (!uid) continue

    const deadlineMs = parseDeadlineAsPHTime(task.deadline)
    if (isNaN(deadlineMs)) continue

    const notifyAt = deadlineMs - NOTIFY_LEAD_MS
    if (notifyAt < windowStart || notifyAt > windowEnd) continue

    try {
      const tokensSnap = await admin.firestore()
        .collection('users').doc(uid).collection('fcmTokens')
        .get()

      const tokens = tokensSnap.docs.map((d) => d.id)
      if (tokens.length === 0) {
        console.log(`[checkTaskDeadlines] no fcm tokens for uid ${uid}, skipping task ${taskDoc.id}`)
        continue
      }

      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title: '⏰ Task Due Soon!',
          body: `"${task.name ?? 'A task'}" is due in 1 hour.`,
        },
        data: {
          taskId: taskDoc.id,
          deadline: task.deadline,
        },
      })

      console.log(`[checkTaskDeadlines] task ${taskDoc.id}: sent ${response.successCount}/${tokens.length}`)

      // Prune dead tokens (uninstalled, cleared data, etc.)
      const deletions: Promise<unknown>[] = []
      response.responses.forEach((result, i) => {
        if (!result.success) {
          const code = result.error?.code
          if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
            deletions.push(
              admin.firestore().collection('users').doc(uid).collection('fcmTokens').doc(tokens[i]).delete()
            )
          }
        }
      })
      if (deletions.length > 0) await Promise.all(deletions)

      await taskDoc.ref.update({ notifiedAt: now })
      notified++
    } catch (err) {
      // One bad task shouldn't stop the rest of the batch
      console.error(`checkTaskDeadlines: failed to process task ${taskDoc.id}`, err)
    }
  }

  return { candidates: snap.size, notified }
}
