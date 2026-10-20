import { useState, useEffect } from 'react'
import { getInstallPrompt, setInstallPrompt, clearInstallPrompt } from '../utils/pwaPrompt'

export const useInstallPWA = () => {
  const [isInstallable, setIsInstallable] = useState(() => !!getInstallPrompt())
  const [isIOS] = useState(() => /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()))
  const [isStandalone] = useState(() => window.matchMedia('(display-mode: standalone)').matches)
  const [isMacSafari] = useState(() => {
    const ua = navigator.userAgent
    return /^((?!chrome|android|crios|fxios).)*safari/i.test(ua) &&
      navigator.platform === 'MacIntel' &&
      navigator.maxTouchPoints <= 1
  })

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      setIsInstallable(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const installApp = async () => {
    const prompt = getInstallPrompt()
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      clearInstallPrompt()
      setIsInstallable(false)
    }
  }

  return { isInstallable, installApp, isIOS, isStandalone, isMacSafari }
}

