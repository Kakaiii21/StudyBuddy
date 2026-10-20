import { useState, useEffect } from 'react'
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../services/firebase'
import { type User } from 'firebase/auth'
import { softDelete } from '../services/recentlyDeletedService'

export type Status = 'todo' | 'in-progress' | 'done'

export interface Task {
  id: string
  name: string
  deadline: string
  status: Status
  uid: string
  createdAt: number
}

export function useTasks(user: User | null) {
  const [tasks, setTasks] = useState<Task[]>([])
  // Tracks which uid the current `tasks` array actually belongs to (or
  // null once we've confirmed there's no signed-in user). Only ever
  // written from inside a callback (the onSnapshot listener, or the
  // timeout below) — never synchronously in the effect body.
  const [tasksOwner, setTasksOwner] = useState<string | null>(null)

  // Derived, not stored: we're "loading" exactly when the tasks we're
  // holding don't yet correspond to the current user — covers both the
  // very first fetch for a user and a mid-flight fetch after the user
  // identity changes, without ever calling setState directly in the
  // effect body.
  const loading = (user?.uid ?? null) !== tasksOwner

  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        setTasks([])
        setTasksOwner(null)
      }, 0)
      return () => clearTimeout(timer)
    }

    const tasksRef = collection(db, 'users', user.uid, 'tasks')
    const q = query(tasksRef, orderBy('createdAt', 'asc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Task[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Task, 'id'>),
      }))
      setTasks(fetched)
      setTasksOwner(user.uid)
    })

    return () => unsubscribe()
  }, [user])

     function addTask(name: string, deadline: string) {
      if (!user || !name.trim()) return
      // don't await — write is queued locally, Firebase syncs when online
      addDoc(collection(db, 'users', user.uid, 'tasks'), {
        name: name.trim(),
        deadline,
        status: 'todo' as Status,
        uid: user.uid,
        createdAt: Date.now(),
      })
    }

     function updateTask(taskId: string, fields: Partial<Pick<Task, 'name' | 'deadline'>>) {
      if (!user) return
      const taskRef = doc(db, 'users', user.uid, 'tasks', taskId)
      // don't await — same reason
      updateDoc(taskRef, fields)
    }
    function updateTaskStatus(taskId: string, newStatus: Status) {
      if (!user) return
      const taskRef = doc(db, 'users', user.uid, 'tasks', taskId)
      updateDoc(taskRef, { status: newStatus })
    }

  async function deleteTask(taskId: string) {
    if (!user) return
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    await softDelete(user.uid, {
      name: task.name,
      type: 'To Do',
      originalCollection: `users/${user.uid}/tasks`,
      originalDocId: taskId,
      data: { ...task },
    })
  }

  return { tasks, loading, addTask, updateTask, updateTaskStatus, deleteTask }
}