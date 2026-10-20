import { useState, useEffect, useRef } from 'react'
import { onAuthChange } from '../services/authService'
import { useNavigate } from 'react-router-dom'
import { login, sendVerificationEmail } from '../services/authService'
import { getAuth } from 'firebase/auth'
import { googleLogin } from '../services/authService'

type FieldErrors = {
  email: string
  password: string
}

type TouchedFields = {
  email: boolean
  password: boolean
}

function Login({ onSwitchToSignup} : {onSwitchToSignup?: () => void}) {
  const navigate = useNavigate()
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user && user.emailVerified) {  
        navigate('/dashboard', { replace: true })
      }
    })
    return () => unsubscribe()
  }, [])

  const [emailUpdated] = useState(() => {
    const val = new URLSearchParams(window.location.search).get('emailUpdated')
    if (val) window.history.replaceState({}, '', '/')
    return val
  })
  const [cancelResult] = useState(() => {
  const val = new URLSearchParams(window.location.search).get('cancelResult')
  if (val) window.history.replaceState({}, '', '/')
  return val
})

const [passwordUpdated] = useState<boolean>(() => {
  const fromQuery = new URLSearchParams(window.location.search).get('passwordUpdated') === 'true'
  if (fromQuery) window.history.replaceState({}, '', '/')
  return fromQuery
})
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({ email: '', password: '' })
  const [touched, setTouched] = useState<TouchedFields>({ email: false, password: false })

  const [loading, setLoading] = useState(false)

const emailRef = useRef<HTMLInputElement>(null)
const passwordRef = useRef<HTMLInputElement>(null)

  const validateField = (field: keyof FieldErrors, values: { email: string; password: string }): string => {
    switch (field) {
      case 'email':
        if (!values.email.trim()) return 'Email is required.'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return 'Enter a valid email address.'
        return ''
      case 'password':
        if (!values.password) return 'Password is required.'
        return ''
      default:
        return ''
    }
  }

    const handleGoogleLogin = async () => {
      try {
        setLoading(true)
        await googleLogin()
        navigate('/dashboard')
      } catch (err: unknown) {
        if (
          typeof err === 'object' && err !== null && 'code' in err &&
          (err as { code: string }).code === 'auth/popup-closed-by-user'
        ) return
        setFieldErrors(prev => ({ ...prev, email: 'Google sign-in failed. Please try again.' }))
      } finally {
        setLoading(false)
      }
    }

  const handleChange = (field: keyof FieldErrors, value: string) => {
    const newValues = { email, password, [field]: value }

    if (field === 'email') setEmail(value)
    if (field === 'password') setPassword(value)

    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, newValues)
    setFieldErrors(prev => ({ ...prev, [field]: error }))
  }

  const handleBlur = (field: keyof FieldErrors) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, { email, password })
    setFieldErrors(prev => ({ ...prev, [field]: error }))
  }

  const fieldOrder: { key: keyof FieldErrors; ref: React.RefObject<HTMLInputElement | null>; value: string }[] = [
  { key: 'email', ref: emailRef, value: email },
  { key: 'password', ref: passwordRef, value: password },
]

