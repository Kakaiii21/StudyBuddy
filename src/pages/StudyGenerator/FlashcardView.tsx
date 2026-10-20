import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { db, auth } from '../../services/firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { CleanInput, CleanTextarea } from '../../components/CleanInput'
import { containsBadWords } from '../../utils/contentFilter'

interface FlashcardItem {
  term: string
  definition: string
}

interface FlashcardViewState {
  items: FlashcardItem[]
  fileName: string
  id: string
}

// ← Outside the component so it's stable
const FLASHCARD_VIEW_KEY = 'flashcard_view_state'

const shuffleArray = <T,>(arr: T[]): T[] => {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function FlashcardView() {
  const location = useLocation()
  const navigate = useNavigate()
  const isOnline = useNetworkStatus()


  const rawState = location.state as FlashcardViewState | null

  // Read from sessionStorage as fallback
  const state: FlashcardViewState | null = rawState ?? (() => {
    try {
      const saved = sessionStorage.getItem(FLASHCARD_VIEW_KEY)
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })()

  // ── All hooks BEFORE any early return ──
  const [cards, setCards] = useState<FlashcardItem[]>(state?.items ?? [])
  const [originalCards, setOriginalCards] = useState<FlashcardItem[]>(state?.items ?? [])
  const [flipped, setFlipped] = useState<Record<number, boolean>>({})
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<FlashcardItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null)

  // ← Save to sessionStorage via useEffect, not during render
  useEffect(() => {
    if (rawState?.items && rawState.items.length > 0) {
      sessionStorage.setItem(FLASHCARD_VIEW_KEY, JSON.stringify(rawState))
    }
  }, [rawState])

  // ── Early return guard AFTER all hooks ──
  if (!state?.items || state.items.length === 0) {
    return (
      <div className='flex h-screen'>
        <Sidebar />
        <main className='flex-1 overflow-auto p-8 flex flex-col items-center justify-center'>
          <p className='text-primary-600 font-roboto font-bold text-xl mb-4'>No flashcard data found.</p>
          <button
            className='bg-primary-600 text-white font-roboto px-6 py-2 rounded-md hover:bg-primary-500'
            onClick={() => navigate('/history')}
          >
            Back to History
          </button>
        </main>
      </div>
    )
  }

  const { fileName, id } = state

  const toggleCard = (index: number) => {
    if (editIndex === index) return
    setFlipped((prev) => ({ ...prev, [index]: !prev[index] }))
  }

const persistCards = async (updated: FlashcardItem[]) => {
  const user = auth.currentUser
  if (!user || !id) {
    console.warn('Missing user or id', { uid: user?.uid, id })
    return
  }
  setSaving(true)
  setSaveError(null)
  try {
    await updateDoc(doc(db, 'users', user.uid, 'flashcardHistory', id), {
      items: updated,
      total: updated.length,
    })
    setOriginalCards(updated)
    setShowSuccessModal(true)
  } catch (err) {
    console.error('Update failed:', err)
    setSaveError('Failed to save changes.')
  } finally {
    setSaving(false)
  }
}

  const handleEditOpen = (index: number) => {
    setEditIndex(index)
    setEditDraft({ ...cards[index] })
    setOpenMenuIndex(null)
  }

const handleEditSave = () => {
  if (editHasBadWords) return   // the message under the field explains why
  if (editDraft && editIndex !== null) {
    const updated = cards.map((c, i) => (i === editIndex ? editDraft : c))
    setCards(updated)
  }
  setEditIndex(null)
  setEditDraft(null)
}

  const handleEditCancel = () => {
    setEditIndex(null)
    setEditDraft(null)
  }

  const handleDelete = (index: number) => {
    const updated = cards.filter((_, i) => i !== index)
    setCards(updated)
    setFlipped((prev) => {
      const next: Record<number, boolean> = {}
      Object.entries(prev).forEach(([k, v]) => {
        const ki = parseInt(k)
        if (ki < index) next[ki] = v
        else if (ki > index) next[ki - 1] = v
      })
      return next
    })
    setDeleteConfirmIndex(null)
    setOpenMenuIndex(null)
  }
const isDirty = JSON.stringify(cards) !== JSON.stringify(originalCards)
  const handleShuffle = () => {
    setCards((prev) => shuffleArray(prev))
    setFlipped({})
    setOpenMenuIndex(null)
  }

  const editHasBadWords =
  !!editDraft &&
  (containsBadWords(editDraft.term) || containsBadWords(editDraft.definition))

  return (

    <div className='flex h-screen'>
    <div className='lg:p-3 '>

     <Sidebar />
     </div>
      <main className='flex-1  w-full overflow-auto p-2 px-5 md:px-7 md:py-0 md:pt-0 py-0  lg:p-2 lg:pt-2  pt-1'>


        <div className='lg:hidden flex flex-col items-center justify-center px-4 sm:px-6 py-2 bg-transparent mt-2 '>
          <p className=' text-center warm:text-[#623627] font-inter mt-4 font-semibold text-xl text-[#B3B3B3] uppercase'>Flashcard</p>
          {fileName && (
            <p className=' text-center font-inter mt-3 font-semibold  text-xs uppercase'>from: {fileName}</p>
          )}
        </div>

<div className='flex flex-col md:flex-row lg:items-center w-full gap-3 mb-6  mt-4 lg:mt-0'>
  <div className='hidden lg:flex lg:items-center justify-between w-full lg:pl-0
    mt-2 md:mt-4 lg:mt-1 xl:mt-2 2xl:mt-3'>
    <p className='font-inter font-semibold text-sm md:text-md lg:text-[10px]  xl:text-[12px] 2xl:text-[14px] 3xl:text-[16px] text-[#B3B3B3] uppercase'>
            Flashcard
          </p>
          {fileName && (
      <span className='font-inter font-semibold text-sm md:text-md lg:text-[10px] lg:mr-1 xl:text-[12px] 2xl:text-[14px] 3xl:text-[16px] text-[#B3B3B3] uppercase'>

              from: {fileName}
            </span>
          )}
        </div>
      </div>

        {saving && (
          <p className='text-xs text-gray-400 font-roboto text-center mb-4'>Saving changes...</p>
        )}

        {saveError && (
          <p className='text-xs text-red-500 font-roboto text-center mb-4'>{saveError}</p>
        )}

        <p className='text-center warm:text-[#623627] text-gray-400 font-roboto text-sm lg:text-xs 2xl:text-lg lg:mb-2 mb-6'>
          Click a card to flip it and reveal the term.
        </p>

        {/* Cards */}
        <div className='flex flex-col lg:mx-20 gap-8 lg:gap-2 2xl:gap-4  md:mx-10'>
          {cards.map((card, index) => (
            <div key={index} className='flex justify-center'>
              <div className='perspective w-full max-w-md lg:max-w-xl xl:max-w-3xl 2xl:max-w-4xl relative'>

                {/* ── Menu Button ── */}
                <div className='absolute top-3 right-3 z-20'>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuIndex(openMenuIndex === index ? null : index)
                    }}
                    className={`hover:opacity-70 text-3xl leading-none transition-colors duration-500 ${
                      flipped[index] ? 'text-primary-600' : 'text-white'
                    }`}
                    title='EDIT/DELETE'
                  >
                    ⋮
                  </button>

                  {openMenuIndex === index && (
                    <div className='absolute right-0 top-8 z-30 bg-white border border-gray-200 rounded-lg shadow-lg w-32 overflow-hidden'>
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => handleEditOpen(index)}
                        className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 font-semibold'
                      >
                        <img className='w-5 h-5 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false} src='/edit.png' alt='edit icon' />Edit
                      </button>
                      <hr className='my-1 border-gray-100' />
                      <button
                        onClick={() => {
                          setDeleteConfirmIndex(index)
                          setOpenMenuIndex(null)
                        }}
                        className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-red-50 font-semibold'
                      >
                        <img src='/delete.png' alt='delete icon' className='w-5 h-5 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false} />Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Edit Mode ── */}
                {editIndex === index && editDraft ? (
                  <div className='w-full border-2 border-primary-600 rounded-xl px-5 py-5 flex flex-col gap-3 bg-transparent dark:border-white'>
                    <label className='text-xs dark:text-white text-gray-500 warm:text-[#623627] font-roboto'>Term</label>
                    <CleanInput
                      className='border border-gray-300 dark:bg-transparent dark:text-white warm:bg-transparent warm:border-[#623627] rounded-lg px-3 py-2 text-sm font-roboto focus:outline-none focus:border-primary-600'
                      value={editDraft.term}
                      onChange={(e) => setEditDraft({ ...editDraft, term: e.target.value })}
                      aria-label='Edit term'
                    />
                    <label className='text-xs dark:text-white text-gray-500 warm:text-[#623627] font-roboto'>Definition</label>
                    <CleanTextarea
                      className='border border-gray-300 dark:bg-transparent dark:text-white warm:bg-transparent warm:border-[#623627] rounded-lg px-3 py-2 text-sm font-roboto focus:outline-none focus:border-primary-600 resize-none'
                      rows={3}
                      value={editDraft.definition}
                      onChange={(e) => setEditDraft({ ...editDraft, definition: e.target.value })}
                      aria-label='Edit definition'
                    />
                    <div className='flex gap-2 mt-1'>
<button
  onClick={handleEditSave}
  disabled={editHasBadWords}
  className='bg-primary-600 text-white text-sm px-4 py-1.5 rounded-lg hover:opacity-80 transition font-roboto disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40'
>
  Save
</button>
                      <button
                        onClick={handleEditCancel}
                        className='bg-gray-200 text-gray-600 text-sm px-4 py-1.5 rounded-lg hover:opacity-80 transition font-roboto'
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Flip Card ── */
<div
  onClick={() => toggleCard(index)}
  className={`relative w-full h-56 lg:h-44 2xl:h-52 cursor-pointer duration-500 transform-style preserve-3d
    ${flipped[index] ? 'rotate-y-180' : ''}`}
>
  {/* FRONT — now shows the definition */}
  <div className='absolute w-full h-full backface-hidden flex items-center justify-center
    bg-primary-600 dark:bg-transparent dark:border-white warm:bg-[#623627] warm:border-[#623627] border-2 border-primary-600 rounded-xl px-5'>
    <div className='flex flex-col text-center'>
      <p className='text-white font-inter text-xl lg:text-lg font-bold'>{card.definition}</p>
      <p className='text-white font-inter text-sm lg:text-xs mt-1'>Click to view term</p>
    </div>
  </div>

  {/* BACK — now shows the term */}
  <div className='absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center
    bg-white dark:bg-[#BFC7D4] warm:bg-transparent warm:border-[#623627] border-2 border-primary-600 rounded-xl px-5'>
    <p className='text-primary-600 text-center font-medium uppercase'>{card.term}</p>
  </div>
</div>
                )}
              </div>
            </div>
          ))}

          {/* Buttons */}
          <div className='flex flex-row ml-auto gap-4 mb-10 lg:mt-2'>
            <button
              className='hover:opacity-50 lg:text-xs 2xl:text-lg  bg-gray-500 text-white py-2 font-roboto md:px-14 px-8 text-sm md:text-xl rounded-md uppercase'
              onClick={() => {
                sessionStorage.removeItem(FLASHCARD_VIEW_KEY)
                navigate('/history')
              }}
            >
              Back
            </button>
            <button
              className='hover:opacity-50 lg:text-xs 2xl:text-lg bg-primary-800 text-white py-2 font-roboto md:px-14 px-8 text-sm md:text-xl rounded-md uppercase'
              onClick={handleShuffle}
            >
              Shuffle
            </button>
            <button
              className={`hover:opacity-50 lg:text-xs 2xl:text-lg  bg-primary-600 text-white py-2 font-roboto md:px-14 px-8 text-sm md:text-xl rounded-md uppercase transition
                ${(!isOnline || !isDirty) ? 'opacity-40 cursor-not-allowed' : ''}`}
              disabled={!isOnline || !isDirty}
              onClick={() => (isOnline && isDirty) ? persistCards(cards) : undefined}
            >
              Save
            </button>
          </div>
        </div>

      </main>

      {/* ── Success Modal ── */}
      {showSuccessModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 flex flex-col items-center gap-6'>
            <div className='flex flex-col items-center gap-2'>
              <img src='/Saved.png' alt='Saved' className='w-16 h-16 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false} />
              <p className='text-primary-600 font-roboto font-bold text-xl text-center uppercase'>
                Flashcards Updated!
              </p>
              <p className='text-gray-400 font-roboto text-sm text-center'>
                Your changes have been saved successfully.
              </p>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem(FLASHCARD_VIEW_KEY)
                navigate('/history')
              }}
              className='w-full bg-primary-600 text-white font-roboto py-2.5 rounded-lg hover:opacity-80 transition uppercase font-semibold text-sm'
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirmIndex !== null && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 flex flex-col items-center gap-6'>
            <p className='text-primary-600 font-roboto font-bold text-xl text-center uppercase'>
              Delete this card?
            </p>
            <p className='text-gray-400 font-roboto text-sm text-center'>
              This action cannot be undone.
            </p>
            <div className='flex flex-row w-full gap-3'>
              <button
              aria-label='cancel'
                onClick={() => setDeleteConfirmIndex(null)}
                className='flex-1 border-2 border-primary-600 text-primary-600 font-roboto py-2.5 rounded-lg hover:bg-primary-50 transition uppercase font-semibold text-sm'
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmIndex)}
                className='flex-1 bg-red-500 text-white font-roboto py-2.5 rounded-lg hover:opacity-80 transition uppercase font-semibold text-sm'
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FlashcardView