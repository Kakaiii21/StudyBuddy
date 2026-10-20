import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'

interface QuizQuestion {
  question: string
  options: string[]
  answer: string
}

interface QuizViewState {
  items: QuizQuestion[]
  selectedAnswers: Record<number, string>
  score: number
  total: number
  fileName: string
  id?: string
}

const optionLetters = ['A', 'B', 'C', 'D']

function QuizView() {
  const location = useLocation()
  const navigate = useNavigate()

  const state = location.state as QuizViewState | null

  const [viewState] = useState<QuizViewState | null>(() => {
    if (state?.items) {
      sessionStorage.setItem('quizView_state', JSON.stringify(state))
      return state
    }
    try {
      const saved = sessionStorage.getItem('quizView_state')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  // Fallback guard — uses viewState, not state
  if (!viewState?.items || viewState.items.length === 0) {
    return (
      <div className='flex h-screen'>

      <div className='lg:p-3 '>
      <Sidebar />
        
      </div>
          <main className='flex-1 overflow-auto p-8 flex flex-col items-center justify-center'>
          <p className='text-primary-600 font-roboto font-bold text-xl mb-4'>No quiz data found.</p>
          <button
            className='bg-primary-600 text-white font-roboto px-6 py-2 rounded-md hover:bg-primary-500'
            onClick={() => {
              sessionStorage.removeItem('quizView_state')
              navigate('/history')
            }}
          >
            Back to History
          </button>
        </main>
      </div>
    )
  }

  const { items, selectedAnswers, score, total, fileName } = viewState

  const getOptionStyle = (qIndex: number, letter: string) => {
    const correct = items[qIndex].answer
    const userPicked = selectedAnswers?.[qIndex]
    if (letter === correct) return 'border-green-500 bg-green-50 text-green-700'
    if (letter === userPicked && letter !== correct) return 'border-red-400 bg-red-50 text-red-600'
    return 'border-gray-200 text-gray-400'
  }


  const handleBack = () => {
    sessionStorage.removeItem('quizView_state')
    navigate('/history')
  }

  return (
    <div className='flex h-screen'>
      <div className='lg:p-3 '>

      <Sidebar />
      </div>



      <main className='flex-1  w-full overflow-auto p-2 px-5 md:px-7 md:py-0 md:pt-0 py-0  lg:p-2 lg:pt-2  pt-1'>

        <div className='lg:hidden flex flex-col items-center justify-center px-4 sm:px-6 py-2 bg-transparent mt-2 '>
          <p className=' text-center font-inter mt-4 warm:text-[#623627] font-semibold text-xl text-[#B3B3B3] uppercase'>Quiz Review</p>
          <p className=' text-center font-inter mt-3 font-semibold  text-xs uppercase'>from: {fileName}</p>
          
          
        </div>
        {/* Header */}
<div className='flex flex-col  md:flex-row lg:items-center w-full gap-3 mb-6  mt-4 lg:mt-0'>
  <div className='hidden lg:flex  lg:items-center justify-between w-full lg:pl-0
    mt-2 md:mt-4 lg:mt-1 xl:mt-2 2xl:mt-3'>
    <p className='font-inter font-semibold text-sm md:text-md lg:text-[10px]  xl:text-[12px] 2xl:text-[14px] 3xl:text-[16px] text-[#B3B3B3] uppercase'>
      Quiz Review
    </p>
    {fileName && (
      <span className='font-inter font-semibold text-sm md:text-md lg:text-[10px] lg:mr-1 xl:text-[12px] 2xl:text-[14px] 3xl:text-[16px] text-[#B3B3B3] uppercase'>
        from: {fileName}
      </span>
    )}
  </div>
</div>

        {/* Score Banner */}
        <div className='mb-6 px-6 py-4 
        lg:py-2 lg:rounded-lg lg:mb-3
         bg-primary-50 dark:bg-transparent warm:bg-transparent border-2 border-primary-600 dark:border-white warm:border-[#623627] 
rounded-xl flex flex-row justify-between items-center'>
          <p className='text-primary-600 dark:text-white  font-roboto font-bold text-lg 
          md:text-xl 
          lg:text-xs xl:text-sm 2xl:text-base 3xl:text-lg'>
            Score: {score} / {total}
          </p>
          <p className='text-primary-600 dark:text-white  font-roboto font-bold text-lg 
          md:text-xl 
          lg:text-xs xl:text-sm 2xl:text-base 3xl:text-lg'>
            Mistakes: {total - score}
          </p>
        </div>

        {/* Legend */}
        <div className='flex flex-row gap-4 mb-6 px-1'>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-[18px] 2xl:h-[18px] 3xl:w-5 3xl:h-5 rounded border-2 border-green-500 bg-green-50' />
            <span className='text-xs lg:text-[10px] dark:text-white xl:text-xs 2xl:text-sm 3xl:text-base text-gray-500 font-roboto'>Correct answer</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-[18px] 2xl:h-[18px] 3xl:w-5 3xl:h-5 rounded border-2 border-red-400 bg-red-50' />
            <span className='text-xs lg:text-[10px] dark:text-white xl:text-xs 2xl:text-sm 3xl:text-base text-gray-500 font-roboto'>Wrong answer</span>
          </div>
        </div>

        {/* Questions */}
        <div className='flex flex-col lg:mx-20 gap-8'>
          {items.map((q, qIndex) => {
            const userPicked = selectedAnswers?.[qIndex]
            const isCorrect = userPicked === q.answer

            return (
              <div
                key={qIndex}
                className={`flex flex-col border-2 py-2 px-5  rounded-xl ${
                  isCorrect ? 'border-primary-600 warm:border-[#623627] lg:text-xs xl:text-sm 2xl:text-base 3xl:text-lg' : 'border-red-400 lg:text-xs xl:text-sm 2xl:text-base 3xl:text-lg'
                }`}
              >
                <div className='flex flex-row items-start gap-2 pt-5 w-full'>
                  <p className='flex-1 text-sm dark:text-white warm:text-[#623627] md:text-xl lg:text-xs xl:text-sm 2xl:text-base 3xl:text-lg text-primary-600 font-bold font-inter'>
                    {qIndex + 1}. {q.question}
                  </p>
                  {!isCorrect && (
                    <span className='text-xs lg:text-[10px] xl:text-xs warm:text-[#623627] 2xl:text-sm 3xl:text-base text-red-400 font-roboto whitespace-nowrap '>Wrong</span>
                  )}
                  {isCorrect && (
                    <span className='text-xs lg:text-[10px] xl:text-xs warm:text-[#623627] 2xl:text-sm 3xl:text-base text-green-500 font-roboto whitespace-nowrap '>Correct</span>
                  )}
                </div>

                <div className='flex flex-col gap-3 mt-5 lg:ml-4 md:ml-10 pb-3'>
                  {q.options.map((option, oIndex) => {
                    const letter = optionLetters[oIndex]
                    return (
                      <div
                        key={oIndex}
                        className={`flex items-center gap-3 warm:text-[#623627] warm:border-[#623627] border-2 lg:text-sm xl:text-base 2xl:text-lg 3xl:text-xl rounded-lg px-1 py-1 cursor-default ${getOptionStyle(qIndex, letter)}`}
                      >
                        <span className='w-4 h-4' />
                        <span className='text-xs md:text-xl lg:text-xs xl:text-sm 2xl:text-base 3xl:text-lg font-inter'>
                          {letter}) {option}
                        </span>
                        {letter === q.answer && (
                          <span className='ml-auto text-xs lg:text-[10px] xl:text-xs 2xl:text-sm 3xl:text-base text-green-600 font-semibold'>✓ Correct</span>
                        )}
                        {letter === userPicked && letter !== q.answer && (
                          <span className='ml-auto text-xs lg:text-[10px] xl:text-xs 2xl:text-sm 3xl:text-base text-red-500 font-semibold'>✗ Your answer</span>
                        )}
                      </div>
                    )
                  })}
                </div>

                <p className='text-xs md:text-sm lg:text-xs xl:text-sm 2xl:text-base 3xl:text-lg text-green-600 font-roboto font-semibold px-2 pb-3'>
                  ✓ Correct Answer: {q.answer}
                </p>
              </div>
            )
          })}

          {/* Action buttons */}
          <div className='flex flex-row ml-auto gap-4 mb-10'>
            <button
              className='hover:opacity-50 lg:text-sm xl:text-base 2xl:text-lg 3xl:text-xl lg:py-1 xl:py-1.5 2xl:py-2 3xl:py-2.5 bg-primary-800 text-white py-2 font-roboto md:px-14 px-8 text-sm md:text-xl rounded-md uppercase'
              onClick={handleBack}
            >
              Back
            </button>

          </div>
        </div>

      </main>
    </div>
  )
}

export default QuizView