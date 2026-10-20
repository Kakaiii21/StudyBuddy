import { useEffect, useRef } from 'react'
import type { Task } from './useTasks'

// Normalises "YYYY-MM-DDTHH:MM" → full ISO string with seconds so every
// browser treats it as local time, not UTC.
function toLocalISO(deadline: string): string {
  if (!deadline) return deadline
  // Already has seconds or timezone info — leave it alone
  if (deadline.length > 16) return deadline
  return deadline + ':00' // "2025-06-18T14:00" → "2025-06-18T14:00:00"
}

async function postToSW(message: object) {
  // 1. Already controlling — post directly
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message)
    return
  }

  // 2. SW is registered but not yet controlling (first load / hard refresh)
  const registration = await navigator.serviceWorker.ready
  if (registration.active) {
    registration.active.postMessage(message)
    return
  }
}

function scheduleAll(tasks: Task[]) {
  tasks.forEach((task) => {
    if (!task.deadline || task.status === 'done') {
      postToSW({ type: 'CANCEL_NOTIFICATION', taskId: task.id })
      return
    }

    postToSW({
      type: 'SCHEDULE_NOTIFICATION',
      taskId: task.id,
      taskName: task.name,
      // normalise before sending so SW math is always correct
      deadline: toLocalISO(task.deadline),
    })
  })
}

export function useTaskNotifications(tasks: Task[]) {
  const scheduledRef = useRef(false)

  // Request permission once
  useEffect(() => {
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') return
    if (!('serviceWorker' in navigator)) return
    // Don't schedule if tasks haven't loaded yet (empty array on first render)
    if (tasks.length === 0 && !scheduledRef.current) return

    scheduledRef.current = true
    scheduleAll(tasks)
  }, [tasks])
}