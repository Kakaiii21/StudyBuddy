import { useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../services/firebase'
import { onAuthChange, type User } from '../services/authService'
import { useState } from 'react'

function EmailChangeWatcher() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthChange((u) => setUser(u))
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return

    // Watch Firestore for when pendingEmail gets cleared (meaning Cloud Function completed)
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), async (snap) => {
      const data = snap.data()
      // If pendingEmail was just cleared and email changed, sign out
      if (!data?.pendingEmail && data?.email && data.email !== user.email) {
        sessionStorage.removeItem(`user_${user.uid}`)
        await signOut(auth)
        window.location.href = '/?emailUpdated=true'
      }
    })

    return () => unsubscribe()
  }, [user])

  return null
}

export default EmailChangeWatcher