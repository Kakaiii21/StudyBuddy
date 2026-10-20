import { useEffect } from 'react'
import { getToken } from 'firebase/messaging'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { getMessagingInstance } from '../services/firebase'
import { type User } from 'firebase/auth'

export function useFcmRegistration(user: User | null) {
  useEffect(() => {
    if (!user) return
    if (typeof Notification === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    async function register() {
      if (Notification.permission === 'default') {
        await Notification.requestPermission()
      }
      if (Notification.permission !== 'granted') return

      const messaging = getMessagingInstance()
      if (!messaging) return

      try {
        const registration = await navigator.serviceWorker.ready
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        })

        if (!token || !user) return

        await setDoc(doc(db, 'users', user.uid, 'fcmTokens', token), {
          token,
          createdAt: Date.now(),
          platform: navigator.userAgent.includes('Mobile') ? 'mobile-pwa' : 'desktop',
        })
      } catch (err) {
        console.error('FCM token registration failed:', err)
      }
    }

    register()
  }, [user])
}