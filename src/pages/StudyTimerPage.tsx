import { useNavigate } from 'react-router-dom'
import StudyTimer from '../components/StudyTimer'

function StudyTimerPage() {
  const navigate = useNavigate()

  return (
    <div className='h-screen w-full overflow-y-auto bg-white dark:bg-[#0A0F15] warm:bg-[#FBF1E8]'>
      {/* Top bar with back button */}
      <div className='flex items-center px-4 sm:px-6 py-3 sticky top-0 bg-white dark:bg-[#0A0F15] warm:bg-[#FBF1E8] z-10 border-b border-gray-100 dark:border-[#222631] warm:border-[#623627]'>
        <button
          onClick={() => navigate('/dashboard')}
          className='flex items-center gap-1 text-primary-800 dark:text-white warm:text-[#623627] font-inter font-semibold text-sm'
        >
          <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
            <polyline points='15 18 9 12 15 6' />
          </svg>
          Back
        </button>
        <p className='absolute left-1/2 -translate-x-1/2 font-inter font-semibold text-md text-[#B3B3B3] dark:text-white warm:text-[#623627] uppercase'>
          Study Timer
        </p>
      </div>

      {/* Timer content */}
      <div className='w-full max-w-[500px] mx-auto px-4 sm:px-6 pb-8'>
        <StudyTimer />
      </div>
    </div>
  )
}

export default StudyTimerPage