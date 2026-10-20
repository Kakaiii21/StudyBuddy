import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { useClassSched, type MeetingInput } from '../hooks/useClassSched'
import { useCategories } from '../hooks/useCategories'
import { useTour } from '../hooks/useTour'
import { useTheme, type Theme } from '../context/ThemeContext'
import { containsBadWords } from '../utils/contentFilter'
import { CleanInput } from '../components/CleanInput'


function SoftDeleteModal({ itemName, onConfirm, onCancel }: {
  itemName: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const [confirming, setConfirming] = useState(false)

  const handleConfirm = () => {
    if (confirming) return
    setConfirming(true)
    onConfirm()
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4'>
        <div className='flex items-center gap-3 mb-3'>
          <img src="/delete.png" alt="deleteicon" className='w-7 h-7 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false} />
          <h2 className='text-lg font-bold text-gray-800'>Move to Recently Deleted?</h2>
        </div>
        <p className='text-sm text-gray-500 mb-1'>
          <span
            className='block max-w-full truncate font-semibold text-gray-700'
            title={itemName}
          >
            "{itemName}"
          </span>
          will be moved to{' '}
          <span className='font-semibold text-primary-600'>Recently Deleted</span>.
        </p>
        <p className='text-xs text-gray-400 mb-6'>
          You can restore it anytime within <span className='font-semibold text-red-400'>30 days</span>, after which it will be permanently deleted.
        </p>
        <div className='flex gap-3 justify-end'>
          <button
            onClick={onCancel}
            disabled={confirming}
            className='px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40'
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className='px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-60'
          >
            {confirming ? 'Moving...' : 'Move to Trash'}
          </button>
        </div>
      </div>
    </div>
  )
}


function ClearScheduleModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl lg:rounded-lg shadow-2xl p-6 lg:p-3 xl:p-3 2xl:p-4 3xl:p-5 w-80  lg:w-[250px] xl:w-[280px] 2xl:w-[350px] 3xl:w-[420px]'>
        <div className='flex items-center gap-3 xl:gap-2 2xl:gap-3  mb-1 2xl:mb-2 3xl:mb-3 '>
          <img src="/delete.png" alt="delete icon" className='w-5 h-5 xl:w-5 xl:h-5 2xl:w-7 2xl:h-7 3xl:w-9 3xl:h-9 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false}  />
          <h2 className='text-sm pt-2 lg:text-xs xl:text-sm 2xl:text-[16px] 3xl:text-[20px] lg:pt-2 font-bold text-gray-800 '>Clear All Schedules?</h2>
        </div>
        <p className='text-sm lg:text-[10px] xl:text-[12px] 2xl:text-[15px] 3xl:text-[18px]  text-gray-500 mb-1 3xl:mb-3'>
          This will  delete{' '}
          <span className='text-sm lg:text-[10px] xl:text-[12px] 2xl:text-[15px] 3xl:text-[18px]  text-gray-500 mb-1 3xl:mb-3'>all subjects</span> from your class schedule.
        </p>
        <p className='text-sm lg:text-[10px] xl:text-[12px] 2xl:text-[15px] 3xl:text-[18px]  text-gray-500 mb-1 3xl:mb-3'>
          This action <span className='font-semibold text-red-400'>cannot be undone</span>.
        </p>
        <div className='flex gap-3 justify-end'>
          <button
            onClick={onCancel}
            className='text-sm  lg:text-[10px] xl:text-[12px] 2xl:text-[15px] 3xl:text-[18px] py-1 px-2 rounded-md lg:py-1 2xl:py-2 lg:px-2 xl font-medium text-gray-600 hover:bg-gray-100 transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className='text-sm  lg:text-[10px] xl:text-[12px] 2xl:text-[15px] 3xl:text-[18px] py-1 px-2 rounded-md lg:py-1 2xl:py-2 lg:px-2 xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors'
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  )
} 
function ResetFormModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4'>
        <div className='flex items-center gap-3 mb-3'>
          <img src="/delete.png" alt="reset icon" className='w-6 h-6 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false} />
          <h2 className='text-lg font-bold text-gray-800'>Clear Form?</h2>
        </div>
        <p className='text-sm text-gray-500 mb-6'>
          This will erase everything you've entered in this form, including subject info and all schedule rows.
        </p>
        <div className='flex gap-3 justify-end'>
          <button
            onClick={onCancel}
            className='px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className='px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors'
          >
            Clear Form
          </button>
        </div>
      </div>
    </div>
  )
}
// ── Speed Dial FAB (mobile/md only) ───────────
function ScheduleFab({ onClearAll, onAddSchedule, disabled }: {
  onClearAll: () => void
  onAddSchedule: () => void
  disabled: boolean
}) {
  const [open, setOpen] = useState(false)

  const actions = [
    {
      id: 'fabAddScheduleBtn',
      label: 'Add Schedule',
      icon: '/Add.png',
      onClick: () => { onAddSchedule(); setOpen(false) },
      className: 'bg-[#FEE248]',
    },
    {
      id: 'fabClearScheduleBtn',
      label: 'Clear All Schedule',
      icon: '/delete.png',
      onClick: () => { onClearAll(); setOpen(false) },
      className: 'bg-[#E2E2E2]',
      disabled,
    },
  ]

  return (
    <div className="lg:hidden fixed bottom-16 right-6 flex flex-col items-end gap-3 z-50">
      {open && actions.slice().reverse().map((action) => (
        <div key={action.label} className="flex items-center gap-3 animate-fade-in">
          <span className="bg-white text-primary-800 text-xs font-inter font-semibold px-3 py-1 rounded-md whitespace-nowrap uppercase">
            {action.label}
          </span>
          <button
            id={action.id}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`w-12 h-12 rounded-full shadow-md flex items-center justify-center
              hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${action.className}`}
          >
            <img src={action.icon} alt={action.label} className="w-5 h-5 select-none" onContextMenu={(e) => e.preventDefault()} draggable={false}  />
          </button>
        </div>
      ))}

      <button
        id="scheduleFabBtn"
        onClick={() => setOpen((prev) => !prev)}
        className="w-14 h-14 rounded-full bg-primary-600 active:bg-primary-600 focus:bg-primary-600 shadow-lg flex items-center justify-center transition-transform outline-none"
        style={{
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <img src="/Add.png" alt={open ? 'Close' : 'Open menu'} className="w-6 h-6 invert select-none" onContextMenu={(e) => e.preventDefault()} draggable={false}  />
      </button>
    </div>
  )
}


interface MeetingRow {
  key: string
  id?: string
  day: string
  timeStart: string
  timeEnd: string
  room: string
  roomType: string
}

const newMeetingRow = (): MeetingRow => ({
  key: crypto.randomUUID(),
  day: '',
  timeStart: '',
  timeEnd: '',
  room: '',
  roomType: '',
})


const MIN_GAP_MINUTES = 0


const MIN_DURATION_MINUTES = 15

const needHelpIcon: Record<Theme, string> = {
  light: '/needhelp.png',
  dark: '/needhelp-dark.png',
  warm: '/needhelp-warm.png',
}
const BAD_WORD_MSG = "Inappropriate language isn't allowed."
function ClassSchedule() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const { schedules, loading, addClass, updateClass, deleteSchedule } = useClassSched(user)
  const { categories, addCategory } = useCategories(user)
const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [isAddSubOpen, setIsAddSubOpen] = useState(false)
  const [subjectName, setSubjectName] = useState('')
  const [instructor, setInstructor] = useState('')
  const [meetings, setMeetings] = useState<MeetingRow[]>([newMeetingRow()])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [rowErrors, setRowErrors] = useState<Record<string, Record<string, string>>>({})
  const [menuOpenIndex, setMenuOpenIndex] = useState<string | null>(null)
  const [editTargetClassId, setEditTargetClassId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const [showClearModal, setShowClearModal] = useState(false)

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const typeRoom = ['Lecture', 'Laboratory']
  const { startTour } = useTour(
    'classschedule',
    false,
    () => {},
    () => {},
    user
  )
  const formatTime = (time: string) => {
    if (!time) return ''
    const [hourStr, minute] = time.split(':')
    const hour = parseInt(hourStr)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minute} ${ampm}`
  }

  const resetForm = () => {
    setSubjectName(''); setInstructor('')
    setMeetings([newMeetingRow()])
    setFieldErrors({}); setRowErrors({}); setEditTargetClassId(null)
  }

  const errClass = (field: string) =>
    fieldErrors[field] ? 'border-2 border-red-400 bg-red-50' : ''

  const rowErrClass = (rowKey: string, field: string) =>
    rowErrors[rowKey]?.[field] ? 'border-2 border-red-400 bg-red-50' : ''

  const addMeetingRow = () => setMeetings((prev) => [...prev, newMeetingRow()])


const [confirmRemoveKey, setConfirmRemoveKey] = useState<string | null>(null)

const removeMeetingRow = (key: string) => {
  setMeetings((prev) => prev.filter((m) => m.key !== key))
  setConfirmRemoveKey(null)
}
  const updateMeetingRow = <K extends keyof MeetingRow>(key: string, field: K, value: MeetingRow[K]) =>
    setMeetings((prev) => prev.map((m) => (m.key === key ? { ...m, [field]: value } : m)))

  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  // If a subject is no longer referenced by any schedule row (optionally
  // excluding rows we're about to delete/replace), turn it into a real,
  // standalone category doc — same as one added manually in Notes — so it
  // survives in Notes as a deletable category instead of silently
  // disappearing along with the schedule that used to reference it.
  const preserveOrphanedSubject = (subject: string, excludeIds: string[] = []) => {
    const stillUsed = schedules.some((s) => s.subject === subject && !excludeIds.includes(s.id))
    const alreadyCategory = categories.some((c) => c.name === subject)
    if (!stillUsed && !alreadyCategory) {
      addCategory(subject)
    }
  }

  const handleSave = () => {
  if (
    containsBadWords(subjectName) ||
    containsBadWords(instructor) ||
    meetings.some((m) => containsBadWords(m.room))
  ) return   // the live message under the field already explains why

  const topErrors: Record<string, string> = {}
    const trimmedSubject = subjectName.trim()
if (!trimmedSubject) {
  topErrors.subjectName = 'Required'
} else {
  const isDuplicateSubject = schedules.some(
    (s) =>
      s.subject.trim().toLowerCase() === trimmedSubject.toLowerCase() &&
      s.classId !== editTargetClassId
  )
  if (isDuplicateSubject) {
    topErrors.subjectName = 'A class with this subject name already exists'
  }
}

    if (!instructor.trim()) {
      topErrors.instructor = 'Required'
    } else if (containsBadWords(instructor)) {
      topErrors.instructor = BAD_WORD_MSG
    }

    const activeRows = meetings
    if (activeRows.length === 0) topErrors.meetings = 'Add at least one day and time slot'

    const newRowErrors: Record<string, Record<string, string>> = {}
    activeRows.forEach((row) => {
      const errs: Record<string, string> = {}
      if (!row.day) errs.day = 'Required'
      if (!row.timeStart) errs.timeStart = 'Required'
      if (!row.timeEnd) errs.timeEnd = 'Required'
      if (!row.room.trim()) errs.room = 'Required'
      else if (containsBadWords(row.room)) errs.room = BAD_WORD_MSG
      if (!row.roomType) errs.roomType = 'Required'
      if (row.timeStart && row.timeEnd && row.timeEnd <= row.timeStart) {
        errs.timeEnd = 'Must be later than start time'
      } else if (
        row.timeStart && row.timeEnd &&
        toMinutes(row.timeEnd) - toMinutes(row.timeStart) < MIN_DURATION_MINUTES
      ) {
        errs.timeEnd = `Class must be at least ${MIN_DURATION_MINUTES} minutes long`
      }
      if (Object.keys(errs).length > 0) newRowErrors[row.key] = errs
    })

    activeRows.forEach((row, i) => {
      if (!row.day || !row.timeStart || !row.timeEnd) return
     
      if (newRowErrors[row.key]?.timeEnd || newRowErrors[row.key]?.timeStart) return

      const rowStart = toMinutes(row.timeStart)
      const rowEnd = toMinutes(row.timeEnd)

      const conflictExisting = schedules
        .filter((s) => s.day === row.day && s.classId !== editTargetClassId)
        .some((s) =>
          rowStart < toMinutes(s.timeEnd) + MIN_GAP_MINUTES &&
          rowEnd + MIN_GAP_MINUTES > toMinutes(s.timeStart)
        )

      const conflictLocal = activeRows.some((other, j) =>
        j !== i && other.day === row.day && other.timeStart && other.timeEnd &&
        rowStart < toMinutes(other.timeEnd) + MIN_GAP_MINUTES &&
        rowEnd + MIN_GAP_MINUTES > toMinutes(other.timeStart)
      )

      if (conflictExisting || conflictLocal) {
        newRowErrors[row.key] = {
          ...newRowErrors[row.key],
          timeStart: 'Time conflict',
          timeEnd: MIN_GAP_MINUTES > 0
            ? `${row.day} already has a class scheduled too close to this time`
            : `${row.day} already has a class during this time`,
        }
      }
    })

    if (Object.keys(topErrors).length > 0 || Object.keys(newRowErrors).length > 0) {
      setFieldErrors(topErrors)
      setRowErrors(newRowErrors)
      return
    }

    const payload: MeetingInput[] = activeRows.map((row) => ({
      id: row.id,
      day: row.day,
      timeStart: row.timeStart,
      timeEnd: row.timeEnd,
      room: row.room,
      roomType: row.roomType,
    }))

    const targetClassId = editTargetClassId

    setIsAddSubOpen(false)
    resetForm()

    if (targetClassId) {
      updateClass(targetClassId, subjectName, instructor, payload)
    } else {
      addClass(subjectName, instructor, payload)
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    await deleteSchedule(pendingDelete.id)
    preserveOrphanedSubject(pendingDelete.name, [pendingDelete.id])
    setPendingDelete(null)
  }

  async function handleClearAll() {
    const uniqueSubjects = Array.from(new Set(schedules.map((s) => s.subject)))
    await Promise.all(schedules.map((s) => deleteSchedule(s.id)))
    uniqueSubjects.forEach((subject) => {
      if (!categories.some((c) => c.name === subject)) {
        addCategory(subject)
      }
    })
    setShowClearModal(false)
  }


  const handleEditOpen = (classId: string) => {
    const rows = schedules.filter((s) => s.classId === classId)
    if (rows.length === 0) return

    setSubjectName(rows[0].subject)
    setInstructor(rows[0].instructor)
    setMeetings(
      rows
        .slice()
        .sort((a, b) => a.timeStart.localeCompare(b.timeStart))
        .map((s) => ({
          key: s.id,
          id: s.id,
          day: s.day,
          timeStart: s.timeStart,
          timeEnd: s.timeEnd,
          room: s.room,
          roomType: s.roomType,
        }))
    )
    setEditTargetClassId(classId)
    setMenuOpenIndex(null)
    setIsAddSubOpen(true)
  }

  const byDay = (day: string) =>
    schedules.filter(s => s.day === day).sort((a, b) => a.timeStart.localeCompare(b.timeStart))

const DayCard = ({ day }: { day: string }) => {
    const daySchedules = byDay(day)
    return (
      <div id='scheduleGrid'
      className='flex flex-col   mt-2 pb-2 bg-primary-800
        rounded-lg 3xl:mt-5 dark:bg-[#222631] warm:bg-[#623627]
      border border-white/10
        hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]
        transition-all duration-300
        self-start w-full'>
        <p className='text-white text-center text-[23px] md:text-3xl lg:text-[23px] xl:text-[24px] 2xl:text-[25px] 3xl:text-[30px] uppercase mt-2 font-fustat'>{day}</p>
        <div className='space-y-1 2xl:space-y-2 2xl:px-2  pb-2'>
          {daySchedules.length > 0 ? (
            daySchedules.map((s) => (
              <div key={s.id} className='bg-white dark:bg-[#4E5669] px-2 lg:px-2  mx-2 mb-1 mt-1 rounded-sm relative'>
                <div className='flex flex-row 3xl:py-2  items-center pt-1 gap-2'>
                  <p
                    title={s.subject}
                    className='min-w-0 flex-1 dark:text-white truncate text-[12px] leading-tight md:text-[12px] lg:text-[11px] xl:text-[12px] 2xl:text-[13px] 3xl:text-[20px] font-roboto font-bold text-primary-600'
                  >
                    {s.subject}
                  </p>

                  <div data-note-menu className='relative ml-auto shrink-0'>
                    <button
                    id='scheduleOptionsBtn'
                    className='hover:opacity-50'
                      title='More Options'
                      onClick={() => setMenuOpenIndex(menuOpenIndex === s.id ? null : s.id)}
                    >
                      <img src="subM.png" alt="menu" className='h-[15px] w-[3px] lg:h-[16px] lg:w-[3px] xl:h-[15px] xl:w-[3px] 2xl:h-[15px] 2xl:w-[3px] 3xl:h-[19px] 3xl:w-[4px]  shrink-0 select-none ' onContextMenu={(e) => e.preventDefault()} draggable={false}  />
                    </button>

                    {menuOpenIndex === s.id && (
                      <>
                        <div className='fixed inset-0 z-0' onClick={() => setMenuOpenIndex(null)} />
                       <div className='absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-36 py-1'>
                          <button
                            onClick={() => handleEditOpen(s.classId)}
                            className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 font-semibold'
                          >
                            <img className='w-5 h-5 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false}  src="edit.png" alt="edit icon" />Edit
                          </button>
                          <hr className='my-1 mx-1 border-primary-800 ' />
                          <button
                            onClick={() => {
                              setMenuOpenIndex(null)
                              setPendingDelete({ id: s.id, name: s.subject })
                            }}
                            className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 font-semibold'
                          >
                            <img src="delete.png" alt="delete icon"  className='w-5 h-5 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false}  />Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <p
                  title={`${formatTime(s.timeStart)} - ${formatTime(s.timeEnd)} — ${s.room} [ ${s.roomType} ]`}
                  className='truncate text-[10px] dark:text-white leading-tight md:text-[10px] lg:text-[10px] xl:text-[10px] 2xl:text-[11px] 3xl:text-[16px] font-roboto text-primary-600 '
                >
                  {formatTime(s.timeStart)} - {formatTime(s.timeEnd)} — {s.room} [ {s.roomType} ]
                </p>
                <p
                  title={s.instructor}
                  className='truncate text-[10px] leading-tight lg:text-[10px] xl:text-[10px] 2xl:text-[11px] 3xl:text-[14px] text-gray-600 pb-2'
                >
                  {s.instructor}
                </p>
              </div>
            ))
          ) : (
            <p className='text-white  text-center lg:text-xs 3xl:text-[15px] mt-4 lg:mt-3 mb-5 lg:mb-2 font-fustat'>No scheduled class here.</p>
          )}
        </div>
      </div>
    )
  }

  const isFormEmpty =
  !subjectName.trim() &&
  !instructor.trim() &&
  meetings.length === 1 &&
  !meetings[0].day &&
  !meetings[0].timeStart &&
  !meetings[0].timeEnd &&
  !meetings[0].room.trim() &&
  !meetings[0].roomType
  return (
  <div className='flex h-screen bg-white dark:bg-[#010409] warm:bg-[#FBF1E8]'>
        {/* Sidebar */}
        <div className='lg:p-3 '>
       <Sidebar /> 
      </div>
        <div className='flex-1  flex flex-col overflow-hidden'>

        {/* Top Bar — mobile only */}
        <div className='lg:hidden flex items-center justify-between px-4 sm:px-6 py-2 bg-white dark:bg-[#0A0F15] warm:bg-[#FBF1E8]  top-0 left-0 right-0 z-10 relative'>
          <p className='absolute left-1/2 -translate-x-1/2 font-inter mt-4 font-semibold text-xl warm:text-[#623627] dark:text-white text-[#B3B3B3] uppercase'>Class Schedule</p>
  <button
    id='tour-btn'
    onClick={() => startTour()}
    className='flex flex-col items-center gap-1 ml-auto pt-3
    hover:opacity-80 active:scale-95 transition-all'
    title='Take a Tour'
  >
<div className='w-9 h-9 flex items-center justify-center'>
<img src={needHelpIcon[theme]} alt="?" className='w-12 block mx-auto mt-1 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false} />
</div>
              <p className='text-[9px] text-primary-600 lg:text-primary-600 md:text-primary-600 xl:text-primary-600 2xl:text-primary-600 font-inter font-medium dark:text-white  warm:text-[#623627]'>Need Help?</p>
  </button>
        </div>
        
      <main  className="flex-1  w-full  overflow-auto p-2 px-5 md:px-7  md:py-0 md:pt-0 py-0  lg:p-2 lg:pt-2 2xl:pt-0  pt-1">
        <div className="min-h-screen  w-full flex flex-col">
            <p className='hidden lg:flex justify-center lg:justify-start w-full lg:pl-3 
            font-inter font-semibold text-sm md:text-md lg:text-[10px] xl:text-[12px] 2xl:text-[14px] 3xl:text-[16px] text-[#B3B3B3] uppercase
            mt-2 md:mt-4 lg:mt-1 xl:mt-2 2xl:mt-4 '>Class Schedule</p>
          {/* Header */}
          <div className='flex flex-col md:flex-row lg:flex-row  justify-between items-center w-full'>

              <div className=" hidden  w-full lg:flex flex-col  lg:flex-row md:flex-row justify-center  lg:mb-1 2xl:mb-3 3xl:mb-4
                pl-1 
                lg:justify-end  lg:items-start lg:pr-6 2xl:pr-20 lg:px-2 lg:gap-3 
                md:justify-between md:items-start sm:items-center gap-1 p-2">
                  <button
                    id='clearScheduleBtn'
                    onClick={() => setShowClearModal(true)}
                    disabled={schedules.length === 0}
                    className="bg-[#E2E2E2] drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] text-primary-800 
                    py-1 px-4 rounded-sm 
                    flex items-center gap-1.5
                    font-inter font-black
                    text-[10px] lg:text-[9px]
                    xl:text-[12px] 2xl:text-[14px]
                    3xl:text-[18px]
                    hover:opacity-90 w-auto
                    backdrop-blur-xs
                    hover:-translate-y-1 
                    hover:shadow-[0_2px_5px_rgba(0,0,0,0.5)] warm:bg-[#F9D5C6]
                    transition-all duration-300 uppercase
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    <img src="./crossB.png" alt="" className='w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-5 2xl:h-5 3xl:w-6 3xl:h-6 shrink-0 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false}  />
                      CLEAR ALL schedules
                  </button>
                <button
                  id='addScheduleBtn'
                  onClick={() => { resetForm(); setIsAddSubOpen(true) }}
                  className="bg-[#FEE248]  uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] text-primary-800 
                  py-1 px-4 rounded-sm 
                  flex items-center gap-1.5
                  font-inter font-black warm:bg-[#FBD79A]
                  text-[10px] lg:text-[9px]
                  xl:text-[12px] 2xl:text-[14px]
                  3xl:text-[18px]
                  hover:opacity-90 w-auto
                  backdrop-blur-xs
                  hover:-translate-y-1 
                  hover:shadow-[0_2px_5px_rgba(0,0,0,0.5)]
                  transition-all duration-300"
                >
                  <img src="./addB.png" alt="" className='w-2.5 h-2.5 lg:w-2.5 lg:h-2.5 xl:w-3 xl:h-3 2xl:w-4 2xl:h-4 3xl:w-4.5 3xl:h-4.5 shrink-0 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false}  />
                  Add Schedule
                </button>



              </div>
          </div>

          {/* Add / Edit Class Modal */}
{isAddSubOpen && (
  <div className='fixed inset-0 bg-black/50 flex items-end lg:items-center justify-center z-50 lg:p-4'>
    <div className='bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl w-full lg:max-w-3xl h-[90vh] lg:h-auto lg:max-h-[90vh] flex flex-col'>
      {/* Header */}
      <div className='flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100'>
        <div>
          <h2 className='text-xl xl:text-2xl font-bold text-gray-900'>
            {editTargetClassId ? 'Edit Class Schedule' : 'Add Class Schedule'}
          </h2>
          <p className='text-xs xl:text-sm text-gray-400 mt-1'>
            Create a class that meets on multiple days with different times, rooms, or types.
          </p>
        </div>
        <button
          onClick={() => { setIsAddSubOpen(false); resetForm() }}
          className='text-gray-400 hover:text-gray-600 text-2xl leading-none px-1'
          aria-label='Close'
        >
          ×
        </button>
      </div>

                <div className='overflow-y-auto px-6 py-5 flex-1'>
                  {/* Class Information */}
                  <div className='border border-gray-200 rounded-xl p-4 mb-5'>
                    <p className='text-sm font-bold text-gray-800 mb-3'>Class Information</p>
                    <div className='flex flex-col sm:flex-row gap-4'>
                      <div className='flex-1 flex flex-col'>
                        <label className='text-xs font-semibold text-gray-500 mb-1'>Subject Name *</label>
                        <CleanInput
                          type='text'
                          placeholder='Enter Subject'
                          className={`py-2 px-3 rounded-lg border border-gray-300 dark:bg-white text-sm w-full ${errClass('subjectName')}`}
                          value={subjectName}
                          onChange={(e) => {
                            setSubjectName(e.target.value)
                            if (fieldErrors.subjectName) {
                              setFieldErrors((prev) => {
                                const next = { ...prev }
                                delete next.subjectName
                                return next
                              })
                            }
                          }}
                          aria-invalid={!!fieldErrors.subjectName}
                          aria-describedby={fieldErrors.subjectName ? 'subjectNameError' : undefined}
                        />
                        {fieldErrors.subjectName && (
                          <p id='subjectNameError' className='text-red-500 text-xs mt-1'>
                            {fieldErrors.subjectName}
                          </p>
                        )}
                      </div>
                      <div className='flex-1 flex flex-col'>
                        <label className='text-xs font-semibold text-gray-500 mb-1 '>Teacher / Instructor *</label>
                        <CleanInput
                          type='text'
                          placeholder='Enter Teacher/Instructor Name'
                          className={`py-2 px-3 rounded-lg border border-gray-300  dark:bg-white text-sm w-full ${errClass('instructor')}`}
                          value={instructor}
                          onChange={(e) => setInstructor(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Schedule Meetings */}
                  <div className='border border-gray-200 rounded-xl p-4'>
                    <p className='text-sm font-bold text-gray-800 mb-3'>Schedule Meetings</p>
                    <div className='bg-gray-50 text-gray-500 text-xs rounded-lg px-3 py-2 mb-4'>
                      Add all the days and time slots when this class meets.
                    </div>

                    {fieldErrors.meetings && (
                      <p className='text-red-500 text-xs mb-3'>{fieldErrors.meetings}</p>
                    )}

                    <div className='space-y-3'>
                      {meetings.map((row) => {
                        const rowErrs = rowErrors[row.key]
      
                        const errorMessages = rowErrs
                          ? Array.from(new Set(Object.values(rowErrs)))
                          : []

                        return (
                          <div key={row.key} className='border-b border-gray-100 pb-3 last:border-b-0'>
                            <div className='flex flex-col lg:flex-row lg:flex-wrap lg:items-start gap-2 border rounded-md p-4'>
                              <div className='flex flex-col md:flex-col md:flex-nowrap md:items-start lg:flex-row lg:flex-nowrap lg:items-end gap-2 w-full'>

                              {/* Day */}
                              <div className='flex flex-col gap-1 md:w-full lg:w-32 shrink-0'>
                                <p className='text-xs text-primary-800'>Day *</p>
                                <div className='flex items-center gap-2'>
                                  <span className='w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0' aria-hidden='true' />
                                  <select
                                    aria-label='Select Day'
                                    value={row.day}
                                    onChange={(e) => updateMeetingRow(row.key, 'day', e.target.value)}
                                    className={`border rounded-md  dark:bg-white border-gray-300 text-xs px-1 py-1 w-full ${rowErrClass(row.key, 'day')}`}
                                  >
                                    <option value='' disabled>Day</option>
                                    {days.map((day) => <option key={day} value={day}>{day}</option>)}
                                  </select>
                                    {confirmRemoveKey === row.key ? (
                                      <div className='flex md:hidden items-center gap-2 shrink-0'>
                                        <button
                                          onClick={() => removeMeetingRow(row.key)}
                                          className='text-[11px] font-semibold text-red-500 hover:text-red-600'
                                        >
                                          Confirm
                                        </button>
                                        <button
                                          onClick={() => setConfirmRemoveKey(null)}
                                          className='text-[11px] font-semibold text-gray-400 hover:text-gray-600'
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => setConfirmRemoveKey(row.key)}
                                        className='flex lg:hidden shrink-0 self-center text-gray-400 hover:text-red-500 px-0'
                                        title='Delete this day'
                                      >
                                        <img src="/delete.png" alt="delete" className='w-4 h-4 shrink-0' />
                                      </button>
                                    )}
                                </div>
                              </div>

                              {/* Time Start */}
                              <div className='flex flex-col gap-1 w-full md:w-28 lg:flex-1 lg:min-w-0'>
                                <p className='text-xs text-primary-800'>Time Start *</p>
                                <input
                                  aria-label='Time Start'
                                  type='time'
                                  className={`text-xs rounded-md border dark:bg-white border-gray-300 px-2 py-1 w-full ${rowErrClass(row.key, 'timeStart')}`}
                                  value={row.timeStart}
                                  onChange={(e) => updateMeetingRow(row.key, 'timeStart', e.target.value)}
                                />
                              </div>

                              {/* Time End */}
                              <div className='flex flex-col gap-1 w-full md:w-28 lg:flex-1 lg:min-w-0'>
                                <p className='text-xs text-primary-800'>Time End *</p>
                                <input
                                  aria-label='Time End'
                                  type='time'
                                  className={`text-xs rounded-md border dark:bg-white border-gray-300 px-2 py-1 w-full ${rowErrClass(row.key, 'timeEnd')}`}
                                  value={row.timeEnd}
                                  onChange={(e) => updateMeetingRow(row.key, 'timeEnd', e.target.value)}
                                />
                              </div>

                              {/* Room */}
                              <div className='flex flex-col gap-1 w-full md:w-28 lg:flex-1 lg:min-w-0'>
                                <p className='text-xs text-primary-800'>Room *</p>
                                <CleanInput
                                  type='text'
                                  placeholder='Room'
                                  className={`text-xs rounded-md border dark:bg-white border-gray-300 px-2 py-1 w-full ${rowErrClass(row.key, 'room')}`}
                                  value={row.room}
                                  onChange={(e) => updateMeetingRow(row.key, 'room', e.target.value)}
                                />
                              </div>

                              {/* Type */}
                              <div className='flex flex-col gap-1 w-full md:w-28 lg:flex-1 lg:min-w-0'>
                                <p className='text-xs text-primary-800'>Type *</p>
                                <select
                                  aria-label='Select Room Type'
                                  value={row.roomType}
                                  onChange={(e) => updateMeetingRow(row.key, 'roomType', e.target.value)}
                                  className={`border rounded-md border-gray-300  dark:bg-white text-xs px-2 py-1 w-full ${rowErrClass(row.key, 'roomType')}`}
                                >
                                  <option value='' disabled>Type</option>
                                  {typeRoom.map((room) => <option key={room} value={room}>{room}</option>)}
                                </select>
                              </div>

                              {confirmRemoveKey === row.key ? (
                                <div className='hidden md:flex items-center gap-1 shrink-0 ml-1 pl-2 border-l border-gray-200 pb-1'>
                                  <button
                                    onClick={() => removeMeetingRow(row.key)}
                                    className='text-[11px] font-semibold text-red-500 hover:text-red-600 px-1'
                                    title='Confirm delete — this cannot be undone'
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setConfirmRemoveKey(null)}
                                    className='text-[11px] font-semibold text-gray-400 hover:text-gray-600 px-1'
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmRemoveKey(row.key)}
                                  className='hidden lg:flex items-center justify-center shrink-0 w-7 h-7 ml-1 pl-2 border-l border-gray-200 text-gray-400 hover:text-red-500 transition-colors mb-1'
                                  title='Delete this day'
                                >
                                  <img src="/delete.png" alt="delete" className='w-4 h-4 shrink-0' />
                                </button>
                              )}
                              </div>
                              {errorMessages.length > 0 && (
                              <div className='md:w-full mt-1.5 pl-1 space-y-0.5'>
                                
                                {errorMessages.map((msg, i) => (
                                  <p key={i} className='text-red-500 text-[11px] leading-tight'>
                                    {msg}
                                  </p>
                                ))}
                              </div>
                            )}
                        </div>


                          </div>
                        )
                      })}
                    </div>

                    <button
                      onClick={addMeetingRow}
                      className='mt-4 w-full border border-dashed border-gray-300 rounded-lg py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors'
                    >
                      + Add Another Day
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className='flex items-center justify-between px-6 py-4 border-t border-gray-100'>
                  <button
                    onClick={() => { setIsAddSubOpen(false); resetForm() }}
                    className='text-sm font-semibold text-gray-600 border border-gray-300 rounded-full px-6 py-2 hover:bg-gray-50'
                  >
                    Cancel
                  </button>
                  <div className='flex items-center gap-3'>
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    disabled={isFormEmpty}
                    className='text-sm font-semibold text-gray-600 px-4 py-2 hover:bg-gray-50 rounded-full disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent'
                  >
                    Clear
                  </button>
<button
  onClick={handleSave}
  disabled={
    containsBadWords(subjectName) ||
    containsBadWords(instructor) ||
    meetings.some((m) => containsBadWords(m.room))
  }
  className='bg-gray-900 text-white text-sm font-semibold px-6 py-2 rounded-full hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40'
>
  Save Class
</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {showResetConfirm && (
            <ResetFormModal
              onConfirm={() => { resetForm(); setShowResetConfirm(false) }}
              onCancel={() => setShowResetConfirm(false)}
            />
          )}

          {/* Day Cards */}
          {loading ? (
            <div className='flex-1 flex items-center justify-center text-primary-400 text-xl mt-10'>
              Loading schedules...
            </div>
          ) : (
            <div className='grid px-6 mt-2 lg:mt-0 lg:gap-10 xl:gap-x-12 2xl:gap-x-20 2xl:px-20 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-6 w-full items-start'>
              {days.map((day) => <DayCard key={day} day={day} />)}
            </div>
          )}
        </div>
          {!isAddSubOpen && (
            <ScheduleFab
              onClearAll={() => setShowClearModal(true)}
              onAddSchedule={() => { resetForm(); setIsAddSubOpen(true) }}
              disabled={schedules.length === 0}
            />
          )}

        {/* Soft Delete Modal */}
        {pendingDelete && (
          <SoftDeleteModal
            itemName={pendingDelete.name}
            onConfirm={handleDelete}
            onCancel={() => setPendingDelete(null)}
          />
        )}
        {showClearModal && (
            <ClearScheduleModal
              onConfirm={handleClearAll}
              onCancel={() => setShowClearModal(false)}
            />
          )}

          <button
            id='tour-btn'
            onClick={() => startTour(                             )}
            className='hidden lg:flex fixed bottom-6 right-6 z-50
            flex-col items-center gap-1
            hover:opacity-80 active:scale-95 transition-all
            lg:bottom-8 lg:right-8'
            title='Take a Tour'
          >
            <div className='w-7 h-7 lg:w-7 lg:h-7 2xl:w-10 2xl:h-10 3xl:w-12 3xl:h-12  flex items-center justify-center text-2xl font-bold'>
              <img src={needHelpIcon[theme]} alt="?"  className='w-12 mb-2 block mx-auto mt-1 select-none'  onContextMenu={(e) => e.preventDefault()} draggable={false} />
            </div>  
            <p className='text-[8px] md:text-[8px] text-primary-800  uppercase text-center lg:text-[8px] 2xl:text-[10px] 3xl:text-[11px] dark:text-white  warm:text-[#623627] 
              font-inter font-semibold'>Need Help?</p>         
           </button>
      </main>
      </div>
    </div>
  )
}

export default ClassSchedule