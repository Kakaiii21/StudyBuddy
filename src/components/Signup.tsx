import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { signup } from '../services/authService'
import { googleLogin } from '../services/authService'
import { checkEmailStatus } from '../services/authService'
import { containsBadWords } from '../utils/contentFilter'

const BAD_WORD_MSG = "Inappropriate language isn't allowed."
type FieldErrors = {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

type TouchedFields = {
  firstName: boolean
  lastName: boolean
  email: boolean
  password: boolean
  confirmPassword: boolean
}
function PasswordRequirements({ password }: { password: string }) {
  
  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character (!@#$...)', met: /[!@#$%^&*()_+=;'"|,.<>?@-]/.test(password) },
  ]

  return (
    <div className='bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-2'>
      <p className='text-xs font-semibold text-primary-600 mb-1'>Password requirements:</p>
      <ul className='space-y-0.5'>
        {requirements.map((req) => (
          <li key={req.label} className='flex items-center gap-2 text-xs'>
            <span className={req.met ? 'text-green-500' : 'text-gray-400'}>
              {req.met ? '✓' : '○'}
            </span>
            <span className={req.met ? 'text-green-600 line-through' : 'text-gray-500'}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
function Signup({ onSwitchToLogin } : { onSwitchToLogin?: () => void}) {
    const navigate = useNavigate()

  const [passwordFocused, setPasswordFocused] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  //  Terms agreement state
  const [agreed, setAgreed] = useState(false)
  const [agreedTouched, setAgreedTouched] = useState(false)

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [touched, setTouched] = useState<TouchedFields>({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
  })

  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Refs for Enter-to-advance behavior below.
  const firstNameRef = useRef<HTMLInputElement>(null)
  const lastNameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)

  const handleGoogleSignup = async () => {
    try {
      setLoading(true)
      await googleLogin()
      navigate('/dashboard')   // Google users are always verified ✓
    } catch (err) {
      const firebaseError = err as { code: string }
      if (firebaseError.code === 'auth/popup-closed-by-user') return
      setFieldErrors(prev => ({ ...prev, email: 'Google sign-in failed. Please try again.' }))
    } finally {
      setLoading(false)
    }
  }

  const touch = (field: keyof TouchedFields) =>
    setTouched(prev => ({ ...prev, [field]: true }))

  const validateField = (field: keyof FieldErrors, values: {
    firstName: string
    lastName: string
    email: string
    password: string
    confirmPassword: string
  }): string => {
    switch (field) {
case 'firstName':
  if (!values.firstName.trim()) return 'First name is required.'
  if (containsBadWords(values.firstName)) return BAD_WORD_MSG
  return ''
case 'lastName':
  if (!values.lastName.trim()) return 'Last name is required.'
  if (containsBadWords(values.lastName)) return BAD_WORD_MSG
  return ''
      case 'email':
        if (!values.email.trim()) return 'Email is required.'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return 'Enter a valid email address.'
        return ''
      case 'password':
        if (!values.password) return 'Password is required.'
        if (values.password.length < 8) return 'Must be at least 8 characters.'
        if (!/[A-Z]/.test(values.password)) return 'Must include an uppercase letter.'
        if (!/[a-z]/.test(values.password)) return 'Must include a lowercase letter.'
        if (!/[0-9]/.test(values.password)) return 'Must include a number.'
        if (!/[!@#$%^&*()_+=;'"|,.<>?@-]/.test(values.password)) return 'Must include a special character.'
        return ''
      case 'confirmPassword':
        if (!values.confirmPassword) return 'Please confirm your password.'
        if (values.confirmPassword !== values.password) return 'Passwords do not match.'
        return ''
      default:
        return ''
    }
  }

  const currentValues = { firstName, lastName, email, password, confirmPassword }

  const handleChange = (field: keyof FieldErrors, value: string) => {
    const newValues = { ...currentValues, [field]: value }

    const setters = {
      firstName: setFirstName,
      lastName: setLastName,
      email: setEmail,
      password: setPassword,
      confirmPassword: setConfirmPassword,
    }
    setters[field](value)

    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, newValues)
    setFieldErrors(prev => ({ ...prev, [field]: error }))

    if (field === 'password') {
      const confirmError = validateField('confirmPassword', newValues)
      setFieldErrors(prev => ({ ...prev, confirmPassword: touched.confirmPassword ? confirmError : prev.confirmPassword }))
    }
  }

  const handleBlur = (field: keyof FieldErrors) => {
    touch(field)
    const error = validateField(field, currentValues)
    setFieldErrors(prev => ({ ...prev, [field]: error }))
  }

  const validateAll = (): boolean => {
    const fields = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'] as (keyof FieldErrors)[]
    const errors = {} as FieldErrors
    fields.forEach(f => { errors[f] = validateField(f, currentValues) })
    setFieldErrors(errors)
    setTouched({ firstName: true, lastName: true, email: true, password: true, confirmPassword: true })
    setAgreedTouched(true)
    return Object.values(errors).every(e => e === '') && agreed
  }

  const handleSignup = async () => {
    setSuccess('')
    if (!validateAll()) return

    try {
      setLoading(true)
      await signup(firstName, lastName, email, password)
      setLoading(false)
      setFirstName('')
      setLastName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setAgreed(false)
      setAgreedTouched(false)
      setFieldErrors({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
      setTouched({ firstName: false, lastName: false, email: false, password: false, confirmPassword: false })
      setSuccess(' Redirecting to Verify Email...')
      setTimeout(() => navigate('/verify-email'), 2000)
    } catch (err) {
      setLoading(false)
      const firebaseError = err as { code: string }
      if (firebaseError.code === 'auth/email-already-in-use') {
        try {
          const { verified } = await checkEmailStatus(email)
          setFieldErrors(prev => ({
            ...prev,
            email: verified
              ? 'Email is already in use.'
              : 'This email is already registered but not verified. Check your inbox, or log in to resend the verification email.'
          }))
        } catch {
          setFieldErrors(prev => ({ ...prev, email: 'Email is already in use.' }))
        }
      } else {
        setFieldErrors(prev => ({ ...prev, email: 'Something went wrong. Please try again.' }))
      }
    }
  }

const fieldOrder: { key: keyof FieldErrors; ref: React.RefObject<HTMLInputElement | null>; value: string }[] = [
  { key: 'firstName', ref: firstNameRef, value: firstName },
  { key: 'lastName', ref: lastNameRef, value: lastName },
  { key: 'email', ref: emailRef, value: email },
  { key: 'password', ref: passwordRef, value: password },
  { key: 'confirmPassword', ref: confirmPasswordRef, value: confirmPassword },
]

  // On Enter, jumps to the next empty field (wrapping around), or submits
  // if every field is already filled.
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

    handleSignup()
  }

  const inputClass = (field: keyof FieldErrors) =>
    `w-full mb-1 bg-white text-sm text-[13px] lg:text-[11px] xl:text-[13px] 2xl:text-[14px] 3xl:text-[16px] px-2 py-2 xl:py-1 2xl:py-2 3xl:py-2 border border-primary-600 ${touched[field] && fieldErrors[field] ? 'border-red-500 bg-red-50' : ''}`

  return (
    <div className="min-h-screen md:h-auto flex flex-col lg:px-10 md:px-32 lg:flex-row bg-primary-600  2xl:px-[150px]">
      {/* MOBILE HEADER */}
      <div className="flex lg:hidden flex-col items-center pt-8 pb-4 px-6 text-center">
        <h1 className="text-white font-inter font-extrabold text-3xl">
          Welcome To Study Buddy!
        </h1>
        <p className="text-white font-fustat text-sm mt-3">
          Create your account and start learning smarter.
        </p>
        <p className="text-white font-fustat text-sm mt-2">
          Already have an account?{' '}
          <button
            onClick={() => onSwitchToLogin ? onSwitchToLogin() : navigate('/login')}
            className="font-bold underline bg-white text-primary-800 px-2 rounded-lg"
          >
            Log In
          </button>
        </p>
      </div>


{/* LEFT PANEL */}
    <div className="hidden lg:flex lg:w-1/2 bg-primary-600 items-center justify-center px-16 ">

      <div className="max-w-xl">

        <h1 className="text-white font-inter font-extrabold text-6xl lg:text-4xl xl:text-5xl 2xl:text-6xl ">
            Welcome To
            Study Buddy!
        </h1>

        <div className="mt-12 space-y-10 lg:space-y-5 xl:space-y-5">

          <p className="text-white text-2xl lg:text-[18px] xl:text-lg 2xl:text-2xl font-fustat max-w-md">
            Start your learning journey and stay on track with your goals.
          </p>

          <p className="text-white text-2xl lg:text-[18px] xl:text-lg 2xl:text-2xl font-fustat max-w-md">
            Create your account and start learning smarter.
          </p>

          <div>
            <p className="text-white text-2xl lg:text-[18px] xl:text-lg 2xl:text-2xl mb-5 font-fustat">
              Already have an account?
            </p>

            <button
              onClick={() => onSwitchToLogin ? onSwitchToLogin() : navigate('/login')}
              className="
                bg-white
                text-primary-600
                text-xl
                lg:text-lg
                px-10 py-3
                lg:px-6 lg:py-1
                xl:px-8 xl:py-2
                rounded-full
                font-fustat
                font-bold
                flex items-center
                gap-6
                shadow-lg
                hover:-translate-y-1
                transition-all
              "
            >
              LOG IN
              <img src="./Arrow.png" alt="arrow" className='w-8 lg:w-5 xl:w-6 ' />
            </button>
          </div>

        </div>

      </div>

    </div>

    {/*FORM*/}
    <div className="w-full lg:w-1/2 flex items-center justify-center pb-8 lg:pt-10 xl:pt-0 lg:pb-20 xl:pb-28 2xl:pb-28 pt-1 order-2 lg:order-1 mt-2">
      <div className="w-full lg:w-[360px] xl:w-[400px]  lg:mt-5 xl:mt-5 2xl:mt-0 2xl:w-full 3xl:w-full lg:max-w-md bg-white p-6 lg:p-0 lg:px-4 lg:py-2 xl:py-4 2xl:py-6 lg:rounded-xl xl:rounded-xl 2xl:rounded-xl shadow-md border-4 border-primary-600">

          <p className='text-primary-600 font-inter font-extrabold uppercase text-center text-sm lg:text-sm xl:text-xl 2xl:text-2xl'>Sign UP</p>

          {/* SUCCESS MESSAGE */}
          {success && (
            <p className="text-green-500 text-sm text-center mb-4 font-semibold">{success}</p>
          )}

          {/* FIRST NAME */}
          <p className="text-primary-600 font-inter font-normal p-2 lg:p-0.5 xl:p-1 2xl:pl-0
          text-[13px]
          lg:text-[10px]
          xl:text-[13px]
          2xl:text-[16px]
          3xl:text-[19px]
          ">FIRST NAME *</p>
          <input
            ref={firstNameRef}
            type="text"
            value={firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            onBlur={() => handleBlur('firstName')}
            onKeyDown={(e) => focusNextEmpty(e, 'firstName')}
            className={inputClass('firstName')}
            placeholder="Enter Your First Name"
          />
          {touched.firstName && fieldErrors.firstName && (
            <p className="text-red-500 lg:text-[10px] xl:text-[11px] 2xl:text-[12px] 3xl:text-[13px] text-xs mb-2 px-1">⚠ {fieldErrors.firstName}</p>
          )}

          {/* LAST NAME */}
          <p className="text-primary-600  font-inter font-normal p-2 lg:p-0.5 xl:p-1 2xl:pl-0
          text-[13px]
          lg:text-[10px]
          xl:text-[13px]
          2xl:text-[16px]
          3xl:text-[19px]
          ">LAST NAME *</p>
          <input
            ref={lastNameRef}
            type="text"
            value={lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            onBlur={() => handleBlur('lastName')}
            onKeyDown={(e) => focusNextEmpty(e, 'lastName')}
            className={inputClass('lastName')}
            placeholder="Enter Your Last Name"
          />
          {touched.lastName && fieldErrors.lastName && (
            <p className="text-red-500 lg:text-[10px] xl:text-[11px] 2xl:text-[12px] 3xl:text-[13px]  text-xs mb-2 px-1">⚠ {fieldErrors.lastName}</p>
          )}

          {/* EMAIL */}
          <p className="text-primary-600  font-inter font-normal p-2 lg:p-0.5 xl:p-1 2xl:pl-0
          text-[13px]
          lg:text-[10px]
          xl:text-[13px]
          2xl:text-[16px]
          3xl:text-[19px]
          ">EMAIL *</p>
          <input
            ref={emailRef}
            type="email"
            value={email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            onKeyDown={(e) => focusNextEmpty(e, 'email')}
            className={inputClass('email')}
            placeholder="Enter Your Email Address"
          />
          {touched.email && fieldErrors.email && (
            <p className="text-red-500 lg:text-[10px] xl:text-[11px] 2xl:text-[12px] 3xl:text-[13px] text-xs mb-2 px-1">⚠ {fieldErrors.email}</p>
          )}

          {/* PASSWORD */}
          <p className="text-primary-600  font-inter font-normal p-2 lg:p-0.5 xl:p-1 2xl:pl-0
          text-[13px]
          lg:text-[10px]
          xl:text-[13px]
          2xl:text-[16px]
          3xl:text-[19px]
          ">PASSWORD *</p>
          <input
            ref={passwordRef}
            type="password"
            value={password}
            onChange={(e) => handleChange('password', e.target.value)}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => {
              setPasswordFocused(false)
              handleBlur('password')
            }}            
            onKeyDown={(e) => focusNextEmpty(e, 'password')}
            className={inputClass('password')}
            placeholder="Enter Your Password"
          />

          {passwordFocused && (
            <PasswordRequirements password={password} />
          )}
          {!passwordFocused && touched.password && fieldErrors.password && (
            <p className="text-red-500 lg:text-[10px] xl:text-[11px] 2xl:text-[12px] 3xl:text-[13px] text-xs  mb-2 px-1">⚠ {fieldErrors.password}</p>
          )}

          {/* CONFIRM PASSWORD */}
          <p className="text-primary-600  font-inter font-normal lg:p-0.5 xl:p-1 2xl:pl-0
          text-[13px]
          lg:text-[10px]
          xl:text-[13px]
          2xl:text-[16px]
          3xl:text-[19px]
          ">CONFIRM PASSWORD *</p>
          <input
            ref={confirmPasswordRef}
            type="password"
            value={confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            onBlur={() => handleBlur('confirmPassword')}
            onKeyDown={(e) => focusNextEmpty(e, 'confirmPassword')}
            className={`w-full mb-1 text-sm bg-white text-[13px] lg:text-[11px] xl:text-[13px] 2xl:text-[14px] 3xl:text-[16px] px-2 py-2 xl:py-1 2xl:py-2 3xl:py-2 border border-primary-600 ${touched.confirmPassword && fieldErrors.confirmPassword ? 'border-red-500 bg-red-50' : ''}`}
            placeholder="Enter Your Password"
          />
          {touched.confirmPassword && fieldErrors.confirmPassword && (
            <p className="text-red-500 lg:text-[10px] xl:text-[11px] 2xl:text-[12px] 3xl:text-[13px] text-xs mb-4 px-1">⚠ {fieldErrors.confirmPassword}</p>
          )}

          {/* TERMS & PRIVACY CHECKBOX */}
          <div className="mb-4 mt-2">
            <label className="flex font-inter items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked)
                  setAgreedTouched(true)
                }}
                className="mt-1 accent-primary-600"
              />
              <span className="text-xs lg:text-[10px] xl:text-[12px] 2xl:text-[14px] 3xl:text-[16px] text-gray-600">
                I have read and agree to the{' '}
                <span
                  onClick={() => navigate('/terms')}
                  className="text-primary-600 lg:text-[10px] xl:text-[12px] 2xl:text-[14px] 3xl:text-[16px] font-semibold cursor-pointer hover:underline"
                >
                  Terms of Service
                </span>{' '}
                and{' '}
                <span
                  onClick={() => navigate('/privacy')}
                  className="text-primary-600 lg:text-[10px] xl:text-[12px] 2xl:text-[14px] 3xl:text-[16px] font-semibold cursor-pointer hover:underline"
                >
                  Privacy Policy
                </span>
                .
              </span>
            </label>
            {agreedTouched && !agreed && (
              <p className="text-red-500 lg:text-[10px] xl:text-[11px] 2xl:text-[12px] 3xl:text-[13px] text-xs mt-1 px-1">⚠ You must agree to the Terms of Service and Privacy Policy.</p>
            )}
          </div>

<button
  onClick={handleSignup}
  disabled={loading || containsBadWords(firstName) || containsBadWords(lastName)}
  className="w-full bg-primary-800 hover:opacity-90 backdrop-blur-xs hover:-translate-y-1 hover:shadow-[0_8px_10px_rgba(0,0,0,0.5)] transition-all duration-300 font-normal font-inter text-white p-2 lg:text-[12px] lg:p-2 xl:p-3 2xl:p-4 rounded-full border disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
>
            {loading ? 'SIGNING UP...' : 'SIGN UP'}
          </button>

          <p className='text-center text-[13px] lg:text-[10px] xl:text-[12px] pt-5 font-inter text-primary-600'>OR</p>


          <div className="flex justify-center">
            <button
              onClick={handleGoogleSignup}
              disabled={loading}
                className="
                flex items-center gap-4
                 mt-1 
                px-2 py-2
                md:px-10 md:py-3
                lg:px-10 lg:py-1
                xl:px-10 xl:py-1
                2xl:px-10 2xl:py-1
                rounded-full 
                font-bold uppercase
                text-primary-600
                disabled:opacity-50
                shadow-[0_0px_2px_rgba(0,0,0,0.28)]
                hover:shadow-[0_18px_40px_rgba(0,0,0,0.28)]
                md:shadow-none
                lg:shadow-none
                xl:shadow-none
                2xl:shadow-none
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

export default Signup