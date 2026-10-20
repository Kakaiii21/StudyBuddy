import { useEffect, useState, useCallback, useRef } from 'react'
import { useMemo } from 'react'
import {
  fetchRecentlyDeleted,
  restoreItem,
  permanentDelete,
  type DeletedItem,
  type DeletedItemType,
} from '../services/recentlyDeletedService'
import { useAuth } from './useAuth'

async function deleteFromCloudinary(publicId: string, fileType?: string): Promise<void> {
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp']
  const resourceType = imageExts.includes(fileType ?? '') ? 'image' : 'raw'

  console.log('[DELETE ATTEMPT] publicId:', publicId, '| resourceType:', resourceType)

  const res = await fetch('https://us-central1-study-buddy-cbaa8.cloudfunctions.net/deleteCloudinaryAsset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicId, resourceType }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to delete from Cloudinary')
  }

  console.log('[DELETE SUCCESS]')
}

type State = {
  items: DeletedItem[]
  loading: boolean
  error: string | null
}

const CACHE_KEY_PREFIX = 'recently_deleted_'
const cacheKey = (uid: string) => `${CACHE_KEY_PREFIX}${uid}`

function readCache(uid: string): DeletedItem[] | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(uid))
    if (!raw) return null
    return JSON.parse(raw) as DeletedItem[]
  } catch {
    return null
  }
}

function writeCache(uid: string, items: DeletedItem[]) {
  try {
    sessionStorage.setItem(cacheKey(uid), JSON.stringify(items))
  } catch {
    // sessionStorage full or unavailable — fail silently, cache is best-effort
  }
}

// Cheap fingerprint so we can skip a re-render/write when nothing actually changed.
// Sorted by id so ordering differences from the backend don't cause false positives.
function fingerprint(items: DeletedItem[]): string {
  return JSON.stringify(
    [...items]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((i) => ({ id: i.id, type: i.type, data: i.data }))
  )
}

export function useRecentlyDeleted() {
  const { user } = useAuth()
  const uid = user?.uid

  // Seed synchronously from cache on first render so there's no loading flash
  // when we already have something to show.
  const [state, setState] = useState<State>(() => {
    if (!uid) return { items: [], loading: true, error: null }
    const cached = readCache(uid)
    return cached
      ? { items: cached, loading: false, error: null }
      : { items: [], loading: true, error: null }
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [restoreError, setRestoreError] = useState<string | null>(null)

  // Tracks the fingerprint of what's currently in state/cache so a background
  // revalidation can bail out without touching state (and re-rendering) when
  // nothing changed.
  const lastFingerprint = useRef<string | null>(state.items.length ? fingerprint(state.items) : null)

  const load = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (!uid) return
      const hasCache = lastFingerprint.current !== null

      // Only show the loading spinner when we truly have nothing to show yet.
      if (!hasCache && !opts.silent) {
        setState((prev) => ({ ...prev, loading: true }))
      }

      try {
        const data = await fetchRecentlyDeleted(uid)
        const fp = fingerprint(data)

        if (fp === lastFingerprint.current) {
          // Nothing new or updated — skip the state update/re-render entirely.
          setState((prev) => (prev.loading ? { ...prev, loading: false } : prev))
          return
        }

        lastFingerprint.current = fp
        writeCache(uid, data)
        setState({ items: data, loading: false, error: null })
      } catch {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: hasCache ? prev.error : 'Failed to load recently deleted items.',
        }))
      }
    },
    [uid]
  )

  useEffect(() => {
    // If we rendered from cache, revalidate silently in the background.
    // Otherwise this is a normal loading fetch.
    load({ silent: lastFingerprint.current !== null })
  }, [load])

  const handleRestore = useCallback(
    async (item: DeletedItem) => {
      if (!uid) return
      setActionLoading(item.id)
      setRestoreError(null)
      try {
        await restoreItem(uid, item)
        setState((prev) => {
          const items = prev.items.filter((i) => i.id !== item.id)
          lastFingerprint.current = fingerprint(items)
          writeCache(uid, items)
          return { ...prev, items }
        })
        // ✅ No storage change on restore — file was never removed from Cloudinary
        // so storageUsed was never decremented and should not be incremented here
      } catch {
        setRestoreError('Failed to restore item. Please try again.')
      } finally {
        setActionLoading(null)
      }
    },
    [uid]
  )

  const handlePermanentDelete = useCallback(
    async (item: DeletedItem) => {
      if (!uid) return
      setActionLoading(item.id)
      try {
        await permanentDelete(uid, item, (publicId) =>
          deleteFromCloudinary(publicId, item.data?.fileType as string)
        )

        // ✅ Only decrement storage on permanent delete (file is truly gone from Cloudinary)
        if (item.data?.fileSize) {
          const sizeStr = String(item.data.fileSize).trim().toLowerCase().replace(/\s/g, '')
          let bytes = 0
          if (sizeStr.endsWith('mb')) bytes = parseFloat(sizeStr) * 1024 * 1024
          else if (sizeStr.endsWith('kb')) bytes = parseFloat(sizeStr) * 1024
          else if (sizeStr.endsWith('gb')) bytes = parseFloat(sizeStr) * 1024 * 1024 * 1024
          else bytes = parseFloat(sizeStr)

          if (!isNaN(bytes) && bytes > 0) {
            // ✅ setDoc with merge:true works even if storageUsed field doesn't exist yet
            // unlike updateDoc which silently fails on an empty/new document
            const { doc, setDoc, increment } = await import('firebase/firestore')
            const { db } = await import('../services/firebase')
            await setDoc(doc(db, 'users', uid), {
              storageUsed: increment(-bytes)
            }, { merge: true })
          }
        }

        setState((prev) => {
          const items = prev.items.filter((i) => i.id !== item.id)
          lastFingerprint.current = fingerprint(items)
          writeCache(uid, items)
          return { ...prev, items }
        })
      } catch {
        setState((prev) => ({ ...prev, error: 'Failed to permanently delete item.' }))
      } finally {
        setActionLoading(null)
      }
    },
    [uid]
  )

  const filteredByType = useCallback(
    (type: DeletedItemType) => state.items.filter((i) => i.type === type),
    [state.items]
  )

  const orphanedFileIds = useMemo(() => {
    const deletedFolderIds = new Set(
      state.items
        .filter(i => i.type === 'Course' && !i.data?.fileUrl)
        .map(i => i.originalDocId)
    )
    return new Set(
      state.items
        .filter(i => i.type === 'Course' && i.data?.fileUrl)
        .filter(i => {
          const parts = i.originalCollection.split('/')
          const courseId = parts[3]
          return deletedFolderIds.has(courseId)
        })
        .map(i => i.id)
    )
  }, [state.items])

  // Force a real refetch that always re-renders, e.g. for a manual "Refresh" button.
  const reload = useCallback(() => {
    lastFingerprint.current = null
    return load()
  }, [load])

  return {
    items: state.items,
    orphanedFileIds,
    loading: state.loading,
    error: state.error,
    restoreError,
    clearRestoreError: () => setRestoreError(null),
    actionLoading,
    handleRestore,
    handlePermanentDelete,
    filteredByType,
    reload,
  }
}