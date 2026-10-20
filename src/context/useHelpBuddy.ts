// src/context/useHelpBuddy.ts
import { createContext, useContext } from 'react'

export type HelpBuddyContextType = {
  isOpen: boolean
  openHelpModal: () => void
  closeHelpModal: () => void
}

export const HelpBuddyContext = createContext<HelpBuddyContextType | undefined>(undefined)

export function useHelpBuddy() {
  const ctx = useContext(HelpBuddyContext)
  if (!ctx) throw new Error('useHelpBuddy must be used within a HelpBuddyProvider')
  return ctx
}