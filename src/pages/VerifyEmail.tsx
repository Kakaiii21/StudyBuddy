import { useEffect, useState } from 'react'
import { getAuth, reload } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { sendVerificationEmail } from '../services/authService'


function VerifyEmail() {
  const auth = getAuth()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)

  
  // Auto-check every 5 seconds if user verified their email
useEffect(() => {
  const interval = setInterval(async () => {
    const user = auth.currentUser
    if (!user) return

    setChecking(true)
    await reload(user)

    if (user.emailVerified) {
      clearInterval(interval)
      navigate('/', { state: { showLogin: true }, replace: true })
    }
    setChecking(false)
  }, 5000)

  return () => clearInterval(interval)
}, [])
const handleContinue = async () => {
  const user = auth.currentUser
  if (!user) return

  setChecking(true)
  await reload(user)

  if (user.emailVerified) {
    navigate('/', { state: { showLogin: true }, replace: true })
  } else {
    setError('Email not verified yet. Please check your inbox and click the link.')
  }
  setChecking(false)
}

const handleResend = async () => {
  const user = auth.currentUser
  if (!user || !user.email) return

  try {
    setLoading(true)
    setError('')
    setMessage('')
    await sendVerificationEmail(user.email)
    setMessage('Verification email resent! Check your inbox.')
  } catch (err) {
    let message = 'Could not resend email. Please try again later.'
    if (err && typeof err === 'object') {
      const e = err as { code?: string; message?: string }
      if (e.code === 'auth/too-many-requests' || e.message?.includes('wait')) {
        message = e.message ?? message
      }
    }
    setError(message)
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="bg-white p-8 lg:p-4 xl:p-5 2xl:p-6 3xl:p-10 rounded-xl 
      shadow-[0_0px_40px_rgba(0,0,0,.30)]
       w-full lg:w-[350px] xl:w-[450px] 2xl:w-[550px] 3xl:w-[650px] text-center">

        <img src="/logo.png" alt="Study Buddy" className="w-40 lg:w-20 xl:w-24 2xl:w-28 3xl:w-32 mx-auto mb-6" />

        <h2 className="text-2xl lg:text-sm xl:text-lg 2xl:text-xl 3xl:text-2xl font-bold font-inter uppercase text-primary-600 mb-2
          ">Verify Your Email</h2>
        <p className="text-gray-600 text-sm lg:text-xs xl:text-sm 2xl:text-lg 3xl:text-xl mb-5">
          We sent a verification link to your email. Please check your inbox and click the link to activate your account.
        </p>

        {/* {checking && (
          <p className="text-sm text-gray-400 mb-4">Checking verification status...</p>
        )} */}

        {message && <p className="text-green-500  text-sm lg:text-xs xl:text-sm 2xl:text-lg 3xl:text-xlfont-semibold mb-4">{message}</p>}
        {error && <p className="text-red-500 text-sm lg:text-xs xl:text-sm 2xl:text-lg 3xl:text-xl font-semibold mb-4">{error}</p>}

        <button
          onClick={handleResend}
          disabled={loading}
          className="w-full bg-primary-600 text-white text-sm lg:text-xs xl:text-sm 2xl:text-lg 3xl:text-xl  uppercase font-bold p-4 rounded-xl backdrop-blur-xs
          hover:-translate-y-1 hover:shadow-[0_2px_10px_rgba(0,0,0,0.5)]
          transition-all duration-300 mb-4 disabled:opacity-50"
        >
          {loading ? 'Resending...' : 'Resend Verification Email'}
        </button>
        <button
            onClick={handleContinue}
            disabled={checking}
            className="w-full border-2 border-primary-600 uppercase
            rounded-xl backdrop-blur-xs text-sm lg:text-xs xl:text-sm 2xl:text-lg 3xl:text-xl
            hover:-translate-y-1 hover:shadow-[0_2px_10px_rgba(0,0,0,0.5)]
            transition-all duration-300
            bg-white text-primary-600 font-bold p-4  mb-4 disabled:opacity-50"
          >
            {checking ? 'Checking...' : "I've verified my email — Continue"}
          </button>

        <button
          onClick={() => navigate('/', { state: { showLogin: true }, replace: true })}
          className="w-full border-2 border-primary-600 uppercase 
          rounded-xl backdrop-blur-xs text-sm lg:text-xs xl:text-sm 2xl:text-lg 3xl:text-xl
          hover:-translate-y-1 hover:shadow-[0_2px_10px_rgba(0,0,0,0.5)]
          transition-all duration-300
          text-primary-600 font-bold p-4 "
        >
          Go to Login
        </button>

      </div>
    </div>
  )
}

export default VerifyEmail