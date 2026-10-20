import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import SplashScreen from './SplashScreen'

interface AuthGateProps {
  children: React.ReactNode
}

export default function AuthGate({ children }: AuthGateProps) {
  const { user, status, authLoading } = useAuth()
  const location = useLocation()

  if (authLoading) {
    return <SplashScreen />
  }

  // Skip the auto-redirect when we were explicitly sent here to show the
  // login form (e.g. right after verifying an email) — otherwise a
  // verified user gets bounced straight to /dashboard before they can
  // log in.
  const forceShowLogin = Boolean(location.state?.showLogin)

  if (user && user.emailVerified && !forceShowLogin) {
    if (status === 'deactivated') {
      return <Navigate to="/reactivate" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}