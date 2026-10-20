import { useState, useRef, useEffect, useMemo } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { useNotes, type Note } from '../hooks/useNotes'
import { useClassSched } from '../hooks/useClassSched'
import { useTour } from '../hooks/useTour'
import NoteEditor from '../components/NoteEditor'
import { useCategories, type Category } from '../hooks/useCategories'
import { useAutosaveNote } from '../hooks/useAutosaveNote'
import { useTheme, type Theme } from '../context/ThemeContext'
import { containsBadWords } from '../utils/contentFilter'
import { CleanInput } from '../components/CleanInput'
// Notes are stored as HTML (from the rich-text editor). This converts them to
// plain text for card previews and .txt downloads.
function htmlToPlainText(html: string): string {
  if (!html) return ''
  // Put a space between blocks so "<p>a</p><p>b</p>" becomes "a b", not "ab"
  const spaced = html
    .replace(/<\/(p|h[1-6]|li|tr|div)>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
  const doc = new DOMParser().parseFromString(spaced, 'text/html')
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

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
          <img src="/delete.png" alt="deleteicon" className='w-7 h-7 select-none'  onContextMenu={(e) => e.preventDefault()} draggable={false} />
          <h2 className='text-lg font-bold text-gray-800'>Move to Recently Deleted?</h2>
        </div>
        <p className='text-sm text-gray-500 mb-1'>
          <span className='font-semibold text-gray-700'>"{itemName}"</span> will be moved to{' '}
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

function DiscardNoteModal({ onConfirm, onCancel }: {
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
    <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4'>
        <h2 className='text-lg font-bold text-gray-800 mb-2'>Discard this note?</h2>
        <p className='text-sm text-gray-500 mb-6'>
          This note hasn't been kept — it will be deleted and this can't be undone.
        </p>
        <div className='flex gap-3 justify-end'>
          <button
            onClick={onCancel}
            disabled={confirming}
            className='px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40'
          >
            Keep Editing
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className='px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-60'
          >
            {confirming ? 'Discarding...' : 'Discard'}
          </button>
        </div>
      </div>
    </div>
  )
}
const needHelpIcon: Record<Theme, string> = {
  light: '/needhelp.png',
  dark: '/needhelp-dark.png',
  warm: '/needhelp-warm.png',
}
function Notes() {
    const { theme } = useTheme()
  const { user } = useAuth()
  const { notes, loading, addNote, updateNote, deleteNote } = useNotes(user)
  const { categories, addCategory, deleteCategory } = useCategories(user)
  const { schedules } = useClassSched(user)
  const schedSubjects = useMemo(() => schedules.map((s) => s.subject), [schedules])

  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const [deleteSubjectConfirm, setDeleteSubjectConfirm] = useState<Category | null>(null)
  const [confirmDownload, setConfirmDownload] = useState<Note | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState(false)



  const { startTour } = useTour(
    'notes',
    false,
    () => {},
    () => {},
    user
  )

  function handleSubjectDelete(category: Category) {
    const affectedNotes = notes.filter((n) => n.subject === category.name)
    affectedNotes.forEach((n) => updateNote(n.id, { subject: 'Uncategorized' }))
    deleteCategory(category.id)
    if (selectedSubject === category.name) setSelectedSubject('All Categories')
    setDeleteSubjectConfirm(null)
  }

  // Notes autosave silently — closing is just "close", nothing to discard.
function handleCloseAttempt() {
  if (noteHasBadWords) return   // stay open; the warning explains why
  autosave.flush()
  closeNoteModal()
}

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false)
  const [subjectName, setSubjectName] = useState('')
  const [subjectError, setSubjectError] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [selectedSubject, setSelectedSubject] = useState('All Categories')
  const [searchQuery, setSearchQuery] = useState('')
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('edit')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteSubject, setNoteSubject] = useState('Uncategorized')
  const [noteContent, setNoteContent] = useState('')
  const [modalTime, setModalTime] = useState({ date: '', time: '' })

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const autosave = useAutosaveNote(user, addNote, updateNote)

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
      const clickedInsideMenu = Array.from(
        document.querySelectorAll('[data-note-menu]')
      ).some((el) => el.contains(e.target as Node))
      if (!clickedInsideMenu) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  function openSubjectModal() {
    setSubjectName('')
    setSubjectError('')
    setIsSubjectModalOpen(true)
  }

  function closeSubjectModal() {
    setIsSubjectModalOpen(false)
    setSubjectError('')
  }

 const BAD_WORD_MSG = "Inappropriate language isn't allowed."

function handleSubjectNameChange(value: string) {
  setSubjectName(value)
  setSubjectError(containsBadWords(value) ? BAD_WORD_MSG : '')
}

function handleSubjectSave() {
  const trimmed = subjectName.trim()
  if (trimmed === '') return

  if (containsBadWords(trimmed)) {
    setSubjectError(BAD_WORD_MSG)
    return
  }

  const isDuplicate = allSubjects.some((s) => s.toLowerCase() === trimmed.toLowerCase())
  if (isDuplicate) {
    setSubjectError('This category already exists.')
    return
  }

  addCategory(trimmed)
  setSubjectName('')
  setSubjectError('')
  setIsSubjectModalOpen(false)
  setIsDropdownOpen(true)
}

  function getSuggestedCategories() {
    // Suggest base names derived from your existing categories/class subjects,
    // e.g. "Elective 2" and "Elective 3" both suggest "Elective".
    const baseNames = Array.from(
      new Set(
        allSubjects.map((s) => s.replace(/\s+\d+$/, '').trim())
      )
    )

    return baseNames.filter((name) => name !== '')
  }

  function openNoteModal() {
    // Opens a blank, immediately-editable note. Nothing is created in
    // Firestore yet — autosave silently creates the doc on first keystroke.
    setSelectedNote(null)
    setModalMode('edit')
    const now = new Date()
    setModalTime({
      date: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    })
    const initialSubject = selectedSubject !== 'All Categories' ? selectedSubject : 'Uncategorized'
    setNoteTitle('')
    setNoteSubject(initialSubject)
    setNoteContent('')
    autosave.startNew(initialSubject)
    setIsNoteModalOpen(true)
  }

  function openViewModal(note: Note) {
    setSelectedNote(note)
    setModalMode('view')
    setModalTime({
      date: new Date(note.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      time: new Date(note.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    })
    setIsNoteModalOpen(true)
  }

  function openEditModal(note: Note) {
    setSelectedNote(note)
    setModalMode('edit')
    setModalTime({
      date: new Date(note.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      time: new Date(note.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    })
    setNoteTitle(note.title)
    setNoteSubject(note.subject)
    setNoteContent(note.content)
    autosave.startExisting(note.id, { title: note.title, subject: note.subject, content: note.content })
    setIsNoteModalOpen(true)
  }

  function closeNoteModal() {
    setIsNoteModalOpen(false)
    setSelectedNote(null)
    setCancelConfirm(false)
  }

  // Only reachable for a brand-new note (selectedNote === null) — deletes
  // the doc autosave already created in Firestore and closes without saving.
  async function handleCancelNewNote() {
    const idToDelete = autosave.cancelDraft()
    if (idToDelete) {
      await deleteNote(idToDelete)
    }
    setCancelConfirm(false)
    closeNoteModal()
  }

  // Every title/subject/content edit flows through here — updates local
  // state for the UI and hands the merged draft to autosave in one call.
function handleFieldChange(next: Partial<{ title: string; subject: string; content: string }>) {
  const merged = {
    title: next.title ?? noteTitle,
    subject: next.subject ?? noteSubject,
    content: next.content ?? noteContent,
  }
  if (next.title !== undefined) setNoteTitle(next.title)
  if (next.subject !== undefined) setNoteSubject(next.subject)
  if (next.content !== undefined) setNoteContent(next.content)

  // Keep showing what the user typed, but don't save it until it's clean.
  if (containsBadWords(merged.title) || containsBadWords(htmlToPlainText(merged.content))) return

  autosave.onFieldChange(merged)
}

  function downloadNote(note: Note) {
    const text = [
      `Title: ${note.title}`,
      `Subject: ${note.subject}`,
      `Date: ${new Date(note.createdAt).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })}`,
      '',
      htmlToPlainText(note.content),
    ].join('\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${note.title}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filteredNotes = notes
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((n) => selectedSubject === 'All Categories' || n.subject === selectedSubject)
    .filter((n) => n.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const displayTitle   = modalMode === 'view' ? (selectedNote?.title   ?? '') : noteTitle
  const displaySubject = modalMode === 'view' ? (selectedNote?.subject ?? 'Uncategorized') : noteSubject
  const displayContent = modalMode === 'view' ? (selectedNote?.content ?? '') : noteContent
  const isReadOnly     = modalMode === 'view'
const noteHasBadWords =
  modalMode === 'edit' &&
  (containsBadWords(noteTitle) || containsBadWords(htmlToPlainText(noteContent)))

  const allSubjects = Array.from(
    new Set([
      ...categories.map((c) => c.name.trim()),
      ...schedules.map((s) => s.subject.trim()),
    ])
  )

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    await deleteNote(pendingDelete.id)
    setPendingDelete(null)
  }


  return (
  <div className='flex h-screen bg-white dark:bg-[#010409] warm:bg-[#FBF1E8]'>
          <div className='lg:p-3 '>
        <Sidebar />        
      </div>
      
 {/* Top App Bar — mobile only */}
<div className='lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-1 py-3 bg-white warm:bg-[#FBF1E8] dark:bg-[#0A0F15] dark:text-white shadow-sm gap-2'>
  <p className='absolute left-1/2 -translate-x-1/2 font-inter mt-4 font-semibold text-xl text-[#B3B3B3] uppercase warm:text-[#623627]'>
    Notes
  </p>
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

<div className='lg:hidden h-[72px]'  />

      <main  className="flex-1  mt-24 lg:mt-2  w-full overflow-auto p-2 px-5 md:px-7 md:py-0 md:pt-0 py-0  lg:p-2 lg:pt-2  pt-1">
        <div className='min-h-screen flex flex-col'>

          <div className='w-full flex  flex-col lg:flex-row gap-1'>
            {/* ── Notes Area ── */}
            <div className='flex-1 min-w-0  '>

              <div className='hidden lg:flex flex-col items-end w-full pl-3 pr-2
                mt-2 md:mt-4 lg:-mt-1 xl:mt-0 2xl:mt-0 gap-2'>
                <p className='self-start font-inter   font-semibold text-sm md:text-md lg:text-[10px] xl:text-[12px] 2xl:text-[14px] 3xl:text-[16px] text-[#B3B3B3] uppercase'>
                  Notes
                </p>

                {/* Search Bar */}
                <div id='notesSearchBar' className='relative mr-5'>
                  <CleanInput
                  id='notesSearchBar'
                    type='text'
                    placeholder='Search'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64    border-primary-800 warm:border-[#623627] rounded-md
                      py-2 pl-3 pr-8  text-md
                      text-[10px] lg:text-[8px] xl:text-[10px] 2xl:text-[12px]
                      font-inter text-primary-800 border-2 placeholder:text-primary-800  dark:text-white dark:bg-[#657084]  dark:placeholder:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                      transition-all duration-200"
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 lg:w-3 lg:h-3 xl:w-3.5 xl:h-3.5 2xl:w-4 2xl:h-4 text-primary-800 dark:text-white pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className='absolute right-8 top-1/2 -translate-y-1/2 text-primary-600 font-bold '
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className='flex lg:hidden flex-col gap-3 px-2  mt-3'>
                {/* Search bar */}
                <div 
                className='relative w-full '>
                  <CleanInput
                  id='notesSearchBarMobile'
                    type='text'
                    placeholder='Search'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='w-full border-2 border-primary-800 warm:border-[#623627] rounded-md py-3 pl-4 pr-10  dark:bg-[#657084] dark:text-white dark:placeholder:text-white text-sm font-inter text-primary-800 placeholder:text-primary-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200'  
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-800 pointer-events-none  dark:text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className='absolute right-9 top-1/2 -translate-y-1/2 text-primary-600 font-bold'
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className='flex items-center gap-3'>
                  <button
                    id='addSubjectBtnMobile'
                    aria-label='add Sub'
                    onClick={openSubjectModal}
                    className='flex-shrink-0 h-12 w-12 flex items-center justify-center bg-[#FEE248] dark:bg-transparent dark:border-white dark:border dark:text-white  text-primary-800 font-bold rounded-md'
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>

                  <div className='relative flex-1' ref={dropdownRef}>
                    <button
                    id='subjectDropdown'
                      onClick={() => setIsDropdownOpen((prev) => !prev)}
                      className='flex justify-between items-center w-full border-2 border-primary-600 rounded-md px-4 py-3 text-primary-600 font-bold text-sm dark:bg-white'
                    >
                      <span className='truncate'>{selectedSubject === 'All Categories' ? 'All Categories' : selectedSubject}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isDropdownOpen && (
                      <div  className='absolute  top-full left-0 mt-2 w-full bg-white border rounded-md shadow-md z-50 max-h-64 overflow-y-auto'>
<button
  className={`block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm font-semibold
    ${selectedSubject === 'All Categories' ? 'bg-primary-50 text-primary-600' : 'text-primary-600'}`}
  onClick={() => { setSelectedSubject('All Categories'); setIsDropdownOpen(false) }}
>
  All Categories
</button>
<button
  className={`block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm font-semibold
    ${selectedSubject === 'Uncategorized' ? 'bg-primary-50 text-primary-600' : 'text-primary-600'}`}
  onClick={() => { setSelectedSubject('Uncategorized'); setIsDropdownOpen(false) }}
>
  Uncategorized
</button>
{allSubjects.map((subject, index) => (

                          <div
                          id='subjectDropdown'
                            key={index}
                            className={`flex items-center justify-between px-3 py-2 hover:bg-gray-100
                              ${selectedSubject === subject ? 'bg-primary-50' : ''}`}
                          >
                            <button
                              className='flex-1 text-left text-sm truncate font-semibold text-primary-600'
                              onClick={() => { setSelectedSubject(subject); setIsDropdownOpen(false) }}
                            >
                              {subject}
                            </button>
                             {!schedSubjects.includes(subject) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const category = categories.find((c) => c.name === subject)
                                  if (category) setDeleteSubjectConfirm(category)
                                }}
                                className='ml-2 text-primary-600 hover:text-red-500 font-bold text-xs flex-shrink-0'
                                aria-label={`Delete ${subject}`}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <hr className=' lg:hidden w-full border-t lg:mt-6 lg:mb-6 border-2 my-3  warm:border-[#623627]' />


              {loading ? (
                <div className='flex-1 flex items-center justify-center text-primary-400 text-xl mt-3'>
                  Loading notes...
                </div>
              ) : (
                <div className='grid grid-cols-2 lg:flex mb-5 lg:flex-row lg:flex-wrap lg:justify-start mt-3 lg:items-start gap-4 lg:py-2 px-2'>
                  <button
                    id='newNoteBtnMobile'
                    onClick={openNoteModal}
                    className='flex lg:hidden 
                    shadow-[0_3px_5px_rgba(0,0,0,.5)]
                    hover:opacity-80 w-36 lg:w-44 h-36 lg:h-44 
                    hover:shadow-[2_10px_4px_rgba(0,0,0,1)]
                    items-center justify-center  px-12 py-10 lg:mt-3  rounded-xl bg-[#FEE248] dark:bg-transparent dark:border-white dark:border dark:text-white font-bold font-roboto text-2xl text-black'
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg> 
                  </button>

                  <button
                    id='newNoteBtnDesktop'
                    onClick={openNoteModal}
                    className='hidden lg:flex 
                    shadow-[0_3px_5px_rgba(0,0,0,.5)]
                    hover:opacity-80 w-36  2xl:w-52 2xl:h-44  lg:mr-8 2xl:mr-0 3xl:mr-4
                    hover:shadow-[2_10px_4px_rgba(0,0,0,1)]
                    items-center justify-center  px-12 py-8 lg:mt-3  rounded-xl bg-[#FEE248]  dark:bg-transparent dark:border-white dark:border dark:text-white font-bold font-roboto text-7xl text-black'
                  >
                    +
                  </button>

                  {/* ── Note Cards ── */}
                  {filteredNotes.map((note) => (
                    <div
                      id='notesGrid'
                      key={note.id}
                      onClick={() => openViewModal(note)}
                      className='relative bg-white border-2 dark:bg-[#657084] border-primary-800 warm:border-[#623627]  rounded-xl p-5 w-full lg:w-44  lg:min-h-44  2xl:w-52 3xl:w-56 2xl:min-h-48 flex flex-col  cursor-pointer hover:shadow-md transition-shadow'
                    >
                      <div className='flex justify-between items-center'>
                        <p className='font-bold text-primary-600 dark:text-white text-sm lg:text-md truncate flex-1'>{note.title}</p>
                        <div
                          className='relative ml-2'
                          data-note-menu
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            id='noteOptionsBtn'
                            title='More Options'
                            onClick={() => setOpenMenuId(openMenuId === note.id ? null : note.id)}
                            className='text-primary-600 hover:opacity-40 hover:text-primary-600 font-bold text-xl px-1 leading-none select-none'
                            aria-label='Note options'
                          >
                            ⋮
                          </button>

                          {openMenuId === note.id && (
                            <div className='absolute right-0 top-full mt-1 bg-white border  border-gray-200 rounded-lg shadow-lg z-50 w-36 py-1'>
                              <button
                                onClick={() => { openEditModal(note); setOpenMenuId(null) }}
                                className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 font-semibold'
                              >
                                <img className='w-5 h-5 select-none'  onContextMenu={(e) => e.preventDefault()} draggable={false} src="edit.png" alt="edit icon" />Edit
                              </button>
                              <hr className='my-1 border-gray-100' />
                              <button
                                onClick={() => { setConfirmDownload(note); setOpenMenuId(null) }}
                                className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 font-semibold'
                              >
                                <img className='w-5 h-5 select-none'  onContextMenu={(e) => e.preventDefault()} draggable={false} src="download.png" alt="download icon" />Download
                              </button>
                              <hr className='my-1 border-gray-100' />
                              <button
                                onClick={() => setPendingDelete({ id: note.id, name: note.title })}
                                className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-red-50 font-semibold'
                              >
                                <img src="delete.png" alt="delete icon" className='w-5 h-5 select-none'  onContextMenu={(e) => e.preventDefault()} draggable={false} />Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <hr className='border-t border-primary-600 my-2 dark:border-white' />
                      <p className='text-sm text-gray-600 line-clamp-3 flex-1 dark:text-white'>{htmlToPlainText(note.content)}</p>
                      <div className='flex justify-between items-center mt-3'>
                        <p className='text-xs dark:text-white text-primary-400 font-semibold truncate'>{note.subject}</p>
                        <p className='text-xs dark:text-white text-gray-400 shrink-0 ml-2'>
                          {new Date(note.createdAt).toLocaleDateString('en-US', {
                            month: 'long', day: 'numeric', year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            <div className='hidden lg:flex flex-col lg:w-56 xl:w-80 shrink-0 rounded-xl pr-2 mt-5'>
              <p className='self-start font-inter font-semibold text-sm md:text-md lg:text-[10px] xl:text-[12px] 2xl:text-[14px] 3xl:text-[16px] text-[#B3B3B3] uppercase'>
                NOTE CATEGORIES
              </p>

              <div className='flex flex-col gap-y-5 mt-5'>
                <div className='flex items-center gap-2 lg:gap-4 md:gap-4'>
                  {/* + Category Button */}
                  <button
                    id='addSubjectBtn'
                    aria-label='add Sub'
                    onClick={openSubjectModal}
                    className='flex-shrink-0 w-full flex items-center shadow-[0_3px_5px_rgba(0,0,0,.5)]
 text-xs justify-center h-10 bg-[#FEE248]  text-primary-800 font-bold  rounded-md dark:bg-transparent dark:border-white dark:border dark:text-white'
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    ADD NEW CATEGORY
                  </button>
                </div>

                {/* Category Buttons */}
                <div id='subjectDropdown' className='flex flex-col gap-2'>
<button
  onClick={() => setSelectedSubject('All Categories')}
  className={`w-full text-left px-3 py-2 rounded-md text-sm lg:text-md font-bold border-2 transition-colors
    ${selectedSubject === 'All Categories'
      ? 'bg-primary-600 text-white border-primary-600 warm:bg-[#623627] warm:border-[#623627] dark:bg-[#4E5669]  hover:opacity-50 '
      : 'bg-white text-primary-600 border-primary-600 hover:bg-primary-50 dark:bg-[#657084]'}`}
>
  All Categories
</button>

<button
  onClick={() => setSelectedSubject('Uncategorized')}
  className={`w-full text-left px-3 py-2 rounded-md text-sm lg:text-md font-bold border-2 transition-colors
    ${selectedSubject === 'Uncategorized'
      ? 'bg-primary-600 text-white border-primary-600 warm:bg-[#623627] warm:border-[#623627] dark:bg-[#4E5669]  hover:opacity-50'
      : 'bg-white text-primary-600 border-primary-600 hover:bg-primary-50 dark:bg-[#657084]'}`}
>
  Uncategorized
</button>

{allSubjects.map((subject, index) => (
                    <div
                    id='subjectDropdownDesktop'
                      key={index}
                      className={`flex items-center justify-between px-3 py-2 rounded-md border-2 transition-colors
                        ${selectedSubject === subject
                          ? 'bg-primary-600 text-white border-primary-600 warm:bg-[#623627] warm:border-[#623627] dark:bg-[#4E5669]  hover:opacity-50'
                          : 'bg-white text-primary-600 border-primary-600 hover:bg-primary-50 dark:bg-[#657084]'}`}
                    >
                      <button
                        onClick={() => setSelectedSubject(subject)}
                        className={`flex-1 text-left truncate text-sm lg:text-md font-bold
                          ${selectedSubject === subject ? 'text-white' : 'text-primary-600'}`}
                      >
                        {subject}
                      </button>
                       {!schedSubjects.includes(subject) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const category = categories.find((c) => c.name === subject)
                            if (category) setDeleteSubjectConfirm(category)
                          }}
                          className={`ml-2 font-bold text-xs flex-shrink-0
                            ${selectedSubject === subject ? 'text-white hover:text-red-200' : 'text-primary-600 hover:text-red-500'}`}
                          aria-label={`Delete ${subject}`}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {pendingDelete && (
            <SoftDeleteModal
              itemName={pendingDelete.name}
              onConfirm={handleConfirmDelete}
              onCancel={() => setPendingDelete(null)}
            />
          )}

          {cancelConfirm && (
            <DiscardNoteModal
              onConfirm={handleCancelNewNote}
              onCancel={() => setCancelConfirm(false)}
            />
          )}

          {/* ── Download Confirmation Modal ── */}
          {confirmDownload && (
            <div
              className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'
              onClick={() => setConfirmDownload(null)}
            >
              <div
                className='bg-white rounded-2xl p-8 w-full max-w-sm mx-6 flex flex-col items-center gap-4'
                onClick={(e) => e.stopPropagation()}
              >
                <p className='text-xl font-bold text-primary-600 uppercase text-center'>
                  are you sure you want to download?
                </p>
                <p className='text-sm text-gray-500 text-justify'>
                  <span className='font-semibold text-primary-600'>"{confirmDownload.title}"</span> will be downloaded as .txt file.
                </p>
                <div className='flex gap-4 w-full mt-2'>
                  <button
                    onClick={() => setConfirmDownload(null)}
                    className='flex-1 border-2 border-primary-600 text-primary-600 font-bold py-2 rounded-md hover:bg-primary-50'
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={() => { downloadNote(confirmDownload); setConfirmDownload(null) }}
                    className='flex-1 bg-primary-600 text-white font-bold py-2 rounded-md hover:bg-primary-700'
                  >
                    CONTINUE
                  </button>
                </div>
              </div>
            </div>
          )}

{/* ── Add Category Modal ── */}
{isSubjectModalOpen && (
  <div
    className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'
    onClick={closeSubjectModal}
  >
    <div
      className='bg-white rounded-2xl p-10 w-full max-w-md mx-6'
      onClick={(e) => e.stopPropagation()}
    >
      <p className='text-2xl font-bold uppercase text-primary-600 text-center mb-6'>
        Add A Category Name
      </p>
      <input
        className={`w-full border-2 rounded-md px-3 py-3 transition-colors dark:bg-white
          ${subjectError ? 'border-red-400 bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300' : 'border-primary-600'}`}
        type='text'
        placeholder='Enter Category Name'
        maxLength={18}
        value={subjectName}
        onChange={(e) => handleSubjectNameChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubjectSave()}
        aria-invalid={!!subjectError}
        aria-describedby={subjectError ? 'subjectNameError' : undefined}
        autoFocus
      />
      {subjectError ? (
        <p id='subjectNameError' className='text-red-500 text-xs font-semibold mt-2 mb-2'>
          {subjectError}
        </p>
      ) : (
        <div className='mb-4' />
      )}

      <div className='flex flex-col gap-1 mb-4'>
        <label className='text-primary-800 font-semibold text-sm'>Suggested Categories:</label>
        <div className='flex flex-wrap gap-2'>
          {getSuggestedCategories().map((s) => (
            <button
              key={s}
              type='button'
              disabled={subjectName.trim() === '' || containsBadWords(subjectName)}
              onClick={() => handleSubjectNameChange(s)}
              className='text-sm px-3 py-1 rounded-full border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white transition-colors'
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className='flex gap-4 mt-4'>
        <button
          onClick={closeSubjectModal}
          className='flex-1 border-2 border-primary-600 text-primary-600 font-bold py-2 rounded-md hover:bg-primary-50'
        >
          CANCEL
        </button>
        <button
          onClick={handleSubjectSave}
          disabled={subjectName.trim() === ''}
          className='flex-1 bg-primary-600 text-white font-bold py-2 rounded-md hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed'
        >
          SAVE
        </button>
      </div>
    </div>
  </div>
)}

          {/* ── Delete Category Confirmation Modal ── */}
          {deleteSubjectConfirm && (
            <div
              className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'
              onClick={() => setDeleteSubjectConfirm(null)}
            >
              <div
                className='bg-white rounded-2xl p-8 w-full max-w-sm mx-6 flex flex-col items-center gap-4'
                onClick={(e) => e.stopPropagation()}
              >
                <p className='text-xl font-bold text-primary-600 uppercase text-center'>
                  Remove Category?
                </p>
<p className='text-sm text-gray-500 text-center'>
  <span
    className='block max-w-[260px] mx-auto truncate font-semibold text-primary-600'
    title={deleteSubjectConfirm.name}
  >
    "{deleteSubjectConfirm.name}"
  </span>
will be removed. Notes tagged with this category will be moved to <span className='font-semibold'>Uncategorized</span>.
</p>
                <div className='flex gap-4 w-full mt-2'>
                  <button
                    onClick={() => setDeleteSubjectConfirm(null)}
                    className='flex-1 border-2 border-primary-600 text-primary-600 font-bold py-2 rounded-md hover:bg-primary-50'
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={() => handleSubjectDelete(deleteSubjectConfirm)}
                    className='flex-1 bg-red-500 text-white font-bold py-2 rounded-md hover:bg-red-600'
                  >
                    REMOVE
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Note Modal (view / edit — edit autosaves; only a brand-new note can be discarded) ── */}
          {isNoteModalOpen && (
            <div
              className='fixed inset-0 bg-black bg-opacity-50 flex justify-end lg:justify-center items-end lg:items-center z-50'
              onClick={handleCloseAttempt}
            >
              <div
                className='bg-white w-full h-dvh lg:rounded-2xl lg:h-[85vh] lg:max-w-4xl lg:mx-6 flex flex-col overflow-y-auto'
                onClick={(e) => e.stopPropagation()}
              >

                {/* ── MOBILE layout ── */}
                <div className='lg:hidden flex flex-col flex-1 p-6 pt-4 dark:bg-[#0A0F15] '>
                  <div className='flex justify-between items-start gap-2 mb-2'>
                    <input
                      className='flex-1 min-w-0 text-primary-600 text-2xl font-bold dark:bg-transparent dark:text-white placeholder:text-gray-300 border-b-2 border-primary-200 py-2 focus:outline-none read-only:cursor-default'
                      type='text'
                      placeholder='Untitled'
                      value={displayTitle}
                      onChange={(e) => handleFieldChange({ title: e.target.value })}
                      readOnly={isReadOnly}
                      autoFocus={!isReadOnly}
                    />
                    {isReadOnly ? (
                      <p className='text-sm text-right text-primary-600  dark:bg-white font-semibold pt-2 shrink-0 max-w-[120px] truncate'>{displaySubject}</p>
                    ) : (
                      <select
                        aria-label='Select category'
                        value={displaySubject}
                        onChange={(e) => handleFieldChange({ subject: e.target.value })}
                        className='shrink-0 max-w-[100px] border-2
                        
                         dark:bg-white 
                        border-primary-600 rounded-md px-2 py-2 text-primary-600 font-semibold text-sm'
                      >
  <option value='Uncategorized'>Uncategorized</option>
  {allSubjects.map((subject, index) => (
    <option key={index} value={subject}>{subject}</option>
  ))}
</select>
                    )}
                  </div>

                  <p className='text-sm text-gray-400 mb-4'>{modalTime.date} — {modalTime.time}</p>
{noteHasBadWords && (
  <p className='text-red-500 text-xs font-semibold mb-2'>
    Inappropriate language isn't allowed. This note won't be saved until it's removed.
  </p>
)}
<NoteEditor
  content={displayContent}
  onChange={(html) => handleFieldChange({ content: html })}
  readOnly={isReadOnly}
/>

                  <div className='flex gap-4 mt-auto'>
                    {modalMode === 'view' ? (
                      <>
                        <button
                          onClick={handleCloseAttempt}
                          className='flex-1 border-2 border-primary-600 text-primary-600 font-bold py-2 rounded-md hover:bg-primary-50'
                        >
                          CLOSE
                        </button>
                        <button
                          onClick={() => { if (selectedNote) openEditModal(selectedNote) }}
                          className='flex-1 bg-primary-600 text-white font-bold py-2 rounded-md hover:bg-primary-700'
                        >
                          EDIT
                        </button>
                      </>
                    ) : selectedNote === null ? (
                      <>
                        <button
                          onClick={() => setCancelConfirm(true)}
                          className='flex-1 border-2 border-red-400 text-red-500 font-bold py-2 rounded-md hover:bg-red-50'
                        >
                          CANCEL
                        </button>
                        <button
                          onClick={handleCloseAttempt}
                          className='flex-1 border-2 border-primary-600 bg-primary-600 text-white font-bold py-2 rounded-md hover:bg-primary-700'
                        >
                          DONE
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleCloseAttempt}
                        className='flex-1 border-2 border-primary-600 bg-primary-600 text-white font-bold py-2 rounded-md hover:bg-primary-700'
                      >
                        DONE
                      </button>
                    )}
                  </div>
                </div>

                {/* ── DESKTOP layout ── */}
                <div className='hidden lg:flex flex-col flex-1 min-h-0 py-10 lg:py-3 px-5 relative dark:bg-black dark:border-white dark:border'>
<div className='flex justify-between items-center gap-1 mb-0'>
  <input
    className='min-w-20 py-2 text-primary-600 text-2xl font-bold dark:bg-black dark:text-white dark:placeholder:text-white placeholder:text-gray-300 focus:outline-none read-only:cursor-default'
    type='text'
    placeholder='Untitled'
    maxLength={24}
    value={displayTitle}
    onChange={(e) => handleFieldChange({ title: e.target.value })}
    readOnly={isReadOnly}
    autoFocus={!isReadOnly}
  />
  {isReadOnly ? (
    <p className='text-primary-600 font-bold text-xl px-2 py-2 dark:bg-black dark:text-white dark:placeholder:text-white'>{displaySubject}</p>
  ) : (
<select
  aria-label='Select category'
  value={displaySubject}
  onChange={(e) => handleFieldChange({ subject: e.target.value })}
  className='shrink-0 max-w-[130px] border-2 border-primary-600 rounded-md px-2 py-2 dark:bg-white text-primary-600 font-semibold text-xs'
>
  <option value='Uncategorized'>Uncategorized</option>
  {allSubjects.map((subject, index) => (
    <option key={index} value={subject}>{subject}</option>
  ))}
</select>
                    )}
                  </div>
{noteHasBadWords && (
  <p className='text-red-500 text-xs font-semibold mb-1'>
    Inappropriate language isn't allowed. This note won't be saved until it's removed.
  </p>
)}

                  <p className='text-sm text-primary-600 dark:text-white mb-2'>{modalTime.date} — {modalTime.time}</p>
                  <hr className='w-full border-t border-primary-600 mb-2' />

<NoteEditor
  content={displayContent}
  onChange={(html) => handleFieldChange({ content: html })}
  readOnly={isReadOnly}
/>

                  <div className='flex gap-4 mt-auto'>
                    {modalMode === 'view' ? (
                      <div className='flex gap-2 ml-auto'>
                        <button
                          onClick={closeNoteModal}
                          className='border border-primary-600 text-primary-600 dark:text-white dark:border-white text-xs font-bold py-2 px-10 rounded-md hover:bg-primary-50'
                        >
                          CLOSE
                        </button>
                        <button
                          onClick={() => { if (selectedNote) openEditModal(selectedNote) }}
                          className='uppercase bg-primary-600 border border-primary-600 text-white text-xs font-bold py-1 px-10 rounded-md hover:bg-primary-700'
                        >
                          EDIT
                        </button>
                      </div>
                    ) : selectedNote === null ? (
                      <div className='flex gap-2 ml-auto'>
                        <button
                          onClick={() => setCancelConfirm(true)}
                          className='uppercase border border-red-400 text-red-500 text-xs font-bold py-1 px-10 rounded-md hover:bg-red-50'
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCloseAttempt}
                          className='uppercase bg-primary-600 border border-primary-600 text-white text-xs font-bold py-1 px-10 rounded-md hover:bg-primary-700'
                        >
                          DONE
                        </button>
                      </div>
                    ) : (
                      <div className='flex gap-2 ml-auto'>
                        <button
                          onClick={handleCloseAttempt}
                          className='uppercase bg-primary-600 border border-primary-600 text-white text-xs font-bold py-1 px-10 rounded-md hover:bg-primary-700'
                        >
                          DONE
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
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
        </div>
      </main>
    </div>
  )
}

export default Notes