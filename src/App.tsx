import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Signup from './components/Signup'
import Login from './components/Login'
import { useInstallPWA } from './hooks/useInstallPWA'
import { useLocation } from 'react-router-dom'



function App() {
const location = useLocation()
const [activeForm, setActiveForm] = useState<'signup' | 'login'>(() => {
  const params = new URLSearchParams(window.location.search)
  const hasAuthQueryFlag =
    params.has('emailUpdated') || params.has('passwordUpdated') || params.has('cancelResult')
  return (location.state?.showLogin || hasAuthQueryFlag) ? 'login' : 'signup'
})

  const signupRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [showPoliciesMenu, setShowPoliciesMenu] = useState(false)
  const policiesRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!showPoliciesMenu) return
    function handleOutsideClick(e: MouseEvent) {
      if (policiesRef.current && !policiesRef.current.contains(e.target as Node)) {
        setShowPoliciesMenu(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [showPoliciesMenu])

  const [showFooterPoliciesMenu, setShowFooterPoliciesMenu] = useState(false)
  const footerPoliciesRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!showFooterPoliciesMenu) return
    function handleOutsideClick(e: MouseEvent) {
      if (footerPoliciesRef.current && !footerPoliciesRef.current.contains(e.target as Node)) {
        setShowFooterPoliciesMenu(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [showFooterPoliciesMenu])

    const { isInstallable, installApp, isMacSafari} = useInstallPWA();
    const [showIOSModal, setShowIOSModal] = useState(false);
    const [showMacModal, setShowMacModal] = useState(false);
    useEffect(() => {
      const params = new URLSearchParams(window.location.search)
      const hasAuthQueryFlag =
        params.has('emailUpdated') || params.has('passwordUpdated') || params.has('cancelResult')
      if (location.state?.showLogin || hasAuthQueryFlag) {
        setTimeout(() => {
          signupRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    }, [location.state])

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
  const isAndroid = /Android/.test(navigator.userAgent)
  const isWindows = /Win/.test(navigator.platform || navigator.userAgent)
  const isMac = /Mac/.test(navigator.platform || navigator.userAgent) && !isIOS
  const downloadRef = useRef<HTMLElement>(null)

  return (
  <>
  <div className='bg-white'>
    
    <section className=" bg-white h-auto xl:h-screen w-full  ">
      <nav className=" px-2 md:px-6 lg:px-6 xl:px-6 2xl:px-6 py-2 flex items-center justify-between mt-3 md:mt-3 lg:mt-0 xl:mt-0 2xl:mt-0 ">
        {/* LOGO */}
        <img src="./logo.png" alt="logo" className="pl-2 h-10 md:pl-5 md:h-16 lg:pl-5 lg:h-16 xl:pl-5 xl:h-16 2xl:pl-5 2xl:h-16 w-auto" 
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
        />

        {/* NAV LINKS */}
        <div className="flex items-center gap-2 md:gap-4 lg:gap-5 xl:gap-6 2xl:gap-20  
        md:mr-18  
        lg:mr-20
        xl:mr-20
        2xl:mr-20">
          <select
            defaultValue=''
            onChange={(e) => {
              if (e.target.value) navigate(e.target.value)
            }}
            className='hidden md:block lg:block xl:block 2xl:block
            text-primary-600 font-fustat font-bold text-sm lg:text-base 2xl:text-lg px-1 py-1 uppercase 
            bg-transparent  rounded-full text-center
            hover:text-white hover:bg-primary-600 transition-all duration-300
            focus:outline-none cursor-pointer'
          >
            <option value='' disabled>Policies</option>
            <option value='/terms'>Terms of Service</option>
            <option value='/privacy'>Privacy Policy</option>
          </select>
          <button onClick={() => aboutRef.current?.scrollIntoView({behavior:'smooth'})} 
          className='hidden md:flex lg:flex xl:flex 2xl:flex text-primary-600 font-fustat font-bold text-sm lg:text-base 2xl:text-lg uppercase
          hover:text-white transition-all duration-300 py-1 hover:bg-primary-600 rounded-full px-4'>
            About Us
          </button>
          <button onClick={() => {
              setActiveForm('signup')
              setTimeout(() => {
                signupRef.current?.scrollIntoView({ behavior: 'smooth' })
              }, 50)
            }}
            className='text-primary-600 font-fustat font-bold text-sm lg:text-base 2xl:text-lg uppercase
            hover:text-white transition-all duration-300 py-1 hover:bg-primary-600 rounded-full px-4'>      
            Sign Up
          </button>
          <p className='text-primary-600 font-fustat font-bold text-sm lg:text-base 2xl:text-lg uppercase'>|</p>
          <button 
                onClick={() => {
                  setActiveForm('login')
                  setTimeout(() => {
                    signupRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }, 0)
                }}
            className='text-primary-600 font-fustat font-bold text-sm lg:text-base 2xl:text-lg uppercase
            hover:text-white transition-all duration-300 py-1 hover:bg-primary-600 rounded-full px-4'>
            Log In
          </button>
        </div>
      </nav>
      <div className='flex xl:px-18 2xl:px-32  px-6 mt-3 md:mt-3 lg:mt-0 xl:mt-0 2xl:mt-0 flex-row justify-evenly'>
        <div className='flex flex-col w-full md:h-auto xl:h-screen 2xl:h-screen  justify-start items-start 
        md:px-12 md:pt-12 
        lg:px-28 lg:pt-16 
        xl:px-32 xl:pt-20 
        2xl:px-34 2xl:pt-24'>
          <p className='text-primary-600 font-inter font-extrabold 
          text-[22px]
          md:text-[28px]
          lg:text-[40px]
          xl:text-[55px]
          2xl:text-[60px] 
          uppercase '
          >start your day by being productive.</p>
          <p className='text-primary-600 font-fustat font-medium 
          text-[10px] mt-3
          md:text-[10px] md:pr-0 md:mt-4
          lg:text-[12px] lg:pr-0 lg:mt-4
          xl:text-[14px] xl:pr-0 xl:mt-4
          2xl:text-[18px] 2xl:pr-0 '
          >Study Buddy is a Progressive Web App (PWA) that helps students manage their study time, organize notes, track tasks, and enhance learning efficiency.</p>
          <button 
          onClick={() => downloadRef.current?.scrollIntoView({ behavior: 'smooth'})}
          className='flex flex-row mt-5 justify-center items-center gap-4 
          py-2 px-3
          md:py-3 md:px-5
          lg:py-3 lg:px-5
          xl:py-3 xl:px-5
          2xl:py-3 2xl:px-5


        text-white uppercase font-fustat font-bold 
          text-xs 
          md:text-xl 
          lg:text-xl 
          xl:text-xl 
          2xl:text-xl 
          bg-primary-600 rounded-full 
          hover:opacity-90   
          backdrop-blur-xs
          hover:-translate-y-1 hover:shadow-[0_8px_10px_rgba(0,0,0,0.5)]
          transition-all duration-300'>
            Add to Home
            <img src="./downA.png" alt="Download" className='w-2 h-3 md:w-4 md:h-6 lg:w-4 lg:h-6 xl:w-4 xl:h-6 2xl:w-4 2xl:h-6' />
          </button>

        </div>
        <div className='flex flex-col w-full justify-start items-center pt-0 2xl:pt-18'>
            <img src="./landImg.png" alt="landing img" 
            className=' w-[120px] h-[100px] 
            md:min-w-[250px] md:min-h-[260px] md:pt-12
            lg:min-w-[350px] lg:min-h-[360px] lg:pt-14
            xl:min-w-[400px] xl:min-h-[450px] xl:pt-16
            2xl:min-w-[550px] 2xl:min-h-[580px] object-center'
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
            />
        </div>

      </div>
    </section>
    {/*First*/}
      <hr className='lg:hidden md:hidden mt-4  w-full border-t opacity-5 border-primary-600 ' />

      <section className=' bg-white w-full mt-4 md:mt-10'>
        <div className='flex flex-col px-4 md:px-10 lg:px-[110px] xl:px-[180px] 2xl:px-[350px] mb-1'>
          <p className='flex flex-wrap justify-center items-center  gap-x-1 font-fustat text-primary-600 text-sm md:text-lg 2xl:text-2xl lg:mb-20 xl:mb-24 2xl:mb-32 px-4 mb-10 text-center'>
            <span>Your all-in-one study companion &mdash;</span>
            <b>plan, organize,</b>
            <span>and</span>
            <b>learn smarter.</b>
          </p>

        </div>

      <div className='flex flex-col bg-white px-4 md:px-10 lg:px-[110px] xl:px-[180px] 2xl:px-[350px] mb-10 '>
        <div className='flex flex-row gap-x-4 md:gap-x-6 lg:gap-x-8 2xl:gap-x-10 justify-start items-center max-w-3xl mb-6'>
          <img src="./assets/timer.gif" alt="Timergif" className='border border-black rounded-2xl shrink-0 select-none
          w-[80px] h-[80px] 
          md:w-[150px] md:h-[150px] 
          lg:w-[130px] lg:h-[120px]
          xl:w-[130px] xl:h-[130px] 
          2xl:w-[200px] 2xl:h-[200px]' 
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
          />
          <div className='text-primary-600 font-inter'>
            <p className='font-bold text-[16px] md:text-[34px] lg:text-[28px] 2xl:text-[44px]'>Study Timer</p>
            <p className='text-[12px] md:text-[14px] lg:text-[13px] 2xl:text-[15px]'>Track how much time you actually spend studying. 
              Start the timer whenever you sit down to work,
              and watch your study hours add up.
              </p>
          </div>
        </div>

        <div className='flex bg-white flex-row gap-4 md:gap-x-6 lg:gap-x-8 2xl:gap-x-10 justify-end items-center max-w-3xl ml-auto'>
          <div className='text-right text-primary-600 font-inter'>
            <p className='font-bold text-[16px] md:text-[34px] lg:text-[28px] 2xl:text-[44px]'>To Do List</p>
            <p className='ml-2 text-[12px] md:text-[14px] lg:text-[13px] 2xl:text-[15px]'>Keep track of everything you need to get done.
              Add, Drag & Drop, and manage your tasks so
              nothing slips through the cracks.
            </p>
          </div>
          <img src="./assets/todolist.gif" alt="Todo list gif" className='border border-black rounded-2xl shrink-0
          w-[80px] h-[80px] 
          md:w-[150px] md:h-[150px] 
          lg:w-[130px] lg:h-[120px]
          xl:w-[130px] xl:h-[130px] 
          2xl:w-[200px] 2xl:h-[200px]' 
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
          />
        </div>
      </div>
      {/*Second*/}
      <div className='flex  bg-white flex-col px-4 md:px-10 lg:px-[110px] xl:px-[180px] 2xl:px-[350px] mb-10'>
        <div className='flex flex-row gap-x-4 md:gap-x-6 lg:gap-x-8 2xl:gap-x-10 justify-start items-center max-w-3xl mb-6 '>
          <img src="./assets/notes.gif" alt="Notesgif" className='border border-black rounded-2xl shrink-0
          w-[80px] h-[80px] 
          md:w-[150px] md:h-[150px] 
          lg:w-[130px] lg:h-[120px]
          xl:w-[130px] xl:h-[130px] 
          2xl:w-[200px] 2xl:h-[200px]'
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
           />
          <div className='text-primary-600 font-inter'>
            <p className='font-bold text-[16px] md:text-[34px] lg:text-[28px] 2xl:text-[44px]'>Notes</p>
            <p className=' mr-2 text-[12px] md:text-[14px] lg:text-[13px] 2xl:text-[15px]'>Keep all your study notes in one organized
            place. Create, edit, and revisit your notes
            anytime, so nothing gets lost between
            subjects and deadlines.</p>
          </div>
        </div>

        <div className='flex flex-row gap-4 md:gap-x-6 lg:gap-x-8 2xl:gap-x-10 justify-end items-center max-w-3xl ml-auto'>
          <div className='text-right text-primary-600 font-inter'>
            <p className='font-bold text-[16px] md:text-[34px] lg:text-[28px] 2xl:text-[44px]'>Class Schedule</p>
            <p className='ml-2 text-[12px] md:text-[14px] lg:text-[13px] 2xl:text-[15px]'>See your classes and study sessions at a
            glance. Plan your week and stay on top
            of where you need to be and when.</p>
          </div>
          <img src="./assets/classschedule.gif" alt="Class Schedgif" className='border border-black rounded-2xl shrink-0
          w-[80px] h-[80px] 
          md:w-[150px] md:h-[150px]  
          lg:w-[130px] lg:h-[120px]
          xl:w-[130px] xl:h-[130px]
          2xl:w-[200px] 2xl:h-[200px]' 
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
          />
        </div>
      </div>

      {/*Third*/}
      <div className='flex flex-col px-4 md:px-10 lg:px-[110px] xl:px-[180px] 2xl:px-[350px] mb-16'>
        <div className='flex flex-row gap-x-4 md:gap-x-6 lg:gap-x-8 2xl:gap-x-10 justify-start items-center max-w-3xl mb-6'>
          <img src="./assets/courses.gif" alt="coursesgif" className='border border-black rounded-2xl shrink-0
          w-[80px] h-[80px] 
          md:w-[150px] md:h-[150px]  
          lg:w-[130px] lg:h-[120px]
          xl:w-[130px] xl:h-[130px]
          2xl:w-[200px] 2xl:h-[200px]' 
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
          />
          <div className='text-primary-600 font-inter'>
            <p className='font-bold text-[16px] md:text-[34px] lg:text-[28px] 2xl:text-[44px]'>My Files</p>
            <p className=' mr-2 text-[12px] md:text-[14px] lg:text-[13px] 2xl:text-[15px]'>Organize your subjects and
            materials by folders. Keep
            everything related to each class
            neatly grouped and easy to find.</p>
          </div>
        </div>

        <div className='flex flex-row gap-4 md:gap-x-6 lg:gap-x-8 2xl:gap-x-10 justify-end items-center max-w-3xl ml-auto'>
          <div className='text-right text-primary-600 font-inter'>
            <p className='font-bold text-[16px] md:text-[34px] lg:text-[28px] 2xl:text-[44px]'>Study Generator</p>
            <p className='ml-2 text-[12px] md:text-[14px] lg:text-[13px] 2xl:text-[15px]'>Turn your notes and files into quizzes and
            flashcards in seconds. A smarter, faster way
            to review and test what you've learned.</p>
          </div>
          <img src="./assets/studygen.gif" alt="Study Gen gif" className='border border-black rounded-2xl shrink-0
          w-[80px] h-[80px] 
          md:w-[150px] md:h-[150px] 
          lg:w-[130px] lg:h-[120px]
          xl:w-[130px] xl:h-[130px]
          2xl:w-[200px] 2xl:h-[200px]' 
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
          />
        </div>
      </div>

      </section>
    <section ref={signupRef} className="w-full h-auto bg-primary-600 ">
      {activeForm === 'signup'
        ? <Signup  onSwitchToLogin={() => setActiveForm('login')}   />
        : <Login onSwitchToSignup={() => setActiveForm('signup')} />
      }
    </section>


    {/* Download Section */}
 <section ref={downloadRef} className="py-10 bg-white">
  <div className='flex flex-col mt-10 gap-10 justify-start items-center'>
    <p className='text-center font-fustat text-2xl font-medium text-primary-600 uppercase'>Add to Home</p>
    <p className='text-center font-fustat text-lg font-normal text-primary-600'>Get Study Buddy on any device:</p>
    <div className='grid grid-cols-2 md:flex md:flex-row gap-5 2xl:gap-x-8 mt-10 px-6'>

      {/* Android */}
        <button
          className={`flex flex-col justify-start items-center group ${!(isAndroid && isInstallable) ? 'opacity-40 cursor-not-allowed' : ''}`}
          onClick={isAndroid && isInstallable ? installApp : undefined}
        >
        <div className='relative border rounded-2xl border-black group-hover:bg-black p-3 w-36 h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 2xl:w-48 2xl:h-48 select-none'>
          <div className='flex items-center justify-center h-full'>
            <img src="./android.png" alt="android icon" className='w-16 md:w-24 lg:w-24 2xl:w-30 mb-8 group-hover:hidden' onContextMenu={(e) => e.preventDefault()} draggable={false} />
            <img src="./androidH.png" alt="android icon hover" className='w-16 md:w-24 lg:w-24 2xl:w-30 mb-8 hidden group-hover:block' onContextMenu={(e) => e.preventDefault()} draggable={false} />
          </div>
          <img src="./dlBtn.png" alt="downloadicon" className='absolute bottom-2 right-2 w-5 md:w-7 group-hover:hidden' onContextMenu={(e) => e.preventDefault()} draggable={false} />
          <img src="./dlBtnH.png" alt="downloadicon hover" className='absolute bottom-2 right-2 w-5 md:w-7 hidden group-hover:block' onContextMenu={(e) => e.preventDefault()} draggable={false} />
        </div>
        <p className='mt-3 font-fustat font-bold text-primary-600 text-sm md:text-base'>Android</p>
      </button>

      {/* iOS */}
          <button
            className={`flex flex-col justify-start items-center group ${!isIOS ? 'opacity-40 cursor-not-allowed' : ''}`}
            onClick={() => isIOS && setShowIOSModal(true)}
          >
        <div className='relative border rounded-2xl border-black group-hover:bg-black p-3 w-36 h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 2xl:w-48 2xl:h-48'>
          <div className='flex items-center justify-center h-full'>
            <img src="./iphone.png" alt="iphone icon" className='w-16 md:w-24 lg:w-24 2xl:w-30 mb-5 group-hover:hidden' onContextMenu={(e) => e.preventDefault()} draggable={false} />
            <img src="./iphoneH.png" alt="iphone icon hover" className='w-16 md:w-24 lg:w-24 2xl:w-30 mb-5 hidden group-hover:block' onContextMenu={(e) => e.preventDefault()} draggable={false} />
          </div>
          <img src="./dlBtn.png" alt="downloadicon" className='absolute bottom-2 right-2 w-5 md:w-7 group-hover:hidden' onContextMenu={(e) => e.preventDefault()} draggable={false} />
          <img src="./dlBtnH.png" alt="downloadicon hover" className='absolute bottom-2 right-2 w-5 md:w-7 hidden group-hover:block' onContextMenu={(e) => e.preventDefault()} draggable={false} />
        </div>
        <p className='mt-3 font-fustat font-bold text-primary-600 text-sm md:text-base'>iOS</p>
      </button>

      {/* Windows */}
        <button
          className={`flex flex-col justify-start items-center group ${!(isWindows && isInstallable) ? 'opacity-40 cursor-not-allowed' : ''}`}
          onClick={isWindows && isInstallable ? installApp : undefined}
        >
        <div className='relative border rounded-2xl border-black group-hover:bg-black p-3 w-36 h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 2xl:w-48 2xl:h-48'>
          <div className='flex items-center justify-center h-full'>
            <img src="./windows.png" alt="windows icon" className='w-14 md:w-20 mb-5 group-hover:hidden' onContextMenu={(e) => e.preventDefault()} draggable={false} />
            <img src="./windowsH.png" alt="windows icon hover" className='w-14 md:w-20 mb-5 hidden group-hover:block' onContextMenu={(e) => e.preventDefault()} draggable={false} />
          </div>
          <img src="./dlBtn.png" alt="downloadicon" className='absolute bottom-2 right-2 w-5 md:w-7 group-hover:hidden' onContextMenu={(e) => e.preventDefault()} draggable={false} />
          <img src="./dlBtnH.png" alt="downloadicon hover" className='absolute bottom-2 right-2 w-5 md:w-7 hidden group-hover:block' onContextMenu={(e) => e.preventDefault()} draggable={false} />
        </div>
        <p className='mt-3 font-fustat font-bold text-primary-600 text-sm md:text-base'>Windows</p>
      </button>

      {/* Mac */}
          <button
            className={`flex flex-col justify-start items-center group ${!isMac ? 'opacity-40 cursor-not-allowed' : ''}`}
            onClick={isMacSafari ? () => setShowMacModal(true) : (isMac && isInstallable) ? installApp : undefined}
          >
          <div className='relative border rounded-2xl border-black group-hover:bg-black p-3 w-36 h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 2xl:w-48 2xl:h-48'>
          <div className='flex items-center justify-center h-full'>
            <img src="./mac.png" alt="mac icon" className='w-16 md:w-24 mb-5 group-hover:hidden' onContextMenu={(e) => e.preventDefault()} draggable={false} />
            <img src="./macH.png" alt="mac icon hover" className='w-16 md:w-24 mb-5 hidden group-hover:block' onContextMenu={(e) => e.preventDefault()} draggable={false} />
          </div>
          <img src="./dlBtn.png" alt="downloadicon" className='absolute bottom-2 right-2 w-5 md:w-7 group-hover:hidden' onContextMenu={(e) => e.preventDefault()} draggable={false} />
          <img src="./dlBtnH.png" alt="downloadicon hover" className='absolute bottom-2 right-2 w-5 md:w-7 hidden group-hover:block' onContextMenu={(e) => e.preventDefault()} draggable={false} />
        </div>
        <p className='mt-3 font-fustat font-bold text-primary-600 text-sm md:text-base'>MacOS</p>
      </button>

    </div>
  </div>
</section>

    {/* iOS Modal */}
    {showIOSModal && (
      <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center' onClick={() => setShowIOSModal(false)}>
        <div className='bg-white rounded-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center gap-4' onClick={e => e.stopPropagation()}>
          <img src="./iphone.png" alt="iOS" className='w-16' />
          <p className='font-fustat font-bold text-primary-600 text-xl text-center'>Install on iOS</p>
          <ol className='text-primary-600 font-fustat text-sm flex flex-col gap-2 list-decimal list-inside'>
            <li>Open <strong>studybuddyph.site</strong> in Safari</li>
            <li>Tap the <strong>Share</strong> button (box with arrow)</li>
            <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
            <li>Tap <strong>Add</strong> to confirm</li>
          </ol>
          <button onClick={() => setShowIOSModal(false)} className='mt-2 bg-primary-600 text-white font-fustat font-bold px-6 py-2 rounded-xl'>Got it</button>
        </div>
      </div>
    )}

    {/* Mac Safari Modal */}
    {showMacModal && (
      <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center' onClick={() => setShowMacModal(false)}>
        <div className='bg-white rounded-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center gap-4' onClick={e => e.stopPropagation()}>
          <img src="./mac.png" alt="macOS" className='w-16' />
          <p className='font-fustat font-bold text-primary-600 text-xl text-center'>Install on macOS Safari</p>
          <ol className='text-primary-600 font-fustat text-sm flex flex-col gap-2 list-decimal list-inside'>
            <li>Open <strong>studybuddyph.site</strong> in Safari</li>
            <li>Click <strong>File</strong> in the menu bar</li>
            <li>Select <strong>Add to Dock</strong></li>
            <li>Click <strong>Add</strong> to confirm</li>
          </ol>
          <button onClick={() => setShowMacModal(false)} className='mt-2 bg-primary-600 text-white font-fustat font-bold px-6 py-2 rounded-xl'>Got it</button>
        </div>
      </div>
    )}
 {/*Developers Section*/}
<section ref={aboutRef} className="py-10 bg-white w-full flex flex-col justify-center">
    <div className='flex flex-col mt-10 gap-2 justify-center items-center md:items-start'>
    <h1 className='text-primary-600 px- 4 text-center md:text-left md:px-[50px] lg:px-[150px] xl:px-[180px] 2xl:px-[230px] 3xl:px-[350px] w-full font-inter font-extrabold'>Developers</h1>
    <p className='text-primary-600 px-4   font-inter  text-center md:ml-0 md:text-left md:px-[50px] lg:px-[150px] xl:px-[180px] 2xl:px-[230px] 3xl:px-[350px] mb-10 font-medium'>Meet the developers of Study Buddy.</p>

    {/*Proponents*/}
<div className='flex flex-col md:flex-row justify-between items-center md:items-start w-full max-w-6xl mx-auto gap-12 md:gap-8 px-4 md:px-[60px] lg:px-[100px] xl:px-[120px] 2xl:px-[80px]'>

  {/*Column 1: Programmer & QA Tester*/}
<div className='flex flex-col gap-10 w-full items-start md:items-start md:w-1/2 max-w-[280px] mx-auto md:max-w-none md:mx-0'>

    {/*Programmer*/}
    <div className='flex flex-row gap-5'>
      <img src="./programmer.png" alt="Programmer" className='w-16 h-16 md:w-24 md:h-24 lg:w-28 lg:h-28 2xl:w-32 2xl:h-32 object-cover border border-primary-600 rounded-full shrink-0 select-none'
        onContextMenu={(e) => e.preventDefault()}
        draggable={false}/>
      <div className='flex flex-col justify-center items-start'>
        <p className='text-primary-600 text-sm md:text-lg lg:text-[16px] 2xl:text-[20px] font-fustat font-extrabold uppercase'>Programmer</p>
        <p className='text-primary-600 text-xs md:text-md lg:text-[14px] 2xl:text-[16px] font-fustat font-medium'>Casey P. Dellamas</p>
        <a href="https://mail.google.com/mail/?view=cm&fs=1&to=dellamascasey@gmail.com"
          target="_blank"
          rel="noopener noreferrer"
          title='Email Programmer'
          className='flex flex-row hover:underline mt-1 justify-center items-center gap-5'
        >
          <p className='text-primary-600 text-xs md:text-md lg:text-[14px] 2xl:text-[16px] font-fustat font-medium'>
          dellamascasey@gmail.com
          </p>
        </a>
      </div>
    </div>

    {/*QA Tester*/}
    <div className='flex flex-row gap-5'>
      <img src="./QATester.jpg" alt="QA Tester" className='w-16 h-16 md:w-24 md:h-24 lg:w-28 lg:h-28 2xl:w-32 2xl:h-32 object-cover border border-primary-600 rounded-full shrink-0 select-none'
        onContextMenu={(e) => e.preventDefault()}
        draggable={false}/>
      <div className='flex flex-col justify-center items-start'>
        <p className='text-primary-600 text-sm md:text-lg lg:text-[16px] 2xl:text-[20px] font-fustat font-extrabold uppercase'>QA Tester</p>
        <p className='text-primary-600 text-xs md:text-md lg:text-[14px] 2xl:text-[16px] font-fustat font-medium'>Joshua L. Mejia</p>
        <a href="https://mail.google.com/mail/?view=cm&fs=1&to=joshuamejia2266@gmail.com"
          target="_blank"
          rel="noopener noreferrer"
          title='Email QA Tester'
          className='flex flex-row hover:underline mt-1 justify-center items-center gap-5'
        >
          <p className='text-primary-600 text-xs md:text-md lg:text-[14px] 2xl:text-[16px] font-fustat font-medium'>
          joshuamejia2266@gmail.com
          </p>
        </a>
      </div>
    </div>

  </div>

  {/*Column 2: Project Manager & UI Designer*/}
<div className='flex flex-col gap-10 w-full items-start md:items-start md:w-1/2 max-w-[280px] mx-auto md:max-w-none md:mx-0'>
    {/*Project Manager*/}
    <div className='flex flex-row gap-5'>
      <img src="./projMan.png" alt="Project Manager" className='w-16 h-16 md:w-24 md:h-24 lg:w-28 lg:h-28 2xl:w-32 2xl:h-32 object-cover border border-primary-600 rounded-full shrink-0 select-none'
        onContextMenu={(e) => e.preventDefault()}
        draggable={false}/>
      <div className='flex flex-col justify-center items-start'>
        <p className='text-primary-600 text-sm md:text-lg lg:text-[16px] 2xl:text-[20px] font-fustat font-extrabold uppercase'>Project Manager / UI Designer</p>
        <p className='text-primary-600 text-xs md:text-md lg:text-[14px] 2xl:text-[16px] font-fustat font-medium'>Eunice Jayce F. De Vero</p>
        <a href="https://mail.google.com/mail/?view=cm&fs=1&to=eunicejaycedevero@gmail.com"
          target="_blank"
          rel="noopener noreferrer"
          title='Email Project Manager'
          className='flex flex-row hover:underline mt-1 justify-center items-center gap-5'
        >
          <p className='text-primary-600 text-xs md:text-md lg:text-[14px] 2xl:text-[16px] font-fustat font-medium'>
          eunicejaycedevero@gmail.com
          </p>
        </a>
      </div>
    </div>

    {/*UI Designer*/}
    <div className='flex flex-row gap-5'>
      <img src="./UIDesigner.jpg" alt="UI Designer" className='w-16 h-16 md:w-24 md:h-24 lg:w-28 lg:h-28 2xl:w-32 2xl:h-32 object-cover border border-primary-600 rounded-full shrink-0 select-none'
        onContextMenu={(e) => e.preventDefault()}
        draggable={false}/>
      <div className='flex flex-col justify-center items-start'>
        <p className='text-primary-600 text-sm md:text-lg lg:text-[16px] 2xl:text-[20px] font-fustat font-extrabold uppercase'>System Analyst</p>
        <p className='text-primary-600 text-xs md:text-md lg:text-[14px] 2xl:text-[16px] font-fustat font-medium'>Jerwin L. Zamora</p>
        <a href="https://mail.google.com/mail/?view=cm&fs=1&to=zamorajerwin0@gmail.com"
          target="_blank"
          rel="noopener noreferrer"
          title='Email UI Designer'
          className='flex flex-row hover:underline mt-1 justify-center items-center gap-5'
        >
          <p className='text-primary-600 text-xs md:text-md lg:text-[14px] 2xl:text-[16px] font-fustat font-medium'>
          zamorajerwin0@gmail.com
          </p>
        </a>
      </div>
    </div>

  </div>

</div>
  </div>
</section>
  {/*Contact Us Section*/}
<section ref={contactRef} className='py-2 bg-white md:py-10 lg:py-10 xl:py-10 2xl:py-10 w-full overflow-hidden'>
  <div className='flex flex-col bg-white items-center md:items-start mt-0 md:mt-10 lg:mt-10 xl:mt-10 2xl:mt-10 gap-2 justify-start'>

    <h1 className='text-primary-600 text-center md:text-start lg:text-start xl:text-start 2xl:text-start px-4 md:px-[50px] lg:px-[130px] xl:px-[180px] 2xl:px-[230px] 3xl:px-[350px] w-full font-inter font-extrabold'>Contact Us!</h1>
    <p className='text-primary-600 text-center text-sm lg:text-base font-inter px-4 md:px-[50px] lg:px-[130px] xl:px-[180px] 2xl:px-[230px] 3xl:px-[350px] mb-10 font-medium'>
      Have questions about StudyBuddy? We'd love to hear from you — reach us at:
    </p>
    <div className='flex flex-col md:flex-row w-full justify-center items-center gap-8 md:gap-10 lg:gap-20 2xl:gap-52'>
    {/*MAIL*/}

      <a href="https://mail.google.com/mail/?view=cm&fs=1&to=support@studybuddyph.site"
      target="_blank"
      rel="noopener noreferrer"
      className='flex flex-row justify-center hover:underline items-center gap-5'
    >
      <div className='bg-primary-600  rounded-full border border-primary-600 w-14 h-14 md:w-14 md:h-14
      lg:w-14 lg:h-14
      xl:w-16 xl:h-16
      2xl:w-18 2xl:h-18
      items-center justify-center flex shrink-0'>
        <img src="./mail.png" alt="mail icon" className='w-8 h-8 md:w-10 md:h-10
        lg:w-8 lg:h-8
        xl:w-10 xl:h-10
        2xl:w-12 2xl:h-12' 
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
        />
      </div>
      <p className='text-sm md:text-sm lg:text-sm 2xl:text-lg text-primary-600 font-fustat font-medium'>
        support@studybuddyph.site
      </p>
    </a>
      {/*Facebook*/}
      <div className='flex flex-row justify-center items-center gap-5'>
        
        <a   href="https://www.facebook.com/profile.php?id=61591712304009"
        target="_blank"
        rel="noopener noreferrer"
        className='flex flex-row hover:underline justify-center items-center gap-5'
      >
        <img
          src="./fb.png"
          alt="Facebook"
          className='w-[55px] h-[55px] md:w-[55px] md:h-[55px] lg:w-[55px] lg:h-[55px] xl:w-[65px] xl:h-[65px] 2xl:w-[65px] 2xl:h-[65px]'
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
        />
        <p className='text-sm md:text-sm lg:text-sm 2xl:text-lg text-primary-600 font-fustat font-medium'>
          support@studybuddyph.site
        </p>
      </a>
      </div>
    </div>
  </div>
</section>

{/*Footer Section*/}
<section className='  bg-primary-600 mt-16 overflow-hidden'>
  <div className='flex flex-col items-center gap-6 px-6 py-8
  md:flex-row md:justify-between md:items-center md:gap-4 md:px-8
  lg:justify-center lg:gap-16 lg:px-20
  2xl:gap-x-72 md:py-6'>

    {/* Logo */}
    <div className='flex flex-col justify-center items-center gap-1 shrink-0'>
      <img src="./logoF.png" alt="logo" className='h-14 lg:h-20' 
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
      />
      <p className='text-[10px] text-white opacity-75 font-fustat font-light text-center'>@2026 Dominican College of Tarlac, Inc.</p>
    </div>

    {/* 3 columns */}
    <div className='flex flex-row justify-center gap-6 md:gap-8 lg:gap-16'>

      <div className='flex flex-col items-start gap-3'>
        <p className=' text-xs md:text-xs lg:text-sm uppercase text-white font-fustat font-normal'>policies</p>
        <button onClick={()=> navigate('/terms')}
        className='hover:opacity-75 text-xs md:text-xs lg:text-[13px] text-white font-fustat font-medium text-left'>Terms of Services</button>
        <button onClick={() => navigate('/privacy')}
         className='hover:opacity-75 text-xs md:text-xs lg:text-[13px] text-white font-fustat font-medium text-left'>Privacy Policy</button>
      </div>

      <div className='flex flex-col items-start gap-3'>
        <p className='text-xs md:text-xs lg:text-sm uppercase text-white font-fustat font-normal'>DOWNLOAD</p>
        <button onClick={() => downloadRef.current?.scrollIntoView({behavior: 'smooth'})}
        className='hover:opacity-75 text-xs md:text-xs lg:text-[13px] text-white font-fustat font-medium text-left'>iOS & Android</button>
        <button  onClick={()=> downloadRef.current?.scrollIntoView({behavior: 'smooth'})}
        className='hover:opacity-75 text-xs md:text-xs lg:text-[13px] text-white font-fustat font-medium text-left'>Mac & Windows</button>
      </div>

      <div className='flex flex-col items-start gap-3'>
        <p className='text-xs md:text-xs lg:text-sm uppercase text-white font-fustat font-normal'>About us</p>
        <button onClick={() => aboutRef.current?.scrollIntoView({behavior: 'smooth'})}
         className='hover:opacity-75 text-xs md:text-xs lg:text-[13px] text-white font-fustat font-medium text-left'>Developers</button>
        <button onClick={() => contactRef.current?.scrollIntoView({behavior: 'smooth'})}
         className='hover:opacity-75 text-xs md:text-xs lg:text-[13px] text-white font-fustat font-medium text-left'>Contact Us</button>
      </div>

    </div>
  </div>
</section>

  </div>


  </>


    

  )
}

export default App