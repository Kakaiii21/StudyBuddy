import { useEffect, useRef, useState, useMemo } from 'react'
import Sidebar from '../components/Sidebar'
import { useNavigate } from 'react-router-dom'
import StudyTimer from '../components/StudyTimer'
import { useAuth } from '../hooks/useAuth'
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useTimerContext } from '../context/TimerContext' 
import { useQuizHistory } from '../hooks/useQuizHistory'
import { useTasks } from '../hooks/useTasks'
import { useTour } from '../hooks/useTour'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'
import { uploadToCloudinary } from '../services/cloudinary'
import { useTheme } from '../context/ThemeContext'
import { CleanInput } from '../components/CleanInput'
import { containsBadWords } from '../utils/contentFilter'


const themeIcon = {
  light: '/sideIcons/theme-light.png',
  dark: '/sideIcons/theme-dark.png',
  warm: '/sideIcons/theme-warm.png',
}
const themeOptions = [
  { key: 'light', label: 'Light', img: '/sideIcons/themeLight.png' },
  { key: 'dark', label: 'Dark', img: '/sideIcons/themeDark.png' },
  { key: 'warm', label: 'Warm', img: '/sideIcons/themeWarm.png' },
] as const

function Dashboard() {
const { theme, setTheme } = useTheme()
const [showThemeModal, setShowThemeModal] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)  
  
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleScroll = () => {
    setIsScrolling(true)
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    scrollTimeout.current = setTimeout(() => setIsScrolling(false), 800)
  }

  useEffect(() => {
    return () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    }
  }, [])
  const mainRef = useRef<HTMLElement>(null)
  const idCardRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { user } = useAuth()
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (!user) {
          navigate('/login', { replace: true })
        } else if (!user.emailVerified) {
          navigate('/verify-email', { replace: true })
        }
        setAuthChecked(true)  
      })
      return () => unsubscribe()
    }, [])
  const { startTour } = useTour(
    'dashboard',
    false,
    () => setShowSidebar(true), 
    () => setShowSidebar(false), 
    user
  )
  const needHelpIcon = {
  light: '/needhelp.png',
  dark: '/needhelp-dark.png',
  warm: '/needhelp-warm.png',
}
const timerIcon = {
  light: '/timer.png',
  dark: '/timer-dark.png',
  warm: '/timer-warm.png',
}
  const { elapsedSeconds } = useTimerContext() 
  const { quizHistory } = useQuizHistory(user)
  const latestQuiz = quizHistory[0] ?? null
  const { tasks, loading: tasksLoading } = useTasks(user)
  const computedPercent = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter(
      (t: { status: string }) => t.status === 'done'
    ).length
    return total === 0 ? 0 : Math.round((done / total) * 100)
  }, [tasks])


  const [initialCachedPercent] = useState<number>(() => {
    const uid = user?.uid ?? sessionStorage.getItem('lastUid')
    if (!uid) return 0
    const cached = sessionStorage.getItem(`taskProgress_${uid}`)
    return cached ? Number(cached) : 0
  })

  const completedPercent = (!user || tasksLoading) ? initialCachedPercent : computedPercent

  
  useEffect(() => {
    if (!user) return
    sessionStorage.setItem('lastUid', user.uid)
  }, [user])

  useEffect(() => {
    if (!user || tasksLoading) return
    sessionStorage.setItem(`taskProgress_${user.uid}`, String(computedPercent))
  }, [computedPercent, tasksLoading, user])

  // Shape of the fields we read off the cached/live users/{uid} doc.
  // Matches the subset of Firestore fields this component actually uses.
  interface CachedUserDoc {
    firstName?: string
    lastName?: string
    photoURL?: string | null
    age?: number | null
    yearLevel?: string
    cardColor?: string
    hasCustomizedCard?: boolean
  }

  // One-time synchronous read of this device's cached copy of the user
  // doc, used only to seed initial state so the dashboard paints
  // instantly. This runs during render (lazy useState initializer), not
  // inside an effect — every subsequent update comes from the onSnapshot
  // listener's callback instead.
  const [initialUserCache] = useState<CachedUserDoc | null>(() => {
    const uid = user?.uid ?? sessionStorage.getItem('lastUid')
    if (!uid) return null
    const cached = sessionStorage.getItem(`user_${uid}`)
    if (!cached) return null
    try {
      return JSON.parse(cached) as CachedUserDoc
    } catch {
      return null
    }
  })

  const [firstName, setFirstName] = useState<string | null>(
    initialUserCache ? (initialUserCache.firstName || 'Student') : null
  )
  const [profilePic, setProfilePic] = useState(initialUserCache?.photoURL || '/profile.png')

  const [lastName, setLastName] = useState<string | null>(
    initialUserCache ? (initialUserCache.lastName || '') : null
  )
  const [age, setAge] = useState<number | null>(initialUserCache?.age ?? null)
  const [yearLevel, setYearLevel] = useState<string | null>(
    initialUserCache ? (initialUserCache.yearLevel || '') : null
  )
  const [hasCustomizedCard, setHasCustomizedCard] = useState<boolean | null>(
    initialUserCache ? (initialUserCache.hasCustomizedCard ?? false) : null
  )

  const [showCustomize, setShowCustomize] = useState(initialUserCache?.hasCustomizedCard === false)
  const [cardColor, setCardColor] = useState(initialUserCache?.cardColor || '#C9C9C9')
  const [formCardColor, setFormCardColor] = useState(initialUserCache?.cardColor || '#C9C9C9')

  const [formFirstName, setFormFirstName] = useState(
    initialUserCache?.hasCustomizedCard === false ? (initialUserCache?.firstName || '') : ''
  )
  const [formLastName, setFormLastName] = useState(
    initialUserCache?.hasCustomizedCard === false ? (initialUserCache?.lastName || '') : ''
  )
  const [formAge, setFormAge] = useState(
    initialUserCache?.hasCustomizedCard === false &&
    initialUserCache?.age !== undefined &&
    initialUserCache?.age !== null
      ? String(initialUserCache.age)
      : ''
  )
  const [formYearLevel, setFormYearLevel] = useState(
    initialUserCache?.hasCustomizedCard === false ? (initialUserCache?.yearLevel || '') : ''
  )

  // Pending profile-picture changes, staged in the modal until Save is clicked.
  const [pendingProfileFile, setPendingProfileFile] = useState<File | null>(null)
  const [pendingProfilePreview, setPendingProfilePreview] = useState<string | null>(null)
  const [pendingRemove, setPendingRemove] = useState(false)

// Lazy-init from sessionStorage instead of setting state inside an
// effect — this reads the toast stashed right before a forced reload
// (see handleSaveCustomizeAll) so a success message survives the
// reload, without the "setState synchronously in an effect" pattern.
const [toast, setToast] = useState<string | null>(() => {
  const pending = sessionStorage.getItem('pendingToast')
  if (pending) {
    sessionStorage.removeItem('pendingToast')
    return pending
  }
  return null
})

