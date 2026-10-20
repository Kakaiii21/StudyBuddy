import { useState } from 'react'
import { getAuth } from 'firebase/auth'
import { resetPassword } from '../services/authService'

function ChangePassword() {
  const auth = getAuth()
  const currentEmail = auth.currentUser?.email || ''

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

const maskEmail = (em: string) => {
  if (!em) return ''
  const [local, domain] = em.split('@')
  if (!domain) return em
  return `${local[0]}${'•'.repeat(local.length - 1)}@${domain}`
}
  const handleSendLink = async () => {
    setError('')
    setSuccess('')

    if (!currentEmail) {
      setError('No account email found. Please log in again.')
      return
    }

    try {
      setLoading(true)
      await resetPassword(currentEmail) // ← changed
      setSuccess(`Reset link sent to ${currentEmail}. Check your inbox.`)
    } catch (err) {
      const e = err as { code: string }
      if (e.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a moment and try again.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }


return (
      <div className='w-full px-4 md:px-16 lg:px-5 xl:px-7 2xl:px-9 3xl:px-11 py-6 lg:py-0 '>

        <h1 className='text-primary-600 dark:text-white  font-semibold font-inter text-xl md:text-2xl lg:text-[20px] xl:text-[28px] 2xl:text-[30px] 3xl:text-[35px] mb-4 md:mb-6 lg:mb-0 xl:mb-2 2xl:mb-3 3xl:mb-6'>Password</h1>
    <h1 className='text-primary-600 dark:text-white font-semibold font-inter mt-5 md:mt-12 lg:mt-2 xl:mt-2 2xl:mt-2 text-center text-xl md:text-2xl lg:text-[18px] xl:text-[20px] uppercase 2xl:text-[30px] mb-4 md:mb-6 lg:mb-2 2xl:mb-5'>Change Password</h1>
    <p className='text-primary-600 dark:text-white text-sm text-center font-inter font-normal lg:text-[12px] 2xl:text-[15px] 3xl:text-[17px] mb-6 lg:mb-2'>
      We'll send a password reset link to your registered email.
    </p>

    {error && <p className='text-red-500 text-center text-sm lg:text-[10px] 2xl:text-[13px] 3xl:text-[15px] font-semibold mb-4 lg:mb-2'>{error}</p>}
    {success && <p className='text-green-500 text-center text-sm lg:text-[10px] 2xl:text-[13px] 3xl:text-[15px] font-semibold mb-4 lg:mb-2'>{success}</p>}

    {/* Email */}
    <div className='flex flex-col  lg:mx-2 2xl:mx-16 3xl:mx-28 gap-1 mb-6 mt-5 md:mt-12 lg:mt-8 xl:mt-10 2xl:mt-20'>
      <label className='text-primary-600 dark:text-white font-inter text-sm  md:text-md lg:text-[10px] 2xl:text-[14px] 3xl:text-[18px]'>Email</label>
      <input
        aria-label='email'
        type="email"
        value={maskEmail(currentEmail)}
        readOnly
        className='border border-gray-300 rounded-md bg-transparent bg-gray-50 text-primary-600 dark:text-white w-full px-4 py-2 lg:py-1 cursor-not-allowed opacity-70 text-sm md:text-base lg:text-[10px] 2xl:text-[14px] 3xl:text-[18px]'
      />
    </div>

    {/* Send Link Button */}
    <div className='flex justify-center'>
      <button
        onClick={handleSendLink}
        disabled={loading}
            className='w-full md:w-[350px] lg:w-[250px]  2xl:w-[300px] 3xl:w-[380px] items-center justify-center text-black flex bg-[#E59D24] hover:bg-[#F0AD3A] transition-all duration-300 font-inter font-semibold uppercase py-2 lg:py-1 xl:py-2 2xl:py-2 3xl:py-2
            disabled:opacity-50 lg:text-[12px] xl:text-[14px] 2xl:text-[16px] 3xl:text-[18px]
            shadow-[0_2px_1px_rgba(0,0,0,0.35)]
            rounded-md backdrop-blur-xs
            hover:-translate-y-1 hover:shadow-[0_4px_8px_rgba(0,0,0,0.35)]'
      >
        {loading ? 'Sending...' : 'Send Link'}
      </button>
    </div>
  </div>
)
}

export default ChangePassword