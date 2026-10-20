import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthChange, reactivateAccount, logout } from '../services/authService'
import type { User } from 'firebase/auth'

function ReactivatePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [reactivating, setReactivating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthChange((u) => {
      setUser(u)
      setCheckingAuth(false)
    })
    return () => unsubscribe()
  }, [])

    const handleReactivate = async () => {
    setReactivating(true)
    setError(null)
    try {
        await reactivateAccount()
        navigate('/dashboard')
    } catch (err) {
        const message = err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message?: unknown }).message)
            : 'Failed to reactivate. Please try again.'

        if (message.toLowerCase().includes('expired')) {
        setExpired(true)
        } else {
        setError(message)
        }
    } finally {
        setReactivating(false)
    }
    }

const handleLogout = async () => {
  try {
    await logout()
  } catch (err) {
    console.error('Logout error:', err)
  } finally {
    navigate('/')
  }
}

  if (checkingAuth) {
    return <div className="text-center mt-10">Loading...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm text-center">
          <h1 className="text-xl font-bold text-primary-600 font-roboto mb-2">Reactivate Account</h1>
          <p className="text-gray-600 mb-6 text-sm">Please log in to reactivate your account.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-primary-600 text-white font-roboto font-bold py-3 rounded-lg hover:opacity-90 transition-opacity duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm text-center">
        <h1 className="text-xl font-bold text-primary-600 font-roboto mb-2">
          {expired ? 'Reactivation Window Expired' : 'Account Deactivated'}
        </h1>

        {expired ? (
          <>
            <p className="text-gray-600 mb-6 text-sm">
              The 30-day reactivation window has passed and this account can no longer be reactivated.
            </p>
            <button
              onClick={handleLogout}
              className="w-full border-2 border-primary-600 text-primary-600 font-roboto font-bold py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-6 text-sm">
              Your account is currently deactivated. Reactivate now to regain access.
            </p>
            {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleReactivate}
                disabled={reactivating}
                className="w-full bg-primary-600 text-white font-roboto font-bold py-3 rounded-lg hover:opacity-90 transition-opacity duration-200 disabled:opacity-50"
              >
                {reactivating ? 'Reactivating...' : 'Reactivate Account'}
              </button>
              <button
                onClick={handleLogout}
                disabled={reactivating}
                className="w-full text-gray-500 text-sm hover:underline disabled:opacity-50"
              >
                Log out instead
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ReactivatePage