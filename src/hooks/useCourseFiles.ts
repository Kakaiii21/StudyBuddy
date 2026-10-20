import { useState, useEffect } from 'react'
import { softDelete } from '../services/recentlyDeletedService'
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  increment,
} from 'firebase/firestore'
import { db } from '../services/firebase'
import { type User } from 'firebase/auth'

export interface CourseFile {
  id: string
  fileName: string
  fileUrl: string
  publicId: string
  fileType: string
  fileSize: string
  fileSizeBytes: number
  moderationStatus: 'pending' | 'approved' | 'rejected'
  uid: string
  createdAt: number
}

export function useCourseFiles(user: User | null, courseId: string | undefined) {
  const [files, setFiles] = useState<CourseFile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !courseId) {
      const timer = setTimeout(() => {
        setFiles([])
        setLoading(false)
      }, 0)
      return () => clearTimeout(timer)
    }

    const filesRef = collection(db, 'users', user.uid, 'courses', courseId, 'files')
    const q = query(filesRef, orderBy('createdAt', 'asc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: CourseFile[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<CourseFile, 'id'>),
      }))
      setFiles(fetched)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, courseId])

  async function addCourseFile(
    fileName: string,
    fileUrl: string,
    publicId: string,
    fileType: string,
    fileSize: string,
    fileSizeBytes: number,
  ) {
    if (!user || !courseId) return

    // Only writes the file document.
    // storageUsed is handled in CourseFolder.tsx using raw file.size bytes.
    await addDoc(collection(db, 'users', user.uid, 'courses', courseId, 'files'), {
      fileName,
      fileUrl,
      publicId,
      fileType,
      fileSize,
      fileSizeBytes,
      moderationStatus: 'pending',
      uid: user.uid,
      createdAt: Date.now(),
    })
    const courseRef = doc(db, 'users', user.uid, 'courses', courseId)
    await updateDoc(courseRef, { fileCount: increment(1) })
  }

  async function renameCourseFile(fileId: string, newFileName: string) {
    if (!user || !courseId || !newFileName.trim()) return
    const fileRef = doc(db, 'users', user.uid, 'courses', courseId, 'files', fileId)
    await updateDoc(fileRef, { fileName: newFileName.trim() })
  }

  async function deleteCourseFile(fileId: string) {
    if (!user || !courseId) return
    const file = files.find((f) => f.id === fileId)
    if (!file) return

    await softDelete(user.uid, {
      name: file.fileName,
      type: 'Course',
      originalCollection: `users/${user.uid}/courses/${courseId}/files`,
      originalDocId: fileId,
      cloudinaryPublicId: file.publicId,
      data: { ...file },
    })

    const courseRef = doc(db, 'users', user.uid, 'courses', courseId)
    await updateDoc(courseRef, { fileCount: increment(-1) })

    await deleteDoc(doc(db, 'users', user.uid, 'courses', courseId, 'files', fileId))
  }

  return { files, loading, addCourseFile, renameCourseFile, deleteCourseFile }
}