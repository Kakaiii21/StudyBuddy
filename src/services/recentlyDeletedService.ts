import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const RETENTION_DAYS = 30

export type DeletedItemType =
  | 'To Do'
  | 'Notes'
  | 'Class Schedule'
  | 'Course'
  | 'Quiz'
  | 'Flashcard'

export interface DeletedItem {
  id: string
  name: string
  type: DeletedItemType
  deletedAt: Timestamp
  originalCollection: string
  originalDocId: string
  cloudinaryPublicId?: string
  cloudinaryUrl?: string
  data: Record<string, unknown>
}

// ─── Soft Delete ─────────────────────────────────────────────────────────────
export async function softDelete(
  uid: string,
  params: {
    name: string
    type: DeletedItemType
    originalCollection: string
    originalDocId: string
    cloudinaryPublicId?: string
    cloudinaryUrl?: string
    data: Record<string, unknown>
  }
): Promise<void> {
  const ref = collection(db, 'users', uid, 'recentlyDeleted')
  await addDoc(ref, {
    name: params.name,
    type: params.type,
    deletedAt: Timestamp.now(),
    originalCollection: params.originalCollection,
    originalDocId: params.originalDocId,
    cloudinaryPublicId: params.cloudinaryPublicId ?? null,
    cloudinaryUrl: params.cloudinaryUrl ?? null,
    data: params.data,
  })

  await deleteDoc(doc(db, params.originalCollection, params.originalDocId))
  // ✅ No storageUsed change — file still exists on Cloudinary
}

// ─── Fetch Recently Deleted ───────────────────────────────────────────────────
export async function fetchRecentlyDeleted(uid: string): Promise<DeletedItem[]> {
  const ref = collection(db, 'users', uid, 'recentlyDeleted')
  const snap = await getDocs(ref)

  const now = Date.now()
  const expiredIds: string[] = []
  const items: DeletedItem[] = []

  snap.forEach((d) => {
    const raw = d.data()
    const deletedAt = raw.deletedAt as Timestamp
    const ageMs = now - deletedAt.toMillis()
    const ageDays = ageMs / (1000 * 60 * 60 * 24)

    if (ageDays >= RETENTION_DAYS) {
      expiredIds.push(d.id)
    } else {
      items.push({ id: d.id, ...raw } as DeletedItem)
    }
  })

  await Promise.all(
    expiredIds.map((id) => deleteDoc(doc(db, 'users', uid, 'recentlyDeleted', id)))
  )

  return items
}

// ─── Restore ─────────────────────────────────────────────────────────────────
export async function restoreItem(uid: string, item: DeletedItem): Promise<void> {
  const isCourseFile = item.originalCollection.includes('/courses/') &&
    item.originalCollection.endsWith('/files')

  if (isCourseFile) {
    const parts = item.originalCollection.split('/')
    const courseId = parts[3]
    const coursePath = `users/${uid}/courses/${courseId}`
    const courseSnap = await getDoc(doc(db, coursePath))

    if (!courseSnap.exists()) {
      const coursesRef = collection(db, 'users', uid, 'courses')
      const coursesSnap = await getDocs(coursesRef)

      const existing = coursesSnap.docs.find(d => d.data().name === 'Restored Files')

      let restoredFolderId: string
      if (existing) {
        restoredFolderId = existing.id
      } else {
        const newFolder = await addDoc(coursesRef, {
          name: 'Restored Files',
          uid,
          createdAt: Date.now(),
          fileCount: 0,
          color: 'grey',
        })
        restoredFolderId = newFolder.id
      }

      const newFileRef = doc(collection(db, 'users', uid, 'courses', restoredFolderId, 'files'))
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...cleanData } = item.data as Record<string, unknown>
      await setDoc(newFileRef, cleanData)
      await updateDoc(doc(db, 'users', uid, 'courses', restoredFolderId), {
        fileCount: increment(1),
      })
      await deleteDoc(doc(db, 'users', uid, 'recentlyDeleted', item.id))
      return
    }
  }

const originalRef = doc(db, item.originalCollection, item.originalDocId)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { id: _id, ...cleanData } = item.data as Record<string, unknown>
await setDoc(originalRef, cleanData)

if (isCourseFile) {
  // restoring a single file into a course that still exists —
  // bump the parent's count instead of leaving it stale
  const parts = item.originalCollection.split('/')
  const courseId = parts[3]
  await updateDoc(doc(db, 'users', uid, 'courses', courseId), {
    fileCount: increment(1),
  })
} else if (item.originalCollection === `users/${uid}/courses`) {
  // restoring a whole course folder — recompute from the actual
  // files subcollection rather than trusting the snapshot's fileCount
  const filesRef = collection(db, item.originalCollection, item.originalDocId, 'files')
  const filesSnap = await getDocs(filesRef)
  await updateDoc(originalRef, { fileCount: filesSnap.size })
}

await deleteDoc(doc(db, 'users', uid, 'recentlyDeleted', item.id))
}

// ─── Permanent Delete ─────────────────────────────────────────────────────────
export async function permanentDelete(
  uid: string,
  item: DeletedItem,
  deleteFromCloudinary: (publicId: string) => Promise<void>
): Promise<void> {
  console.log('[PERM DELETE] cloudinaryPublicId:', item.cloudinaryPublicId)

  // 1. Delete from Cloudinary
  if (item.cloudinaryPublicId) {
    await deleteFromCloudinary(item.cloudinaryPublicId)
  }

  // 2. Delete the live Firestore document if the file was already restored
  //    When a file is restored, it gets written back to Firestore but the
  //    recentlyDeleted entry keeps the OLD originalCollection/originalDocId.
  //    We need to find and delete it from wherever it currently lives.
  if (item.type === 'Course' && item.data?.fileUrl) {
    // It might have been restored to "Restored Files" folder — search for it
    const coursesSnap = await getDocs(collection(db, 'users', uid, 'courses'))
    for (const courseDoc of coursesSnap.docs) {
      const filesRef = collection(db, 'users', uid, 'courses', courseDoc.id, 'files')
      const filesSnap = await getDocs(filesRef)
      for (const fileDoc of filesSnap.docs) {
        const data = fileDoc.data()
        // Match by cloudinary publicId or fileUrl — both are unique per file
        if (
          data.publicId === item.cloudinaryPublicId ||
          data.fileUrl === item.cloudinaryUrl
        ) {
          await deleteDoc(doc(db, 'users', uid, 'courses', courseDoc.id, 'files', fileDoc.id))
        }
      }
    }
  }

  // 3. Delete from recentlyDeleted
  await deleteDoc(doc(db, 'users', uid, 'recentlyDeleted', item.id))
}

// ─── Days Remaining ───────────────────────────────────────────────────────────
export function daysRemaining(deletedAt: Timestamp): number {
  const ageMs = Date.now() - deletedAt.toMillis()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  return Math.max(0, Math.ceil(RETENTION_DAYS - ageDays))
}