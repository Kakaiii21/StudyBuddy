import { useRef, useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Signup from './components/Signup'
import Login from './components/Login'
import { useInstallPWA } from './hooks/useInstallPWA'

/* ------------------------------------------------------------------ */
/*  Small animation helpers (no extra dependencies)                    */
/* ------------------------------------------------------------------ */

function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, visible] as const
}

function Reveal({
  children,
  delay = 0,
  from = 'up',
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  from?: 'up' | 'left' | 'right' | 'zoom'
  className?: string
}) {
  const [ref, visible] = useInView<HTMLDivElement>()
  const hidden = {
    up: 'translate-y-10',
    left: '-translate-x-10',
    right: 'translate-x-10',
    zoom: 'scale-90',
  }[from]
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`sb-reveal transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : `opacity-0 ${hidden}`
      } ${className}`}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

const features = [
  {
    tag: 'Focus',
    title: 'Study Timer',
    desc: 'Track how much time you actually spend studying. Start the timer whenever you sit down to work, and watch your study hours add up.',
    gif: './assets/timer.gif',
  },
  {
    tag: 'Organize',
    title: 'To Do List',
    desc: 'Keep track of everything you need to get done. Add, drag & drop, and manage your tasks so nothing slips through the cracks.',
    gif: './assets/todolist.gif',
  },
  {
    tag: 'Capture',
    title: 'Notes',
    desc: 'Keep all your study notes in one organized place. Create, edit, and revisit your notes anytime, so nothing gets lost between subjects and deadlines.',
    gif: './assets/notes.gif',
  },
  {
    tag: 'Plan',
    title: 'Class Schedule',
    desc: 'See your classes and study sessions at a glance. Plan your week and stay on top of where you need to be and when.',
    gif: './assets/classschedule.gif',
  },
  {
    tag: 'Store',
    title: 'My Files',
    desc: 'Organize your subjects and materials by folders. Keep everything related to each class neatly grouped and easy to find.',
    gif: './assets/courses.gif',
  },
  {
    tag: 'Learn',
    title: 'Study Generator',
    desc: "Turn your notes and files into quizzes and flashcards in seconds. A smarter, faster way to review and test what you've learned.",
    gif: './assets/studygen.gif',
  },
]

const developers = [
  { role: 'Programmer', name: 'Casey P. Dellamas', email: 'dellamascasey@gmail.com', img: './programmer.png' },
  { role: 'QA Tester', name: 'Joshua L. Mejia', email: 'joshuamejia2266@gmail.com', img: './QATester.jpg' },
  { role: 'Project Manager / UI Designer', name: 'Eunice Jayce F. De Vero', email: 'eunicejaycedevero@gmail.com', img: './projMan.png' },
  { role: 'System Analyst', name: 'Jerwin L. Zamora', email: 'zamorajerwin0@gmail.com', img: './UIDesigner.jpg' },
]

const palette = ['#FFD84D', '#7FC4FF', '#B5E8A0', '#C9A9F0', '#FFB8D9', '#FFB870']

// Fisher-Yates shuffle (returns a new array)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const noMenu = (e: React.MouseEvent) => e.preventDefault()

/* ------------------------------------------------------------------ */
/*  Device install card                                                */
/* ------------------------------------------------------------------ */