const showToast = (message: string) => {
  setToast(message)
  setTimeout(() => setToast(null), 3000)
}

// If a toast was recovered on mount, schedule its auto-clear the same
// way showToast does for a normal call.
useEffect(() => {
  if (!toast) return
  const timer = setTimeout(() => setToast(null), 3000)
  return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])


  const openCustomize = () => {
    setFormFirstName(firstName ?? '')
    setFormLastName(lastName ?? '')
    setFormAge(age !== null ? String(age) : '')
    setFormYearLevel(yearLevel ?? '')
    setFormCardColor(cardColor) 
    setPendingProfileFile(null)
    setPendingProfilePreview(null)
    setPendingRemove(false)
    setShowCustomize(true)
  }

  useEffect(() => {
    if (!user) return
    const cacheKey = `user_${user.uid}`

    // Live listener instead of a one-time getDoc: this is what makes
    // changes made on one device (e.g. laptop) show up on another (e.g.
    // phone) without a manual refresh — including the moment a write that
    // was queued while offline actually reaches Firestore. Every setState
    // call below happens inside this subscription callback, not directly
    // in the effect body.
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (!snap.exists()) return
        const data = snap.data()
        setFirstName(data.firstName || 'Student')
        setProfilePic(data.photoURL || '/profile.png')
        setLastName(data.lastName || '')
        setAge(data.age ?? null)
        setYearLevel(data.yearLevel || '')
        setCardColor(data.cardColor || '#C9C9C9')
        setHasCustomizedCard(data.hasCustomizedCard ?? false)
        if (data.hasCustomizedCard === false) {
          setFormFirstName(data.firstName || '')
          setFormLastName(data.lastName || '')
          setFormAge(data.age !== undefined && data.age !== null ? String(data.age) : '')
          setFormYearLevel(data.yearLevel || '')
          setShowCustomize(true)
        }
        sessionStorage.setItem(cacheKey, JSON.stringify(data))
      },
      (err) => {
        console.error('Failed to listen to user doc:', err)
      }
    )

    const handleUpdate = () => {
      const cachedNow = sessionStorage.getItem(cacheKey)
      if (cachedNow) {
        const data = JSON.parse(cachedNow)
        setProfilePic(data.photoURL || '/profile.png')
        setFirstName(data.firstName || 'Student')
      }
    }
    window.addEventListener('profilePicUpdated', handleUpdate)
    return () => {
      unsubscribe()
      window.removeEventListener('profilePicUpdated', handleUpdate)
    }
  }, [user])

  const formatElapsed = (total: number): string => {
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }


  const displayFirstName = firstName || '—'
  const displayLastName = lastName || '—'
  const displayAge = age !== null && age !== undefined && String(age) !== '' ? age : '—'
  const displayYearLevel = yearLevel || '—'
