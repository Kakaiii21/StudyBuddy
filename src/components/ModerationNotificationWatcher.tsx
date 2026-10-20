// src/components/ModerationNotificationWatcher.tsx
import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { onAuthChange, type User } from '../services/authService'

interface ModerationNotification {
  type: 'content_rejected'
  context: 'course_file' | 'profile_photo'
  fileName?: string | null
}

export default function ModerationNotificationWatcher() {
  const [user, setUser] = useState<User | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthChange((u) => setUser(u))
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'users', user.uid, 'notifications'),
      where('read', '==', false)
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type !== 'added') return
        const data = change.doc.data() as ModerationNotification

        if (data.type === 'content_rejected') {
          const message = data.context === 'profile_photo'
            ? 'Your profile picture was removed — it did not pass our content review.'
            : `"${data.fileName ?? 'A file'}" was removed — it did not pass our content review.`
          setToast(message)
          setTimeout(() => setToast(null), 6000)
        }

        // Mark as read so it never shows again, even across devices/reloads.
        updateDoc(doc(db, 'users', user.uid, 'notifications', change.doc.id), { read: true }).catch(() => {})
      })
    })
    return () => unsubscribe()
  }, [user])

  if (!toast) return null

  return (
    <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg font-inter text-sm transition-all max-w-[90vw] text-center'>
      ⚠ {toast}
    </div>
  )
}