import Sidebar from '../components/Sidebar'
import { useState } from 'react'
import BasicInfo from '../components/BasicInfo'
import Terms from '../terms'
import Privacy from '../privacy'
import ChangeEmail from './ChangeEmail'
import ChangePassword from './ChangePassword'

import { useAuth } from '../hooks/useAuth'
import { useTour } from '../hooks/useTour'
import { useTheme, type Theme } from '../context/ThemeContext'

const needHelpIcon: Record<Theme, string> = {
  light: '/needhelp.png',
  dark: '/needhelp-dark.png',
  warm: '/needhelp-warm.png',
}

// White icon in dark mode, except on the selected row (light gray background in dark mode)
const darkIcon = (active: boolean) => (active ? '' : 'dark:brightness-0 dark:invert')

const navItems = [
  {
    id: 'navBasicInfo',
    tab: 'basicinfo',
    activeTabs: ['basicinfo', 'changeEmail'],
    icon: '/basicInfo.png',
    alt: 'Basic info icon',
    label: 'Basic Info',
    iconSize: 'w-6 h-6 xl:w-8 xl:h-8 2xl:w-9 2xl:h-9',
  },
  {
    id: 'navPassword',
    tab: 'password',
    activeTabs: ['password'],
    icon: '/passIcon.png',
    alt: 'Password icon',
    label: 'Password',
    iconSize: 'w-6 h-6 xl:w-9 xl:h-9 2xl:w-10 2xl:h-10',
  },
  {
    id: 'navTerms',
    tab: 'terms',
    activeTabs: ['terms'],
    icon: '/tos.png',
    alt: 'Terms icon',
    label: 'Terms of Service',
    iconSize: 'w-6 h-6 xl:w-8 xl:h-8 2xl:w-9 2xl:h-9',
  },
  {
    id: 'navPrivacy',
    tab: 'privacy',
    activeTabs: ['privacy'],
    icon: '/pp.png',
    alt: 'Privacy icon',
    label: 'Privacy Policy',
    iconSize: 'w-6 h-6 xl:w-8 xl:h-8 2xl:w-9 2xl:h-9',
  },
]

