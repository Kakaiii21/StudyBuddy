import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import EmailChangeWatcher from './components/EmailChangeWatcher'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { HelpBuddyProvider } from './context/HelpBuddyContext'
import { ThemeProvider } from './context/ThemeContext'
import BfcacheGuard from './components/BfcacheGuard'
import ModerationNotificationWatcher from './components/ModerationNotificationWatcher'
import './index.css'
import App from './App'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import ToDoList from './pages/ToDoList'
import Notes from './pages/Notes'
import ClassSchedule from './pages/ClassSchedule'
import Courses from './pages/Courses'
import StudyGenerator from './pages/StudyGenerator'
import GeneratedHistory from './pages/GeneratedHistory'
import RecentlyDeleted from './pages/RecentlyDeleted'
import Account from './pages/Account'
import CourseFolder from './pages/CourseFolder'
import { TimerProvider } from './context/TimerContext'  
import ExpiredAlert from './components/ExpiredAlert'  
import Quiz from './pages/StudyGenerator/Quiz'
import PasswordChangeWatcher from './components/PasswordChangeWatcher'
import Flashcard from './pages/StudyGenerator/Flashcard'
import QuizView from './pages/StudyGenerator/QuizView'
import FlashcardView from './pages/StudyGenerator/FlashcardView'
import ChangePassword from './pages/ChangePassword'
import { registerSW } from 'virtual:pwa-register'  // ← ADD THIS
import VerifyEmail from './pages/VerifyEmail'
import ChangeEmail from './pages/ChangeEmail'
import { setInstallPrompt } from './utils/pwaPrompt'
import PrivacyPolicy from './privacy'
import TermsOfService from './terms'
import AuthGate from './components/AuthGate'
import StudyTimerPage from './pages/StudyTimerPage'
import ReactivatePage from './pages/ReactivatePage'

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  setInstallPrompt(e)
})
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return
    const check = () => reg.update().catch(() => {})
    setInterval(check, 30 * 60 * 1000)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
  },
})// Prevent stale-cache blank screens: when a new service worker takes
// control mid-session, the in-memory page may reference old build
// assets that no longer exist in the new precache. Force one clean
// reload to resync — guarded so it can only fire once per page load.
const hadController = !!navigator.serviceWorker.controller
let refreshing = false
navigator.serviceWorker.addEventListener('controllerchange', () => {
  if (!hadController || refreshing) return
  refreshing = true
  window.location.reload()
})
window.addEventListener('error', (e) => {
  const el = document.createElement('div')
  el.style.cssText = 'position:fixed;inset:0;background:#fff;color:#c00;padding:16px;font-size:12px;z-index:99999;overflow:auto;white-space:pre-wrap;font-family:monospace;'
  el.textContent = `ERROR: ${e.message}\n${e.filename}:${e.lineno}\n${e.error?.stack ?? ''}`
  document.body.appendChild(el)
})
window.addEventListener('unhandledrejection', (e) => {
  const el = document.createElement('div')
  el.style.cssText = 'position:fixed;inset:0;background:#fff;color:#c00;padding:16px;font-size:12px;z-index:99999;overflow:auto;white-space:pre-wrap;font-family:monospace;'
  el.textContent = `UNHANDLED REJECTION: ${e.reason?.message ?? e.reason}\n${e.reason?.stack ?? ''}`
  document.body.appendChild(el)
})
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthGate>
        <App />
      </AuthGate>
    ),
  },
  {
    path: '/terms',
    element: <TermsOfService />
  },
  {
    path: '/privacy',
    element: <PrivacyPolicy />
  },
  {
    path: '/verify-email',
    element: <VerifyEmail />,
  },
  {
    path: '/reactivate',
    element: <ReactivatePage />
  },
  {
    path: '/forgotPassword',
    element: <ForgotPassword />,
  },
    {
    path: '/changePassword',
    element:(
      <ProtectedRoute>
       <ChangePassword />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/timer',
    element: (
      <ProtectedRoute>
        <StudyTimerPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/todolist',
    element: (
      <ProtectedRoute>
          <ToDoList />
      </ProtectedRoute>
    )
  },
  {
    path: '/notes',
    element: (
      <ProtectedRoute>
        <Notes />
      </ProtectedRoute>
    )
  },
  {
    path: '/schedule',
    element:(
      <ProtectedRoute>
        <ClassSchedule />
      </ProtectedRoute>
    )
  },
  {
    path: '/myFiles',
    element:(
      <ProtectedRoute>
        <Courses />
      </ProtectedRoute>
    )
  },
  {
    path: '/myFiles/:courseId',
    element:(
      <ProtectedRoute>
        <CourseFolder />
      </ProtectedRoute>
    )
  },
  {
    path: '/studyGenerator',
    element:(
      <ProtectedRoute>
        <StudyGenerator />
      </ProtectedRoute>
    )
  },
  {
    path: '/studyGenerator/Quiz',
    element:(
      <ProtectedRoute>
        <Quiz />
      </ProtectedRoute>
    )
  },
    {
    path: '/studyGenerator/Flashcard',
    element:(
      <ProtectedRoute>
        <Flashcard />
      </ProtectedRoute>
    )
  },
  {
    path:'/history',
    element:(
      <ProtectedRoute>
        <GeneratedHistory />
      </ProtectedRoute>
    )
  },
  {
    path:'/quizView',
    element:(
      <ProtectedRoute>
        <QuizView />
      </ProtectedRoute>
    )
  },
    {
    path:'/flashcardView',
    element:(
      <ProtectedRoute>
        <FlashcardView />
      </ProtectedRoute>
    )
  },
  {
    path:'/delete',
    element: (
      <ProtectedRoute>
        <RecentlyDeleted />
      </ProtectedRoute>
    )
  },
  {
    path: '/account',
    element: (
      <ProtectedRoute>
        <Account />
      </ProtectedRoute>
    )
  },
    {
    path: '/changeEmail',
    element: (
      <ProtectedRoute>
        <ChangeEmail />
      </ProtectedRoute>
    )
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <TimerProvider>
        <HelpBuddyProvider>
          <BfcacheGuard />
          <ExpiredAlert />
          <EmailChangeWatcher /> 
          <PasswordChangeWatcher /> 
          <ModerationNotificationWatcher />
          <RouterProvider router={router} />
        </HelpBuddyProvider>
      </TimerProvider>
    </ThemeProvider>
  </StrictMode>
)