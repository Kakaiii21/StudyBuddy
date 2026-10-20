import { useState, useEffect } from 'react'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../services/firebase'
import { type User } from 'firebase/auth'

export interface Category {
  id: string
  name: string
  uid: string
  createdAt: number
}

export function useCategories(user: User | null) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        setCategories([])
        setLoading(false)
      }, 0)
      return () => clearTimeout(timer)
    }

    const catRef = collection(db, 'users', user.uid, 'categories')
    const q = query(catRef, orderBy('createdAt', 'asc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: Category[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Category, 'id'>),
        }))
        setCategories(fetched)
        setLoading(false)
      },
      (error) => {
        console.warn('Categories snapshot error:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  // Guards against duplicate category docs (same name, case/whitespace
  // insensitive) — both the manual "Add Category" flow and the
  // orphaned-subject preservation flow in ClassSchedule call this,
  // so the check lives here once instead of at every call site.
  function addCategory(name: string) {
    if (!user || !name.trim()) return
    const trimmed = name.trim()
    const exists = categories.some(
      (c) => c.name.trim().toLowerCase() === trimmed.toLowerCase()
    )
    if (exists) return
    addDoc(collection(db, 'users', user.uid, 'categories'), {
      name: trimmed,
      uid: user.uid,
      createdAt: Date.now(),
    })
  }

  function deleteCategory(categoryId: string) {
    if (!user) return
    const catDoc = doc(db, 'users', user.uid, 'categories', categoryId)
    return deleteDoc(catDoc)
  }

  return { categories, loading, addCategory, deleteCategory }
}