const [customizeErrors, setCustomizeErrors] = useState<{ firstName?: string; lastName?: string }>({})
  const customizeFileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingPic, setUploadingPic] = useState(false)

  // Tracks browser connectivity so picture upload/removal (which needs a
  // real network round-trip to Cloudinary/Cloud Functions) can be disabled
  // offline, while text fields + card color still save fine via Firestore's
  // built-in offline queueing.
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Live preview shown inside the customize modal only — reflects a
  // pending file pick / pending remove, not the saved profilePic yet.
  const modalPreviewSrc = pendingRemove
    ? '/profile.png'
    : (pendingProfilePreview || profilePic)

  // Waits for an image URL to actually finish loading before we swap it in.
  // Prevents a flash of the old cached picture / broken image if the CDN
  // or a service worker hasn't caught up with the new asset yet.
  const preloadImage = (src: string): Promise<void> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => reject(new Error(`Failed to preload ${src}`))
      img.src = src
    })

  // Stage a newly picked file as a local preview only. Nothing is
  // uploaded or deleted until Save is clicked.
  const handleProfilePicSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (pendingProfilePreview) URL.revokeObjectURL(pendingProfilePreview)
    setPendingProfileFile(file)
    setPendingProfilePreview(URL.createObjectURL(file))
    setPendingRemove(false)
    if (customizeFileInputRef.current) customizeFileInputRef.current.value = ''
  }

  // Stage a removal. Nothing is deleted from Cloudinary/Firestore until Save.
  const handleRemoveProfilePicClick = () => {
    if (pendingProfilePreview) URL.revokeObjectURL(pendingProfilePreview)
    setPendingProfileFile(null)
    setPendingProfilePreview(null)
    setPendingRemove(true)
  }

  // Discard any staged picture change and close the modal without saving.
  const handleCancelCustomize = () => {
    if (pendingProfilePreview) URL.revokeObjectURL(pendingProfilePreview)
    setPendingProfileFile(null)
    setPendingProfilePreview(null)
    setPendingRemove(false)
    setShowCustomize(false)
  }

  const handleSaveCardField = (
    field: 'firstName' | 'lastName' | 'age' | 'yearLevel' | 'cardColor',
    value: string | number
  ) => {
    if (!user) return Promise.resolve()
    const cacheKey = `user_${user.uid}`
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      sessionStorage.setItem(cacheKey, JSON.stringify({ ...JSON.parse(cached), [field]: value }))
    }
    // return the promise instead of firing-and-forgetting
    return updateDoc(doc(db, 'users', user.uid), { [field]: value }).catch((err) => {
      console.error(`Failed to sync ${field} to server:`, err)
    })
  }

 const handleSaveCustomizeAll = async () => {
  const trimmedFirst = formFirstName.trim()
  const trimmedLast = formLastName.trim()
setCustomizeErrors({})

if (containsBadWords(trimmedFirst) || containsBadWords(trimmedLast)) {
  showToast('Please remove inappropriate language.')
  return
}
  // NEW — block save if first/last name are empty
  const errors: { firstName?: string; lastName?: string } = {}
  if (!trimmedFirst) errors.firstName = 'First name is required.'
  if (!trimmedLast) errors.lastName = 'Last name is required.'
  if (errors.firstName || errors.lastName) {
    setCustomizeErrors(errors)
    return
  }
  setCustomizeErrors({})

  const numericAge = formAge ? Math.min(99, Math.max(1, Number(formAge))) : null

let photoCommitted = false

if (!isOnline && (pendingProfileFile || pendingRemove)) {
  showToast("You're offline — your photo change will save once you're back online.")
}

    // Commit a staged new profile picture (upload to Cloudinary, delete old asset).
    if (pendingProfileFile && user && isOnline) {
      setUploadingPic(true)
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid))
        const oldPublicId = userSnap.data()?.photoPublicId ?? null

        const result = await uploadToCloudinary(pendingProfileFile, undefined, user.uid)
        const bustedUrl = `${result.url}?v=${Date.now()}`

        await updateDoc(doc(db, 'users', user.uid), {
          photoURL: bustedUrl,
          photoPublicId: result.publicId,
          photoModerationStatus: 'pending'
        })

        try {
          await preloadImage(bustedUrl)
        } catch (preloadErr) {
          console.warn('Profile pic preload failed, setting src anyway:', preloadErr)
        }

        setProfilePic(bustedUrl)
        sessionStorage.setItem('profilePic', bustedUrl)
        window.dispatchEvent(new Event('profilePicUpdated'))

        const cacheKey = `user_${user.uid}`
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) {
          sessionStorage.setItem(cacheKey, JSON.stringify({ ...JSON.parse(cached), photoURL: bustedUrl, photoPublicId: result.publicId }))
        }

        if (oldPublicId) {
          await fetch('https://us-central1-study-buddy-cbaa8.cloudfunctions.net/deleteCloudinaryAsset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId: oldPublicId, resourceType: 'image' }),
          }).catch((err) => console.warn('Old profile pic delete failed:', err))
        }

        showToast('Profile picture updated successfully!')
        sessionStorage.setItem('pendingToast', 'Profile picture updated successfully!')
        photoCommitted = true
      } catch (err) {
        console.error('Profile picture upload failed:', err)
        showToast('Failed to upload picture. Please try again.')
      } finally {
        setUploadingPic(false)
      }
    } else if (pendingRemove && user && isOnline) {
      // Commit a staged removal.
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid))
        const oldPublicId = userSnap.data()?.photoPublicId ?? null

        await updateDoc(doc(db, 'users', user.uid), { photoURL: null, photoPublicId: null })

        setProfilePic('/profile.png')
        sessionStorage.setItem('profilePic', '/profile.png')
        window.dispatchEvent(new Event('profilePicUpdated'))

        const cacheKey = `user_${user.uid}`
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) {
          sessionStorage.setItem(cacheKey, JSON.stringify({ ...JSON.parse(cached), photoURL: null, photoPublicId: null }))
        }

        if (oldPublicId) {
          await fetch('https://us-central1-study-buddy-cbaa8.cloudfunctions.net/deleteCloudinaryAsset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId: oldPublicId, resourceType: 'image' }),
          }).catch((err) => console.warn('Old profile pic delete failed:', err))
        }

        showToast('Profile picture removed.')
        sessionStorage.setItem('pendingToast', 'Profile picture removed.')
        photoCommitted = true
      } catch (err) {
        console.error('Failed to remove profile picture:', err)
        showToast('Failed to remove picture. Please try again.')
      }
    }

    // Only clear the staged picture state once it's actually been committed
    // (or there was nothing pending). If we're offline, leave it staged so
    // it survives to the next Save attempt once connectivity returns.
    if (isOnline) {
      if (pendingProfilePreview) URL.revokeObjectURL(pendingProfilePreview)
      setPendingProfileFile(null)
      setPendingProfilePreview(null)
      setPendingRemove(false)
    }

    const pendingWrites: Promise<unknown>[] = []

    if (trimmedFirst && trimmedFirst !== firstName) pendingWrites.push(handleSaveCardField('firstName', trimmedFirst))
    if (trimmedLast && trimmedLast !== lastName) pendingWrites.push(handleSaveCardField('lastName', trimmedLast))
    if (numericAge !== null && numericAge !== age) pendingWrites.push(handleSaveCardField('age', numericAge))
    if (formYearLevel && formYearLevel !== yearLevel) pendingWrites.push(handleSaveCardField('yearLevel', formYearLevel))
    pendingWrites.push(handleSaveCardField('cardColor', formCardColor))
    setCardColor(formCardColor)

    if (!hasCustomizedCard && user) {
      const cacheKey = `user_${user.uid}`
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        sessionStorage.setItem(cacheKey, JSON.stringify({ ...JSON.parse(cached), hasCustomizedCard: true }))
      }
      pendingWrites.push(
        updateDoc(doc(db, 'users', user.uid), { hasCustomizedCard: true }).catch((err) => {
          console.error('Failed to sync hasCustomizedCard to server:', err)
        })
      )
      setHasCustomizedCard(true)
    }

    setFirstName(trimmedFirst || firstName)
    setLastName(trimmedLast)
    setAge(numericAge)
    setYearLevel(formYearLevel)
    setShowCustomize(false)

    // Wait for every Firestore write to actually reach the server before
    // reloading — otherwise reload() cancels the in-flight requests and
    // hasCustomizedCard never gets persisted, causing the modal to keep
    // reappearing.
    if (pendingWrites.length > 0) {
      await Promise.allSettled(pendingWrites)
    }

    if (photoCommitted) {
      window.location.reload()
    }
  }

  const activities = [
    { label: 'To Do List',     path: '/todolist',       color: '#FFD84D' },
    { label: 'Notes',          path: '/notes',          color: '#7FC4FF' },
    { label: 'Class Schedule', path: '/schedule',       color: '#B5E8A0' },
    { label: 'My Files',        path: '/myFiles',        color: '#C9A9F0' },
    { label: 'Study Generator',path: '/studyGenerator', color: '#FFB8D9' },
    { label: 'Generated History', path: '/history', color: '#FFB870' },
  ]

  const YEAR_LEVEL_GROUPS = [
    { label: 'Elementary', options: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'] },
    { label: 'Junior High', options: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'] },
    { label: 'Senior High', options: ['Grade 11', 'Grade 12'] },
    { label: 'College', options: ['1st Year', '2nd Year', '3rd Year', '4th Year'] },
  ]

  if (!authChecked) return null  
  return (
    <>
      <style>{`
        .upload-loader {
          width: fit-content;
          font-size: 40px;
          font-family: system-ui, sans-serif;
          font-weight: bold;
          text-transform: uppercase;
          color: #0000;
          -webkit-text-stroke: 1px #fff;
          background:
            radial-gradient(0.71em at 50% 1em, #fff 99%, #0000 101%) calc(50% - 1em) 1em/2em 200% repeat-x text,
            radial-gradient(0.71em at 50% -0.5em, #0000 99%, #fff 101%) 50% 1.5em/2em 200% repeat-x text;
          animation: l10-0 .8s linear infinite alternate, l10-1 4s linear infinite;
        }
        .upload-loader:before { content: "Loading"; }
        @keyframes l10-0 { to { background-position-x: 50%, calc(50% + 1em); } }
        @keyframes l10-1 { to { background-position-y: -.5em, 0; } }
      `}</style>

      {uploadingPic && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="upload-loader" />
        </div>
      )}

      {toast && (
        <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-primary-600 text-white px-6 py-3 rounded-xl shadow-lg font-inter text-sm transition-all'>
          {toast}
        </div>
      )}

    <div className='h-screen w-full  overflow-hidden bg-white dark:bg-[#0A0F15] FBF1E8 warm:bg-[#FBF1E8]'>
      <div className='flex h-full'>
        {/* Sidebar */}
        <div className='md:p-3 '>
          <Sidebar
            isOpenExternal={showSidebar}
            onExternalClose={() => setShowSidebar(false)}
          />
        </div>
        
        {/* Right of sidebar */}
        <div className='flex-1  flex flex-col overflow-hidden'>
        {/* Top Bar — mobile only */}
        <div className='lg:hidden dark:bg-[#010409] warm:bg-[#FBF1E8] flex items-center justify-between px-4 sm:px-6 py-2 bg-white  top-0 left-0 right-0 z-10 relative'>
          <p className='absolute left-1/2 -translate-x-1/2 font-inter font-semibold text-md text-[#B3B3B3]uppercase dark:text-white'>Dashboard</p>
          <div className='w-10' />
          <button
            id='timer-btn'                      
            onClick={() => navigate('/timer')}
            className='flex flex-col items-center gap-1 px-2 mt-3 md:mt-0 py-1'
          >
  <img
    src={timerIcon[theme]}
    alt='timer'
    className='w-10 h-10 select-none'
    onContextMenu={(e) => e.preventDefault()}
    draggable={false}
  />
              <span className='text-xs dark:text-white warm:text-[#623627] text-primary-600 font-bold'>Timer</span>
          </button>
        </div>
          {/* Body: main content + timer side by side */}
        <div className='flex w-full  flex-1 overflow-hidden mt-0 lg:mt-0'>
            {/* Scrollable Main Content */}
        <main ref={mainRef} onScroll={handleScroll}     className={`flex-1 min-w-0 w-full overflow-y-auto bg-white dark:bg-[#0A0F15] warm:bg-[#FBF1E8] px-3 lg:px-5 xl:px-6 2xl:px-7 3xl:px-8 custom-scroll ${isScrolling ? 'is-scrolling' : ''}`}>
        <p className='hidden md:flex w-full max-w-[520px] sm:max-w-[600px] md:max-w-[680px] lg:max-w-[clamp(560px,58vw,680px)] xl:max-w-[780px] 2xl:max-w-[1050px] 3xl:max-w-[1400px] mx-auto 
        font-inter font-semibold text-sm md:text-md lg:text-[10px] xl:text-[11px] 2xl:text-[13px] 3xl:text-[15px] text-[#B3B3B3] uppercase
        mt-6 sm:mt-5 md:mt-4 lg:mt-3 xl:mt-4 2xl:mt-5 3xl:mt-6 
        dark:text-white warm:text-[#623627]
        '>Dashboard</p>
        <div className='w-full   max-w-[520px] sm:max-w-[600px] md:max-w-[650px] lg:max-w-[clamp(560px,58vw,680px)] xl:max-w-[780px] 2xl:max-w-[1050px] 3xl:max-w-[1400px] mx-auto mt-2 '>
        <div className='flex  flex-col sm:flex-row sm:flex-nowrap w-full gap-4 sm:gap-5 md:gap-6 lg:gap-6 xl:gap-7 2xl:gap-7 3xl:gap-10 mt-0 justify-center items-center'>
            
        {/* ID Card */}
        <div id='idCard' ref={idCardRef} onClick={openCustomize} className='w-full flex-1 min-w-[100px] max-w-[350px] md:min-w-[340px] md:max-w-[420px]
          lg:min-w-[280px] lg:max-w-[clamp(260px,34vw,290px)] xl:min-w-[310px] xl:max-w-[340px] 
          2xl:min-w-[400px] 2xl:max-w-[430px] 3xl:min-w-[520px] 3xl:max-w-[550px]
          h-auto pb-3 bg-white  border-2 border-primary-800 dark:border-white warm:border-[#623627] rounded-lg overflow-hidden relative
          shadow-[0_5px_4px_-2px_rgba(0,0,0,0.25)]  group cursor-pointer'>

          {/* Header strip*/}
          <div
            className='w-full h-8 md:h-9 lg:h-8 xl:h-10 2xl:h-12 3xl:h-14 relative'
            style={{ backgroundColor: cardColor }}
          >
            <div className='absolute left-1/2 -translate-x-1/2 bottom-2 bg-white dark:bg-[#0A0F15] warm:bg-[#FBF1E8] w-20 md:w-22 lg:w-24 xl:w-28 2xl:w-32 3xl:w-36 h-3 md:h-3 lg:h-3 xl:h-4 2xl:h-5 3xl:h-6 border-2 border-primary-800 rounded-full'></div>
          </div>

          {/* Main content: photo + text + logo */}
          <div className='flex flex-row items-start gap-3 px-4 md:px-4 lg:px-3 lg:py-0 xl:px-5 xl:py-0 2xl:px-6 3xl:px-5 mt-2 lg:mt-2 xl:mt-2 2xl:mt-2 3xl:mt-2'>

            <div className='flex flex-col h-auto '>
              <img
                key={profilePic}
                src={profilePic}
                alt="Profile"
                crossOrigin="anonymous"
                className='w-[80px] h-[100px]  md:w-[85px] md:h-[115px]
                lg:w-[70px] lg:h-[85px] lg:my-1 xl:w-[90px] xl:h-[110px] xl:my-1.5 2xl:w-[110px] 2xl:h-[130px] 2xl:my-3 3xl:w-[135px] 3xl:h-[160px] object-cover border-2 border-primary-800'
              />
              <div
                className='w-full h-3 md:h-5 lg:h-3 xl:h-5 2xl:h-6 3xl:h-7 mt-2 lg:mt-1 2xl:-mt-1'
                style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, #000 0px, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 5px, transparent 5px, transparent 8px)',
                }}
              />
        <div className='relative w-full h-[8px] md:h-[8px] lg:h-[7px] xl:h-[9px] 2xl:h-[10px] 3xl:h-[13px] mt-1 overflow-hidden'>
          <p className='absolute inset-0 text-center text-[#B3B3B3] font-inter text-[7px] md:text-[7px] lg:text-[7px] xl:text-[8px] 2xl:text-[8px] 3xl:text-[10px] leading-tight'>
            NOT A VALID ID
          </p>
        </div>
    </div>

    <div className='flex flex-col flex-1 min-w-0 pl-0 3xl:pl-5'>
      <div className='flex flex-row items-start justify-between'>
        <span className='font-kapakana italic text-[28px] sm:text-[29px] md:text-[30px] lg:text-[28px] xl:text-[34px] 2xl:text-[40px] 3xl:text-[46px] font-extrabold text-primary-800 leading-tight'>
          Welcome to
        </span>
        <img src='/idLogo.png' alt="Logo" className='w-7 h-6 md:w-7 md:h-6 lg:w-8 lg:h-6 xl:w-10 xl:h-8 2xl:w-11 2xl:h-9 3xl:w-14 3xl:h-12 flex-shrink-0' />
      </div>

      <p className='text-xl md:text-2xl lg:text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 
      uppercase font-black font-inter text-primary-800 leading-tight -mt-2 lg:-mt-3'>Study Buddy</p>

      <span className='text-[6px] md:text-[9px] lg:text-[6px] xl:text-[8px] 2xl:text-[10px] 3xl:text-[11px] font-inter font-medium text-primary-800 leading-tight lg:mt-0 2xl:mt-1'>
        START YOUR DAY BY BEING PRODUCTIVE.
      </span>

      <div className='flex flex-row w-full'>
        {/* First Name and Age */}
        <div className='flex flex-col justify-start w-2/4'>
          <div className='flex flex-col'>
            <p className='text-[#636363] font-inter font-normal uppercase text-[8px]  md:text-[9px] lg:text-[7px] 2xl:text-[10px] 3xl:text-[13px] mt-1 sm:mt-1 md:mt-2 lg:mt-1 xl:mt-2 2xl:mt-3 3xl:mt-3'>First Name:</p>
            <span className='font-bold uppercase font-inter text-primary-800 text-sm md:text-sm lg:text-xs xl:text-sm 2xl:text-lg 3xl:text-2xl leading-tight mt-0 md:mt-0 lg:-mt-0 xl:mt-0 2xl:-mt-1 3xl:mt-0 truncate'>
              {displayFirstName}
            </span>
          </div>
          <div className='flex flex-col'>
            <p className='text-[#636363] font-inter font-normal uppercase text-[8px]  md:text-[9px] lg:text-[7px] 2xl:text-[10px] 3xl:text-[13px] mt-1 sm:mt-1 md:mt-2 lg:mt-1 xl:mt-2 2xl:mt-3 3xl:mt-2'>Age:</p>
            <span className='font-bold font-inter text-primary-800 text-sm md:text-sm lg:text-xs xl:text-sm 2xl:text-lg 3xl:text-2xl leading-tight mt-0 md:mt-0 lg:-mt-0 xl:mt-0 2xl:-mt-1 3xl:mt-0'>
              {displayAge}
            </span>
          </div>
        </div>

        {/* Last Name and Year Level */}
        <div className='flex flex-col w-2/4'>
          <div className='flex flex-col'>
            <p className='text-[#636363] font-inter font-normal uppercase text-[8px]  md:text-[9px] lg:text-[7px] 2xl:text-[10px] 3xl:text-[13px] mt-1 sm:mt-1 md:mt-2 lg:mt-1 xl:mt-2 2xl:mt-3 3xl:mt-3 '>Last Name:</p>
            <span className='uppercase font-bold font-inter text-primary-800 text-sm md:text-sm lg:text-xs xl:text-sm 2xl:text-lg 3xl:text-2xl leading-tight mt-0 md:mt-0 lg:-mt-0 xl:mt-0 2xl:-mt-1 3xl:mt-0 truncate'>
              {displayLastName}
            </span>
          </div>
          <div className='flex flex-col'>
            <p className='text-[#636363] font-inter font-normal uppercase text-[8px]  md:text-[9px] lg:text-[7px] 2xl:text-[10px] 3xl:text-[13px] mt-1 sm:mt-1 md:mt-2 lg:mt-1 xl:mt-2 2xl:mt-3 3xl:mt-2 '>Year Level:</p>
            <span className='uppercase font-bold font-inter text-primary-800 text-sm md:text-sm lg:text-xs xl:text-sm 2xl:text-lg 3xl:text-2xl leading-tight mt-0 md:mt-0 lg:-mt-0 xl:mt-0 2xl:-mt-1 3xl:mt-0'>
              {displayYearLevel}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Hover overlay */}
  <div data-card-overlay className='absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 
    transition-opacity duration-200 flex flex-col items-center justify-center gap-2 z-10'>

    <img src="./idCustom.png" alt="" className='w-6 h-6 md:w-7 md:h-7 lg:w-9 lg:h-9 xl:w-8 xl:h-8 2xl:w-9 2xl:h-9 3xl:w-10 3xl:h-10 select-none'  onContextMenu={(e) => e.preventDefault()} draggable={false} />
    <span className='font-inter font-medium text-xs md:text-sm lg:text-[8px] xl:text-sm 2xl:text-base 3xl:text-lg text-black uppercase'>
      Customize Card
    </span>
  </div>
</div>
    {/* Stats column */}
<div className='flex w-full flex-1 min-w-0 flex-row gap-x-4  md:flex-col md:flex-1 lg:flex-1   sm:min-w-[220px] sm:max-w-[280px] md:min-w-[240px] md:max-w-[300px] lg:min-w-[200px] lg:max-w-[clamp(260px,28vw,320px)] xl:min-w-[260px] xl:max-w-[320px] 2xl:max-w-[360px] 3xl:max-w-[440px]
  gap-y-3 md:gap-y-5 md:mt-1 lg:gap-y-5 lg:mt-1.5 xl:gap-y-7 xl:mt-1 3xl:gap-y-8 justify-between md:justify-center items-center pr-0 md:pr-3'>
      {/* Current Time Spent */}
      <div id='currentTime'           
        className='w-full h-auto px-1 md:px-4 lg:px-3 xl:min-px-8 2xl:min-px-2 3xl:min-px-2 py-3
          border-2 border-primary-600 
          dark:bg-[#BFC7D4] dark:border-white
          warm:bg-[#F9D5C6] warm:border-[#623627]
           rounded-xl flex items-center justify-start gap-x-4 md:gap-x-3 lg:gap-x-2 xl:gap-x-3 2xl:gap-x-1 3xl:gap-x-2
          md:min-h-[70px] 3xl:min-h-[85px]
        '>
        <img src="/currentTime.png" alt="Timer" onContextMenu={(e) => e.preventDefault()} draggable={false}
          className='h-9 w-9 md:h-10 md:w-10 lg:h-[40px]  lg:w-[40px] xl:h-[50px] xl:w-[50px] 2xl:h-16 2xl:w-16 3xl:h-20 3xl:w-20 flex-shrink-0 select-none' />
        <div className='flex flex-col flex-1 items-center'>
          <p className='text-[10px] md:text-[10px] lg:text-[12px] xl:text-[16px] 2xl:min-text-lg 3xl:text-xl font-extrabold font-inter text-center text-primary-600 2xl:-mt-2 3xl:mt-0'>Current Time Spent</p>
          <p className='text-[20px] md:text-[25px] lg:text-[25px] xl:text-[30px] 2xl:text-[35px] 3xl:text-[45px] font-intelOneMono font-normal text-center text-primary-600 2xl:mt-1 3xl:mt-3'>
            {formatElapsed(elapsedSeconds)}
          </p>
        </div>
      </div>
      {/* Current Score */}
      <div id='currentScore' 
        className='w-full h-auto px-2 md:px-4 lg:px-3 xl:min-px-8 2xl:min-px-2 3xl:min-px-2 py-3 
          border-2 border-primary-600
          dark:bg-[#BFC7D4] dark:border-white
          warm:bg-[#FBD79A] warm:border-[#623627] rounded-xl flex items-center justify-start gap-x-4 md:gap-x-3 lg:gap-x-2 xl:gap-x-3 2xl:gap-x-10 3xl:gap-x-12
          md:min-h-[70px] 3xl:min-h-[85px]
        '>
        <img src="/currentScore.png" alt="Score" onContextMenu={(e) => e.preventDefault()} draggable={false}         
          className='h-9 w-9 md:h-10 md:w-10 lg:h-[40px] lg:w-[40px] xl:h-[50px] xl:w-[50px] 2xl:h-16 2xl:w-16 3xl:h-20 3xl:w-20 flex-shrink-0 select-none' />
        <div className='flex flex-col flex-1 items-center xl:pr-10'>
          <p className='text-[10px] md:text-[10px] lg:text-[12px] xl:text-[16px] 2xl:min-text-lg 3xl:text-xl font-extrabold font-inter text-center text-primary-600 2xl:-mt-2 3xl:mt-0'>Current Score</p>
          <p className='text-[20px] md:text-[25px] lg:text-[25px] xl:text-[30px] 2xl:text-[35px] 3xl:text-[45px] font-roboto font-bold text-center text-primary-600 2xl:mt-1 3xl:mt-3'>
            {latestQuiz ? `${latestQuiz.score}/${latestQuiz.total}` : '00/00'}
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
{/* TASK PROGRESS */}
<div id='progressC' >
  <div className='flex items-center justify-between w-full max-w-[520px] sm:max-w-[600px] md:max-w-[680px] lg:max-w-[clamp(560px,58vw,680px)] xl:max-w-[780px] 2xl:max-w-[1050px] 3xl:max-w-[1400px] lg:pr-3 mx-auto lg:mt-1 2xl:mt-5 3xl:mt-6 mt-6 sm:mt-5 md:mt-5'>
  <p className='font-inter font-semibold text-sm md:text-md 
  lg:text-[10px] xl:text-[11px] 2xl:text-[13px] 3xl:text-[15px]
dark:text-white warm:text-[#623627]
 text-[#B3B3B3] uppercase'>TASK PROGRESS IN TO DO LIST</p>
  <span className='font-inter font-semibold text-sm md:text-md 
  lg:text-[10px] xl:text-[11px] 2xl:text-[13px] 3xl:text-[15px] dark:text-white warm:text-[#623627] text-primary-600'>{completedPercent}%</span>
</div>
{/* HORIZONTAL PROGRESS BAR */}
<div  className='w-full max-w-[520px] sm:max-w-[600px] md:max-w-[680px] lg:max-w-[clamp(560px,58vw,680px)] xl:max-w-[780px] 2xl:max-w-[1050px] 3xl:max-w-[1400px] mx-auto px-2 mt-3 xl:mt-3 2xl:mt-3 3xl:mt-4 mb-2'>
  <div className='w-full h-3 lg:h-3 xl:h-3 3xl:h-4 bg-gray-200 warm:bg-[#E0CABE] rounded-full overflow-hidden'>
    <div
      className='h-full bg-[#9CCF7E] dark:bg-[#4E5669]  warm:bg-[#623627] rounded-full  transition-all  duration-500 ease-out'
      style={{ width: `${completedPercent}%` }}
    />
  </div>
</div>
</div>

<div className='flex  flex-row w-full mt-5 sm:mt-4 md:mt-4 lg:mt-1 lg:pr-3  2xl:mt-3 3xl:mt-4 max-w-[520px] sm:max-w-[600px] md:max-w-[680px] lg:max-w-[clamp(560px,58vw,680px)] xl:max-w-[780px] 2xl:max-w-[1050px] 3xl:max-w-[1400px] mx-auto justify-between'>
  <p className='font-inter  mt-5 2xl:mt-8 3xl:mt-9 font-semibold text-sm md:text-md 
  lg:text-[10px] xl:text-[11px] 2xl:text-[13px] 3xl:text-[15px] dark:text-white warm:text-[#623627] text-[#B3B3B3] uppercase'>Activities</p>

  <div className='flex flex-row items-start  gap-4'>
    {/* THEME BUTTON — left of Need Help */}
    <button
      id='theme-btn'
      type='button'
      onClick={() => setShowThemeModal(true)}
      title='Change theme'
      className='flex flex-col items-center justify-center'
    >
      <div className='w-7 h-7   lg:w-7 lg:h-7 2xl:w-10 2xl:h-10 3xl:w-12 3xl:h-12 flex items-center justify-center text-2xl font-bold'>
        <img
          src={themeIcon[theme]}
          alt='Theme'
          className='w-12 lg:w-10 mb-2 block mx-auto mt-1 select-none rounded-md'
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
        />
      </div>
      <p className='text-[8px] md:text-[8px] dark:text-white warm:text-[#623627] warm:font-bold text-primary-800 uppercase text-center lg:text-[8px] 2xl:text-[10px] 3xl:text-[11px] font-inter font-semibold'>Theme</p>
    </button>
{showThemeModal && (
  <div
    className='fixed inset-0 z-50 bg-black/50 flex items-center justify-center'
    onClick={() => setShowThemeModal(false)}
  >
    <div
      className='bg-white rounded-2xl border-2 border-black shadow-xl p-8 lg:py-4 lg:px-5 2xl:py-6 3xl:py-8 w-80 lg:w-64 xl:w-72 2xl:w-80 3xl:w-96 text-center'
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className='text-xl lg:text-sm xl:text-lg 2xl:text-xl 3xl:text-2xl font-bold text-primary-600 font-roboto mb-4'>
        Select a theme
      </h2>
      <div className='flex justify-between gap-2'>
        {themeOptions.map(({ key, label, img }) => (
          <button
            key={key}
            onClick={() => { setTheme(key); setShowThemeModal(false) }}
            aria-label={`${label} mode`}
            className='flex flex-col items-center gap-1 flex-1'
          >
            <img
              src={img}
              alt=''
              className={`w-16 h-16 lg:w-12 lg:h-12 xl:w-14 xl:h-14 2xl:w-16 2xl:h-16 3xl:w-20 3xl:h-20 rounded-md select-none object-contain transition-transform duration-200 hover:scale-105 ${theme === key ? 'ring-2 ring-[#FEE248]' : ''}`}
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
            />
            <span className='text-black font-roboto uppercase text-xs lg:text-[9px] xl:text-[10px] 2xl:text-xs 3xl:text-sm'>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  </div>
)}
    {/* NEED HELP BUTTON (unchanged) */}
    <button
      id='tour-btn'
      onClick={() => startTour()}
      title='Take a Tour'
      className='flex flex-col items-center justify-center'
    >
      <div className='w-7 h-7 lg:w-7 lg:h-7 2xl:w-10 2xl:h-10 3xl:w-12 3xl:h-12  flex items-center justify-center text-2xl font-bold'>
        <img
          src={needHelpIcon[theme]}
          alt="?"
          className='w-10 mb-2 block mx-auto mt-1 select-none '
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
        />
      </div>
      <p className='text-[8px] md:text-[8px] dark:text-white warm:text-[#623627] warm:font-bold text-primary-800  uppercase text-center lg:text-[8px] 2xl:text-[10px] 3xl:text-[11px]
      font-inter font-semibold'>Need Help?</p>
    </button>
  </div>
</div>
{/* Activities Grid */}
<div id='activitiesGrid' className='flex  justify-center pb-8 mt-3 sm:mt-3 md:mt-3 lg:mt-3 lg:pr-3 2xl:mt-2 3xl:mt-3 pr-1'>
  <div className='grid  grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:px-2 2xl:grid-cols-3 3xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-x-10 lg:gap-y-4 xl:gap-x-11 xl:gap-y-5 2xl:gap-x-10 2xl:gap-y-8 3xl:gap-x-12 3xl:gap-y-9'>
    {activities.map((activity) => (
      <button
        key={activity.label}
        onClick={() => navigate(activity.path)}
        style={{ backgroundColor: activity.color  }}
className='relative flex flex-col justify-between text-left p-2  s
  min-w-[100px] h-[100px]  md:w-[190px] md:h-[120px] lg:w-full lg:max-w-[170px] xl:max-w-[170px] 2xl:max-w-[300px] 3xl:max-w-[340px] lg:h-[100px] xl:w-[170px] xl:h-[120px] 2xl:w-[230px] 2xl:h-[145px] 3xl:w-[270px] 3xl:h-[165px]
  border-2 border-black rounded-2xl lg:rounded-lg 
  warm:border-[#623627] warm:border-2
  hover:scale-[1.02] active:scale-[0.98] transition-transform'
      >
        <span className='font-inter font-black text-base sm:text-base md:text-lg lg:text-[14px] xl:text-[20px] 2xl:text-[26px] 3xl:text-[30px] text-black uppercase leading-tight  pr-8'>
          {activity.label}
        </span>
        <div className='absolute bottom-3 
        drop-shadow-[0_4px_2px_rgba(0,0,0,0.4)]
        right-3 w-8 h-8 sm:w-8 sm:h-8 md:w-9 md:h-9 2xl:w-14 2xl:h-14 3xl:w-16 3xl:h-16 rounded-full bg-black flex items-center justify-center'>
          <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round'>
            <polyline points='9 6 15 12 9 18' />
          </svg>
        </div>
      </button>
    ))}
  </div>
</div>
</main>
 {/* Timer Panel  */}
 <div
   id='timer-panel'
   className='hidden warm:bg-[#623627] lg:flex lg:flex-shrink-0 lg:h-full lg:w-[30%] xl:w-[30%] 2xl:w-[28%] 3xl:w-[26%]'
 >
   <div className='h-full w-full overflow-y-auto'>
     <StudyTimer />
   </div>
</div>
          </div>
        </div>
      </div>

      {showCustomize && (
        <div className='fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-1 md:p-4'>
          <div className='bg-white dark:bg-[#010409] dark:border-white warm:bg-[#FBF1E8] warm:border-[#623627]
           rounded-lg border-2 border-black w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8'>

            <p className='text-center dark:text-white warm:text-[#623627] lg:text-xs xl:text-sm 2xl:text-lg 3xl:text-xl font-inter font-semibold text-gray-400 uppercase tracking-wide mb-6'>
              Customize Card
            </p>

            <div className='flex flex-col md:flex-row gap-8'>
              <div className='flex-1 min-w-0'>

                {/* Live mini preview */}
                <div className='w-full max-w-[320px] 3xl:max-w-[400px] mx-0 md:mx-auto border-2 border-primary-800 dark:border-white dark:bg-white warm:bg-white warm:border-[#623627] rounded-lg overflow-hidden mb-6 lg:mb-2'>
                  <div className='w-full h-8 3xl:h-10 relative' style={{ backgroundColor: formCardColor }}>
                    <div className='absolute left-1/2 -translate-x-1/2 bottom-2 bg-white dark:bg-[#010409] warm:bg-[#FBF1E8] w-24 h-3 border-2 border-primary-800 rounded-full' />
                  </div>
                  <div className='flex flex-row items-start gap-3 px-2 md:px-4 pt-2 pb-3'>
                    <div className='flex flex-col items-center gap-1'>
                      <div className='relative w-[75px] h-[100px] group/pic'>
                        <button
                          type='button'
                          aria-label='change profile picture'
                          disabled={uploadingPic || !isOnline}
                          onClick={() => customizeFileInputRef.current?.click()}
                          className='relative w-full h-full block disabled:opacity-40'
                        >
                          <img
                            key={modalPreviewSrc}
                            src={modalPreviewSrc}
                            alt="Profile"
                            className={`w-full h-full object-cover border-2 border-primary-800 ${uploadingPic ? 'opacity-40' : 'opacity-100'}`}
                          />
                          {/* Hover overlay */}
                          <div className='absolute inset-0 bg-black/50 opacity-0 group-hover/pic:opacity-100 transition-opacity duration-200 flex items-center justify-center'>
                            <span className='text-white text-[9px] font-inter font-medium uppercase text-center px-1'>
                              {uploadingPic ? 'Uploading...' : !isOnline ? 'Offline' : 'Change'}
                            </span>
                          </div>
                        </button>
                        <input
                          ref={customizeFileInputRef}
                          type="file"
                          accept="image/png, image/jpg, image/jpeg"
                          className="hidden"
                          onChange={handleProfilePicSelect}
                        />
                      </div>
                      <button
                        type='button'
                        onClick={handleRemoveProfilePicClick}
                        disabled={!isOnline}
                        className='text-red-500 text-[9px] font-inter hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed'
                      >
                        Remove
                      </button>
                      {!isOnline && (
                        <p className='text-[7px] text-gray-400 font-inter text-center leading-tight'>
                          Connect to change photo
                        </p>
                      )}
                      <div
                        className='w-full h-3 mt-2'
                        style={{
                          backgroundImage: 'repeating-linear-gradient(90deg, #000 0px, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 5px, transparent 5px, transparent 8px)',
                        }}
                      />
                    <div className='relative w-full h-[8px] mt-1 overflow-hidden'>
                    <p className='absolute inset-0 text-center text-[#B3B3B3] font-inter text-[8px] leading-tight'>
                        NOT A VALID ID
                    </p>
                  </div>
                    </div>
                    <div className='flex flex-col flex-1 min-w-0'>
                      <div className='flex flex-row items-start justify-between'>
                        <span className='font-kapakana italic text-2xl font-extrabold text-primary-800 leading-tight'>Welcome to</span>
                        <img src='/idLogo.png' alt="Logo" className='w-7 h-6 flex-shrink-0' />

                      </div>
                      <p className='text-sm md:text-xl uppercase font-black font-inter text-primary-800 leading-tight -mt-1'>Study Buddy</p>
                      <span className='text-[6px] md:text-[8px] font-inter font-medium text-primary-800 leading-tight'>START YOUR DAY BY BEING PRODUCTIVE.</span>
                      <div className='flex flex-row w-full mt-2'>
                        <div className='flex flex-col w-1/2'>
                          <p className='text-[#636363] font-inter text-[8px] uppercase'>First Name:</p>
                          <span className='font-bold uppercase font-inter text-primary-800 text-xs md:text-sm leading-tight truncate'>{formFirstName || '—'}</span>
                          <p className='text-[#636363] font-inter text-[8px] uppercase mt-1'>Age:</p>
                          <span className='font-bold font-inter text-primary-800 text-xs md:text-sm leading-tight truncate'>{formAge || '—'}</span>
                        </div>
                        <div className='flex flex-col w-1/2'>
                          <p className='text-[#636363] font-inter text-[8px] uppercase'>Last Name:</p>
                          <span className='uppercase font-bold font-inter text-primary-800 text-xs md:text-sm leading-tight truncate'>{formLastName || '—'}</span>
                          <p className='text-[#636363] font-inter text-[8px] uppercase mt-1'>Year Level:</p>
                          <span className='uppercase font-bold font-inter text-primary-800 text-xs md:text-sm leading-tight'>{formYearLevel || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <div className='flex flex-col gap-2'>
                  <div>
                    <label className='block font-inter text-gray-400 dark:text-white warm:text-[#623627] font-bold uppercase text-sm lg:text-xs 3xl:text-sm mb-1'>First Name *</label>
                      <CleanInput
                        type='text'
                        value={formFirstName}
                        onChange={(e) => {
                          setFormFirstName(e.target.value)
                          if (customizeErrors.firstName) setCustomizeErrors((prev) => ({ ...prev, firstName: undefined }))
                        }}
                        placeholder='Required'
                        className={`w-full bg-gray-100 border rounded-md px-3 py-2 font-inter text-primary-800 lg:text-xs ${customizeErrors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {customizeErrors.firstName && (
                        <p className='text-red-500 text-[10px] font-inter mt-1'>{customizeErrors.firstName}</p>
                      )}
                  </div>
                  <div>
                    <label className='block font-inter text-gray-400  dark:text-white warm:text-[#623627] font-bold uppercase text-sm lg:text-xs 3xl:text-sm mb-1'>Last Name *</label>
<CleanInput
  type='text'
  value={formLastName}
  onChange={(e) => {
    setFormLastName(e.target.value)
    if (customizeErrors.lastName) setCustomizeErrors((prev) => ({ ...prev, lastName: undefined }))
  }}
  placeholder='Required'
  className={`w-full bg-gray-100 border rounded-md px-3 py-2 font-inter text-primary-800 lg:text-xs ${customizeErrors.lastName ? 'border-red-500' : 'border-gray-300'}`}
/>
{customizeErrors.lastName && (
  <p className='text-red-500 text-[10px] font-inter mt-1'>{customizeErrors.lastName}</p>
)}
                  </div>
                  <div className='flex gap-4'>
                    <div className='flex-1'>
                      <label className='block font-inter text-gray-400  dark:text-white warm:text-[#623627] font-bold uppercase text-sm lg:text-xs 3xl:text-sm mb-1'>Age</label>
                        <input
                          type='number'
                          min={1}
                          max={99}
                          value={formAge}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === '' || (Number(val) >= 1 && Number(val) <= 99)) {
                              setFormAge(val)
                            }
                          }}
                          placeholder='Optional'
                          className='w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 font-inter text-primary-800 lg:text-xs'
                        />
                    </div>
                    <div className='flex-1'>
                      <label className='block font-inter text-gray-400  dark:text-white warm:text-[#623627] font-bold uppercase text-sm lg:text-xs 3xl:text-sm mb-1'>Year Level</label>
                      <select
                        value={formYearLevel}
                        onChange={(e) => setFormYearLevel(e.target.value)}
                        className='w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 font-inter text-primary-800 lg:text-xs'
                      >
                        <option value=''>Select... (optional)</option>
                        {YEAR_LEVEL_GROUPS.map((group) => (
                          <optgroup key={group.label} label={group.label}>
                            {group.options.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className='w-full md:w-56 flex flex-col gap-3'>

                <p className='order-1 md:order-4 text-center font-inter dark:text-white warm:text-[#623627] font-bold text-gray-400 uppercase text-sm mt-0 md:mt-4 mb-2'>Color</p>
                <div className='order-2 md:order-5 border-2 warm:border-[#623627] dark:border-white border-black rounded-xl p-4 grid grid-cols-4 gap-3'>
                  {['#C9C9C9', '#000000', '#FFD84D', '#7FC4FF', '#B5E8A0', '#D9CBF5', '#FFB8D9', '#FFA55E'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormCardColor(color)}
                      className={`w-10 h-10 rounded-md border-2 ${formCardColor === color ? 'border-black ring-2 ring-offset-1 ring-black' : 'border-gray-300'}`}
                      style={{ backgroundColor: color }}
                      aria-label={`Choose color ${color}`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleSaveCustomizeAll}
                  disabled={uploadingPic}
                  className='order-3 md:order-1 mt-1 md:mt-0 border-2 warm:border-[#623627] warm:bg-[#FBD79A] dark:text-black dark:border-white border-black rounded-lg py-3 font-inter font-bold uppercase bg-[#FFD84D] hover:brightness-95 disabled:opacity-50'
                >
                  {uploadingPic ? 'Saving...' : 'Save'}
                </button>

                <button
                  onClick={handleCancelCustomize}
                  className='order-5 md:order-3 border-2 warm:border-[#623627] warm:bg-[#F9D5C6] warm:hover:opacity-60 dark:bg-[#657084] dark:text-white dark:border-white border-black rounded-lg py-3 font-inter font-bold uppercase hover:bg-gray-50'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
export default Dashboard