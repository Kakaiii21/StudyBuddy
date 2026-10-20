// hooks/useClassSched.ts
import { useState, useEffect } from 'react'
import { softDelete } from '../services/recentlyDeletedService'
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

export interface Schedule {
  id: string
  classId: string
  day: string
  subject: string
  timeStart: string
  timeEnd: string
  room: string
  roomType: string
  instructor: string
  uid: string
  createdAt: number
}

// One row of the "Schedule Meetings" table in the Add/Edit Class modal.
// `id` is present when the row already exists as a Firestore doc (editing);
// absent when it's a brand-new meeting slot being added.
export interface MeetingInput {
  id?: string
  day: string
  timeStart: string
  timeEnd: string
  room: string
  roomType: string
}

export function useClassSched(user: User | null) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        setSchedules([])
        setLoading(false)
      }, 0)
      return () => clearTimeout(timer)
    }

    const schedRef = collection(db, 'users', user.uid, 'schedules')
    const q = query(schedRef, orderBy('createdAt', 'asc'))

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const fetched: Schedule[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Schedule, 'id'>),
        }))
        setSchedules(fetched)
        setLoading(false)
      },
      (error) => {
        console.warn('Schedules snapshot error:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  // Legacy single-meeting create/update — still used internally by
  // addClass/updateClass, kept exported in case other call sites need it.
  function addSchedule(
    classId: string, day: string, subject: string, timeStart: string, timeEnd: string,
    room: string, roomType: string, instructor: string
  ) {
    if (!user) return
    return addDoc(collection(db, 'users', user.uid, 'schedules'), {
      classId, day, subject: subject.trim(), timeStart, timeEnd,
      room: room.trim(), roomType, instructor: instructor.trim(),
      uid: user.uid, createdAt: Date.now(),
    })
  }

  function updateSchedule(
    scheduleId: string,
    fields: Partial<Pick<Schedule, 'day' | 'subject' | 'timeStart' | 'timeEnd' | 'room' | 'roomType' | 'instructor'>>
  ) {
    if (!user) return
    const schedRef = doc(db, 'users', user.uid, 'schedules', scheduleId)
    return updateDoc(schedRef, fields)
  }

  // keep deleteSchedule with await — softDelete needs to complete
  async function deleteSchedule(scheduleId: string) {
    if (!user) return
    const schedule = schedules.find((s) => s.id === scheduleId)
    if (!schedule) return
    await softDelete(user.uid, {
      name: schedule.subject,
      type: 'Class Schedule',
      originalCollection: `users/${user.uid}/schedules`,
      originalDocId: scheduleId,
      data: { ...schedule },
    })
  }

  // Creates a brand-new class: one Firestore doc per meeting slot,
  // all sharing a fresh classId + the same subject/instructor.
  async function addClass(subject: string, instructor: string, meetings: MeetingInput[]) {
    if (!user) return
    const classId = doc(collection(db, 'users', user.uid, 'schedules')).id
    await Promise.all(
      meetings.map((m) =>
        addSchedule(classId, m.day, subject, m.timeStart, m.timeEnd, m.room, m.roomType, instructor)
      )
    )
    return classId
  }

  // Updates an existing class: syncs subject/instructor across all its
  // meeting docs, updates changed rows, adds new rows, and removes rows
  // that were deleted in the modal (via soft delete, same as a manual delete).
  async function updateClass(classId: string, subject: string, instructor: string, meetings: MeetingInput[]) {
    if (!user) return

    const existing = schedules.filter((s) => s.classId === classId)
    const keepIds = new Set(meetings.filter((m) => m.id).map((m) => m.id))
    const removed = existing.filter((s) => !keepIds.has(s.id))

    await Promise.all(removed.map((s) => deleteSchedule(s.id)))

    await Promise.all(
      meetings.map((m) => {
        if (m.id) {
          return updateSchedule(m.id, {
            day: m.day,
            subject,
            timeStart: m.timeStart,
            timeEnd: m.timeEnd,
            room: m.room.trim(),
            roomType: m.roomType,
            instructor,
          })
        }
        return addSchedule(classId, m.day, subject, m.timeStart, m.timeEnd, m.room, m.roomType, instructor)
      })
    )
  }

  return { schedules, loading, addSchedule, updateSchedule, deleteSchedule, addClass, updateClass }
}