import { useState, useRef, useEffect } from 'react'
import { useTimerContext } from '../context/TimerContext'

const PRESETS = [
  { label: '15 min', h: 0, m: 15, s: 0 },
  { label: '30 min', h: 0, m: 30, s: 0 },
  { label: '45 min', h: 0, m: 45, s: 0 },
  { label: '1 hr',   h: 1, m: 0,  s: 0 },
  { label: '1.5 hr', h: 1, m: 30, s: 0 },
  { label: '2 hr',   h: 2, m: 0,  s: 0 },
]

function StudyTimer() {
  const {
    seconds, minutes, hours,
    isRunning, isActive,
    setTimer, pause, resume, stop,
  } = useTimerContext()

  const [errorMsg,     setErrorMsg]     = useState<string>('')
  const [inputHours,   setInputHours]   = useState<string>('0')
  const [inputMinutes, setInputMinutes] = useState<string>('0')
  const [inputSeconds, setInputSeconds] = useState<string>('0')

  const formatTime = (t: number): string => t.toString().padStart(2, '0')

  const handleSetTime = (): void => {
    if (isActive) {
      setErrorMsg('Please stop the current timer first')
      return
    }

    const hrs  = Math.max(0, parseInt(inputHours)   || 0)
    const mins = Math.max(0, parseInt(inputMinutes) || 0)
    const secs = Math.max(0, parseInt(inputSeconds) || 0)

    if (hrs === 0 && mins === 0 && secs === 0) { setErrorMsg('Please set a valid time'); return }
    if (hrs > 23 || mins > 59 || secs > 59)    { setErrorMsg('Invalid time values');     return }

    setErrorMsg('')
    setTimer(hrs, mins, secs)
  }
const [isScrolling, setIsScrolling] = useState(false)
const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

const handleScroll = () => {
  setIsScrolling(true)
  if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
  scrollTimeout.current = setTimeout(() => setIsScrolling(false), 800)
}

useEffect(() => {
  return () => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
  }
}, [])
  return (
    <div  onScroll={handleScroll}
  className={`flex flex-col h-full w-full bg-white
    dark:bg-[#0A0F15] warm:bg-[#FBF1E8]
    px-3 xs:px-4 sm:px-5 md:px-6
    lg:px-0 lg:pr-5
    xl:px-0 xl:pr-5
    2xl:px-0 2xl:pr-7
    py-6 md:py-8
    pt-14
    md:pt-12
    lg:pt-10
    xl:pt-11
    2xl:pt-12
    xl:py-2 
    2xl:py-6 
    gap-4  md:gap-5 lg:gap-2 xl:gap-3 2xl:gap-5
    items-start justify-start overflow-y-auto overflow-x-hidden box-border
    custom-scroll ${isScrolling ? 'is-scrolling' : ''}`}
>

      <div id='timer' className='w-full flex flex-col gap-4 md:gap-5 lg:gap-3 xl:gap-4 2xl:gap-y-10 
      rounded-2xl lg:rounded-xl pb-10 lg:pb-0  dark:bg-[#0A0F15] warm:bg-[#623627] dark:border-white dark:border
       justify-center items-center  bg-primary-800'>
        <p className='font-bold text-center font-inter text-white tracking-widest 
        mt-10 md:mt-10 lg:mt-5 xl:mt-6  2xl:mt-7 text-xl md:text-xl lg:text-lg xl:text-xl 2xl:text-2xl uppercase px-2'>
          Study Timer
        </p>

        {/* TIMER DISPLAY */}
        <div  className='flex items-end gap-2 mt-3 md:mt-3 md:gap-2 lg:mt-0 xs:gap-2 flex-wrap font-intelOneMono justify-center px-2'>
          {[
            { val: formatTime(hours),   label: 'HOUR' },
            { val: formatTime(minutes), label: 'MIN'  },
            { val: formatTime(seconds), label: 'SEC'  },
          ].map((item, i) => (
            <div key={i} className='flex items-end gap-1 xs:gap-2'>
              <div className='flex flex-col items-center'>
                <span className='font-monomaniac leading-none text-white text-4xl xs:text-3xl sm:text-4xl md:text-4xl lg:text-[35px] xl:text-[45px] 2xl:text-[50px]'>{item.val}</span>
                <span className='text-xs xs:text-sm sm:text-base md:text-lg font-roboto font-medium leading-none mt-1 sm:mt-2 lg:mt-1 lg:text-[14px] xl:text-[16px] 2xl:text-[20px] text-white tracking-widest'>{item.label}</span>
              </div>
              {i < 2 && (
                <div className='flex flex-col items-center'>
                  <span className='font-monomaniac font-bold leading-none text-white text-3xl xs:text-3xl sm:text-4xl md:text-4xl lg:text-[20px] xl:text-[35px] 2xl:text-[40px]'>:</span>
                  <span aria-hidden className='invisible text-xs xs:text-sm sm:text-base md:text-lg font-roboto font-medium leading-none mt-1 lg:text-[18px] xl:text-[20px] 2xl:text-[40px] tracking-widest'>0</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* BUTTONS — Stop/Pause/Resume, always rendered to reserve height */}
        <div className={`flex flex-wrap justify-center gap-3 mb-2 md:mb-3 lg:mb-4 px-2 transition-opacity ${
          isActive ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}>
          <button onClick={() => stop()}
            tabIndex={isActive ? 0 : -1}
            className='px-5 sm:px-6 md:px-7 lg:px-5 xl:px-6 2xl:px-7 py-2 md:py-3 lg:py-0 xl:py-1 2xl:py-2 
            rounded-md lg:rounded-sm xl:rounded-md
            dark:bg-[#657084] warm:bg-[#FBF1E8] warm:text-[#623627]
            bg-[#4A4A49] text-white font-inter font-extrabold uppercase  hover:text-primary-800
            text-xs sm:text-sm md:text-base lg:text-[8px] xl:text-[10px] 2xl:text-[12px] hover:bg-red-50'>
            Stop
          </button>
          <button
            onClick={() => { if (isRunning) { pause(); return } resume() }}
            tabIndex={isActive ? 0 : -1}
            className='px-5 sm:px-6 md:px-7 lg:px-5 xl:px-6 2xl:px-7 py-2 md:py-3 lg:py-0 xl:py-1 2xl:py-2 
            rounded-md lg:rounded-sm xl:rounded-md
            bg-white text-primary-800 font-inter font-extrabold uppercase 
            text-xs sm:text-sm md:text-base lg:text-[8px] xl:text-[10px] 2xl:text-[12px] hover:bg-red-50'>
            {isRunning ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      <div className='flex w-full '>
        <p className='font-inter font-semibold uppercase text-left 
        text-sm 
        dark:text-white warm:text-[#623627] warm:font-bold
        md:text-md lg:text-[10px] xl:text-[12px] 2xl:text-[14px] text-[#B3B3B3]'>set your study time</p>
      </div>

      {/* SET-TIMER PANEL */}
      <div id='setTime' className='w-full
      dark:bg-[#657084] warm:bg-[#623627] warm:border-[#FBF1E8]
      bg-white rounded-2xl p-4 sm:p-5 md:p-6 lg:p-0 lg:py-2 lg:px-2 xl:p-6 xl:py-2 2xl:p-8 2xl:py-2 flex flex-col  gap-0 border-2 border-primary-800 '>
      <p className={`text-red-500  text-xs  sm:text-sm md:text-sm lg:text-[9px] xl:text-[10px] 2xl:text-[11px] 3xl:text-[13px] text-center font-inter mb-0 h-4 sm:h-5 md:h-5 lg:h-4 transition-opacity ${
        errorMsg ? 'opacity-100' : 'opacity-0'
      }`}>
        {errorMsg || '\u00A0'}
      </p>

        <div className='flex flex-col  items-center gap-2 mt-4 md:mt-6 lg:mt-1 xl:mt-2 2xl:mt-3 text-primary-600 uppercase font-roboto  mb-5 lg:mb-3 2xl:mb-6'>

          {/* Label row */}
          <div className='flex dark:text-white  justify-center gap-x-5 xs:gap-x-0 sm:gap-x-2 md:gap-x-3 lg:gap-x-2 xl:gap-x-2 2xl:gap-x-3'>
            {[
              { label: 'Hours',   id: 'hours'   },
              { label: 'Minutes', id: 'minutes' },
              { label: 'Seconds', id: 'seconds' },
            ].map((field) => (
              <label
                key={field.id}
                htmlFor={field.id}
                className='w-16 xs:w-14 sm:w-16 md:w-20 lg:w-14 xl:w-16 2xl:w-16 text-center
                text-sm
                dark:text-white warm:text-white
                md:text-lg lg:text-[10px] xl:text-[12px] 2xl:text-[16px] text-primary-600'
              >
                {field.label}
              </label>
            ))}
          </div>

          {/* Input row — colon lives here so it centers against the input height */}
          <div className='flex items-center justify-center gap-x-1 xs:gap-x-0.5 sm:gap-x-1 md:gap-x-2'>
            {[
              { val: inputHours,   set: setInputHours,   id: 'hours'   },
              { val: inputMinutes, set: setInputMinutes, id: 'minutes' },
              { val: inputSeconds, set: setInputSeconds, id: 'seconds' },
            ].map((field, i) => (
              <div key={field.id} className='flex items-center'>
                <input
                  id={field.id}
                  type='text'
                  inputMode='numeric'
                  pattern='[0-9]*'
                  value={field.val}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9]/g, '')
                    field.set(clean === '' ? '0' : clean)
                  }}
                  onFocus={(e) => e.target.select()}
                  className='w-16 xs:w-14 sm:w-16 md:w-20
                  dark:bg-white warm:border-[#FBF1E8]
                  lg:w-14 xl:w-16 2xl:w-16 text-center border-2 border-primary-800 rounded
                  text-lg xs:text-xl sm:text-xl md:text-2xl lg:text-sm xl:text-lg 2xl:text-xl text-primary-600'
                />
                {i < 2 && (
                  <span className='text-lg md:text-lg lg:text-xs xl:text-sm 2xl:text-base font-bold warm:text-white text-primary-600 mx-1 leading-none'>
                    :
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSetTime}
          className='w-full py-2 md:py-2 lg:py-[2px] xl:py-[2px] 2xl:py-[7px] 3xl:py-[10px] bg-primary-800 font-inter 
          text-xs sm:text-sm md:text-md lg:text-[10px] xl:text-[12px] 2xl:text-[14px] font-extrabold uppercase text-white
          rounded-md mb-2
          shadow-[0_2px_3px_rgba(107,114,128,0.8)]
          hover:opacity-80
          transition-shadow
          dark:bg-[#0A0F15] warm:bg-[#FBF1E8] warm:text-[#623627]
          hover:shadow-[0_2px_4px_rgba(107,114,128,1)]  '
        >
          Set Timer
        </button>

        <p className='text-primary-800 
        dark:text-white warm:text-white
        mb-3 sm:mb-4 md:mb-4 lg:mb-2 xl:mb-3 2xl:mb-4 font-inter font-normal text-xs sm:text-sm md:text-base lg:text-[10px] xl:text-[12px] 2xl:text-[14px] uppercase text-center'>Quick Presets</p>

        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 md:gap-y-4 md:gap-x-8 gap-y-3 gap-x-8 px-2 sm:px-5 md:px-6 
        lg:gap-x-5   lg:gap-y-2 lg:px-3 
        xl:gap-x-5 xl:px-2 2xl:gap-x-2 2xl:px-1 w-full uppercase justify-center mb-2'>
          {PRESETS.map((p) => (
            <button
              key={p.label} 
              onClick={() => {
                setInputHours(String(p.h))
                setInputMinutes(String(p.m))
                setInputSeconds(String(p.s))
              }}
              className='px-1 w-full py-2 md:py-3 lg:py-[1px] xl:py-[2px] 2xl:py-[5px] 
              text-xs sm:text-sm md:text-base lg:text-[9px] xl:text-[11px] 2xl:text-[15px]
              uppercase bg-[#4A4A49]
              dark:bg-[#BFC7D4] dark:border-white dark:border
              warm:bg-[#FBF1E8] warm:text-[#623627]
              rounded-md text-white font-inter font-bold
              shadow-[0_2px_3px_rgba(107,114,128,0.8)]
              hover:opacity-80
              transition-shadow
              hover:shadow-[0_2px_4px_rgba(107,114,128,1)]'
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StudyTimer