import { useEffect } from "react"
import { startTour, tourSteps } from "../lib/tours"
import type { User } from "firebase/auth"

const TOUR_KEY = 'study_buddy_tour_seen'

export function useTour(
  page: keyof typeof tourSteps,
  auto = false,
  onOpenSidebar?: () => void,
  onCloseSidebar?: () => void,
  user?: User | null,
  onTourEnd?: () => void   // ← NEW, added at the end so existing call sites don't break
) {
  useEffect(() => {
    if (!auto) return
    const key = `${TOUR_KEY}_${page}_${user?.uid ?? 'guest'}`
    const seen = localStorage.getItem(key)
    if (!seen) {
      const timeout = setTimeout(() => {
        startTour(page, onOpenSidebar, onCloseSidebar, onTourEnd)
        localStorage.setItem(key, 'true')
      }, 600)
      return () => clearTimeout(timeout)
    }
  }, [page, auto, user?.uid])

  return {
    startTour: () => startTour(page, onOpenSidebar, onCloseSidebar, onTourEnd)
  }
}