import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { 
  GoogleAuthProvider, 
  signInWithPopup,
} from 'firebase/auth'

const FUNCTIONS_BASE = 'https://us-central1-study-buddy-cbaa8.cloudfunctions.net'
const SEND_PASSWORD_RESET_URL = 'https://sendpasswordreset-ghr3m2mkda-uc.a.run.app'

export const googleLogin = async () => {
  const googleProvider = new GoogleAuthProvider()
  googleProvider.setCustomParameters({ prompt: 'select_account' })
  const result = await signInWithPopup(auth, googleProvider)
  const user = result.user
  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)
  if (!userSnap.exists()) {
    const [firstName, ...lastParts] = (user.displayName ?? 'User').split(' ')
    await setDoc(userRef, {
      firstName,
      lastName: lastParts.join(' ') || '',
      email: user.email,
      createdAt: new Date(),
      hasCustomizedCard: false
    })
  }
  return user
}

// SIGNUP
export const signup = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string
) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user
  await updateProfile(user, {
    displayName: `${firstName} ${lastName}`
  })
  await sendVerificationEmail(email)
  try {
    await setDoc(doc(db, 'users', user.uid), {
      firstName,
      lastName,
      email,
      createdAt: new Date(),
      hasCustomizedCard: false
    })
    await setDoc(doc(db, 'emails', email), { uid: user.uid })
  } catch {
    console.warn('Firestore save failed — possibly blocked by ad blocker.')
  }
  return user
}

// SEND VERIFICATION EMAIL
export const sendVerificationEmail = async (email: string) => {
  const response = await fetch(`${FUNCTIONS_BASE}/sendVerificationEmail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!response.ok) {
    const data = await response.json()
    throw { code: data.code || 'auth/unknown', message: data.error }
  }
}

// CHECK EMAIL STATUS
export const checkEmailStatus = async (email: string) => {
  const response = await fetch(`${FUNCTIONS_BASE}/checkEmailStatus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!response.ok) {
    const data = await response.json()
    throw { code: data.code || 'auth/unknown', message: data.error }
  }
  return response.json() as Promise<{ exists: boolean; verified: boolean }>
}

// PASSWORD RESET (Forgot Password + Change Password)
export const resetPassword = async (email: string) => {
  const response = await fetch(SEND_PASSWORD_RESET_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!response.ok) {
    const data = await response.json()
    throw { code: data.code || 'auth/unknown', message: data.error }
  }
}

// CHANGE EMAIL
export const changeEmail = async (newEmail: string) => {
  const user = auth.currentUser
  if (!user) throw { code: 'auth/no-user', message: 'No user logged in' }
  const response = await fetch(`${FUNCTIONS_BASE}/sendChangeEmail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid: user.uid, newEmail }),
  })
  if (!response.ok) {
    const data = await response.json()
    throw { code: data.code || 'auth/unknown', message: data.error }
  }
}

// DEACTIVATE ACCOUNT
export const deactivateAccount = async () => {
  const user = auth.currentUser
  if (!user) throw { code: 'auth/no-user', message: 'No user logged in' }
  const token = await user.getIdToken()
  const response = await fetch(`${FUNCTIONS_BASE}/deactivateAccount`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  })
  if (!response.ok) {
    const data = await response.json()
    throw { code: data.code || 'auth/unknown', message: data.error }
  }
}

// REACTIVATE ACCOUNT
export const reactivateAccount = async () => {
  const user = auth.currentUser
  if (!user) throw { code: 'auth/no-user', message: 'No user logged in' }
  const token = await user.getIdToken()
  const response = await fetch(`${FUNCTIONS_BASE}/reactivateAccount`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  })
  if (!response.ok) {
    const data = await response.json()
    throw { code: data.code || 'auth/unknown', message: data.error }
  }
}
// LOGIN
export const login = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

// LOGOUT
export const logout = async () => {
  await signOut(auth)
  window.history.replaceState(null, '', '/')
}

// GET CURRENT LOGGED IN USER
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback)
}

export type { User }