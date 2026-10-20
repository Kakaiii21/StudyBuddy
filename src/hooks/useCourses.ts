import { useState, useEffect } from 'react'
import { softDelete } from '../services/recentlyDeletedService'
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  getDocs,      
} from 'firebase/firestore'
import { db } from '../services/firebase'
import { type User } from 'firebase/auth'

export type CourseColor = 'yellow' | 'blue' | 'grey' | 'green' | 'pink' | 'purple' | 'orange'

export interface Course {
  id: string
  name: string
  uid: string
  createdAt: number
  fileCount?: number
  color?: CourseColor
}

export function useCourses(user: User | null) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        setCourses([])
        setLoading(false)
      }, 0)
      return () => clearTimeout(timer)
    }

    const coursesRef = collection(db, 'users', user.uid, 'courses')
    const q = query(coursesRef, orderBy('createdAt', 'asc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Course[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Course, 'id'>),
      }))
      setCourses(fetched)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  async function addCourse(name: string, color: CourseColor = 'blue') {
    if (!user || !name.trim()) return
    await addDoc(collection(db, 'users', user.uid, 'courses'), {
      name: name.trim(),
      uid: user.uid,
      createdAt: Date.now(),
      fileCount: 0,
      color,
    })
  }

  async function updateCourse(courseId: string, name: string, color?: CourseColor) {
    if (!user || !name.trim()) return
    const courseRef = doc(db, 'users', user.uid, 'courses', courseId)
    const updates: { name: string; color?: CourseColor } = { name: name.trim() }
    if (color) updates.color = color
    await updateDoc(courseRef, updates)
  }

  async function deleteCourse(courseId: string) {
    if (!user) return
    const course = courses.find((c) => c.id === courseId)
    if (!course) return

    // Soft-delete all files inside the folder first
    const filesRef = collection(db, 'users', user.uid, 'courses', courseId, 'files')
    const snapshot = await getDocs(filesRef)
    await Promise.all(


      
      
      snapshot.docs.map((fileDoc) => {
        const fileData = fileDoc.data()
        return softDelete(user.uid, {
          name: fileData.fileName,
          type: 'Course',
          originalCollection: `users/${user.uid}/courses/${courseId}/files`,
          originalDocId: fileDoc.id,
          cloudinaryPublicId: fileData.publicId,
          data: { ...fileData, id: fileDoc.id },
        })
      })
    )

    // Then soft-delete the folder itself
    await softDelete(user.uid, {
      name: course.name,
      type: 'Course',
      originalCollection: `users/${user.uid}/courses`,
      originalDocId: courseId,
      data: { ...course },
    })
  }

  return { courses, loading, addCourse, updateCourse, deleteCourse }
}