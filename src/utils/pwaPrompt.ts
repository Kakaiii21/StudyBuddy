let deferredPrompt: BeforeInstallPromptEvent | null = null

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const setInstallPrompt = (e: Event) => { deferredPrompt = e as BeforeInstallPromptEvent }
export const getInstallPrompt = () => deferredPrompt
export const clearInstallPrompt = () => { deferredPrompt = null }