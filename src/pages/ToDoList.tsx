import { useState, useRef, useEffect } from 'react'
import { useTour } from '../hooks/useTour'
import { useFcmRegistration } from '../hooks/useFcmRegistration'
import {
  DndContext,
  useDroppable,
  useDraggable,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { useTasks, type Task, type Status } from '../hooks/useTasks'
import { useTaskNotifications } from '../hooks/useTaskNotification'
import { useTheme, type Theme } from '../context/ThemeContext'
import { CleanInput } from '../components/CleanInput'
import { containsBadWords } from '../utils/contentFilter'


const COLUMNS: { id: Status; label: string }[] = [
  { id: 'todo',        label: 'TO DO' },
  { id: 'in-progress', label: 'IN PROGRESS' },
  { id: 'done',        label: 'DONE' },
]

function getNowISO(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}


function toDisplayFormat(storage: string): string {
  if (!storage) return ''
  const [datePart, timePart] = storage.split('T')
  const [yyyy, mm, dd] = datePart.split('-')
  if (!timePart) return `${mm}/${dd}/${yyyy}`
  const [hStr, mStr] = timePart.split(':')
  let h = parseInt(hStr)
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${mm}/${dd}/${yyyy} ${h}:${mStr} ${ampm}`
}

function toStorageDateOnly(display: string): string {
  const parts = display.split('/')
  if (parts.length !== 3 || parts[2].length !== 4) return ''
  const [mm, dd, yyyy] = parts
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}


function isValidDate(display: string): boolean {
  if (display.length !== 10) return false
  const parts = display.split('/')
  if (parts.length !== 3) return false
  const mm = parseInt(parts[0]), dd = parseInt(parts[1]), yyyy = parseInt(parts[2])
  if (isNaN(mm) || isNaN(dd) || isNaN(yyyy)) return false
  if (yyyy < 2000 || yyyy > 2100) return false
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return false
  const date = new Date(yyyy, mm - 1, dd)
  return date.getFullYear() === yyyy && date.getMonth() === mm - 1 && date.getDate() === dd
}

function buildStorageValue(dateDisplay: string, time: string): string {
  const datePart = toStorageDateOnly(dateDisplay)
  if (!datePart) return ''
  return time ? `${datePart}T${time}` : datePart
}

function getCardStyle(task: Task, nowISO: string): string {
  if (task.status === 'done') return 'border border-2 border-black bg-[#C4EAAD] warm:border-[#623627] dark:border-white  lg:max-h-32 lg:max-w-62 drop-shadow-[0_6px_2px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:shadow-[0_8px_10px_rgba(0,0,0,0.5)] transition-all duration-300'
  if (task.deadline && task.deadline < nowISO) return 'border border-2 border-black bg-[#FF8383] lg:max-h-32 warm:border-[#623627] dark:border-white lg:max-w-62 drop-shadow-[0_6px_2px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:shadow-[0_8px_10px_rgba(0,0,0,0.5)] transition-all duration-300'

  if (task.deadline) {
    const msUntil = new Date(task.deadline).getTime() - Date.now()
    if (msUntil > 0 && msUntil <= 60 * 60 * 1000) {
      return 'bg-amber-300  border border-2 border-black lg:max-h-32 warm:border-[#623627] dark:border-white lg:max-w-62 drop-shadow-[0_6px_2px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:shadow-[0_8px_10px_rgba(0,0,0,0.5)] transition-all duration-300'
    }
  }


  return 'bg-white border border-2 border-black warm:border-[#623627] dark:border-white lg:max-h-32 lg:max-w-62 drop-shadow-[0_6px_2px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:shadow-[0_8px_10px_rgba(0,0,0,0.5)] transition-all duration-300'
}
  function sortByDeadline(a: Task, b: Task): number {
  if (!a.deadline && !b.deadline) return 0
  if (!a.deadline) return 1  
  if (!b.deadline) return -1
  return a.deadline.localeCompare(b.deadline) 
}
// ── Task Modal ────────────────────────────────

function TaskModal({
  title,
  initialName,
  initialDeadline,
  requireDeadline = false,
  onSave,
  onClose,
}: {
  title: string
  initialName: string
  initialDeadline: string
  requireDeadline?: boolean
  saving?: boolean
  onSave: (name: string, deadline: string) => void
  onClose: () => void
}) {
  const nowISO = getNowISO()
  const todayDate = nowISO.split('T')[0]
  const calendarRef = useRef<HTMLInputElement>(null)

  const [initialDateDisplay, initialTime] = (() => {
    if (!initialDeadline) return ['', '00:00']
    const [datePart, timePart] = initialDeadline.split('T')
    const [yyyy, mm, dd] = datePart.split('-')
    return [`${mm}/${dd}/${yyyy}`, timePart ?? '00:00']
  })()

  const [taskName, setTaskName] = useState(initialName)
  const [taskDeadline, setTaskDeadline] = useState(initialDateDisplay)
  const [taskTime, setTaskTime] = useState(initialTime)
  const [dateError, setDateError] = useState('')

  function handleDeadlineChange(value: string) {
    const formatted = formatDateInput(value)
    setTaskDeadline(formatted)
    setDateError('')
    if (formatted.length === 10) {
      if (!isValidDate(formatted)) {
        setDateError('Invalid date — please check month, day and year')
        return
      }
      const storage = buildStorageValue(formatted, taskTime)
      if (storage <= nowISO) setDateError('Deadline must be in the future')
    }
  }

  function handleTimeChange(value: string) {
    setTaskTime(value)
    setDateError('')
    if (taskDeadline.length === 10 && isValidDate(taskDeadline)) {
      const storage = buildStorageValue(taskDeadline, value)
      if (storage <= nowISO) setDateError('Deadline must be in the future')
    }
  }

  function handleCalendarChange(value: string) {
    if (!value) return
    const [yyyy, mm, dd] = value.split('-')
    setTaskDeadline(`${mm}/${dd}/${yyyy}`)
    const storage = buildStorageValue(`${mm}/${dd}/${yyyy}`, taskTime)
    setDateError(storage <= nowISO ? 'Deadline must be in the future' : '')
  }

  const deadlineStorageValue = buildStorageValue(taskDeadline, taskTime)
  const deadlineIsValid =
    isValidDate(taskDeadline) &&
    taskTime.length === 5 &&
    deadlineStorageValue > nowISO

const nameHasBadWords = containsBadWords(taskName)

const canSave =
  taskName.trim() !== '' &&
  !nameHasBadWords &&
  deadlineIsValid &&
  !dateError
  function handleSave() {
    if (!canSave) return
    onSave(taskName.trim(), deadlineStorageValue)
  }

  const calendarValue = isValidDate(taskDeadline) ? toStorageDateOnly(taskDeadline) : ''


return (
    <div
      className="fixed inset-0   bg-black bg-opacity-50 flex justify-center items-center z-50"
    >
      <div
  className="bg-white warm:bg-[#FBF1E8] warm:border-[#623627] warm:border-2 dark:border-2 dark:border-black lg:max-h-[400px] xl:min-h-[450px] 2xl:min-h-[490px] 3xl:min-h-[580px] rounded-2xl p-7 mx-2 w-full lg:max-w-sm xl:max-w-md 2xl:max-w-lg 3xl:max-w-xl max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-center font-bold text-primary-600 
        lg:text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl warm:text-[#623627]
         pt-0">{title}</p>

        <label className="flex font-semibold text-primary-600 text-xl 
       lg:text-sm xl:text-[16px] 2xl:text-lg 3xl:text-2xl warm:text-[#623627]
         py-2">Task *</label>
        <CleanInput
          className="flex border-2 rounded-md border-primary-600 min-w-full my-2 bg-white warm:bg-transparent text-black [color-scheme:light]
          lg:text-sm lg:py-1 lg:rounded-sm lg:my-0
          xl:text-sm xl:py-2 xl:my-0
          2xl:text-[18px] 2xl:py-2 
          3xl:text-2xl 3xl:py-2 warm:text-[#623627]
          py-3 px-3"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          type="text"
          placeholder="Enter Task Name"
          autoFocus
          maxLength={40}
        />

        <div className="flex flex-col gap-1">
          <label className="flex text-primary-800 font-semibold text-xl 
          lg:text-sm lg:py-2
          xl:text-[16px] xl:py-2 warm:text-[#623627]
          2xl:text-lg
          3xl:text-2xl 3xl:py-3
          py-3">Suggested Tasks:</label>
          <div className="flex flex-wrap gap-2">
            {['Prepare report', 'Review', 'Study', 'Plan', 'Research', 'Advance Study', 'Read'].map((s) => (
              <button
                key={s}
                onClick={() => setTaskName(s)}
                className="text-sm px-3 py-1
                lg:text-xs
                xl:text-sm
                2xl:text-[18px]
                3xl:text-[23px]
                3xl:px-5 3xl:py-2
                rounded-full border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white transition-colors warm:text-[#623627]"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <label className="flex text-primary-600 text-xl font-semibold
        lg:text-sm 
        xl:text-[16px]
        2xl:text-lg warm:text-[#623627]
        3xl:text-2xl
        pt-3 gap-1">
          Deadline
          {requireDeadline && <span className="text-red-500">*</span>}
        </label>

        <div className="flex flex-col sm:flex-row  gap-3 3xl:gap-8 my-3">
<div className="relative flex items-center flex-1 ">
  <input
    className={`border-2 rounded-md py-3 px-3 w-full sm:w-36 3xl:w-44 font-mono text-black [color-scheme:light]
    lg:text-sm lg:py-1 lg:rounded-sm
    xl:text-[15px] xl:py-2 warm:text-[#623627]
    2xl:text-[16px]
    3xl:text-lg 
      ${dateError ? 'border-red-400 bg-red-50' : 'border-primary-600 bg-white warm:bg-transparent'}`}
    value={taskDeadline}
    onChange={(e) => handleDeadlineChange(e.target.value)}
    type="text"
    placeholder="MM/DD/YYYY"
    maxLength={10}
  />
  {/* Real date input sits directly over the icon area — tapping it opens the native picker with no JS trigger needed, works on every iOS version */}
  <input
    aria-label="Pick a date"
    ref={calendarRef}
    type="date"
    min={todayDate}
    value={calendarValue}
    onChange={(e) => handleCalendarChange(e.target.value)}
    className="absolute right-0 top-0 w-10 h-full opacity-0 cursor-pointer warm:text-[#623627]"
    tabIndex={-1}
  />
  {/* Decorative icon only — sits underneath, pointer-events-none so taps pass through to the real input above it */}
  <div className="absolute right-1 hover:cursor-pointer text-primary-600 pointer-events-none">
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5  hover:cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  </div>
</div>

          <input
            aria-label="time"
            type="time"
            value={taskTime}
            onChange={(e) => handleTimeChange(e.target.value)}
            className={`border-2 rounded-md py-3 px-3 w-full font-mono text-black [color-scheme:light]
            lg:text-sm lg:py-1 lg:rounded-sm
            xl:text-[15px] xl:py-2 warm:text-[#623627]
            2xl:text-[16px]
            3xl:text-lg
              ${dateError ? 'border-red-400 bg-red-50' : 'border-primary-600 bg-white warm:bg-transparent'}`}
          />
        </div>

        {dateError && <p className="text-red-500 text-sm -mt-2 mb-2">{dateError}</p>}

        <div className="flex flex-row justify-between mb-20  gap-10">
          <button
            onClick={onClose}
            className="flex-1 bg-white border-2 rounded-md font-bold border-primary-600 items-center mt-5
            lg:mt-4 lg:py-1 lg:rounded-sm lg:text-sm
            xl:mt-6 xl:py-2 xl:text-[16px]
            2xl:mt-8 2xl:py-2 2xl:text-lg
            3xl:mt-10 3xl:py-3 3xl:text-xl
            text-primary-600 font-roboto py-2 hover:bg-primary-50"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave }
            className="flex-1 bg-[#FEE248] border-2 rounded-md text-primary-800 font-bold border-primary-800 items-center mt-5 
            lg:mt-4 lg:py-1 lg:rounded-sm lg:text-sm
            xl:mt-6 xl:py-2 xl:text-[16px]
            2xl:mt-8 2xl:py-2 2xl:text-lg
            3xl:mt-10 3xl:py-3 3xl:text-xl
            font-roboto
             hover:bg-primary-50 hover:text-primary-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Soft Delete Modal ─────────────────────────
function SoftDeleteModal({ taskName, onConfirm, onCancel }: { 
  taskName: string
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
          <img src="/delete.png" alt="deleteicon" className='w-7 h-7 select-none'  onContextMenu={(e) => e.preventDefault()} draggable={false} />
          <h2 className='text-lg font-bold text-gray-800'>Move to Recently Deleted?</h2>
        </div>
        <p className='text-sm text-gray-500 mb-1'>
          <span className='font-semibold text-gray-700'>"{taskName}"</span> will be moved to{' '}
          <span className='font-semibold text-primary-800'>Recently Deleted</span>.
        </p>
        <p className='text-xs text-gray-400 mb-6'>
          You can restore it anytime within <span className='font-semibold text-red-400'>30 days</span>, after which it will be permanently deleted.
        </p>
        <div className='flex gap-3 justify-end'>
          <button onClick={onCancel} disabled={confirming}
            className='px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40'>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={confirming}
            className='px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-60'>
            {confirming ? 'Moving...' : 'Move to Trash'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Clear All Modal ───────────────────────────
function ClearAllModal({ count, onConfirm, onCancel }: {
  count: number
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
      <div className='bg-white rounded-2xl lg:rounded-lg shadow-2xl p-6 lg:p-3 xl:p-3 2xl:p-4 3xl:p-5 w-80  lg:w-[250px] xl:w-[280px] 2xl:w-[350px] 3xl:w-[420px]'>
        <div className='flex items-center gap-3 xl:gap-2 2xl:gap-3  mb-1 2xl:mb-2 3xl:mb-3 '>
          <img src="/delete.png" alt="deleteicon" className='w-5 h-5 xl:w-5 xl:h-5 2xl:w-7 2xl:h-7 3xl:w-9 3xl:h-9 select-none'  onContextMenu={(e) => e.preventDefault()} draggable={false} />
          <h2 className='text-sm pt-2 lg:text-xs xl:text-sm 2xl:text-[16px] 3xl:text-[20px] lg:pt-2 font-bold text-gray-800'>Move all tasks to Recently Deleted?</h2>
        </div>
        <p className='text-sm lg:text-[10px] xl:text-[12px] 2xl:text-[15px] 3xl:text-[18px]  text-gray-500 mb-1 3xl:mb-3 '>
          <span className='font-semibold text-gray-700'>{count} task{count !== 1 ? 's' : ''}</span> will be moved to{' '}
          <span className='font-semibold text-primary-800'>Recently Deleted</span>.
        </p>
        <p className='text-xs lg:text-[10px] xl:text-[12px] 2xl:text-[15px] 3xl:text-[18px]  text-gray-400 mb-6 lg:mb-2 xl:mb-5 2xl:mb-6 3xl:mb-8'>
          You can restore any of them within <span className='font-semibold text-red-400'>30 days</span>, after which they'll be permanently deleted.
        </p>
        <div className='flex gap-3 justify-end'>
          <button onClick={onCancel} disabled={confirming}
            className='px-4 py-2 rounded-lg text-sm  lg:text-[10px] xl:text-[12px] 2xl:text-[15px] 3xl:text-[18px] lg:py-1 2xl:py-2  font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40'>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={confirming}
            className='px-4 py-2 rounded-lg text-sm  lg:text-[10px] xl:text-[12px] 2xl:text-[15px] 3xl:text-[18px] lg:py-1 2xl:py-2 font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-60'>
            {confirming ? 'Clearing...' : 'Clear All'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Speed Dial FAB (mobile/md only) ───────────
function TaskFab({ onClearAll, onAddTask, disabled }: {
  onClearAll: () => void
  onAddTask: () => void
  disabled: boolean
}) {
  const [open, setOpen] = useState(false)

  const actions = [
    {
      id: 'fabAddTaskBtn',
      label: 'Add Task',
      icon: '/Add.png',
      onClick: () => { onAddTask(); setOpen(false) },
      className: 'bg-[#FEE248]',
    },
    {
      id: 'fabClearAllBtn',
      label: 'Clear All Tasks',
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
            <img src={action.icon} alt={action.label} className="w-5 h-5 select-none"  onContextMenu={(e) => e.preventDefault()} draggable={false} />
          </button>
        </div>
      ))}

      <button
        id="taskFabBtn"
        onClick={() => setOpen((prev) => !prev)}
        className="w-14 h-14 rounded-full bg-primary-600 active:bg-primary-600 focus:bg-primary-600 shadow-lg flex items-center justify-center transition-transform outline-none"
        style={{
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <img src="/Add.png" alt={open ? 'Close' : 'Open menu'} className="w-6 h-6 invert select-none"  onContextMenu={(e) => e.preventDefault()} draggable={false} />
      </button>
    </div>
  )
}
// ── TaskCard ──────────────────────────────────

function TaskCard({
  task, onDelete, onEdit,
}: {
  task: Task
  onDelete: (id: string, name: string) => void
  onEdit: (task: Task) => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showMenu) return
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [showMenu])

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })

  const nowISO = getNowISO()
  const isOverdue = task.deadline && task.deadline < nowISO && task.status !== 'done'
  const isDone = task.status === 'done'

  const style: React.CSSProperties = transform
    ? {
        opacity: 0.4,
        transition: 'none',
      }
    : {}

  return (
    <div
    id='taskCard'
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`
        rounded-md p-2  2xl:px-3 2xl:py-2 3xl:px-4 3xl:py-3 pt-0  mb-3
        hover:shadow-md
      
        w-full select-none relative
        ${getCardStyle(task, nowISO)}
        ${isDragging ? 'cursor-grabbing' : ''}
        ${showMenu ? 'z-30' : 'z-0'}
      `}
    >
      <div {...listeners} className="cursor-grab active:cursor-grabbing">
        <div className='flex justify-end text-primary-800 font-medium font-fustat text-sm lg:text-[8px] xl:text-[10px] 2xl:text-[12px] 3xl:text-[14px]'>
          <p>{new Date(task.createdAt).toLocaleDateString('en-US', {
            month: '2-digit', day: '2-digit', year: 'numeric',
          })}</p>
        </div>
        <div className="flex justify-between items-start">
          <p className={`font-medium font-fustat overflow-hidden text-ellipsis lg:text-[12px] xl:text-[14px] 2xl:text-[16px] 3xl:text-[18px] ${isDone ? 'text-green-700 line-through' : isOverdue ? 'text-black' : 'text-primary-800'}`}>
            {task.name}
          </p>
        </div>
        {task.deadline && (
          <p className={`text-sm font-fustat font-medium lg:text-[8px] xl:text-[9px] 2xl:text-[10px] 3xl:text-[11px] mt-1 ${isDone ? 'text-primary-800' : isOverdue ? 'text-black font-semibold' : 'text-primary-800'}`}>
            {isOverdue ? 'Past Deadline: ' : 'Deadline: '}
            {toDisplayFormat(task.deadline)}
          </p>
        )}
      </div>

      <div className="absolute bottom-1 right-3">
        <button
        id='taskOptionsBtn'
          title='More Options'
          onClick={() => setShowMenu((prev) => !prev)}
          className="text-primary-800 hover:text-primary-800 text-lg 2xl:text-2xl"
        >
          ⋮
        </button>
        {showMenu && (
          <div ref={menuRef} className='absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-36 py-1'>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => { onEdit(task); setShowMenu(false) }}
              className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-800 hover:bg-primary-50 font-semibold'
            >
              <img className='w-5 h-5 select-none'  onContextMenu={(e) => e.preventDefault()} draggable={false} src="edit.png" alt="edit icon" />Edit
            </button>
            <hr className='my-1 border-gray-100' />
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => { onDelete(task.id, task.name); setShowMenu(false) }}
              className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-800 hover:bg-red-50 font-semibold'
            >
              <img src="delete.png" alt="delete icon" className='w-5 h-5' />Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Drag Overlay Card 

function DragCard({ task }: { task: Task }) {
  const nowISO = getNowISO()
  const isOverdue = task.deadline && task.deadline < nowISO && task.status !== 'done'
  const isDone = task.status === 'done'
  return (
    <div className={`rounded-md p-2 2xl:px-3 2xl:py-2 3xl:px-4 3xl:py-3 pt-0 mb-3 w-full select-none relative shadow-xl rotate-1 scale-105 ${getCardStyle(task, nowISO)}`}>
      <div className='flex justify-end text-primary-800 font-medium font-fustat text-sm lg:text-[8px] xl:text-[10px] 2xl:text-[12px] 3xl:text-[14px]'>
        <p>{new Date(task.createdAt).toLocaleDateString('en-US', {
          month: '2-digit', day: '2-digit', year: 'numeric',
        })}</p>
      </div>
      <div className="flex justify-between items-start">
        <p className={`font-medium font-fustat overflow-hidden text-ellipsis lg:text-[12px] xl:text-[14px] 2xl:text-[16px] 3xl:text-[18px] ${isDone ? 'text-green-700 line-through' : isOverdue ? 'text-primary-50' : 'text-primary-800'}`}>
          {task.name}
        </p>
      </div>
      {task.deadline && (
        <p className={`text-sm font-fustat font-medium lg:text-[8px] xl:text-[9px] 2xl:text-[10px] 3xl:text-[11px] mt-1 ${isDone ? 'text-primary-800' : isOverdue ? 'text-primary-800 font-semibold' : 'text-primary-800'}`}>
          {isOverdue ? 'Past Deadline: ' : 'Deadline: '}
          {toDisplayFormat(task.deadline)}
        </p>
      )}
    </div>
  )
}
// ── Column ────────────────────────────────────

function Column({
  id, label, tasks, onDelete, onEdit, collapsed, onToggleCollapse,
}: {
  id: Status
  label: string
  tasks: Task[]
  onDelete: (id: string, name: string) => void
  onEdit: (task: Task) => void
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
    id='todoColumns'
      ref={setNodeRef}
      className={`
        w-full lg:flex-1
        md:px-32 
        flex flex-col items-center p-4 py-0 pt-4 md:py-0 md:pt-3 sm:p-6 lg:px-10 2xl:px-16 3xl:px-20 lg:p-0 lg:pt-0 lg:pb-5 rounded-3xl 
        transition-colors duration-200
        ${collapsed ? 'min-h-0' : 'min-h-[300px]'}
        ${isOver ? 'bg-primary-50 dark:bg-[#222631] warm:bg-[#FCEEE9]' : ''}
      `}
    >
      <div className="bg-primary-800  dark:bg-[#222631] warm:bg-[#623627]
      shadow-[0_0px_5px_rgba(0,0,0,.3)]
      max-w-full w-full p-3 flex items-center justify-between">
        <p className="text-white pl-5 lg:pl-0 text-xl lg:text-sm 2xl:text-lg 3xl:text-xl lg:text-center text-start font-semibold flex-1">{label}</p>
        <button
        id='colCollapseBtn'
          onClick={onToggleCollapse}
          className="lg:hidden text-white ml-2 text-xl font-bold"
          aria-label={collapsed ? 'Expand column' : 'Collapse column'}
        >
          {collapsed
            ? <img className='w-5 h-5 select-none'  onContextMenu={(e) => e.preventDefault()} draggable={false} src="arrowDown.png" alt="" />
            : <img className='h-5 w-5 select-none'  onContextMenu={(e) => e.preventDefault()} draggable={false} src='arrowUp.png' alt='' />}
        </button>
      </div>

      <div

        style={{ gridTemplateRows: collapsed ? '0fr' : '1fr' }}
        className="grid  transition-all lg:px-0 md:min-px-15 duration-300 ease-in-out lg:!grid-rows-[1fr] w-full"
      >
        <div className={`min-h-0 flex flex-col items-center w-full mt-4 transition-opacity duration-300
          ${collapsed ? 'opacity-0 lg:opacity-100' : 'opacity-100'}`}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={onDelete} onEdit={onEdit} />
          ))}
          {tasks.length === 0 && (
            <div className={`w-full border-2 border-dashed rounded-xl p-6 mt-2 text-center dark:text-white
              transition-colors duration-200
              ${isOver ? 'border-primary-400 text-primary-400' : 'border-gray-200 text-gray-300 '}`}
            >
              {isOver ? 'Drop here' : 'No tasks yet'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


// ── Main Page ─────────────────────────────────

function ToDoList() {
  const { user } = useAuth()
const { theme } = useTheme()
  const { tasks, loading, addTask, updateTask, updateTaskStatus, deleteTask } = useTasks(user)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [confirmingClearAll, setConfirmingClearAll] = useState(false)
  const [clearingAll, setClearingAll] = useState(false)

const needHelpIcon: Record<Theme, string> = {
  light: '/needhelp.png',
  dark: '/needhelp-dark.png',
  warm: '/needhelp-warm.png',
}
  useTaskNotifications(tasks)
  useFcmRegistration(user)

  const [collapsedCols, setCollapsedCols] = useState<Record<Status, boolean>>({
    'todo': false,
    'in-progress': false,
    'done': false,
  })

  const { startTour } = useTour(
    'todolist',
    false,
    () => {},   
    () => {},
    user
)

  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 60 * 1000)
    return () => clearInterval(interval)
  }, [])



  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    })
  )

  function handleToggleCollapse(id: Status) {
    setCollapsedCols((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveTaskId(event.active.id as string)
  }

  function handleDragOver(event: DragEndEvent) {
    const { over } = event
    if (!over) return
    const overId = over.id as Status
    if (window.innerWidth < 1024 && collapsedCols[overId]) {
      setCollapsedCols((prev) => ({ ...prev, [overId]: false }))
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTaskId(null)
    const { active, over } = event
    if (!over) return
    const taskId = active.id as string
    const newStatus = over.id as Status
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return
    updateTaskStatus(taskId, newStatus)
  }

  async function handleAddSave(name: string, deadline: string) {
    setIsAddModalOpen(false) 
    addTask(name, deadline)   
  }

  async function handleEditSave(name: string, deadline: string) {
    if (!editingTask) return
    setEditingTask(null)    
    updateTask(editingTask.id, { name, deadline })  
  }

  function handleDeleteClick(id: string, name: string) {
    setPendingDelete({ id, name })
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    await deleteTask(pendingDelete.id)
    setPendingDelete(null)
  }

  async function handleClearAllConfirm() {
    if (clearingAll) return
    setClearingAll(true)
    await Promise.all(tasks.map((t) => deleteTask(t.id)))
    setClearingAll(false)
    setConfirmingClearAll(false)
  }

  const activeTask = activeTaskId ? tasks.find((t) => t.id === activeTaskId) : null

  return (
    <div className='h-screen w-full  overflow-hidden dark:bg-[#010409] warm:bg-[#FBF1E8] bg-white'>
      <div className='flex h-full'>
        {/* Sidebar */}
        <div className='lg:p-3 '>
          <Sidebar
          />
        </div>
        

        {/* Right of sidebar */}
        <div className='flex-1  flex flex-col overflow-hidden'>

        {/* Top Bar — mobile only */}
        <div className='lg:hidden flex items-center justify-between px-4 sm:px-6 py-2 bg-white dark:bg-[#010409] warm:bg-[#FBF1E8] top-0 left-0 right-0 z-10 relative'>
          <p className='absolute left-1/2 -translate-x-1/2 font-inter mt-4 font-semibold text-xl text-[#B3B3B3]  dark:text-white warm:text-[#623627] uppercase'>To do list</p>
            <button
            id='tour-btn'
              onClick={() => startTour()}
              className='flex flex-col items-center gap-1 ml-auto pt-3
              hover:opacity-80 active:scale-95 transition-all'
              title='Take a Tour'
            >
<div className='w-9 h-9 flex items-center justify-center'>
  <img
    src={needHelpIcon[theme]}
    alt="?"
    className='w-9 h-9 object-contain select-none'
    onContextMenu={(e) => e.preventDefault()}
    draggable={false}
  />
</div>
              <p className='text-[9px] text-primary-600 lg:text-primary-600 md:text-primary-600 xl:text-primary-600 2xl:text-primary-600 font-inter font-medium dark:text-white  warm:text-[#623627]'>Need Help?</p>
            </button>
        </div>

    <TaskFab
      onClearAll={() => setConfirmingClearAll(true)}
      onAddTask={() => setIsAddModalOpen(true)}
      disabled={tasks.length === 0}
    />

    {pendingDelete && (
      <SoftDeleteModal
        taskName={pendingDelete.name}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    )}

    {confirmingClearAll && (
      <ClearAllModal
        count={tasks.length}
        onConfirm={handleClearAllConfirm}
        onCancel={() => setConfirmingClearAll(false)}
      />
    )}
    

      <main  className="flex-1   w-full overflow-auto p-2 px-5 md:px-7 md:py-0 md:pt-0 py-0  lg:p-2 lg:pt-2  pt-1">
        <div className="min-h-screen  w-full flex flex-col">
          <p className='hidden lg:flex justify-center lg:justify-start w-full lg:pl-3 
            font-inter font-semibold text-sm md:text-md lg:text-[10px] xl:text-[12px] 2xl:text-[14px] 3xl:text-[16px] text-[#B3B3B3] uppercase
            mt-2 md:mt-4 lg:mt-1 xl:mt-2 2xl:mt-3 
            dark:text-white warm:text-[#623627] 
            '>To do list</p>

          <div className=" hidden  w-full lg:flex flex-col  lg:flex-row md:flex-row justify-center 
          pl-1   
          lg:justify-end  lg:items-start lg:pr-10 2xl:pr-16 3xl:pr-20 lg:px-2 lg:gap-3
           md:justify-between md:items-start sm:items-center gap-1 p-2">
            <hr className='lg:hidden md:hidden w-full border-t border-[#E9E9E9] warm:border-[#623627]' />

            <button
            id='clearAllBtn'
              onClick={() => setConfirmingClearAll(true)}
              disabled={tasks.length === 0}
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
              hover:shadow-[0_2px_5px_rgba(0,0,0,0.5)]
              transition-all duration-300
              disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <img src="./crossB.png" alt="" className='w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-5 2xl:h-5 3xl:w-6 3xl:h-6 shrink-0 select-none'  onContextMenu={(e) => e.preventDefault()} draggable={false} />
               CLEAR ALL TASKS
            </button>
            <button
            id='newTaskBtn'
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#FEE248] uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] text-primary-800 
              py-1 px-4 rounded-sm 
              flex items-center gap-1.5
              font-inter font-black
              text-[10px] lg:text-[9px]
              xl:text-[12px] 2xl:text-[14px]
              3xl:text-[18px]
              hover:opacity-90 w-auto
              backdrop-blur-xs
              hover:-translate-y-1 
              hover:shadow-[0_2px_5px_rgba(0,0,0,0.5)]
              transition-all duration-300
              disabled:opacity-40 disabled:cursor-not-allowed"

            >
            <img src="./addB.png" alt="" className='w-2.5 h-2.5 lg:w-2.5 lg:h-2 xl:w-3 xl:h-2.5 2xl:w-3 2xl:h-3 3xl:w-4.5 3xl:h-4.5 shrink-0 select-none'  onContextMenu={(e) => e.preventDefault()} draggable={false} />
              New Task
            </button>
          </div>
<hr className="hidden lg:block mt-3 w-[75vw] mx-auto border-t border-[#E9E9E9] warm:border-[#623627]" />


<div className='flex items-center justify-center gap-4 xl:gap-6 2xl:gap-8 mt-3 mb-2'>
  <div className='flex items-center gap-1.5'>
    <span className='w-3 h-3 xl:w-3.5 xl:h-3.5 rounded-sm bg-white border border-1 border-black shrink-0' />
    <p className='text-[10px] xl:text-[11px] 2xl:text-[12px] font-inter font-medium text-primary-800 dark:text-white'>Upcoming</p>
  </div>
  <div className='flex items-center gap-1.5'>
    <span className='w-3 h-3 xl:w-3.5 xl:h-3.5 rounded-sm bg-amber-300 border border-1 border-black shrink-0' />
    <p className='text-[10px] xl:text-[11px] 2xl:text-[12px] font-inter font-medium text-primary-800 dark:text-white'>Due within 1 hour</p>
  </div>
  <div className='flex items-center gap-1.5'>
    <span className='w-3 h-3 xl:w-3.5 xl:h-3.5 rounded-sm bg-[#FF8383] border border-1 border-black shrink-0' />
    <p className='text-[10px] xl:text-[11px] 2xl:text-[12px] font-inter font-medium text-primary-800 dark:text-white'>Past deadline</p>
  </div>
  <div className='flex items-center gap-1.5'>
    <span className='w-3 h-3 xl:w-3.5 xl:h-3.5 rounded-sm bg-[#C4EAAD] border border-1 border-black shrink-0' />
    <p className='text-[10px] xl:text-[11px] 2xl:text-[12px] font-inter font-medium text-primary-800 dark:text-white'>Done</p>
  </div>
</div>
          {isAddModalOpen && (
            <TaskModal
              title="ADD A TASK"
              initialName=""
              initialDeadline=""
              requireDeadline
              onSave={handleAddSave}
              onClose={() => setIsAddModalOpen(false)}
            />
          )}

          {editingTask && (
            <TaskModal
              title="EDIT TASK"
              initialName={editingTask.name}
              initialDeadline={editingTask.deadline ?? ''}
              requireDeadline
              onSave={handleEditSave}
              onClose={() => setEditingTask(null)}
            />
          )}

          {loading ? (
            <div className="flex-1 flex items-center  justify-center text-primary-400 text-xl mt-10">
              Loading your tasks...
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              autoScroll={{ enabled: true, threshold: { x: 0, y: 0.2 } }}
            >
              <div id='todoColumns'
              className="w-full  flex flex-col lg:flex-row h-auto lg:min-h-screen mt-0 md:mt-0 lg:mt-2  rounded-3xl">
                {COLUMNS.map((col) => (
                  <Column
                    key={col.id}
                    id={col.id}
                    label={col.label}
                    tasks={tasks.filter((t) => t.status === col.id).sort(sortByDeadline)}
                    onDelete={handleDeleteClick}
                    onEdit={setEditingTask}
                    collapsed={collapsedCols[col.id]}
                    onToggleCollapse={() => handleToggleCollapse(col.id)}
                  />
                ))}
              </div>

              <DragOverlay dropAnimation={null}>
                {activeTask ? (
                  <DragCard task={activeTask} />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}

        </div>
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
    </div>
  )
}

export default ToDoList