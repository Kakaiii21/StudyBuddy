import  { useState, useRef ,useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { SESSION_KEY_RESULT } from '../StudyGenerator'
import { auth, db } from '../../services/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { CleanInput } from '../../components/CleanInput'
import { containsBadWords } from '../../utils/contentFilter'

interface QuizQuestion {
  question: string
  options: string[]
  answer: string
}

interface ResultState {
  items: QuizQuestion[]
  mode: 'quiz'
  fileName: string
}

const optionLetters = ['A', 'B', 'C', 'D']

const shuffleArray = <T,>(arr: T[]): T[] => {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

const shuffleQuestions = (qs: QuizQuestion[]): QuizQuestion[] =>
  shuffleArray(qs).map((q) => {
    const shuffledOptions = shuffleArray(q.options)
    const newAnswerIndex = shuffledOptions.indexOf(q.options[optionLetters.indexOf(q.answer)])
    return {
      ...q,
      options: shuffledOptions,
      answer: optionLetters[newAnswerIndex],
    }
  })

function loadResult(locationState: unknown): ResultState | null {
  const state = locationState as ResultState | null
  if (state?.items && state.mode === 'quiz') return state
  try {
    const saved = sessionStorage.getItem(SESSION_KEY_RESULT)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.mode === 'quiz') return parsed as ResultState
    }
  } catch {/**/}
  return null
}

function loadPersistedQuizState() {
  try {
    const selected = sessionStorage.getItem('quiz_selected')
    const attempted = sessionStorage.getItem('quiz_attempted')
    const questions = sessionStorage.getItem('quiz_questions')
    return {
      savedSelected: selected ? JSON.parse(selected) : {},
      savedAttempted: attempted === 'true',
      savedQuestions: questions ? JSON.parse(questions) : null,
    }
  } catch {
    return { savedSelected: {}, savedAttempted: false, savedQuestions: null }
  }
}

function clearQuizSession() {
  sessionStorage.removeItem('quiz_selected')
  sessionStorage.removeItem('quiz_attempted')
  sessionStorage.removeItem('quiz_questions')
}

function Quiz() {
  const questionRefs = useRef<(HTMLDivElement | null)[]>([])
  const mainRef = useRef<HTMLElement | null>(null)
  const location = useLocation()
  const navigate = useNavigate()

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)

  // useRef so result never goes null on re-renders
  const [result] = useState<ResultState | null>(() => loadResult(location.state))

  const [selected, setSelected] = useState<Record<number, string>>(
    () => loadPersistedQuizState().savedSelected
  )
  const [attempted, setAttempted] = useState<boolean>(
    () => loadPersistedQuizState().savedAttempted
  )
// ✅ Only runs once, on mount (this is the lazy-init form you already had)
const [questions, setQuestions] = useState<QuizQuestion[]>(
  () => loadPersistedQuizState().savedQuestions ?? result?.items ?? []
)

  const [enabled, setEnabled] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<QuizQuestion | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null)

      useEffect(() => {
      if (submitted) return
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault()
        e.returnValue = ''
      }
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [submitted])

      const handleDiscardAttempt = () => {
        setShowLeaveConfirm(true)
      }

  // Guard: only trigger if result was never available (not when session is cleared mid-quiz)
    if (!result?.items || result.items.length === 0) {
          return (
          <div className='flex h-screen'>
           <div className='p-3 '>
              <Sidebar quizActive={!submitted} />
            </div>
            <main className='flex-1 overflow-auto p-8 flex flex-col items-center justify-center'>
              <p className='text-primary-600 font-roboto font-bold text-xl mb-4'>No quiz data found.</p>
              <button
                className='bg-primary-600 text-white font-roboto px-6 py-2 rounded-md hover:bg-primary-500'
                onClick={() => navigate('/studyGenerator')}
              >
                Go Back
              </button>
            </main>
          </div>
        )
      }


  const allAnswered = questions.every((_, i) => selected[i] !== undefined)
