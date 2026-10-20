import { useEffect, useRef } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../services/firebase'
import { onAuthChange, type User } from '../services/authService'

function isFirebaseError(err: unknown): err is { code: string } {
  return typeof err === 'object' && err !== null && 'code' in err
}



function PasswordChangeWatcher() {
  const prevUserRef = useRef<User | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (u) => {
      if (prevUserRef.current && !u) {
        clearInterval(pollingRef.current!)
        const isIntentional = sessionStorage.getItem('intentionalLogout') === 'true'
        sessionStorage.removeItem('intentionalLogout')
        if (!isIntentional && !window.location.href.includes('emailUpdated')) {
          window.location.replace('/?passwordUpdated=true')
        }
        return
      }

      prevUserRef.current = u

      if (!u) {
        clearInterval(pollingRef.current!)
        return
      }

      if (pollingRef.current) clearInterval(pollingRef.current)
      pollingRef.current = setInterval(async () => {
        try {
          await auth.currentUser?.reload()
        } catch (err: unknown) {
          if (isFirebaseError(err) && (
            err.code === 'auth/user-token-expired' ||
            err.code === 'auth/requires-recent-login' ||
            err.code === 'auth/user-disabled'
          )) {
            clearInterval(pollingRef.current!)
            await signOut(auth)
            if (!window.location.href.includes('emailUpdated')) {
              window.location.replace('/?passwordUpdated=true')
            }
          }
        }
      }, 4000)
    })

    return () => {
      unsubscribe()
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  return null
}

export default PasswordChangeWatcher