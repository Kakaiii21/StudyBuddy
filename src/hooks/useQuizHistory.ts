import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { softDelete } from '../services/recentlyDeletedService'
import { db } from '../services/firebase'
import type { User } from 'firebase/auth'

export interface QuizHistoryItem {
  id: string
  fileName: string
  score: number
  total: number
  dateTaken: Date
  items: { question: string; options: string[]; answer: string }[]
  selectedAnswers: Record<number, string>
}

interface QuizHistoryState {
  quizHistory: QuizHistoryItem[]
  loading: boolean
}

export function useQuizHistory(user: User | null) {
  const [state, setState] = useState<QuizHistoryState>({
    quizHistory: [],
    loading: user !== null,
  })

  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'users', user.uid, 'quizHistory'),
      orderBy('dateTaken', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // ✅ setState is inside a callback (async external update), not synchronously in the effect body
      const quizHistory = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        dateTaken: d.data().dateTaken?.toDate?.() ?? new Date(),
      })) as QuizHistoryItem[]

      setState({ quizHistory, loading: false })
    })

    return unsubscribe
  }, [user])

  const deleteQuiz = async (id: string) => {
    if (!user) return
    const item = state.quizHistory.find((q) => q.id === id)
    if (!item) return
    await softDelete(user.uid, {
      name: item.fileName,
      type: 'Quiz',
      originalCollection: `users/${user.uid}/quizHistory`,
      originalDocId: id,
      data: { ...item, dateTaken: item.dateTaken.toISOString() },
    })
  }

  return { ...state, deleteQuiz }
}