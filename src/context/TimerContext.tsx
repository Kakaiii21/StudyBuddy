import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useTimer } from 'react-timer-hook'

interface TimerContextType {
  seconds: number
  minutes: number
  hours: number
  isRunning: boolean
  totalSeconds: number
  elapsedSeconds: number
  showExpired: boolean
  setShowExpired: (v: boolean) => void
  setTimer: (h: number, m: number, s: number) => void
  pause: () => void
  resume: () => void
  stop: () => void 
  isActive: boolean 
}

const TimerContext = createContext<TimerContextType | null>(null)
const INITIAL_EXPIRY = new Date(Date.now() - 1000)

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [totalSeconds,  setTotalSeconds]  = useState(0)
  const [lockedElapsed, setLockedElapsed] = useState(0)
  const [showExpired,   setShowExpired]   = useState(false)
  const [isActive,      setIsActive]      = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedRef  = useRef(0)

  useEffect(() => {
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const getExpiry = (h: number, m: number, s: number): Date => {
    const t = new Date()
    t.setSeconds(t.getSeconds() + h * 3600 + m * 60 + s)
    return t
  }

  const { seconds, minutes, hours, isRunning, pause, resume, restart } = useTimer({
    expiryTimestamp: INITIAL_EXPIRY,
    autoStart: false,
    onExpire: () => {
      setLockedElapsed(totalSeconds) 
      elapsedRef.current = 0
      setShowExpired(true)
      setTotalSeconds(0)
      setIsActive(false)

      const audio = new Audio('/alarm.mp3')
      audio.play()

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification('Study Timer ⏰', {
            body: "Time's up! Great study session! 🎉",
            icon: '/timer.png',
          })
        })
      } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Study Timer ⏰', {
          body: "Time's up! Great study session! 🎉",
          icon: '/timer.png',
        })
      }
    },
  })

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        elapsedRef.current += 1
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  const stop = useCallback(() => {
    setLockedElapsed(elapsedRef.current)
    elapsedRef.current = 0
    pause()
    setTotalSeconds(0)
    setIsActive(false)
    restart(INITIAL_EXPIRY, false)
  }, [pause, restart])

  const setTimer = useCallback((h: number, m: number, s: number) => {
    setShowExpired(false)
    elapsedRef.current = 0
    setTotalSeconds(h * 3600 + m * 60 + s)
    setIsActive(true)
    restart(getExpiry(h, m, s), true)
  }, [restart])

  return (
    <TimerContext.Provider value={{
      seconds, minutes, hours, isRunning,
      totalSeconds, isActive,
      elapsedSeconds: lockedElapsed,
      showExpired, setShowExpired,
      setTimer, pause, resume,
      stop,
    }}>
      {children}
    </TimerContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTimerContext = () => {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimerContext must be used inside TimerProvider')
  return ctx
}