function Account() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [tourActive, setTourActive] = useState(false)

  const { startTour } = useTour(
    'account',
    false,
    () => {}, () => {},
    user,
    () => setTourActive(false)
  )
  const [activeTab, setActiveTab] = useState('basicinfo')

  return (
    <div className='flex h-screen bg-white dark:bg-[#010409] warm:bg-[#FBF1E8]'>
      <div className='lg:p-3 '>
        <Sidebar />
      </div>

      {/* Right of sidebar */}
      <div className='flex-1 flex flex-col overflow-hidden'>

        {/* Top Bar — mobile only */}
        <div className='lg:hidden flex items-center justify-between px-4 sm:px-6 py-2 bg-transparent top-0 left-0 right-0 z-10 relative'>
          <p className='absolute warm:text-[#623627] left-1/2 -translate-x-1/2 font-inter mt-4 font-semibold text-xl text-[#B3B3B3] uppercase'>Account</p>
          <button
            id='tour-btn'
            onClick={() => startTour()}
            disabled={tourActive}
            className='flex flex-col items-center gap-1 ml-auto pt-3
              hover:opacity-80 active:scale-95 transition-all'
            title='Take a Tour'
          >
            <div className='pt-2 w-9 h-9 rounded-full flex items-center justify-center text-2xl font-bold'>
              <img src={needHelpIcon[theme]} alt='?' className='w-9 block mx-auto mt-1 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false} />
            </div>
            <p className='text-[9px] text-primary-600 font-inter font-medium dark:text-white warm:text-[#623627]'>Need Help?</p>
          </button>
        </div>

        <div className='flex flex-1 overflow-hidden flex-col lg:flex-row'>

          {/* Left */}
          <div className='hidden lg:flex lg:flex-1 flex-col overflow-auto pt-0 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.15)] relative z-10'>
            <p className='hidden lg:flex justify-center lg:justify-start w-full lg:pl-3 2xl:ml-0 3xl:ml-0
              font-inter font-semibold text-sm md:text-md lg:text-[10px] xl:text-[12px] 2xl:text-[14px] 3xl:text-[16px] text-[#B3B3B3] uppercase
              mt-2 md:mt-4 lg:mt-1 xl:mt-2 2xl:mt-4 '>Account</p>
            <p className='text-xs lg:text-[10px] dark:text-white xl:text-[12px] 2xl:text-[14px] 3xl:text-[16px] lg:mt-4 xl:mt-5 2xl:mt-6 3xl:mt-7 font-inter font-medium text-primary-600 pl-9 lg:pl-5 2xl:pl-11 tracking-widest mb-4 xl:mb-5 2xl:mb-6'>
              Account Settings
            </p>

            <nav className='flex flex-col'>
              {navItems.map((item) => {
                const isActive = item.activeTabs.includes(activeTab)
                return (
                  <div key={item.id}>
                    <button
                      id={item.id}
                      onClick={() => setActiveTab(item.tab)}
                      className={`flex items-center justify-between w-full pr-3 py-2.5 lg:py-1.5 xl:py-2.5 2xl:py-3.5 3xl:py-4.5 text-left font-medium transition ${
                        isActive
                          ? 'bg-primary-700 warm:bg-[#F9D5C6] text-primary-600'
                          : 'text-gray-600 hover:bg-gray-50 warm:hover:bg-[#F9D5C6]'
                      }`}
                    >
                      <div className='flex items-center gap-2.5 xl:gap-3 2xl:gap-4 pl-9 lg:pl-4 xl:pl-10 2xl:pl-11'>
                        <img
                          src={item.icon}
                          alt={item.alt}
                          className={`${item.iconSize} object-cover select-none ${darkIcon(isActive)}`}
                          onContextMenu={(e) => e.preventDefault()}
                          draggable={false}
                        />
                        <span
                          className={`font-inter text-base lg:text-[12px] xl:text-[13px] 2xl:text-[15px] 3xl:text-[17px] font-medium text-primary-600 ${
                            isActive ? 'dark:text-black' : 'dark:text-white'
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                      <img
                        src='/arrowA.png'
                        alt='nextArrow'
                        className={`w-1.5 xl:w-2.5 2xl:w-3 select-none ${darkIcon(isActive)}`}
                        onContextMenu={(e) => e.preventDefault()}
                        draggable={false}
                      />
                    </button>
                    <hr className='border-t warm:border-[#623627] border-gray-400 ml-5 xl:ml-10 2xl:ml-11' />
                  </div>
                )
              })}
            </nav>
          </div>

          {/* Right Panel */}
          <div className='flex-1 lg:flex-[3] overflow-auto mt-0 lg:mt-0 xl:mt-0 2xl:mt-0 p-4 lg:p-1 xl:p-1 pt-0 pb-20 lg:pb-0 xl:pb-0'>
            {activeTab === 'basicinfo' && <BasicInfo setActiveTab={setActiveTab} />}
            {activeTab === 'changeEmail' && <ChangeEmail setActiveTab={setActiveTab} />}
            {activeTab === 'password' && <ChangePassword />}
            {activeTab === 'terms' && <Terms hideButton={true} />}
            {activeTab === 'privacy' && <Privacy hideButton={true} />}
          </div>

        </div>
      </div>

      {/* Bottom nav */}
      <div className='lg:hidden fixed bottom-0 left-0 right-0 bg-primary-800 warm:bg-[#623627] border-t border-gray-200 shadow-[0_-8px_16px_-4px_rgba(0,0,0,0.08)] z-20'>
        <div className='flex items-stretch justify-around px-1 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]'>

          <button
            id='mobileNavBasicInfo'
            onClick={() => setActiveTab('basicinfo')}
            className='flex flex-col items-center justify-center gap-1 flex-1 py-1.5 rounded-xl transition-colors duration-200'
          >
            <div className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 ${(activeTab === 'basicinfo' || activeTab === 'changeEmail') ? 'bg-primary-0' : ''}`}>
              <img
                src={(activeTab === 'basicinfo' || activeTab === 'changeEmail') ? '/basicInfoNavAcc.png' : '/basicInfoNav.png'}
                alt='Basic Info'
                className='w-8 h-8 object-contain select-none' onContextMenu={(e) => e.preventDefault()} draggable={false}
              />
            </div>
          </button>

          <button
            id='mobileNavPassword'
            onClick={() => setActiveTab('password')}
            className='flex flex-col items-center justify-center gap-1 flex-1 py-1.5 rounded-xl transition-colors duration-200'
          >
            <div className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 ${activeTab === 'password' ? 'bg-primary-0' : ''}`}>
              <img
                src={activeTab === 'password' ? '/passIconAcc.png' : '/passIconNav.png'}
                alt='Password'
                className='w-8 h-8 object-contain select-none' onContextMenu={(e) => e.preventDefault()} draggable={false}
              />
            </div>
          </button>

          <button
            id='mobileNavTerms'
            onClick={() => setActiveTab('terms')}
            className='flex flex-col items-center justify-center gap-1 flex-1 py-1.5 rounded-xl transition-colors duration-200'
          >
            <div className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 ${activeTab === 'terms' ? 'bg-primary-0' : ''}`}>
              <img
                src={activeTab === 'terms' ? '/tosNavAcc.png' : '/tosNav.png'}
                alt='Terms'
                className='w-8 h-8 object-contain select-none' onContextMenu={(e) => e.preventDefault()} draggable={false}
              />
            </div>
          </button>

          <button
            id='mobileNavPrivacy'
            onClick={() => setActiveTab('privacy')}
            className='flex flex-col items-center justify-center gap-1 flex-1 py-1.5 rounded-xl transition-colors duration-200'
          >
            <div className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 ${activeTab === 'privacy' ? 'bg-primary-0' : ''}`}>
              <img
                src={activeTab === 'privacy' ? '/ppNavAcc.png' : '/ppNav.png'}
                alt='Privacy'
                className='w-8 h-8 object-contain select-none' onContextMenu={(e) => e.preventDefault()} draggable={false}
              />
            </div>
          </button>

        </div>
      </div>

      {/* Desktop help button */}
      <button
        id='tour-btn'
        onClick={() => startTour()}
        className='hidden lg:flex fixed bottom-6 right-6 z-50
          flex-col items-center gap-1
          hover:opacity-80 active:scale-95 transition-all
          lg:bottom-8 lg:right-8'
        title='Take a Tour'
        disabled={tourActive}
      >
        <div className='w-7 h-7 lg:w-7 lg:h-7 2xl:w-10 2xl:h-10 3xl:w-12 3xl:h-12 flex items-center justify-center text-2xl font-bold'>
          <img src={needHelpIcon[theme]} alt='?' className='w-12 block mx-auto mt-1 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false} />
        </div>
        <p className='text-[8px] md:text-[8px] text-primary-800 uppercase text-center lg:text-[8px] 2xl:text-[10px] 3xl:text-[11px] dark:text-white warm:text-[#623627]
          font-inter font-semibold'>Need Help?</p>
      </button>
    </div>
  )
}

export default Account