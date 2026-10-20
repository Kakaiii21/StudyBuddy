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
} from 'firebase/firestore'
import { db } from '../services/firebase'
import { type User } from 'firebase/auth'



export interface Note {
  id: string
  title: string
  subject: string
  content: string
  uid: string
  createdAt: number
}

export function useNotes(user: User | null) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

useEffect(() => {
  if (!user) {
    const timer = setTimeout(() => {
      setNotes([])
      setLoading(false)
    }, 0)
    return () => clearTimeout(timer)
  }

  const notesRef = collection(db, 'users', user.uid, 'notes')
  const q = query(notesRef, orderBy('createdAt', 'asc'))

  const unsubscribe = onSnapshot(q,
    (snapshot) => {
      const fetched: Note[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Note, 'id'>),
      }))
      setNotes(fetched)
      setLoading(false)
    },
    (error) => {
      console.warn('Notes snapshot error:', error)
      setLoading(false)
    }
  )

  return () => unsubscribe()
}, [user])


  // Returns the new note's Firestore doc id (or undefined if it couldn't be
  // created), so callers — e.g. autosave — can start updating it right away.
  async function addNote(title: string, subject: string, content: string): Promise<string | undefined> {
    if (!user || !title.trim()) return undefined
    const docRef = await addDoc(collection(db, 'users', user.uid, 'notes'), {
      title: title.trim(),
      subject,
      content: content.trim(),
      uid: user.uid,
      createdAt: Date.now(),
    })
    return docRef.id
  }

  // Notes example
async function deleteNote(noteId: string) {
  if (!user) return
  const note = notes.find((n) => n.id === noteId)
  if (!note) return
  await softDelete(user.uid, {
    name: note.title,
    type: 'Notes',
    originalCollection: `users/${user.uid}/notes`,
    originalDocId: noteId,
    data: { ...note },
  })
}
   function updateNote(noteId: string, fields: Partial<Pick<Note, 'title' | 'subject' | 'content'>>) {
    if (!user) return
    const noteRef = doc(db, 'users', user.uid, 'notes', noteId)
     updateDoc(noteRef, fields)
  }





  return { notes, loading, addNote, updateNote, deleteNote }
}