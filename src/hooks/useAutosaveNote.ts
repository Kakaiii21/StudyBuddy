import { useRef, useCallback, useEffect } from 'react'
import type { User } from 'firebase/auth'

interface DraftFields {
  title: string
  subject: string
  content: string
}

const DEBOUNCE_MS = 800

export function useAutosaveNote(
  user: User | null,
  addNote: (title: string, subject: string, content: string) => Promise<string | undefined>,
  updateNote: (id: string, fields: Partial<DraftFields>) => void,
) {
  const noteIdRef = useRef<string | null>(null)
  const draftKeyRef = useRef<string>('new')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const creatingRef = useRef(false)
  const latestRef = useRef<DraftFields>({ title: '', subject: 'Uncategorized', content: '' })

  const localKey = useCallback(
    (id: string) => (user ? `sb_note_draft_${user.uid}_${id}` : null),
    [user],
  )

  /** Call when opening the "+" (new note) modal. */
  function startNew(initialSubject: string) {
    noteIdRef.current = null
    draftKeyRef.current = 'new'
    latestRef.current = { title: '', subject: initialSubject, content: '' }
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  /** Call when opening an existing note (view or edit). */
  function startExisting(id: string, fields: DraftFields) {
    noteIdRef.current = id
    draftKeyRef.current = id
    latestRef.current = fields
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  function persistLocal(fields: DraftFields) {
    const key = localKey(draftKeyRef.current)
    if (!key) return
    try {
      localStorage.setItem(key, JSON.stringify(fields))
    } catch {
      // localStorage can throw (quota, private mode) — Firestore's own
      // offline cache still backs us up, so this is non-fatal.
    }
  }

  function clearLocal(id: string) {
    const key = localKey(id)
    if (key) localStorage.removeItem(key)
  }

  async function syncRemote(fields: DraftFields) {
    const hasContent = fields.title.trim() !== '' || fields.content.trim() !== ''
    if (!hasContent) return

    if (!noteIdRef.current) {
      // Note doesn't exist yet — create it silently on first real content.
      if (creatingRef.current) return
      creatingRef.current = true
      try {
        const title = fields.title.trim() || 'Untitled'
        const id = await addNote(title, fields.subject, fields.content)
        if (id) {
          clearLocal('new')
          noteIdRef.current = id
          draftKeyRef.current = id
          persistLocal(fields)
        }
      } finally {
        creatingRef.current = false
      }
      return
    }

    updateNote(noteIdRef.current, {
      title: fields.title.trim() || 'Untitled',
      subject: fields.subject,
      content: fields.content,
    })
  }

    function cancelDraft(): string | null {
    if (timerRef.current) clearTimeout(timerRef.current)
    const id = noteIdRef.current
    clearLocal(draftKeyRef.current)
    noteIdRef.current = null
    return id
  }

  /** Call on every title/subject/content change. */
  function onFieldChange(fields: DraftFields) {
    latestRef.current = fields
    persistLocal(fields) // instant, offline-safe
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      void syncRemote(latestRef.current)
    }, DEBOUNCE_MS)
  }

  /** Call on modal close / unmount to force any pending write through immediately. */
  function flush() {
    if (timerRef.current) clearTimeout(timerRef.current)
    void syncRemote(latestRef.current)
  }

  /** Optional: recover an unsynced draft for a given note id (e.g. app was
   *  killed offline before the debounce fired). Call on note open if you
   *  want to offer "restore unsaved draft?" — not wired in by default. */
  function recoverDraft(id: string): DraftFields | null {
    const key = localKey(id)
    if (!key) return null
    const raw = localStorage.getItem(key)
    if (!raw) return null
    try {
      return JSON.parse(raw) as DraftFields
    } catch {
      return null
    }
  }

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { startNew, startExisting, onFieldChange, flush, recoverDraft, cancelDraft }
}