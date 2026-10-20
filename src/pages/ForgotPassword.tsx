import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { resetPassword } from '../services/authService'

const RESEND_COOLDOWN = 60 // seconds

const formatCooldown = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`
}

function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasSent, setHasSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Tick the cooldown down every second ──
  useEffect(() => {
    if (cooldown <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [cooldown])

  const sendResetLink = async () => {
    setError('')
    setSuccess('')

    if (!email) {
      setError('Please enter your email.')
      return
    }

    try {
      setLoading(true)
      await resetPassword(email)
      setSuccess('Password reset link sent! Check your inbox.')
      setHasSent(true)
      setCooldown(RESEND_COOLDOWN)
    } catch (err) {
      const e = err as { code: string }
      if (e.code === 'auth/user-not-found') {
        setError('No account found with this email.')
      } else if (e.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const canSend = !loading && cooldown === 0

  return (
    <div className='h-screen w-full bg-white'>
      <div className='flex flex-row  mt-3 ml-5'>
              <button
                title="Go Back to Account"
                onClick={() => navigate('/account')}
                className="flex flex-col items-center  md:ml-16 lg:ml-3 lg:mt-0 xl:ml-16 xl:mt-0 2xl:ml-16 2xl:mt-0 px-3 py-0.5 rounded hover:bg-gray-100 transition"
              >
                <span className="text-5xl lg:text-2xl 2xl:text-5xl leading-none">←</span>
                <span className="text-sm lg:text-xs 2xl:text-xl">Back</span>
              </button>
      </div>

      <div className='flex flex-col  justify-center items-center'>
        <img src="logo.png" alt="STudy Buddy" className='w-64 h-42 lg:w-32 xl:w-36 2xl:w-44 3xl:w-52 ' />

        <div className='flex flex-col border-2 border-primary-600 rounded-xl  w-[90%] lg:w-[550px] 2xl:w-[750px] 3xl:w-[850px] mt-10 lg:mt-2 xl:mt-2 2xl:mt-2 lg:gap-y-3 xl:gap-y-5 justify-start items-center px-5 py-10 lg:py-5 2xl:py-8 3xl:py-10 '>
          <p className='font-roboto font-bold text-primary-600 uppercase text-2xl lg:text-lg 2xl:text-2xl 3xl:text-3xl'>
            Forgot Password
          </p>

          <p className='text-gray-500 text-sm lg:text-xs 2xl:text-lg 3xl:text-2xl   text-center max-auto'>
            Enter your email and we'll send you a link to reset your password.
          </p>

          {error && <p className='text-red-500 text-sm lg:text-xs 2xl:text-lg 3xl:text-2xl  font-semibold'>{error}</p>}
          {success && <p className='text-green-500 text-sm lg:text-xs 2xl:text-lg 3xl:text-2xl  font-semibold text-center'>{success}</p>}

          <div className='w-full max-auto lg:px-6 xl:px-6 2xl:px-16 3xl:px-20'>
            <p className='font-roboto font-bold text-primary-600 text-md lg:text-xs 2xl:text-xl 3xl:text-2xl  mb-1'>Email *</p>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && canSend && sendResetLink()}
              placeholder='Enter your email'
              className='w-full px-3 bg-white py-2 border text-md lg:text-xs 2xl:text-xl 3xl:text-2xl border-primary-600 rounded-md focus:outline-none'
            />
          </div>
        </div>

        <div className='flex flex-row gap-4 mt-10 lg:mt-5 xl:mt-5 2xl:mt-10'>
          {!hasSent ? (
            <button
              onClick={sendResetLink}
              disabled={!canSend}
              className='font-roboto font-bold bg-primary-600 text-white text-md px-16 py-2 lg:text-xs xl:text-lg 2xl:text-xl rounded-md uppercase disabled:opacity-50'
            >
              {loading ? 'Sending...' : 'Send Link'}
            </button>
          ) : (
            <button
              onClick={sendResetLink}
              disabled={!canSend}
              className='font-roboto font-bold bg-primary-600 text-white text-md px-16 py-2 lg:text-xs xl:text-lg 2xl:text-xl rounded-md uppercase disabled:opacity-50'
            >
              {loading
                ? 'Sending...'
                : cooldown > 0
                ? `Resend in ${formatCooldown(cooldown)}`
                : 'Resend Link'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword