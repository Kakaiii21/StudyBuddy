import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import { uploadToCloudinary } from '../services/cloudinary'
import { auth } from '../services/firebase'
import { logout, deactivateAccount } from '../services/authService'
import { useNavigate } from 'react-router-dom'
import { CleanInput } from '../components/CleanInput'
import { containsBadWords } from '../utils/contentFilter'

interface BasicInfoProps {
  setActiveTab: (tab: string) => void
}

function BasicInfo({ setActiveTab }: BasicInfoProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')

  const [originalFirstName, setOriginalFirstName] = useState('')
  const [originalLastName, setOriginalLastName] = useState('')
  const [profilePic, setProfilePic] = useState('/profile.png')
  const [saving, setSaving] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const [firstNameError, setFirstNameError] = useState(false)
  const [lastNameError, setLastNameError] = useState(false)

  // ── logout state ──────────────────────────────────────────────────
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  // ────────────────────────────────────────────────────────────────────────
const prevModerationStatusRef = useRef<string | null>(null)
  // ── NEW: remove profile pic state ───────────────────────────────────
const [showRemovePicModal, setShowRemovePicModal] = useState(false)
const [removingPic, setRemovingPic] = useState(false)
// ────────────────────────────────────────────────────────────────────────
  // ── NEW: deactivate state ─────────────────────────────────────────
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  // ────────────────────────────────────────────────────────────────────────

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const maskEmail = (em: string) => {
    if (!em) return ''
    const [local, domain] = em.split('@')
    return `${local[0]}${'•'.repeat(Math.max(local.length - 1, 3))}@${domain}`
  }

  // ── FIX: fetchUser now only trusts the sessionStorage cache when it has
  // no pendingEmail. If a pendingEmail is present (or there's no cache at
  // all), it always reloads auth + refetches Firestore and reconciles,
  // so a confirmed email change can never be masked by a stale cache. ──
  useEffect(() => {
    if (!user) return
    const fetchUser = async () => {
      const cacheKey = `user_${user.uid}`
      const cached = sessionStorage.getItem(cacheKey)
      const cachedData = cached ? JSON.parse(cached) : null

      // Fast path: cache exists and has nothing pending — safe to trust.
      if (cachedData && !cachedData.pendingEmail) {
        setFirstName(cachedData.firstName || '')
        setLastName(cachedData.lastName || '')
        setOriginalFirstName(cachedData.firstName || '')
        setOriginalLastName(cachedData.lastName || '')
        setProfilePic(cachedData.photoURL || '/profile.png')
        setEmail(cachedData.email || user.email || '')
        return
      }

      // Slow path: no cache, or cache has a pendingEmail that needs
      // reconciling against the current auth/Firestore state.
      await user.reload()
      const authEmail = auth.currentUser?.email
      const docSnap = await getDoc(doc(db, 'users', user.uid))
      if (docSnap.exists()) {
        const data = docSnap.data()
        setFirstName(data.firstName || '')
        setLastName(data.lastName || '')
        setOriginalFirstName(data.firstName || '')
        setOriginalLastName(data.lastName || '')
        setProfilePic(data.photoURL || '/profile.png')

        if (data.pendingEmail && authEmail === data.pendingEmail) {
          await updateDoc(doc(db, 'users', user.uid), {
            email: data.pendingEmail,
            pendingEmail: null
          })
          const updated = { ...data, email: data.pendingEmail, pendingEmail: null }
          sessionStorage.setItem(cacheKey, JSON.stringify(updated))
          setEmail(data.pendingEmail)
          showToast('Email updated successfully!')
        } else {
          sessionStorage.setItem(cacheKey, JSON.stringify(data))
          setEmail(data.email || user.email || '')
        }
      }
    }
    fetchUser()
  }, [user])

const handleSave = async (field: 'firstName' | 'lastName') => {
  if (!user) return
  const value = field === 'firstName' ? firstName : lastName
  if (containsBadWords(value)) return
    const trimmed = value.trim()

    if (!trimmed) {
      if (field === 'firstName') setFirstNameError(true)
      else setLastNameError(true)
      return
    }

    setSaving(field)
    try {
      await updateDoc(doc(db, 'users', user.uid), { [field]: trimmed })
      const cacheKey = `user_${user.uid}`
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        sessionStorage.setItem(cacheKey, JSON.stringify({ ...JSON.parse(cached), [field]: trimmed }))
      }
      const label = field === 'firstName' ? 'First name' : 'Last name'
      showToast(`${label} updated successfully!`)
    } catch (err) {
      console.error(`Failed to save ${field}:`, err)
      showToast('Failed to save. Please try again.')
    } finally {
      setSaving(null)
    }
  }

  const handleSaveAll = async () => {
      if (nameHasBadWords) return   // the message under the field explains why
  const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()

    setFirstNameError(!trimmedFirst)
    setLastNameError(!trimmedLast)

    if (!trimmedFirst || !trimmedLast) return

    const firstChanged = trimmedFirst !== originalFirstName.trim()
    const lastChanged = trimmedLast !== originalLastName.trim()

    if (firstChanged) await handleSave('firstName')
    if (lastChanged) await handleSave('lastName')

    setOriginalFirstName(trimmedFirst)
    setOriginalLastName(trimmedLast)
  }
  // Live listener for the moderation outcome of a pending photo upload.
// handleProfilePicChange no longer claims success on upload alone — this
// is what actually confirms approval (or reports rejection) once
// Cloudinary's webhook resolves it, seconds after the upload finishes.
useEffect(() => {
  if (!user) return
  const unsubscribe = onSnapshot(
    doc(db, 'users', user.uid),
    (snap) => {
      if (!snap.exists()) return
      const data = snap.data()
      const status = data.photoModerationStatus ?? null

      if (prevModerationStatusRef.current === 'pending' && status === 'approved') {
        showToast('Profile picture updated successfully!')
      } else if (prevModerationStatusRef.current === 'pending' && status === 'rejected') {
        showToast('Your photo was rejected and removed — reverted to default.')
      }
      prevModerationStatusRef.current = status

      setProfilePic(data.photoURL || '/profile.png')

      const cacheKey = `user_${user.uid}`
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          ...JSON.parse(cached),
          photoURL: data.photoURL ?? null,
          photoPublicId: data.photoPublicId ?? null,
        }))
      }
    },
    (err) => console.error('Failed to listen to photo moderation status:', err)
  )
  return () => unsubscribe()
}, [user])

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      const userSnap = await getDoc(doc(db, 'users', user.uid))
      const oldPublicId = userSnap.data()?.photoPublicId ?? null

      const result = await uploadToCloudinary(file, undefined, user.uid)
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: result.url,
        photoPublicId: result.publicId,
        photoModerationStatus: 'pending'
      })
      setProfilePic(result.url)
      sessionStorage.setItem('profilePic', result.url)
      window.dispatchEvent(new Event('profilePicUpdated'))

      const cacheKey = `user_${user.uid}`
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        sessionStorage.setItem(cacheKey, JSON.stringify({ ...JSON.parse(cached), photoURL: result.url, photoPublicId: result.publicId }))
      }

      if (oldPublicId) {
        await fetch('https://us-central1-study-buddy-cbaa8.cloudfunctions.net/deleteCloudinaryAsset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId: oldPublicId, resourceType: 'image' }),
        }).catch((err) => console.warn('Old profile pic delete failed:', err))
      }

      showToast('Photo uploaded — checking it now...')
    } catch (err) {
      console.error('Profile picture upload failed:', err)
      showToast('Failed to upload picture. Please try again.')
    } finally {
      setUploading(false)
    }
  }

const handleRemoveProfilePic = async () => {
  if (!user) return
  setRemovingPic(true)
  try {
    const userSnap = await getDoc(doc(db, 'users', user.uid))
    const oldPublicId = userSnap.data()?.photoPublicId ?? null

    await updateDoc(doc(db, 'users', user.uid), {
      photoURL: null,
      photoPublicId: null
    })

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
  } catch (err) {
    console.error('Failed to remove profile picture:', err)
    showToast('Failed to remove picture. Please try again.')
  } finally {
    setRemovingPic(false)
    setShowRemovePicModal(false)
  }
}

  // ── logout handler ──────────────────────────────────────────────────
  const handleLogout = async () => {
    sessionStorage.clear()
    sessionStorage.setItem('intentionalLogout', 'true')
    await logout()
    setShowLogoutModal(false)
    navigate('/')
    window.history.replaceState(null, '', '/')
  }
  // ──────────────────────────────────────────────────────────────────────────

  // ── NEW: deactivate handler ───────────────────────────────────────
  const handleDeactivate = async () => {
    setDeactivating(true)
    try {
      await deactivateAccount()
      sessionStorage.clear()
      sessionStorage.setItem('intentionalLogout', 'true')
      await logout()
      navigate('/')
      window.history.replaceState(null, '', '/')
    } catch (err) {
      console.error('Failed to deactivate account:', err)
      showToast('Failed to deactivate. Please try again.')
      setDeactivating(false)
      setShowDeactivateModal(false)
    }
  }
  // ──────────────────────────────────────────────────────────────────────────
const nameHasBadWords = containsBadWords(firstName) || containsBadWords(lastName)
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

      {uploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="upload-loader" />
        </div>
      )}

      {toast && (
        <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary-600 text-white px-6 py-3 rounded-xl shadow-lg font-inter text-sm transition-all'>
          {toast}
        </div>
      )}

      <div className='w-full px-4 md:px-16 lg:px-5 xl:px-7 2xl:px-9 3xl:px-11 py-6 lg:py-0 '>

        <h1 className='text-primary-600 dark:text-white  font-semibold font-inter text-xl md:text-2xl lg:text-[24px] xl:text-[28px] 2xl:text-[30px] 3xl:text-[35px] mb-4 md:mb-6 lg:mb-0 xl:mb-2 2xl:mb-3 3xl:mb-6'>Basic Info</h1>
        <p className='text-primary-600 dark:text-white  w-auto font-inter text-sm md:text-[15px] lg:text-[10px] xl:text-[16px] 2xl:text-[18px] 3xl:text-[20px]  shrink-0'>Profile Picture</p>

        <div className='flex flex-row items-center justify-center gap-6 lg:gap-0 lg:gap-y-0  mb-6 lg:mb-0'>
          <div className='flex flex-col items-center gap-1'>
            <div className='relative w-fit'>
              <button
                aria-label="change profile picture"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="relative rounded-full overflow-hidden group disabled:opacity-40"
              >
<img
  src={profilePic}
  alt="Profile"
  className={`w-28 h-28 md:w-24 md:h-24 lg:w-24 lg:h-24 xl:w-32 xl:h-32 2xl:w-36 2xl:h-36 border-2 select-none border-primary-600 group-hover:opacity-70 rounded-full object-cover transition-opacity ${uploading ? 'opacity-40' : 'opacity-100'}`}
  onContextMenu={(e) => e.preventDefault()} draggable={false}
  onError={(e) => {
    if (e.currentTarget.src.endsWith('/profile.png')) return // avoid an infinite loop if the default itself 404s
    e.currentTarget.src = '/profile.png'
  }}
/>
                <div className='absolute bottom-0 left-0 right-0 h-1/4 flex items-end justify-center pb-1 transition-opacity rounded-b-full'>
                  <img src="/profileAdd.png" alt="camera" className="w-6 h-6 md:w-7 md:h-7 lg:w-5 lg:h-5 select-none" onContextMenu={(e) => e.preventDefault()} draggable={false} />
                </div>
              </button>
              <input
                ref={fileInputRef}
                aria-label='img'
                type="file"
                accept="image/png, image/jpg, image/jpeg"
                className="hidden"
                onChange={handleProfilePicChange}
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className='text-primary-600 dark:text-white text-xs md:text-sm lg:text-[9px] 2xl:text-[13px] 3xl:text-[15px]  font-inter font-medium hover:underline'
            >
              Upload a new photo.
            </button>
<button
  onClick={() => setShowRemovePicModal(true)}
  disabled={profilePic === '/profile.png'}
  className='text-red-500 text-xs md:text-sm  lg:text-[9px] 2xl:text-[13px] 3xl:text-[15px] font-inter hover:underline disabled:opacity-40 disabled:hover:no-underline disabled:cursor-not-allowed'
>
  Remove
</button>
          </div>
        </div>

        <hr className='border-t border-gray-300 mb-4 md:mb-6 lg:mb-0 2xl:mb-4' />

        <div className='flex flex-col gap-1 mb-3 md:mb-4 lg:mb-1'>
          <label className='text-primary-600 dark:text-white font-inter text-sm md:text-md lg:text-[10px] 2xl:text-[14px] 3xl:text-[18px]'>First Name *</label>
          <CleanInput
            type="text"
            value={firstName}
            onChange={(e) => {
              const value = e.target.value
              setFirstName(value)
              setFirstNameError(!value.trim())
            }}
            placeholder='First name'
            className={`border rounded-sm bg-gray-50 text-primary-600 dark:text-white dark:bg-transparent w-full px-4 py-2 lg:py-0 2xl:py-1 3xl:py-2 focus:outline-none focus:border-primary-600 text-sm md:text-base lg:text-[10px] 2xl:text-[14px] 3xl:text-[18px] ${firstNameError ? 'border-red-500' : 'border-gray-300'}`}
          />
          {firstNameError && (
            <span className='text-red-500 text-xs font-inter'>First name is required</span>
          )}
        </div>

        <div className='flex flex-col gap-1 mb-3 md:mb-4 lg:mb-1 2xl:mt-3 '>
          <label className='text-primary-600 dark:text-white font-inter text-sm md:text-md lg:text-[10px] 2xl:text-[14px] 3xl:text-[18px]'>Last Name *</label>
          <CleanInput
            type="text"
            value={lastName}
            onChange={(e) => {
              const value = e.target.value
              setLastName(value)
              setLastNameError(!value.trim())
            }}            placeholder='Last name'
            className={`border rounded-sm bg-gray-50 text-primary-600 dark:text-white dark:bg-transparent w-full px-4 py-2 lg:py-0 2xl:py-1 3xl:py-2 focus:outline-none focus:border-primary-600 text-sm md:text-base lg:text-[10px] 2xl:text-[14px] 3xl:text-[18px] ${lastNameError ? 'border-red-500' : 'border-gray-300'}`}
          />
          {lastNameError && (
            <span className='text-red-500 text-xs font-inter'>Last name is required</span>
          )}
        </div>

        <div className='flex flex-col gap-1 mb-4 md:mb-6 2xl:mt-3'>
          <label className='text-primary-600 dark:text-white font-inter text-sm md:text-md lg:text-[10px] 2xl:text-[14px] 3xl:text-[18px]'>Email</label>
          <div className='flex flex-row gap-2 items-stretch'>
            <input
              aria-label='Email'
              type="text"
              value={maskEmail(email)}
              readOnly
              className='border border-gray-300 rounded-sm bg-gray-50 text-primary-600 dark:text-white dark:bg-transparent flex-1 px-4 py-2 lg:py-0 2xl:py-1 3xl:py-2 cursor-not-allowed opacity-70 text-sm md:text-base lg:text-[10px] 2xl:text-[14px] 3xl:text-[18px]'
            />
            <button
              onClick={() => setActiveTab('changeEmail')}
              className='bg-primary-600 text-white px-2 md:px-6 rounded-md font-inter font-medium text-xs md:text-base
              shadow-[0_2px_4px_rgba(0,0,0,0.25)] lg:text-[10px] xl:text-[11px] 2xl:text-[13px] 3xl:text-[15px]
              hover:bg-white hover:text-primary-600 dark:text-white hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.3)]
              transition-all duration-300 whitespace-nowrap uppercase'
            >
              Change
            </button>
          </div>
        </div>

        <div className='flex  justify-center'>
          <button
            onClick={handleSaveAll}
disabled={
  saving !== null ||
  nameHasBadWords ||
  !firstName.trim() ||
  !lastName.trim() ||
  (firstName.trim() === originalFirstName.trim() && lastName.trim() === originalLastName.trim())
}
            className='w-full md:w-[250px]  disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_2px_1px_rgba(0,0,0,0.35)] items-center justify-center text-black flex bg-[#E59D24] hover:bg-[#F0AD3A] transition-all duration-300 font-inter font-semibold uppercase py-2 lg:py-1 xl:py-2 2xl:py-2 3xl:py-3
            disabled:opacity-50 lg:text-[12px] xl:text-[14px] 2xl:text-[16px] 3xl:text-[18px]
            shadow-[0_2px_1px_rgba(0,0,0,0.35)]
            rounded-md backdrop-blur-xs
            hover:-translate-y-1 hover:shadow-[0_4px_8px_rgba(0,0,0,0.35)]'
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* ── NEW: Deactivate Account button ── */}
        <div className='flex justify-center mt-4'>
          <button
            onClick={() => setShowDeactivateModal(true)}
            className='w-full md:w-[250px] text-red-500 border-2 border-red-500 font-inter font-semibold uppercase py-2 lg:py-1 xl:py-2 2xl:py-2 3xl:py-3 rounded-md hover:bg-red-500 hover:text-white transition-all duration-300'
          >
            Deactivate Account
          </button>
        </div>

        {/* ── Logout button ──
        <div className='flex md:hidden justify-center mt-4'>
          <button
            onClick={() => setShowLogoutModal(true)}
            className='w-full md:w-[400px] text-red-500 border-2 border-red-500 font-inter font-semibold uppercase py-2 lg:py-3 xl:py-3 2xl:py-3 rounded-md hover:bg-red-500 hover:text-white transition-all duration-300'
          >
            Logout
          </button>
        </div> */}

        {/* ── Logout confirmation modal ── */}
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowLogoutModal(false)} />
            <div className="relative bg-white rounded-xl shadow-xl p-8 w-80 text-center">
              <h2 className="text-xl font-bold text-primary-600 dark:text-white font-roboto mb-2">Logout</h2>
              <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 border-2 border-primary-600 font-roboto text-primary-600 dark:text-white font-bold py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-primary-600 text-white font-roboto font-bold py-3 rounded-lg hover:opacity-90 transition-opacity duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── NEW: Deactivate confirmation modal ── */}
        {showDeactivateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => !deactivating && setShowDeactivateModal(false)} />
            <div className="relative bg-white rounded-xl shadow-xl p-8 w-80 text-center">
              <h2 className="text-xl font-bold text-red-500 font-roboto mb-2">Deactivate Account</h2>
              <p className="text-gray-600 mb-6 text-sm">
                Your account will be deactivated immediately. Log back in within 30 days to reactivate — after that, your account and all data will be permanently deleted.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeactivateModal(false)}
                  disabled={deactivating}
                  className="flex-1  mb-5 text-primary-800 border border-primary-800 font-roboto font-bold py-3 rounded-lg hover:opacity-90 transition-opacity duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeactivate}
                  disabled={deactivating}
                  className="flex-1 bg-red-500 mb-5 text-white font-roboto font-bold py-3 rounded-lg hover:opacity-90 transition-opacity duration-200 disabled:opacity-50"
                >
                  {deactivating ? 'Deactivating...' : 'Deactivate'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ── NEW: Remove profile picture confirmation modal ── */}
{showRemovePicModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => !removingPic && setShowRemovePicModal(false)} />
    <div className="relative bg-white rounded-xl shadow-xl p-8 w-80 text-center">
      <h2 className="text-xl font-bold text-red-500 font-roboto mb-2">Remove Profile Picture</h2>
      <p className="text-gray-600 mb-6 text-sm">
        Are you sure you want to remove your profile picture? This can't be undone.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => setShowRemovePicModal(false)}
          disabled={removingPic}
          className="flex-1 text-primary-800 border border-primary-800 font-roboto font-bold py-3 rounded-lg hover:opacity-90 transition-opacity duration-200 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleRemoveProfilePic}
          disabled={removingPic}
          className="flex-1 bg-red-500 text-white font-roboto font-bold py-3 rounded-lg hover:opacity-90 transition-opacity duration-200 disabled:opacity-50"
        >
          {removingPic ? 'Removing...' : 'Remove'}
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    </>
  )
}

export default BasicInfo