function DeviceCard({
  label,
  icon,
  iconHover,
  enabled,
  onClick,
  iconClass,
}: {
  label: string
  icon: string
  iconHover: string
  enabled: boolean
  onClick?: () => void
  iconClass: string
}) {
  return (
    <button
      className={`flex flex-col justify-start items-center group transition-all duration-300 ${
        enabled ? 'hover:-translate-y-2' : 'opacity-40 cursor-not-allowed'
      }`}
      onClick={onClick}
    >
      <div className='relative border rounded-3xl border-black group-hover:bg-black transition-colors duration-300 p-3 w-36 h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 2xl:w-48 2xl:h-48 select-none'>
        <div className='flex items-center justify-center h-full'>
          <img src={icon} alt={`${label} icon`} className={`${iconClass} group-hover:hidden`} onContextMenu={noMenu} draggable={false} />
          <img src={iconHover} alt={`${label} icon hover`} className={`${iconClass} hidden group-hover:block`} onContextMenu={noMenu} draggable={false} />
        </div>
        <img src="./dlBtn.png" alt="download icon" className='absolute bottom-2 right-2 w-5 md:w-7 group-hover:hidden' onContextMenu={noMenu} draggable={false} />
        <img src="./dlBtnH.png" alt="download icon hover" className='absolute bottom-2 right-2 w-5 md:w-7 hidden group-hover:block' onContextMenu={noMenu} draggable={false} />
      </div>
      <p className='mt-3 font-fustat font-bold text-primary-600 text-sm md:text-base'>{label}</p>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  App                                                                */
/* ------------------------------------------------------------------ */

function App() {
  const location = useLocation()
  const navigate = useNavigate()

  const [activeForm, setActiveForm] = useState<'signup' | 'login'>(() => {
    const params = new URLSearchParams(window.location.search)
    const hasAuthQueryFlag =
      params.has('emailUpdated') || params.has('passwordUpdated') || params.has('cancelResult')
    return location.state?.showLogin || hasAuthQueryFlag ? 'login' : 'signup'
  })

  const signupRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)
  const downloadRef = useRef<HTMLElement>(null)
  const featuresRef = useRef<HTMLElement>(null)

  const { isInstallable, installApp, isMacSafari } = useInstallPWA()
  const [showIOSModal, setShowIOSModal] = useState(false)
  const [showMacModal, setShowMacModal] = useState(false)

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

  /* ---- scroll progress bar, navbar state, hero parallax ---- */
  const progressRef = useRef<HTMLDivElement>(null)
  const heroImgRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let ticking = false
    const update = () => {
      const y = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (progressRef.current) {
        progressRef.current.style.width = `${max > 0 ? (y / max) * 100 : 0}%`
      }
      if (heroImgRef.current && y < window.innerHeight * 1.2) {
        heroImgRef.current.style.transform = `translateY(${y * 0.12}px)`
      }
      setScrolled(y > 12)
      ticking = false
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ---- sticky feature showcase: which step is centered ---- */
  const [activeFeature, setActiveFeature] = useState(0)
  const [playKey, setPlayKey] = useState(0)
  // a random color per feature, picked once per page load (no repeats)
  const featureColors = useMemo(() => shuffle(palette).slice(0, features.length), [])
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  // restart the GIF from its first frame whenever the active feature changes
  useEffect(() => {
    setPlayKey((k) => k + 1)
  }, [activeFeature])

  // preload all GIFs once so switching doesn't flash or lag
  useEffect(() => {
    features.forEach((f) => {
      const img = new Image()
      img.src = f.gif
    })
  }, [])

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index)
            if (!Number.isNaN(idx)) setActiveFeature(idx)
          }
        })
      },
      { rootMargin: '-45% 0px -45% 0px' }
    )
    stepRefs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  const goTo = (formType: 'signup' | 'login') => {
    setActiveForm(formType)
    setTimeout(() => signupRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const navBtn =
    'text-primary-600 font-fustat font-bold text-sm lg:text-base 2xl:text-lg uppercase hover:text-white transition-all duration-300 py-1 hover:bg-primary-600 rounded-full px-4'

  const headline = 'Start your day by being productive.'.split(' ')

  return (
    <>
      {/* Keyframes used by the landing page */}
      <style>{`
        @keyframes sb-rise { from { opacity: 0; transform: translateY(28px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes sb-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-14px) } }
        @keyframes sb-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes sb-blob { 0%,100% { transform: translate(0,0) scale(1) } 50% { transform: translate(30px,-20px) scale(1.1) } }
        @keyframes sb-bounce { 0%,100% { transform: translateY(0); opacity: .6 } 50% { transform: translateY(8px); opacity: 1 } }
        @keyframes sb-fade { from { opacity: 0; transform: scale(.96) } to { opacity: 1; transform: scale(1) } }
        .sb-word { display: inline-block; opacity: 0; animation: sb-rise .8s cubic-bezier(.2,.7,.2,1) forwards; }
        .sb-float { animation: sb-float 5s ease-in-out infinite; }
        .sb-marquee { animation: sb-marquee 28s linear infinite; }
        .sb-blob { animation: sb-blob 12s ease-in-out infinite; }
        .sb-bounce { animation: sb-bounce 1.6s ease-in-out infinite; }
        .sb-gif { animation: sb-fade .5s ease-out both; }
        html { scroll-behavior: smooth; }
        @media (prefers-reduced-motion: reduce) {
          .sb-word, .sb-float, .sb-marquee, .sb-blob, .sb-bounce, .sb-gif { animation: none !important; opacity: 1 !important; }
          .sb-reveal { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      {/* Scroll progress */}
      <div className='fixed top-0 left-0 right-0 h-1 z-[60] pointer-events-none'>
        <div ref={progressRef} className='h-full bg-primary-600 w-0' />
      </div>

      <div className='bg-white overflow-x-clip'>
        {/* ============================ NAV ============================ */}
        <nav
          className={`fixed top-1 inset-x-0 z-50 px-3 md:px-8 py-2 flex items-center justify-between transition-all duration-300 ${
            scrolled ? 'bg-white backdrop-blur-md shadow-md' : 'bg-transparent'
          }`}
        >
          <img
            src="./logo.png"
            alt="logo"
            className="pl-2 h-10 md:pl-5 md:h-14 lg:h-16 w-auto"
            onContextMenu={noMenu}
            draggable={false}
          />
          <div className="flex items-center gap-1 md:gap-3 lg:gap-5">
            <select
              defaultValue=''
              onChange={(e) => {
                if (e.target.value) navigate(e.target.value)
              }}
              className='hidden md:block text-primary-600 font-fustat font-bold text-sm lg:text-base 2xl:text-lg px-1 py-1 uppercase bg-transparent rounded-full text-center hover:text-white hover:bg-primary-600 transition-all duration-300 focus:outline-none cursor-pointer'
            >
              <option value='' disabled>Policies</option>
              <option value='/terms'>Terms of Service</option>
              <option value='/privacy'>Privacy Policy</option>
            </select>
            <button onClick={() => aboutRef.current?.scrollIntoView({ behavior: 'smooth' })} className={`hidden md:flex ${navBtn}`}>
              About Us
            </button>
            <button onClick={() => goTo('signup')} className={navBtn}>Sign Up</button>
            <p className='text-primary-600 font-fustat font-bold text-sm uppercase'>|</p>
            <button onClick={() => goTo('login')} className={navBtn}>Log In</button>
          </div>
        </nav>

        {/* ============================ HERO ============================ */}
        <section className="relative min-h-screen w-full flex items-center overflow-hidden pt-24 pb-16">
          {/* soft animated background blobs */}
          <div className='sb-blob pointer-events-none absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-primary-600 opacity-10 blur-3xl' />
          <div className='sb-blob pointer-events-none absolute bottom-0 right-0 w-[520px] h-[520px] rounded-full bg-primary-600 opacity-10 blur-3xl' style={{ animationDelay: '-5s' }} />

          <div className='relative w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col lg:flex-row items-center gap-10 lg:gap-6'>
            {/* Copy */}
            <div className='flex-1 flex flex-col items-center lg:items-start text-center lg:text-left'>
              <span
                className='sb-word inline-flex items-center gap-2 rounded-full border border-primary-600 text-primary-600 font-fustat font-bold uppercase text-[10px] md:text-xs px-4 py-1 mb-5'
                style={{ animationDelay: '0.05s' }}
              >
                <span className='w-2 h-2 rounded-full bg-primary-600' />
                Progressive Web App for students
              </span>

              <h1 className='text-primary-600 font-inter font-extrabold uppercase leading-[1.05] text-[34px] md:text-[56px] lg:text-[60px] xl:text-[72px] 2xl:text-[84px]'>
                {headline.map((w, i) => (
                  <span key={i} className='sb-word mr-3' style={{ animationDelay: `${0.15 + i * 0.09}s` }}>
                    {w}
                  </span>
                ))}
              </h1>

              <p
                className='sb-word text-primary-600 font-fustat font-medium text-sm md:text-base xl:text-lg 2xl:text-xl max-w-xl mt-5'
                style={{ animationDelay: '0.9s' }}
              >
                Study Buddy helps students manage their study time, organize notes, track tasks, and enhance learning efficiency.
              </p> 

              <div className=' flex flex-wrap w-full justify-center lg:justify-start gap-3 mt-7' style={{ animationDelay: '1.05s' }}>
                <button
                  onClick={() => goTo('signup')}
                  className='flex items-center gap-3 py-3 px-6 md:px-8 text-white uppercase font-fustat font-bold text-sm md:text-lg bg-primary-600 rounded-full hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(0,0,0,0.35)] transition-all duration-300'
                >
                  Get Started
                </button>
                <button
                  onClick={() => downloadRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className='flex items-center gap-3 py-3 px-6 md:px-8 uppercase font-fustat font-bold text-sm md:text-lg text-primary-600 border-2 border-primary-600 rounded-full hover:bg-primary-600 hover:text-white hover:-translate-y-1 transition-all duration-300'
                >
                  Add to Home
                  <img src="./downA.png" alt="Download" className='w-3 h-4 md:w-4 md:h-6' />
                </button>
              </div>
            </div>

            {/* Image with parallax + floating chips */}
            <div className='flex-1 flex justify-center'>
              <div ref={heroImgRef} className='relative will-change-transform'>
                <div className='sb-float'>
                  <img
                    src="./landImg.png"
                    alt="landing img"
                    className='w-[240px] md:w-[360px] lg:w-[420px] xl:w-[500px] 2xl:w-[580px] object-contain drop-shadow-2xl'
                    onContextMenu={noMenu}
                    draggable={false}
                  />
                </div>
                {['Timer', 'Notes', 'Quizzes'].map((chip, i) => (
                  <span
                    key={chip}
                    className='sb-float hidden md:block absolute bg-white border border-primary-600 text-primary-600 font-fustat font-bold text-xs lg:text-sm rounded-full px-4 py-1 shadow-lg'
                    style={{
                      animationDelay: `${i * 0.8}s`,
                      top: ['6%', '45%', '80%'][i],
                      left: ['-6%', '92%', '6%'][i],
                    }}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* scroll cue */}
          <button
            onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className='sb-bounce absolute bottom-5 left-1/2 -translate-x-1/2 text-primary-600 font-fustat font-bold uppercase text-[10px] tracking-widest flex flex-col items-center gap-1'
            aria-label='Scroll to features'
          >
            Scroll
            <span className='block w-5 h-8 border-2 border-primary-600 rounded-full relative'>
              <span className='absolute left-1/2 -translate-x-1/2 top-1.5 w-1 h-2 rounded-full bg-primary-600' />
            </span>
          </button>
        </section>

        {/* ============================ MARQUEE ============================ */}
        <div className='bg-primary-600 overflow-hidden'>
          <div className='sb-marquee flex w-max whitespace-nowrap'>
            {[...features, ...features, ...features, ...features].map((f, i) => (
              <span
                key={i}
                style={{ backgroundColor: featureColors[i % features.length] }}
                className='text-primary-600 font-inter font-extrabold uppercase text-lg md:text-2xl px-8 py-4 flex items-center gap-8'
              >
                {f.title}
                <span className='w-2 h-2 rounded-full bg-primary-600 opacity-60' />
              </span>
            ))}
          </div>
        </div>

        {/* ============================ FEATURES ============================ */}
        <section ref={featuresRef} className='bg-white w-full px-4 md:px-10 lg:px-16 xl:px-24 py-20 md:py-28'>
          <Reveal className='text-center mb-14 md:mb-24'>
            <p className='font-fustat font-bold uppercase tracking-widest text-xs md:text-sm text-primary-600 opacity-70'>Everything in one place</p>
            <h2 className='font-inter font-extrabold text-primary-600 text-3xl md:text-5xl 2xl:text-6xl mt-2'>
              Plan, organize, and learn smarter.
            </h2>
            <p className='font-fustat text-primary-600 text-sm md:text-lg max-w-2xl mx-auto mt-4'>
              Your all-in-one study companion. Scroll to see what Study Buddy can do for you.
            </p>
          </Reveal>

          <div className='max-w-6xl mx-auto lg:grid lg:grid-cols-2 lg:gap-16'>
            {/* Steps */}
            <div>
              {features.map((f, i) => (
                <div
                  key={f.title}
                  ref={(el) => { stepRefs.current[i] = el }}
                  data-index={i}
                  className='lg:min-h-[80vh] flex items-center mb-14 lg:mb-0'
                >
<Reveal className={`w-full transition-opacity duration-500 ${activeFeature === i ? 'lg:opacity-100' : 'lg:opacity-30'}`}>
  <div className='flex flex-row items-start gap-4 md:gap-6 max-w-md md:max-w-xl mx-auto lg:mx-0 text-left'>
    {/* left: number + tag */}
    <div className='flex flex-col items-start gap-2 shrink-0'>
      <span
        className='font-inter font-extrabold text-5xl md:text-6xl leading-none'
        style={{ color: featureColors[i] }}
      >
        {String(i + 1).padStart(2, '0')}
      </span>
      <span
        className='font-fustat font-bold uppercase text-[10px] md:text-[11px] tracking-widest border border-primary-600 text-primary-600 rounded-full px-3 py-1'
        style={{ backgroundColor: featureColors[i] }}
      >
        {f.tag}
      </span>
    </div>

    {/* right: title + description */}
    <div className='min-w-0 flex-1'>
      <h3 className='font-inter font-extrabold text-primary-600 text-2xl md:text-4xl 2xl:text-5xl leading-tight'>{f.title}</h3>
      <p className='font-fustat mr-10 text-primary-600 text-sm md:text-base 2xl:text-lg mt-2'>{f.desc}</p>
    </div>
  </div>

  {/* mobile/tablet image: after the text, centered */}
  <img
    src={f.gif}
    alt={`${f.title} preview`}
    loading='lazy'
    style={{ backgroundColor: featureColors[i] }}
    className='lg:hidden w-full max-w-xs md:max-w-sm mx-auto mt-6 aspect-square object-contain border border-black rounded-3xl shadow-xl'
    onContextMenu={noMenu}
    draggable={false}
  />
</Reveal>
                </div>
              ))}
            </div>

            {/* Sticky preview (desktop) */}
            <div className='hidden lg:block'>
              <div className='sticky top-0 h-screen flex flex-col items-center justify-center'>
                <div
                  className='relative w-full max-w-md aspect-square rounded-[2rem] border-2 border-primary-600 shadow-[0_30px_60px_rgba(0,0,0,0.2)] overflow-hidden transition-colors duration-700'
                  style={{ backgroundColor: featureColors[activeFeature] }}
                >
                  {/* Only the active GIF is rendered. The key + query string
                      remount it so it always starts from the first frame. */}
                  <img
                    key={`${activeFeature}-${playKey}`}
                    src={`${features[activeFeature].gif}?play=${playKey}`}
                    alt={`${features[activeFeature].title} preview`}
                    className='sb-gif absolute inset-0 w-full h-full object-contain p-6'
                    onContextMenu={noMenu}
                    draggable={false}
                  />
                </div>
                {/* progress dots */}
                <div className='flex gap-2 mt-6'>
                  {features.map((f, i) => (
                    <span
                      key={f.title}
                      style={{ backgroundColor: featureColors[i] }}
                      className={`h-2 rounded-full border border-primary-600 transition-all duration-500 ${
                        activeFeature === i ? 'w-8 opacity-100' : 'w-2 opacity-40'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================ AUTH ============================ */}
        <section ref={signupRef} className="w-full h-auto bg-primary-600">
          {activeForm === 'signup'
            ? <Signup onSwitchToLogin={() => setActiveForm('login')} />
            : <Login onSwitchToSignup={() => setActiveForm('signup')} />}
        </section>

        {/* ============================ DOWNLOAD ============================ */}
        <section ref={downloadRef} className="py-16 md:py-24 bg-white">
          <Reveal className='flex flex-col gap-4 justify-start items-center'>
            <p className='text-center font-fustat text-3xl md:text-4xl font-extrabold text-primary-600 uppercase'>Add to Home</p>
            <p className='text-center font-fustat text-lg font-normal text-primary-600'>Get Study Buddy on any device:</p>
          </Reveal>
          <div className='grid grid-cols-2 md:flex md:flex-row md:justify-center gap-5 2xl:gap-x-8 mt-12 px-6 place-items-center'>
            <Reveal delay={0} from="zoom">
              <DeviceCard
                label='Android' icon='./android.png' iconHover='./androidH.png'
                iconClass='w-16 md:w-24 2xl:w-30 mb-8'
                enabled={isAndroid && isInstallable}
                onClick={isAndroid && isInstallable ? installApp : undefined}
              />
            </Reveal>
            <Reveal delay={100} from="zoom">
              <DeviceCard
                label='iOS' icon='./iphone.png' iconHover='./iphoneH.png'
                iconClass='w-16 md:w-24 2xl:w-30 mb-5'
                enabled={isIOS}
                onClick={() => isIOS && setShowIOSModal(true)}
              />
            </Reveal>
            <Reveal delay={200} from="zoom">
              <DeviceCard
                label='Windows' icon='./windows.png' iconHover='./windowsH.png'
                iconClass='w-14 md:w-20 mb-5'
                enabled={isWindows && isInstallable}
                onClick={isWindows && isInstallable ? installApp : undefined}
              />
            </Reveal>
            <Reveal delay={300} from="zoom">
              <DeviceCard
                label='MacOS' icon='./mac.png' iconHover='./macH.png'
                iconClass='w-16 md:w-24 mb-5'
                enabled={isMac}
                onClick={isMacSafari ? () => setShowMacModal(true) : isMac && isInstallable ? installApp : undefined}
              />
            </Reveal>
          </div>
        </section>

        {/* iOS Modal */}
        {showIOSModal && (
          <div className='fixed inset-0 bg-black/50 z-[70] flex items-center justify-center' onClick={() => setShowIOSModal(false)}>
            <div className='bg-white rounded-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center gap-4' onClick={(e) => e.stopPropagation()}>
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
          <div className='fixed inset-0 bg-black/50 z-[70] flex items-center justify-center' onClick={() => setShowMacModal(false)}>
            <div className='bg-white rounded-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center gap-4' onClick={(e) => e.stopPropagation()}>
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

        {/* ============================ DEVELOPERS ============================ */}
        <section ref={aboutRef} className="py-16 md:py-24 bg-white w-full">
          <div className='max-w-6xl mx-auto px-6'>
            <Reveal className='text-center md:text-left mb-12'>
              <h2 className='text-primary-600 font-inter font-extrabold text-3xl md:text-4xl'>Developers</h2>
              <p className='text-primary-600 font-inter font-medium mt-2'>Meet the developers of Study Buddy.</p>
            </Reveal>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {developers.map((d, i) => (
                <Reveal key={d.email} delay={i * 100} from={i % 2 === 0 ? 'left' : 'right'}>
                  <div className='flex flex-row gap-5 items-center border border-primary-600 rounded-3xl p-4 group cursor-pointer transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.03] hover:shadow-2xl hover:bg-[var(--dev-color)]' style={{ '--dev-color': featureColors[i] } as React.CSSProperties}>
<img
  src={d.img}
  alt={d.role}
  className='w-16 h-16 md:w-24 md:h-24 2xl:w-28 2xl:h-28 object-cover bg-white border border-primary-600 rounded-full shrink-0 select-none transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3'
  onContextMenu={noMenu}
  draggable={false}
/>
                    <div className='flex flex-col justify-center items-start min-w-0'>
                      <p className='text-primary-600 text-sm md:text-base 2xl:text-lg font-fustat font-extrabold uppercase'>{d.role}</p>
                      <p className='text-primary-600 text-xs md:text-sm 2xl:text-base font-fustat font-medium'>{d.name}</p>
                      <a
                        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${d.email}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Email ${d.role}`}
                        className='hover:underline mt-1 text-primary-600 text-xs md:text-sm 2xl:text-base font-fustat font-medium break-all'
                      >
                        {d.email}
                      </a>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============================ CONTACT ============================ */}
        <section ref={contactRef} className='py-12 md:py-20 bg-white w-full overflow-hidden'>
          <div className='max-w-6xl mx-auto px-6'>
            <Reveal className='text-center md:text-left mb-10'>
              <h2 className='text-primary-600 font-inter font-extrabold text-3xl md:text-4xl'>Contact Us!</h2>
              <p className='text-primary-600 text-sm lg:text-base font-inter mt-2 font-medium'>
                Have questions about StudyBuddy? We'd love to hear from you — reach us at:
              </p>
            </Reveal>

            <div className='flex flex-col md:flex-row w-full justify-center items-center gap-8 md:gap-16'>
              <Reveal from="left">
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=support@studybuddyph.site"
                  target="_blank"
                  rel="noopener noreferrer"
                  className='flex flex-row items-center gap-5 hover:underline group'
                >
                  <div className='bg-primary-600 rounded-full w-14 h-14 xl:w-16 xl:h-16 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300'>
                    <img src="./mail.png" alt="mail icon" className='w-8 h-8 xl:w-10 xl:h-10' onContextMenu={noMenu} draggable={false} />
                  </div>
                  <p className='text-sm 2xl:text-lg text-primary-600 font-fustat font-medium'>support@studybuddyph.site</p>
                </a>
              </Reveal>

              <Reveal from="right">
                <a
                  href="https://www.facebook.com/profile.php?id=61591712304009"
                  target="_blank"
                  rel="noopener noreferrer"
                  className='flex flex-row items-center gap-5 hover:underline group'
                >
                  <img
                    src="./fb.png"
                    alt="Facebook"
                    className='w-[55px] h-[55px] xl:w-[65px] xl:h-[65px] group-hover:scale-110 transition-transform duration-300'
                    onContextMenu={noMenu}
                    draggable={false}
                  />
                  <p className='text-sm 2xl:text-lg text-primary-600 font-fustat font-medium'>Study Buddy on Facebook</p>
                </a>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ============================ FOOTER ============================ */}
        <footer className='bg-primary-600 mt-8 overflow-hidden'>
          <div className='flex flex-col items-center gap-6 px-6 py-8 md:flex-row md:justify-between md:items-center md:gap-4 md:px-8 lg:justify-center lg:gap-16 lg:px-20 2xl:gap-x-72 md:py-6'>
            <div className='flex flex-col justify-center items-center gap-1 shrink-0'>
              <img src="./logoF.png" alt="logo" className='h-14 lg:h-20' onContextMenu={noMenu} draggable={false} />
              <p className='text-[10px] text-white opacity-75 font-fustat font-light text-center'>@2026 Dominican College of Tarlac, Inc.</p>
            </div>

            <div className='flex flex-row justify-center gap-6 md:gap-8 lg:gap-16'>
              <div className='flex flex-col items-start gap-3'>
                <p className='text-xs lg:text-sm uppercase text-white font-fustat font-normal'>policies</p>
                <button onClick={() => navigate('/terms')} className='hover:opacity-75 text-xs lg:text-[13px] text-white font-fustat font-medium text-left'>Terms of Services</button>
                <button onClick={() => navigate('/privacy')} className='hover:opacity-75 text-xs lg:text-[13px] text-white font-fustat font-medium text-left'>Privacy Policy</button>
              </div>

              <div className='flex flex-col items-start gap-3'>
                <p className='text-xs lg:text-sm uppercase text-white font-fustat font-normal'>DOWNLOAD</p>
                <button onClick={() => downloadRef.current?.scrollIntoView({ behavior: 'smooth' })} className='hover:opacity-75 text-xs lg:text-[13px] text-white font-fustat font-medium text-left'>iOS & Android</button>
                <button onClick={() => downloadRef.current?.scrollIntoView({ behavior: 'smooth' })} className='hover:opacity-75 text-xs lg:text-[13px] text-white font-fustat font-medium text-left'>Mac & Windows</button>
              </div>

              <div className='flex flex-col items-start gap-3'>
                <p className='text-xs lg:text-sm uppercase text-white font-fustat font-normal'>About us</p>
                <button onClick={() => aboutRef.current?.scrollIntoView({ behavior: 'smooth' })} className='hover:opacity-75 text-xs lg:text-[13px] text-white font-fustat font-medium text-left'>Developers</button>
                <button onClick={() => contactRef.current?.scrollIntoView({ behavior: 'smooth' })} className='hover:opacity-75 text-xs lg:text-[13px] text-white font-fustat font-medium text-left'>Contact Us</button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

export default App