const editHasBadWords =
  !!editDraft &&
  (containsBadWords(editDraft.question) ||
    editDraft.options.some((o) => containsBadWords(o)))
  const saveQuestions = (updated: QuizQuestion[]) => {
    setQuestions(updated)
    sessionStorage.setItem('quiz_questions', JSON.stringify(updated))
  }

  const getScore = () =>
    questions.reduce((score, q, i) => score + (selected[i] === q.answer ? 1 : 0), 0)

  const getOptionStyle = (qIndex: number, letter: string) => {
    if (!submitted) {
      return selected[qIndex] === letter
        ? 'border-primary-600 bg-primary-50'
        : 'border-gray-200 hover:border-primary-400'
    }
    const correct = questions[qIndex].answer
    if (letter === correct) return 'border-green-500 bg-green-50 text-green-700'
    if (letter === selected[qIndex] && letter !== correct) return 'border-red-400 bg-red-50 text-red-600'
    return 'border-gray-200 text-gray-400'
  }

  const getCardBorderStyle = (qIndex: number) => {
    if (submitted) return 'border-primary-600'
    if (attempted && selected[qIndex] === undefined) return 'border-red-400'
    return 'border-primary-600'
  }

  const proceedSubmit = async () => {
    const score = getScore()
    setFinalScore(score)
    setSubmitted(true)
    setShowModal(true) // ← show result immediately, don't wait on network I/O

    if (enabled) {
      const user = auth.currentUser
      if (user) {
        if (!navigator.onLine) {
          // Don't show "Saving..." — we already know it can't go through
          setSaveError('You are offline. Could not save to history.')
        } else {
          setSaving(true)
          setSaveError(null)
          setSaveSuccess(false)

          const TIMEOUT_MS = 10000
          try {
            await Promise.race([
              addDoc(collection(db, 'users', user.uid, 'quizHistory'), {
                fileName: result.fileName ?? 'Untitled',
                score,
                total: questions.length,
                dateTaken: serverTimestamp(),
                items: questions,
                selectedAnswers: selected,
              }),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS)
              ),
            ])
            setSaveSuccess(true)
          } catch (err) {
            console.error('Save failed:', err)
            setSaveError(
              !navigator.onLine
                ? 'You are offline. Could not save to history.'
                : 'Failed to save to history.'
            )
          } finally {
            setSaving(false)
          }
        }
      }
    }
  }

  const handleSubmit = async () => {
    if (!allAnswered) {
      setAttempted(true)
      sessionStorage.setItem('quiz_attempted', 'true')
      const firstUnanswered = questions.findIndex((_, i) => selected[i] === undefined)
      if (firstUnanswered !== -1) {
        questionRefs.current[firstUnanswered]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
      return
    }

    // All questions answered, but "Save Generated" is off — confirm before submitting
    if (!enabled) {
      setShowSaveConfirm(true)
      return
    }

    await proceedSubmit()
  }

  const handleConfirmSubmitWithoutSaving = () => {
    setShowSaveConfirm(false)
    proceedSubmit()
  }

  const handleDiscard = () => {
    sessionStorage.removeItem(SESSION_KEY_RESULT)
    clearQuizSession()
    navigate('/studyGenerator')
  }

  const handleRetake = () => {
    setShowModal(false)
    setSubmitted(false)
    setSelected({})
    setAttempted(false)
    setFinalScore(0)
    setSaveError(null)
    setSaveSuccess(false)
    setQuestions(shuffleQuestions(questions))   // ← shuffles both question order AND each question's options
    clearQuizSession()
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleOk = () => {
    setShowModal(false)
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteRequest = (qIndex: number) => {
    setOpenMenuIndex(null)
    setDeleteConfirmIndex(qIndex)
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmIndex(null)
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirmIndex === null) return
    const qIndex = deleteConfirmIndex

    const updated = questions.filter((_, i) => i !== qIndex)
    saveQuestions(updated)

    const updatedSelected: Record<number, string> = {}
    Object.entries(selected).forEach(([key, val]) => {
      const k = parseInt(key)
      if (k < qIndex) updatedSelected[k] = val
      else if (k > qIndex) updatedSelected[k - 1] = val
    })
    setSelected(updatedSelected)
    sessionStorage.setItem('quiz_selected', JSON.stringify(updatedSelected))

    setDeleteConfirmIndex(null)
  }

  const handleEditOpen = (qIndex: number) => {
    setEditIndex(qIndex)
    setEditDraft({ ...questions[qIndex] })
    setOpenMenuIndex(null)
  }

const handleEditSave = () => {
  if (editHasBadWords) return   // the message under the field explains why
  if (editDraft && editIndex !== null) {
    const updated = questions.map((q, i) => i === editIndex ? editDraft : q)
    saveQuestions(updated)
  }
  setEditIndex(null)
  setEditDraft(null)
}

  const handleEditCancel = () => {
    setEditIndex(null)
    setEditDraft(null)
  }



  return (
    <div className='flex h-screen'>
    <div className='lg:p-3 '>

     <Sidebar quizActive={!submitted} />
     </div>
      <main ref={mainRef} className='flex-1  w-full overflow-auto p-2 px-5 md:px-7 md:py-0 md:pt-0 py-0  lg:p-2 lg:pt-2  pt-1'>

        <div className='lg:hidden flex flex-col items-center dark:bg-transparent warm:bg-transparent justify-center px-4 sm:px-6 py-2 bg-white mt-2 '>
          <p className=' warm:text-[#623627] text-center font-inter mt-4 warm:text-[#623627] font-semibold text-xl text-[#B3B3B3] uppercase'>Quiz</p>
          {result.fileName && (
            <p className=' text-center font-inter mt-3 font-semibold  text-xs uppercase'>from: {result.fileName}</p>
          )}
        </div>

<div className='flex flex-col md:flex-row lg:items-center w-full gap-3 mb-6  mt-4 lg:mt-0'>
  <div className='hidden lg:flex lg:items-center justify-between w-full lg:pl-0
    mt-2 md:mt-4 lg:mt-1 xl:mt-2 2xl:mt-3'>
    <p className='font-inter font-semibold text-sm md:text-md lg:text-[10px]  xl:text-[12px] 2xl:text-[14px] 3xl:text-[16px] text-[#B3B3B3] uppercase'>
            Quiz
          </p>
          {result.fileName && (
      <span className='font-inter font-semibold text-sm md:text-md lg:text-[10px] lg:mr-1 xl:text-[12px] 2xl:text-[14px] 3xl:text-[16px] text-[#B3B3B3] uppercase'>

              from: {result.fileName}
            </span>
          )}
        </div>
</div>
        {submitted && (
          <div className='mb-6 px-6 py-4 
          lg:py-2 lg:rounded-lg lg:mb-3
           bg-primary-50 border-2 border-primary-600 bg-transparent warm:border-[#623627] dark:text-white dark:border-white rounded-xl text-center'>
            <p className='text-primary-600 font-roboto font-bold  text-xl dark:text-white
            lg:text-xs xl:text-sm 2xl:text-base 3xl:text-lg'>
              Your Score: {finalScore} / {questions.length}
            </p>
          </div>
        )}

        <div className='flex flex-col lg:mx-20 gap-8'>
          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              ref={(el) => void (questionRefs.current[qIndex] = el)}
              className={`flex flex-col border-2 dark:border-gray-400 warm:border-[#623627] py-2 px-5 rounded-xl transition lg:text-xs xl:text-sm 2xl:text-base 3xl:text-lg ${getCardBorderStyle(qIndex)}`}
            >
              <div className='flex flex-row items-start  gap-2 pt-5 w-full'>
                <p className='flex-1 text-sm dark:text-white warm:text-[#623627] md:text-xl lg:text-xs xl:text-sm 2xl:text-base 3xl:text-lg text-primary-600 font-bold font-roboto'>
                  {qIndex + 1}. {q.question}
                </p>

                {attempted && !submitted && selected[qIndex] === undefined && (
                  <span className='text-xs lg:text-[10px] xl:text-xs 2xl:text-sm 3xl:text-base text-red-400 font-roboto whitespace-nowrap pt-1'>
                    Not answered
                  </span>
                )}

                {!submitted && (
                  <div className='relative ml-2'>
                    <button
                      onClick={() => setOpenMenuIndex(openMenuIndex === qIndex ? null : qIndex)}
                      className='text-primary-600 hover:text-primary-800 dark:text-white warm:text-[#623627]  dark:hover:text-gray-300 text-3xl lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl'
                      title='EDIT/DELETE'
                    >
                      ⋮
                    </button>

                    {openMenuIndex === qIndex && (
                      <div className='absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-lg shadow-lg w-32 overflow-hidden'>
                        <button
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => handleEditOpen(qIndex)}
                          className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm lg:text-xs xl:text-sm 2xl:text-base 3xl:text-lg text-primary-600 hover:bg-primary-50 font-semibold'
                        >
                          <img className='w-5 h-5 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false} src='/edit.png' alt='edit icon' />Edit
                        </button>
                        <hr className='my-1 border-gray-100' />
                        <button
                          onClick={() => handleDeleteRequest(qIndex)}
                          className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm lg:text-xs xl:text-sm 2xl:text-base 3xl:text-lg text-primary-600 hover:bg-red-50 font-semibold'
                        >
                          <img src='/delete.png' alt='delete icon' className='w-5 h-5 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false} />Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {editIndex === qIndex && editDraft ? (
                <div className='flex flex-col gap-3 mt-4 pb-4'>
                  <label className='text-xs lg:text-[10px] xl:text-xs 2xl:text-sm 3xl:text-base text-gray-500 font-roboto'>Question</label>
                  <CleanInput
                    aria-label='Edit question'
                    className='border border-gray-300 rounded-lg px-3 py-2 text-sm lg:text-xs xl:text-sm 2xl:text-base 3xl:text-lg font-roboto focus:outline-none focus:border-primary-600'
                    value={editDraft.question}
                    onChange={(e) => setEditDraft({ ...editDraft, question: e.target.value })}
                  />

                  {editDraft.options.map((opt, oIndex) => (
                    <div key={oIndex} className='flex items-center gap-2'>
                      <span className='text-xs lg:text-[10px] xl:text-xs 2xl:text-sm 3xl:text-base font-bold text-primary-600 w-5'>
                        {optionLetters[oIndex]}
                      </span>
                      <CleanInput
                        aria-label={`Edit option ${optionLetters[oIndex]}`}
                        className='flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm lg:text-xs xl:text-sm 2xl:text-base 3xl:text-lg font-roboto focus:outline-none focus:border-primary-600'
                        value={opt}
                        onChange={(e) => {
                          const updatedOptions = editDraft.options.map((o, i) =>
                            i === oIndex ? e.target.value : o
                          )
                          setEditDraft({ ...editDraft, options: updatedOptions })
                        }}
                      />
                      {editDraft.answer === optionLetters[oIndex] && (
                        <span className='text-xs lg:text-[10px] xl:text-xs 2xl:text-sm 3xl:text-base text-green-500 whitespace-nowrap'>✓ Correct</span>
                      )}
                    </div>
                  ))}

                  <div className='flex items-center gap-2'>
                    <label className='text-xs lg:text-[10px] xl:text-xs 2xl:text-sm 3xl:text-base text-gray-500 font-roboto'>Correct answer:</label>
                    <select
                      aria-label='Select correct answer'
                      className='border border-gray-300 rounded-lg px-3 py-1 text-sm lg:text-xs xl:text-sm 2xl:text-base 3xl:text-lg font-roboto focus:outline-none focus:border-primary-600'
                      value={editDraft.answer}
                      onChange={(e) => setEditDraft({ ...editDraft, answer: e.target.value })}
                    >
                      {optionLetters.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>

                  <div className='flex gap-2 mt-1'>
<button
  onClick={handleEditSave}
  disabled={editHasBadWords}
  className='bg-primary-600 text-white text-sm lg:text-xs xl:text-sm 2xl:text-base 3xl:text-lg px-4 py-1.5 rounded-lg hover:opacity-80 transition font-roboto disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40'
>
  Save
</button>
                    <button
                      onClick={handleEditCancel}
                      className='bg-gray-200 text-gray-600 text-sm lg:text-xs xl:text-sm 2xl:text-base 3xl:text-lg px-4 py-1.5 rounded-lg hover:opacity-80 transition font-roboto'
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className='flex flex-col gap-3 mt-5 lg:ml-10 md:ml-10 pb-5'>
                  {q.options.map((option, oIndex) => {
                    const letter = optionLetters[oIndex]
                    return (
                      <label
                        key={oIndex}
                        className={`flex items-center gap-3 dark:text-white warm:text-[#623627] dark:bg-transparent  dark:border-[#4E5669] warm:border-[#623627] border-2 lg:text-sm xl:text-base 2xl:text-lg 3xl:text-xl rounded-lg px-3 py-2 transition
                          ${getOptionStyle(qIndex, letter)}
                          ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <input
                          type='radio'
                          name={`question${qIndex}`}
                          value={letter}
                          className='w-4 h-4 '
                          disabled={submitted}
                          checked={selected[qIndex] === letter}
                          onChange={() => {
                            const updated = { ...selected, [qIndex]: letter }
                            setSelected(updated)
                            sessionStorage.setItem('quiz_selected', JSON.stringify(updated))
                          }}
                          aria-label={letter}
                        />
                        <span className='text-xs md:text-xl dark:text-white warm:text-[#623627] lg:text-xs xl:text-sm 2xl:text-base 3xl:text-lg'>
                          {letter}) {option}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}

              {submitted && (
                <p className='text-xs md:text-sm lg:text-xs xl:text-sm 2xl:text-base 3xl:text-lg text-green-600 font-roboto font-semibold px-5 pb-3'>
                  ✓ Correct Answer: {questions[qIndex].answer}
                </p>
              )}
            </div>
          ))}

          {!submitted && (
            <div className='flex flex-row justify-start items-center gap-3'>
              <button
                aria-label={enabled ? 'Disable save generated' : 'Enable save generated'}
                onClick={() => setEnabled(!enabled)}
                className={`w-14 h-8 flex items-center rounded-full p-1 transition ${enabled ? 'bg-green-500' : 'bg-gray-400'}`}
              >
                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
              <p className='text-xs md:text-sm dark:text-white warm:text-[#623627] lg:text-xs xl:text-sm 2xl:text-base 3xl:text-lg font-semibold text-primary-600'>SAVE GENERATED</p>
            </div>
          )}

          <div className='flex flex-row ml-auto gap-4 mb-10 items-center'>
            {attempted && !submitted && !allAnswered && (
              <p className='text-xs lg:text-[10px] xl:text-xs 2xl:text-sm 3xl:text-base text-gray-400 font-roboto'>
                Answer all questions to submit
              </p>
            )}
            <button
              className='hover:opacity-50 lg:text-sm xl:text-base 2xl:text-lg 3xl:text-xl lg:py-1 xl:py-1.5 2xl:py-2 3xl:py-2.5 bg-gray-500 text-white py-2 font-roboto md:px-14 px-8 text-sm rounded-md md:text-xl uppercase'
                onClick={submitted ? handleDiscard : handleDiscardAttempt}
            >
              Discard
            </button>
            <button
              className='hover:opacity-50 lg:text-sm xl:text-base 2xl:text-lg 3xl:text-xl lg:py-1 xl:py-1.5 2xl:py-2 3xl:py-2.5 bg-primary-600 text-white py-2 font-roboto md:px-14 px-8 text-sm rounded-md md:text-xl uppercase'
              onClick={submitted ? handleRetake : handleSubmit}
            >
              {submitted ? 'Retake' : 'Submit'}
            </button>
          </div>
        </div>
      </main>

      {/* ── Result Modal ───────────────────────────────────────────────────── */}
      {showModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-8 lg:pb-16 lg:pt-10 flex flex-col items-center gap-10'>

            {enabled && saveSuccess ? (
              /* ── SAVED STATE ── */
              <>
                <div className='flex flex-col text-center gap-3'>
                  <p className='text-primary-600 font-roboto font-bold text-4xl uppercase'>
                    Quiz Result
                  </p>
                  <p className='text-primary-600 font-roboto text-center text-sm'>
                    This quiz has been saved. You can view it in Generated History.
                  </p>
                </div>
                <div>
                  <img src='/Saved.png' alt='Saved' className='w-32 h-32 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false} />
                </div>
              </>
            ) : (
              /* ── NOT SAVED STATE ── */
              <>
                <div className='flex flex-col text-center gap-3'>
                  <p className='text-primary-600 font-roboto font-bold text-4xl uppercase'>
                    Quiz Result
                  </p>
                  <p className='text-primary-600 font-roboto text-center text-sm'>
                    This quiz was not saved. It cannot be viewed again.
                  </p>
                </div>
                <div>
                  <img src='/notSaved.png' alt='Not Saved' className='w-32 h-32 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false} />
                </div>
              </>
            )}

            <div className='flex flex-row justify-between w-full lg:px-8 px-2'>
              <p className='lg:text-xl text-xl font-semibold text-primary-600 font-roboto'>
                Score: {finalScore}/{questions.length}
              </p>
              <p className='lg:text-xl text-xl font-semibold text-primary-600 font-roboto'>
                Mistakes: {questions.length - finalScore}
              </p>
            </div>

            {saving && (
              <p className='text-xs text-gray-400 font-roboto text-center'>Saving...</p>
            )}
            {saveError && (
              <p className='text-xs text-red-500 font-roboto text-center'>{saveError}</p>
            )}

            <div className='flex flex-row w-full gap-3'>
              <button
                onClick={handleRetake}
                className='flex-1 border-2 border-primary-600 text-primary-600 font-roboto py-2.5 rounded-lg hover:bg-primary-50 transition uppercase font-semibold text-md'
              >
                Retake
              </button>
              <button
                onClick={handleOk}
                className='flex-1 bg-primary-600 text-white font-roboto py-2.5 rounded-lg hover:opacity-80 transition uppercase font-semibold text-md'
              >
                OK
              </button>
            </div>

          </div>
        </div>
      )}

      {deleteConfirmIndex !== null && (
        <div className='fixed inset-0 z-[70] flex items-center justify-center bg-black/50'>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 flex flex-col items-center gap-6'>
            <p className='text-xl font-bold text-primary-600 uppercase text-center font-roboto'>
              Delete Question?
            </p>
            <p className='text-sm text-gray-500 text-center'>
              This question will be removed from the quiz and can't be undone.
            </p>
            <div className='flex gap-4 w-full'>
              <button
                onClick={handleDeleteCancel}
                className='flex-1 border-2 border-primary-600 text-primary-600 font-bold py-2 rounded-md hover:bg-primary-50 font-roboto uppercase'
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className='flex-1 bg-red-500 text-white font-bold py-2 rounded-md hover:bg-red-600 font-roboto uppercase'
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showLeaveConfirm && (
        <div className='fixed inset-0 z-[70] flex items-center justify-center bg-black/50'>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 flex flex-col items-center gap-6'>
            <p className='text-xl font-bold text-primary-600 uppercase text-center font-roboto'>
              Leave Quiz?
            </p>
            <p className='text-sm text-gray-500 text-center'>
              Your progress will be lost if you leave. Are you sure you want to discard this quiz?
            </p>
            <div className='flex gap-4 w-full'>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className='flex-1 border-2 border-primary-600 text-primary-600 font-bold py-2 rounded-md hover:bg-primary-50 font-roboto uppercase'
              >
                Keep Going
              </button>
              <button
                onClick={() => { setShowLeaveConfirm(false); handleDiscard() }}
                className='flex-1 bg-red-500 text-white font-bold py-2 rounded-md hover:bg-red-600 font-roboto uppercase'
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveConfirm && (
        <div className='fixed inset-0 z-[70] flex items-center justify-center bg-black/50'>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 flex flex-col items-center gap-6'>
            <p className='text-xl font-bold text-primary-600 uppercase text-center font-roboto'>
              Submit Without Saving?
            </p>
            <p className='text-sm text-gray-500 text-center'>
              "Save Generated" is off. This attempt won't appear in your Generated History. Submit anyway?
            </p>
            <div className='flex gap-4 w-full'>
              <button
                onClick={() => setShowSaveConfirm(false)}
                className='flex-1 border-2 border-primary-600 text-primary-600 font-bold py-2 rounded-md hover:bg-primary-50 font-roboto uppercase'
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmitWithoutSaving}
                className='flex-1 bg-primary-600 text-white font-bold py-2 rounded-md hover:opacity-80 font-roboto uppercase'
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Quiz