const focusNextEmpty = (
  e: React.KeyboardEvent<HTMLInputElement>,
  currentKey: keyof FieldErrors
) => {
  if (e.key !== 'Enter') return
  e.preventDefault()

  const currentIndex = fieldOrder.findIndex((f) => f.key === currentKey)

  for (let i = 1; i <= fieldOrder.length; i++) {
    const field = fieldOrder[(currentIndex + i) % fieldOrder.length]
    if (!field.value.trim()) {
      field.ref.current?.focus()
      return
    }
  }

  handleLogin()
}
  const validateAll = (): boolean => {
    const errors: FieldErrors = {
      email: validateField('email', { email, password }),
      password: validateField('password', { email, password }),
    }
    setFieldErrors(errors)
    setTouched({ email: true, password: true })
    return Object.values(errors).every(e => e === '')
  }

  const handleLogin = async () => {
    if (!validateAll()) return

    try {
      setLoading(true)
      const user = await login(email, password)

    if (!user.emailVerified) {
      let resendMessage = "Please verify your email first. We've sent a new verification link to your inbox."
      try {
        await sendVerificationEmail(email)
      } catch (resendErr: unknown) {
       
        const code = typeof resendErr === 'object' && resendErr !== null && 'code' in resendErr
          ? (resendErr as { code: string }).code
          : ''
        resendMessage = code === 'auth/too-many-requests'
          ? 'Please verify your email first. A verification link was already sent recently — please check your inbox.'
          : 'Please verify your email first. Check your inbox for the verification link.'
      }
      sessionStorage.setItem('intentionalLogout', 'true')
      await getAuth().signOut()
      setFieldErrors(prev => ({ ...prev, email: resendMessage }))
      return
    }

      navigate('/dashboard')
      } catch (err: unknown) {
        if (typeof err === 'object' && err !== null && 'code' in err) {
          const code = (err as { code: string }).code
          if (
            code === 'auth/invalid-credential' ||
            code === 'auth/user-not-found' ||
            code === 'auth/wrong-password'
          ) {
            setFieldErrors({ email: 'Invalid email or password.', password: 'Invalid email or password.' })
            setTouched({ email: true, password: true })
          } else {
            setFieldErrors(prev => ({ ...prev, email: 'Something went wrong. Please try again.' }))
          }
        }
      } finally {
            setLoading(false)
          }
        }

  const inputClass = (field: keyof FieldErrors) =>
    `w-full mb-1 bg-transparent text-primary-800 text-sm text-[13px] lg:text-[11px] xl:text-[13px] 2xl:text-[14px] 3xl:text-[16px] px-2 py-2 xl:py-1 2xl:py-2 3xl:py-2 border border-primary-600 ${touched[field] && fieldErrors[field] ? 'border-red-500 bg-red-50' : ''}`

  return (
    <div className="min-h-screen md:h-auto flex flex-col md:px-32 lg:flex-row bg-primary-600 2xl:px-[30px]">
{/* MOBILE HEADER */}
<div className="flex lg:hidden flex-col items-center pt-8 pb-4 px-6 text-center">
  <h1 className="text-white font-inter font-extrabold text-3xl">
    Welcome Back, Buddy!
  </h1>
  <p className="text-white font-fustat text-sm mt-3">
    Log in to access your notes, quizzes, and personalized learning tools.
  </p>
  <p className="text-white font-fustat text-sm mt-2">
    Don't have an account?{' '}
    <button
      onClick={() => onSwitchToSignup ? onSwitchToSignup() : navigate('/signup')}
      className="font-bold underline bg-white text-primary-800 px-2 rounded-lg"
    >
      Sign Up
    </button>
  </p>
</div>


{/* LEFT PANEL */}
    <div className="hidden lg:flex lg:w-1/2 bg-primary-600 items-center justify-center px-16">

      <div className="max-w-xl">

        <h1 className="text-white font-inter font-extrabold text-6xl lg:text-4xl xl:text-5xl 2xl:text-6xl ">
            Welcome Back,
          <br />
            Buddy!
        </h1>

        <div className="mt-12 space-y-10 lg:space-y-5xl:space-y-5">

          <p className="text-white  text-2xl lg:text-[18px] xl:text-lg 2xl:text-2xl font-fustat max-w-md">
            Continue your learning journey and stay on track with your goals.
          </p>

          <p className="text-white  text-2xl lg:text-[18px] xl:text-lg 2xl:text-2xl font-fustat max-w-md">
            Log in to access your notes, quizzes, and personalized learning tools.
          </p>

          <div>
            <p className="text-white  text-2xl lg:text-[18px] xl:text-lg 2xl:text-2xl mb-5 font-fustat">
             Don’t have an account?
            </p>

            <button
              onClick={() => onSwitchToSignup  ? onSwitchToSignup() : navigate('/signup')}
              className="
                bg-white
                text-primary-600
                px-10 py-3
                lg:px-6 lg:py-1
                lg:text-lg
                xl:px-8 xl:py-2
                rounded-full
                font-bold
                text-xl
                font-fustat
                flex items-center
                gap-6
                shadow-lg
                hover:-translate-y-1
                transition-all
                uppercase
              "
            >
             Sign Up
              <img src="./Arrow.png" alt="arrow" className='w-8 lg:w-6 xl:w-6' />
            </button>
          </div>

        </div>

      </div>

    </div>

      {/* FORM */}
    <div className="w-full lg:w-1/2 flex items-center justify-center pb-8 lg:pb-28 xl:pb-28 2xl:pb-28 pt-1 order-2 lg:order-1 mt-2">
      <div className="w-full lg:w-[360px] xl:w-[400px] lg:mt-5 xl:mt-5 2xl:mt-0 2xl:w-full 3xl:w-full lg:max-w-md bg-white p-6 lg:p-0 lg:px-4 lg:py-2 xl:py-4 2xl:py-6 lg:rounded-xl xl:rounded-xl 2xl:rounded-xl shadow-md border-4 border-primary-600">
        <p className='text-primary-600 mb-4 lg:mb-12 font-inter font-extrabold uppercase text-center text-sm lg:text-sm xl:text-xl 2xl:text-2xl'>Log In</p>

          {emailUpdated && (
            <div className="bg-primary-600 text-white px-4 py-3 rounded-md text-sm font-roboto text-center mb-4">
               Email updated! Please sign in with your new email.
            </div>
          )}
          {passwordUpdated && (
            <div className="bg-primary-600 text-white px-4 py-3 rounded-md text-sm font-roboto text-center mb-4">
              Password updated! Please sign in with your new password.
            </div>
          )}

          {cancelResult === 'success' && (
            <div className="bg-green-600 text-white px-4 py-3 rounded-md text-sm font-roboto text-center mb-4">
              Email change cancelled. Your account email remains unchanged.
            </div>
          )}
          {cancelResult === 'expired' && (
            <div className="bg-red-500 text-white px-4 py-3 rounded-md text-sm font-roboto text-center mb-4">
              This undo link has expired. Contact support if you need help recovering your account.
            </div>
          )}
          {cancelResult === 'already-used' && (
            <div className="bg-yellow-500 text-white px-4 py-3 rounded-md text-sm font-roboto text-center mb-4">
              This link has already been used.
            </div>
          )}

          {/* EMAIL */}
          <p className="text-primary-600 font-inter font-normal p-2 lg:p-0.5 xl:p-1 2xl:pl-0
          text-[13px]
          lg:text-[10px]
          xl:text-[13px]
          2xl:text-[16px]
          3xl:text-[19px]
          ">EMAIL</p>
          <input
            ref = {emailRef}
            type="email"
            value={email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            onKeyDown={(e) => focusNextEmpty(e, 'email')}
            className={inputClass('email')}
            placeholder="Enter Your Email"
          />
          {touched.email && fieldErrors.email && (
            <p className="text-red-500 lg:text-[10px] xl:text-[11px] 2xl:text-[12px] 3xl:text-[13px] text-xs mb-2 px-1">⚠ {fieldErrors.email}</p>
          )}

          {/* PASSWORD */}
          <p className="text-primary-600 font-inter mt-4 font-normal p-2 lg:p-0.5 xl:p-1 2xl:pl-0
          text-[13px]
          lg:text-[10px]
          xl:text-[13px]
          2xl:text-[16px]
          3xl:text-[19px]
          ">PASSWORD</p>
          <input
            ref = {passwordRef}
            type="password"
            value={password}
            onChange={(e) => handleChange('password', e.target.value)}
            onBlur={() => handleBlur('password')}
            className={inputClass('password')}
            onKeyDown={(e) => focusNextEmpty(e, 'password')}
            placeholder="Enter Your password"
          />
          {touched.password && fieldErrors.password && (
            <p className="text-red-500 lg:text-[10px] xl:text-[11px] 2xl:text-[12px] 3xl:text-[13px] text-xs mb-2 px-1">⚠ {fieldErrors.password}</p>
          )}

          <div className="flex justify-end">
            <button
              className="mb-8 mt-2 text-sm text-[13px] lg:text-xs text-primary-600 font-inter font-semibold hover:underline"
              onClick={() => navigate('/forgotPassword')}
            >
              FORGOT PASSWORD
            </button>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-primary-600 
              hover:opacity-90   
               backdrop-blur-xs
               hover:-translate-y-1 hover:shadow-[0_8px_10px_rgba(0,0,0,0.5)]
               transition-all duration-300
            font-normal font-inter text-white p-2  lg:text-[12px] lg:p-2 xl:p-3 2xl:p-4 rounded-full border disabled:opacity-50"
          >
            {loading ? 'LOGGING IN...' : 'LOG IN'}
          </button>
          <p className='text-center text-[13px] lg:text-[10px] xl:text-[12px] pt-5 font-inter text-primary-600'>OR</p>

        <div className="flex justify-center">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
                className="
                flex items-center gap-4
                m-2 mt-3
                px-2 py-2
                md:px-10 md:py-3
                lg:px-10 lg:py-3
                xl:px-10 xl:py-3
                2xl:px-10 2xl:py-3
                rounded-full
                font-bold uppercase
                text-primary-600
                disabled:opacity-50
                shadow-[0_0px_2px_rgba(0,0,0,0.28)]
                md:shadow-none
                lg:shadow-none
                xl:shadow-none
                2xl:shadow-none
                hover:shadow-[0_18px_40px_rgba(0,0,0,0.28)]

                hover:-translate-y-1.5
                active:translate-y-0

                transition-all duration-300
                ">
            <img src="/google.png" alt="Google Logo" className="w-8 h-8 lg:h-5 lg:w-5 xl:h-6 xl:w-6 2xl:h-8 2xl:w-8" />
            
          </button>
        </div>

        </div>
      </div>


    </div>
  )
}

export default Login