import { admin } from './firebase'
import { config } from './config'
import { callGroq } from './groqClient'
import { parseQuiz, parseFlashcards } from './parsers'
import { buildPrompt, shuffleQuizOptions } from './promptBuilder'

// Tuned from real Groq usage logs for openai/gpt-oss-20b (8K TPM, requests running
// ~5K tokens each) — one request at a time, ~40s apart, is what the plan can actually sustain.
const MAX_CONCURRENT = 1
const MIN_GAP_MS = 40 * 1000
const STALE_PROCESSING_MS = 90 * 1000 // self-heal if a worker crashed mid-request

const db = () => admin.firestore()
const QUEUE_STATE_REF = () => db().doc('system/groqQueue')
const TICKETS = () => db().collection('queueTickets')

export interface TicketInput {
  userId: string
  mode: 'quiz' | 'flashcard'
  numItems: number
  textSample: string
  sourceLang: string
  fileName?: string
  estimatedTokens: number
}

export interface TicketResult {
  ticketId: string
  ticketNumber: number
  position: number
}

// ── Create ──────────────────────────────────────────────────────────────────

export async function createTicket(input: TicketInput): Promise<TicketResult> {
  const ticketRef = TICKETS().doc()

  const ticketNumber = await db().runTransaction(async (tx) => {
    const stateDoc = await tx.get(QUEUE_STATE_REF())
    const state = stateDoc.exists ? stateDoc.data()! : { active: 0, nextTicketNumber: 1 }
    const num = state.nextTicketNumber ?? 1

    tx.set(QUEUE_STATE_REF(), { nextTicketNumber: num + 1, updatedAt: Date.now() }, { merge: true })
    tx.set(ticketRef, {
      userId: input.userId,
      status: 'waiting',
      ticketNumber: num,
      createdAt: Date.now(),
      mode: input.mode,
      numItems: input.numItems,
      textSample: input.textSample,
      sourceLang: input.sourceLang,
      fileName: input.fileName ?? null,
      estimatedTokens: input.estimatedTokens,
    })
    return num
  })

  const position = await getQueuePosition(ticketNumber)
  return { ticketId: ticketRef.id, ticketNumber, position }
}

// ── Position lookup (used by the enqueue response; client also listens live) ─

export async function getQueuePosition(ticketNumber: number): Promise<number> {
  const ahead = await TICKETS()
    .where('status', 'in', ['waiting', 'processing'])
    .where('ticketNumber', '<', ticketNumber)
    .count()
    .get()
  return ahead.data().count + 1
}

// ── Cancel ──────────────────────────────────────────────────────────────────

export async function cancelTicket(ticketId: string, userId: string): Promise<{ ok: boolean; reason?: string }> {
  const ref = TICKETS().doc(ticketId)
  return db().runTransaction(async (tx) => {
    const doc = await tx.get(ref)
    if (!doc.exists) return { ok: false, reason: 'Ticket not found.' }
    const data = doc.data()!
    if (data.userId !== userId) return { ok: false, reason: 'Not your ticket.' }
    if (data.status !== 'waiting') return { ok: false, reason: 'Already processing or finished — can no longer cancel.' }
    tx.update(ref, { status: 'cancelled', finishedAt: Date.now() })
    return { ok: true }
  })
}

// ── Dispatch ─────────────────────────────────────────────────────────────────
// Called (a) best-effort right after a ticket is created, and (b) every minute
// by the cron job hitting POST /internal/dispatch, which is the reliable path
// (there are no Firestore triggers outside Firebase). Returns true if a ticket
// was claimed and processed.

export async function dispatchNext(): Promise<boolean> {
  const claimed = await tryClaimNext()
  if (!claimed) return false
  await processTicket(claimed.ticketId, claimed.data)
  return true
}

async function tryClaimNext(): Promise<{ ticketId: string; data: FirebaseFirestore.DocumentData } | null> {
  await selfHealStuckTickets()

  const stateDoc = await QUEUE_STATE_REF().get()
  const state = stateDoc.exists ? stateDoc.data()! : { active: 0, lastCompletedAt: 0 }
  const active = Math.max(0, state.active ?? 0)
  if (active >= MAX_CONCURRENT) return null

  // Pacing gate: honor the TPM-driven minimum gap. We do NOT sleep here (a
  // sleeping request can be killed on shared hosting); we just return and let
  // the next cron tick (or the next enqueue) pick the ticket up.
  const gapRemaining = MIN_GAP_MS - (Date.now() - (state.lastCompletedAt ?? 0))
  if (gapRemaining > 0) return null

  const snap = await TICKETS().where('status', '==', 'waiting').orderBy('ticketNumber', 'asc').limit(1).get()
  if (snap.empty) return null
  const candidate = snap.docs[0]

  const claimedOk = await db().runTransaction(async (tx) => {
    const [freshTicket, freshState] = await Promise.all([tx.get(candidate.ref), tx.get(QUEUE_STATE_REF())])
    if (!freshTicket.exists || freshTicket.data()!.status !== 'waiting') return false
    const stateData = freshState.exists ? freshState.data()! : { active: 0 }
    const activeNow = Math.max(0, stateData.active ?? 0)
    if (activeNow >= MAX_CONCURRENT) return false

    tx.update(candidate.ref, { status: 'processing', startedAt: Date.now() })
    tx.set(QUEUE_STATE_REF(), { active: activeNow + 1, updatedAt: Date.now() }, { merge: true })
    return true
  })

  if (!claimedOk) return null
  const freshData = (await candidate.ref.get()).data()!
  return { ticketId: candidate.id, data: freshData }
}

async function selfHealStuckTickets(): Promise<void> {
  const cutoff = Date.now() - STALE_PROCESSING_MS
  const stuck = await TICKETS().where('status', '==', 'processing').where('startedAt', '<', cutoff).get()
  if (stuck.empty) return

  const batch = db().batch()
  stuck.docs.forEach((d) =>
    batch.update(d.ref, { status: 'failed', error: 'Processing timed out. Please try again.', finishedAt: Date.now() })
  )
  // Single-concurrency model: if anything was stuck, it's safe to reset active to 0.
  batch.set(QUEUE_STATE_REF(), { active: 0, updatedAt: Date.now() }, { merge: true })
  await batch.commit()
}

// ── Process a claimed ticket ─────────────────────────────────────────────────

async function processTicket(ticketId: string, data: FirebaseFirestore.DocumentData): Promise<void> {
  const ref = TICKETS().doc(ticketId)
  try {
    const apiKey = config.groqApiKey
    const prompt = buildPrompt(data.mode, data.numItems, data.textSample, data.sourceLang)
    const { text: aiResponse, usage } = await callGroq(prompt, apiKey)

    let items = data.mode === 'quiz' ? parseQuiz(aiResponse) : parseFlashcards(aiResponse)
    if (data.mode === 'quiz') items = shuffleQuizOptions(items)

    await ref.update({ status: 'done', result: { items, usage }, finishedAt: Date.now() })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed.'
    await ref.update({ status: 'failed', error: message, finishedAt: Date.now() })
  } finally {
    await db().runTransaction(async (tx) => {
      const stateDoc = await tx.get(QUEUE_STATE_REF())
      const active = stateDoc.exists ? Math.max(0, (stateDoc.data()!.active ?? 1) - 1) : 0
      tx.set(QUEUE_STATE_REF(), { active, lastCompletedAt: Date.now(), updatedAt: Date.now() }, { merge: true })
    })
    // Nothing to chain: the pacing gap (MIN_GAP_MS) has just restarted, so the
    // next ticket is picked up by the next cron tick (or a new enqueue).
  }
}