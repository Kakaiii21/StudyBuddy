import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../services/firebase'
import { onAuthChange } from '../services/authService'
import EmailChangeWatcher from './EmailChangeWatcher'

type Props = {
  children: React.ReactNode
}

function ProtectedRoute({ children }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<'active' | 'deactivated' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
 const unsubscribe = onAuthChange(async (user) => {
  if (!user) {
    setUser(null)
    setStatus(null)
    setLoading(false)
    return
  }

  let freshUser = user
  try {
    await user.reload()
    freshUser = auth.currentUser ?? user
  } catch {
    // Offline or network error — fall back to the cached user object
    // instead of hanging forever with loading=true.
  }
  setUser(freshUser)

  try {
    const snap = await getDoc(doc(db, 'users', freshUser.uid))
    setStatus(snap.data()?.status ?? 'active')
  } catch {
    setStatus('active')
  }
  setLoading(false)
})
    return () => unsubscribe()
  }, [])

  if (loading) {
    // Blank on purpose — this can flash briefly on back-navigation while
    // auth state resolves, and shouldn't reveal any page shell or text.
    return null
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  const isGoogleUser = user.providerData.some((p) => p.providerId === 'google.com')

  if (!isGoogleUser && !user.emailVerified) {
    return <Navigate to="/verify-email" replace />
  }

  if (status === 'deactivated') {
    return <Navigate to="/reactivate" replace />
  }

  return (
    <>
      <EmailChangeWatcher />
      {children}
    </>
  )
}

export default ProtectedRoute