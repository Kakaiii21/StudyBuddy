import { driver } from 'driver.js'
import type { DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'

// ─── Desktop (lg and above, 1024px+) ───────────────────────────────────────
const dashboardDesktop: DriveStep[] = [
  {
  element: '#tour-btn',
  popover: {
    title: '❓ Need Help Anytime?',
    description: 'Click this button whenever you need a tour of the current page.',
    side: 'left',
  },
  },
  {
    element: '#idCard',
    popover: {
      title: '🪪 Your Student ID Card',
      description: 'Tap this card anytime to customize your name, age, year level, and card color.',
      side: 'bottom',
    },
  },
  {
    element: '#currentTime',
    popover: {
      title: '⏱️ Total Study Time',
      description: 'This shows how much time you\'ve logged studying so far. Keep the streak going!',
      side: 'bottom',
    },
  },
  {
    element: '#currentScore',
    popover: {
      title: '🏆 Latest Quiz Score',
      description: 'Your most recent quiz result appears here. Take more quizzes to keep improving!',
      side: 'bottom',
    },
  },
  {
    element: '#timer',
    popover: {
      title: '⏳ Study Timer',
      description: 'Use this timer to time your study sessions. It automatically logs your focus time to your stats.',
      side: 'left',
    },
  },
  {
    element: '#setTime',
    popover: {
      title: '🕐 Set Your Session Length',
      description: 'Tap here to choose how long you want to study before the timer starts counting down.',
      side: 'left',
    },
  },
  {
    element: '#progressC',
    popover: {
      title: '✅ Task Progress',
      description: 'This ring shows how much of your to-do list you\'ve completed. Keep checking things off!',
      side: 'top',
    },
  },
  {
    element: '#activitiesGrid',
    popover: {
      title: '🚀 Quick Access',
      description: 'Click any of these to go to different pages, like Notes, To-Do List, or your Class Schedule.',
      side: 'top',
    },
  },
]

// ─── Tablet (md, 768px–1023px) ─────────────────────────────────────────────
const dashboardTablet: DriveStep[] = [
  {
  element: '#tour-btn',
  popover: {
    title: '❓ Need Help Anytime?',
    description: 'Click this button whenever you need a tour of the current page.',
    side: 'top',
  },
  },
  {
    element: '#idCard',
    popover: {
      title: '🪪 Your Student ID Card',
      description: 'Tap this card anytime to customize your name, age, year level, and card color.',
      side: 'right',
    },
  },
  {
    element: '#sidebar-btn',
    popover: {
      title: '☰ Open the Sidebar',
      description: 'Tap this button to open the sidebar — it\'s how you navigate between pages in Study Buddy.',
      side: 'right',
    },
  },
  {
    element: '#sidebar',
    popover: {
      title: '🗂️ Navigation Menu',
      description: 'From here you can jump to any section of the app — Notes, Files, Quizzes, and more.',
      side: 'over',
    },
  },
  {
    element: '#timer-btn',
    popover: {
      title: '⏳ Open Study Timer',
      description: 'Click to open the study timer.',
      side: 'bottom',
    },
  },
  {
    element: '#currentTime',
    popover: {
      title: '⏱️ Total Study Time',
      description: 'This shows how much time you\'ve logged studying so far. Keep the streak going!',
      side: 'bottom',
    },
  },
  {
    element: '#currentScore',
    popover: {
      title: '🏆 Latest Quiz Score',
      description: 'Your most recent quiz result appears here. Take more quizzes to keep improving!',
      side: 'bottom',
    },
  },
  {
    element: '#progressC',
    popover: {
      title: '✅ Task Progress',
      description: 'This ring shows how much of your to-do list you\'ve completed. Keep checking things off!',
      side: 'top',
    },
  },
  {
    element: '#activitiesGrid',
    popover: {
      title: '🚀 Quick Access',
      description: 'Click any of these to go to different pages, like Notes, To-Do List, or your Class Schedule.',
      side: 'top',
    },
  },
]

// ─── Mobile (below 768px) ───────────────────────────────────────────────────
const dashboardMobile: DriveStep[] = [
  {
  element: '#tour-btn',
  popover: {
    title: '❓ Need Help Anytime?',
    description: 'Click this button whenever you need a tour of the current page.',
    side: 'top',
  },
  },
  {
    element: '#idCard',
    popover: {
      title: '🪪 Your Student ID Card',
      description: 'Tap this card anytime to customize your name, age, year level, and card color.',
      side: 'bottom',
    },
  },
  {
    element: '#sidebar-btn',
    popover: {
      title: '☰ Open the Sidebar',
      description: 'Tap this button to open the sidebar — it\'s how you navigate between pages in Study Buddy.',
      side: 'right',
    },
  },
  {
    element: '#sidebar',
    popover: {
      title: '🗂️ Navigation Menu',
      description: 'From here you can jump to any section of the app — Notes, Files, Quizzes, and more.',
      side: 'over',
    },
  },
  {
    element: '#timer-btn',
    popover: {
      title: '⏳ Open Study Timer',
      description: 'Click to open the study timer.',
      side: 'left',
    },
  },
  {
    element: '#currentTime',
    popover: {
      title: '⏱️ Total Study Time',
      description: 'This shows how much time you\'ve logged studying so far. Keep the streak going!',
      side: 'bottom',
    },
  },
  {
    element: '#currentScore',
    popover: {
      title: '🏆 Latest Quiz Score',
      description: 'Your most recent quiz result appears here. Take more quizzes to keep improving!',
      side: 'bottom',
    },
  },
  {
    element: '#progressC',
    popover: {
      title: '✅ Task Progress',
      description: 'This ring shows how much of your to-do list you\'ve completed. Keep checking things off!',
      side: 'top',
    },
  },
  {
    element: '#activitiesGrid',
    popover: {
      title: '🚀 Quick Access',
      description: 'Click any of these to go to different pages, like Notes, To-Do List, or your Class Schedule.',
      side: 'top',
    },
  },
]
// ─── To-Do List Desktop (lg+, 1024px+) ──────────────────────────────────────
const todolistDesktop: DriveStep[] = [
  {
    element: '#clearAllBtn',
    popover: {
      title: '🗑️ Clear All Tasks',
      description:
        'Click here to move every task to Recently Deleted at once. You can restore them within 30 days.',
      side: 'left',
    },
  },
  {
    element: '#newTaskBtn',
    popover: {
      title: '➕ Create a Task',
      description:
        'Click here to add a new task. Give it a title and a deadline to get started.',
      side: 'left',
    },
  },
  {
    element: '#todoColumns',
    popover: {
      title: '🗂️ Task Board',
      description:
        'Your tasks are organized into three columns: To Do, In Progress, and Done.',
      side: 'over',
    },
  },
  {
    element: '#taskCard',
    popover: {
      title: '📌 Task Card',
      description:
        'Each card is a task. Drag and drop it between columns as you work to keep your progress up to date.',
      side: 'right',
    },
  },
  {
    element: '#taskOptionsBtn',
    popover: {
      title: '⚙️ Task Options',
      description:
        'Need to make changes? Click the three dots to edit or delete this task.',
      side: 'right',
    },
  },
]

// ─── To-Do List Tablet (md, 768px–1023px) ───────────────────────────────────
const todolistTablet: DriveStep[] = [
  {
    element: '#taskFabBtn',
    popover: {
      title: '➕ Quick Actions',
      description:
        'Tap this floating button to add a new task or clear all tasks at once.',
      side: 'left',
    },
  },
  {
    element: '#fabClearAllBtn',
    popover: {
      title: '🗑️ Clear All Tasks',
      description:
        'Tap here to move every task to Recently Deleted at once. You can restore them within 30 days.',
      side: 'left',
    },
  },
  {
    element: '#fabAddTaskBtn',
    popover: {
      title: '➕ Create a Task',
      description:
        'Tap here to add a new task. Give it a title and a deadline to get started.',
      side: 'left',
    },
  },
  {
    element: '#todoColumns',
    popover: {
      title: '🗂️ Task Board',
      description:
        'Your tasks are organized into three columns: To Do, In Progress, and Done.',
      side: 'top',
    },
  },
  {
    element: '#colCollapseBtn',
    popover: {
      title: '🔼 Expand or Collapse',
      description:
        'Tap the arrow to collapse a column and hide its tasks, or expand it again to see them.',
      side: 'top',
    },
  },
  {
    element: '#taskCard',
    popover: {
      title: '📌 Task Card',
      description:
        'Each card is a task. Drag and drop it between columns as you work to keep your progress up to date.',
      side: 'top',
    },
  },
  {
    element: '#taskOptionsBtn',
    popover: {
      title: '⚙️ Task Options',
      description:
        'Need to make changes? Tap the three dots to edit or delete this task.',
      side: 'left',
    },
  },
]

// ─── To-Do List Mobile (below 768px) ────────────────────────────────────────
const todolistMobile: DriveStep[] = [
  {
    element: '#taskFabBtn',
    popover: {
      title: '➕ Quick Actions',
      description:
        'Tap this floating button to add a new task or clear all tasks at once.',
      side: 'left',
    },
  },
  {
    element: '#fabClearAllBtn',
    popover: {
      title: '🗑️ Clear All Tasks',
      description:
        'Tap here to move every task to Recently Deleted at once. You can restore them within 30 days.',
      side: 'left',
    },
  },
  {
    element: '#fabAddTaskBtn',
    popover: {
      title: '➕ Create a Task',
      description:
        'Tap here to add a new task. Give it a title and a deadline to get started.',
      side: 'left',
    },
  },
  {
    element: '#todoColumns',
    popover: {
      title: '🗂️ Task Board',
      description:
        'Your tasks are organized into three columns: To Do, In Progress, and Done.',
      side: 'over'
    },
  },
  {
    element: '#colCollapseBtn',
    popover: {
      title: '🔼 Expand or Collapse',
      description:
        'Tap the arrow to collapse a column and hide its tasks, or expand it again to see them.',
      side: 'top',
    },
  },
  {
    element: '#taskCard',
    popover: {
      title: '📌 Task Card',
      description:
        'Each card is a task. Drag and drop it between columns as you work to keep your progress up to date.',
      side: 'top',
    },
  },
  {
    element: '#taskOptionsBtn',
    popover: {
      title: '⚙️ Task Options',
      description:
        'Need to make changes? Tap the three dots to edit or delete this task.',
      side: 'left',
    },
  },
]
// ─── Notes Desktop (lg+, 1024px+) ───────────────────────────────────────────
const notesDesktop: DriveStep[] = [
  {
    element: '#notesSearchBar',
    popover: {
      title: '🔍 Search Notes',
      description: 'Quickly find a note by typing part of its title here.',
      side: 'left',
    },
  },
  {
    element: '#addSubjectBtn',
    popover: {
      title: '➕ Add a Category',
      description: 'Create a new category to organize your notes by class or topic.',
      side: 'left',
    },
  },
  {
    element: '#subjectDropdownDesktop',
    popover: {
      title: '🗂️ Filter by Category',
      description: 'Use this dropdown to view notes from a specific category, or see all of them at once.',
      side: 'left',
    },
  },

  {
    element: '#newNoteBtnDesktop',
    popover: {
      title: '📝 Create a Note',
      description: 'Click here to write a new note.',
      side: 'right',
    },
  },
  {
    element: '#notesGrid',
    popover: {
      title: '📚 Your Notes',
      description: 'Click any note card to view it in full.',
      side: 'bottom',
    },
  },
  {
    element: '#noteOptionsBtn',
    popover: {
      title: '⋮ Note Options',
      description: 'Click the three dots on any note to edit, download as a .txt file, or delete it.',
      side: 'left',
    },
  },
]

// ─── Notes Tablet (md, 768px–1023px) ────────────────────────────────────────
const notesTablet: DriveStep[] = [
  {
    element: '#notesSearchBarMobile',
    popover: {
      title: '🔍 Search Notes',
      description: 'Quickly find a note by typing part of its title here.',
      side: 'bottom',
    },
  },
  {
    element: '#addSubjectBtnMobile',
    popover: {
      title: '➕ Add a Category',
      description: 'Create a new category to organize your notes by class or topic.',
      side: 'bottom',
    },
  },
  {
    element: '#subjectDropdown',
    popover: {
      title: '🗂️ Filter by Category',
      description: 'Use this dropdown to view notes from a specific category, or see all of them at once.',
      side: 'bottom',
    },
  },

  {
    element: '#newNoteBtnMobile',
    popover: {
      title: '📝 Create a Note',
      description: 'Tap here to write a new note.',
      side: 'right',
    },
  },
  {
    element: '#notesGrid',
    popover: {
      title: '📚 Your Notes',
      description: 'Tap any note card to view it in full.',
      side: 'left',
    },
  },
  {
    element: '#noteOptionsBtn',
    popover: {
      title: '⋮ Note Options',
      description: 'Tap the three dots on any note to edit, download as a .txt file, or delete it.',
      side: 'left',
    },
  },
]

// ─── Notes Mobile (below 768px) ─────────────────────────────────────────────
const notesMobile: DriveStep[] = [
  {
    element: '#notesSearchBarMobile',
    popover: {
      title: '🔍 Search Notes',
      description: 'Quickly find a note by typing part of its title here.',
      side: 'bottom',
    },
  },
  {
    element: '#addSubjectBtnMobile',
    popover: {
      title: '➕ Add a Category',
      description: 'Create a new category to organize your notes by class or topic.',
      side: 'bottom',
    },
  },
  {
    element: '#subjectDropdown',
    popover: {
      title: '🗂️ Filter by Category',
      description: 'Use this dropdown to view notes from a specific category, or see all of them at once.',
      side: 'bottom',
    },
  },
  {
    element: '#newNoteBtnMobile',
    popover: {
      title: '📝 Create a Note',
      description: 'Tap here to write a new note.',
      side: 'bottom',
    },
  },
  {
    element: '#notesGrid',
    popover: {
      title: '📚 Your Notes',
      description: 'Tap any note card to view it in full.',
      side: 'bottom',
    },
  },
  {
    element: '#noteOptionsBtn',
    popover: {
      title: '⋮ Note Options',
      description: 'Tap the three dots on any note to edit, download as a .txt file, or delete it.',
      side: 'bottom',
    },
  },
]
// ─── Class Schedule Desktop (lg+, 1024px+) ──────────────────────────────────
const classscheduleDesktop: DriveStep[] = [
  {
    element: '#clearScheduleBtn',
    popover: {
      title: '🗑️ Clear All Schedules',
      description: 'This removes every class from your schedule. Use with care — it can\'t be undone.',
      side: 'left',
    },
  },
  {
    element: '#addScheduleBtn',
    popover: {
      title: '➕ Add a Class',
      description: 'Click here to add a new class with its day, time, room, and instructor.',
      side: 'left',
    },
  },
  {
    element: '#scheduleGrid',
    popover: {
      title: '📅 Your Weekly Schedule',
      description: 'See all your classes organized by day, Monday through Sunday.',
      side: 'right',
    },
  },
  {
    element: '#scheduleOptionsBtn',
    popover: {
      title: '⋮ Class Options',
      description: 'Click this icon on any class to edit its details or delete it.',
      side: 'right',
    },
  },
]

// ─── Class Schedule Tablet (md, 768px–1023px) ───────────────────────────────
const classscheduleTablet: DriveStep[] = [
  {
    element: '#scheduleFabBtn',
    popover: {
      title: '➕ Quick Actions',
      description: 'Tap this floating button to add a new class or clear all schedules at once.',
      side: 'left',
    },
  },
  {
    element: '#fabClearScheduleBtn',
    popover: {
      title: '🗑️ Clear All Schedules',
      description: 'This removes every class from your schedule. Use with care — it can\'t be undone.',
      side: 'left',
    },
  },
  {
    element: '#fabAddScheduleBtn',
    popover: {
      title: '➕ Add a Class',
      description: 'Tap here to add a new class with its day, time, room, and instructor.',
      side: 'left',
    },
  },
  {
    element: '#scheduleGrid',
    popover: {
      title: '📅 Your Weekly Schedule',
      description: 'See all your classes organized by day, Monday through Sunday.',
      side: 'right',
    },
  },
  {
    element: '#scheduleOptionsBtn',
    popover: {
      title: '⋮ Class Options',
      description: 'Tap this icon on any class to edit its details or delete it.',
      side: 'right',
    },
  },
]

// ─── Class Schedule Mobile (below 768px) ────────────────────────────────────
const classscheduleMobile: DriveStep[] = [
  {
    element: '#scheduleFabBtn',
    popover: {
      title: '➕ Quick Actions',
      description: 'Tap this floating button to add a new class or clear all schedules at once.',
      side: 'left',
    },
  },
  {
    element: '#fabClearScheduleBtn',
    popover: {
      title: '🗑️ Clear All Schedules',
      description: 'This removes every class from your schedule. Use with care — it can\'t be undone.',
      side: 'left',
    },
  },
  {
    element: '#fabAddScheduleBtn',
    popover: {
      title: '➕ Add a Class',
      description: 'Tap here to add a new class with its day, time, room, and instructor.',
      side: 'left',
    },
  },
  {
    element: '#scheduleGrid',
    popover: {
      title: '📅 Your Weekly Schedule',
      description: 'See all your classes organized by day, Monday through Sunday.',
      side: 'right',
    },
  },
  {
    element: '#scheduleOptionsBtn',
    popover: {
      title: '⋮ Class Options',
      description: 'Tap this icon on any class to edit its details or delete it.',
      side: 'right',
    },
  },
]

// ─── Courses Desktop (lg+, 1024px+) ─────────────────────────────────────────
const coursesDesktop: DriveStep[] = [
  {
    element: '#addCourseBtn',
    popover: {
      title: '➕ Add a new Folder',
      description: 'Click here to create a new folder for organizing files under a specific files.',
      side: 'left',
    },
  },
  {
    element: '#courseSearchBar',
    popover: {
      title: '🔍 Search  Folder',
      description: 'Quickly find a folder by typing part of its name here.',
      side: 'left',
    },
  },
  {
    element: '#coursesGrid',
    popover: {
      title: '📁 Your Folders',
      description: 'All your files folders live here. Click one to open it and see the files inside.',
      side: 'right',
    },
  },
  {
    element: '#courseFolder',
    popover: {
      title: '📁 File Folder',
      description:
        'Open this folder to view, upload, and organize your academic files.',
      side: 'right',
    },
  },
  {
    element: '#courseOptionsBtn',
    popover: {
      title: '⋮ Folder Options',
      description: 'Click this icon on any folder to rename it or move it to Recently Deleted.',
      side: 'right',
    },
  },
]

// ─── Courses Tablet (md, 768px–1023px) ──────────────────────────────────────
const coursesTablet: DriveStep[] = [
  {
    element: '#courseSearchBar',
    popover: {
      title: '🔍 Search Files Folder',
      description: 'Quickly find a folder by typing part of its name here.',
      side: 'bottom',
    },
  },
  {
    element: '#addCourseBtn',
    popover: {
      title: '➕ Add a new Folder',
      description: 'Tap here to create a new folder for organizing files under a specific files.',
      side: 'bottom',
    },
  },
  {
    element: '#coursesGrid',
    popover: {
      title: '📁 Your Folders',
      description: 'All your files folders live here. Tap one to open it and see the files inside.',
      side: 'bottom',
    },
  },
  {
    element: '#courseFolder',
    popover: {
      title: '📁 File Folder',
      description:
        'Open this folder to view, upload, and organize your academic files.',
      side: 'right',
    },
  },
  {
    element: '#courseOptionsBtn',
    popover: {
      title: '⋮ Folder Options',
      description: 'Tap this icon on any folder to rename it or move it to Recently Deleted.',
      side: 'right',
    },
  },
]

// ─── Courses Mobile (below 768px) ───────────────────────────────────────────
const coursesMobile: DriveStep[] = [
  {
    element: '#courseSearchBar',
    popover: {
      title: '🔍 Search Folders',
      description: 'Quickly find a folder by typing part of its name here.',
      side: 'bottom',
    },
  },
  {
    element: '#addCourseBtn',
    popover: {
      title: '➕ Add a new Folder',
      description: 'Tap here to create a new folder for organizing files under a specific files.',
      side: 'bottom',
    },
  },
  {
    element: '#coursesGrid',
    popover: {
      title: '📁 Your Files Folders',
      description: 'All your files folders live here. Tap one to open it and see the files inside.',
      side: 'bottom',
    },
  },
  {
    element: '#courseFolder',
    popover: {
      title: '📁 Files Folder',
      description:
        'Open this folder to view, upload, and organize your academic files.',
      side: 'bottom',
    },
  },
  {
    element: '#courseOptionsBtn',
    popover: {
      title: '⋮ Folder Options',
      description: 'Tap this icon on any folder to rename it or move it to Recently Deleted.',
      side: 'bottom',
    },
  },
]
// ─── Course Folder Desktop (lg+, 1024px+) ───────────────────────────────────
const coursefolderDesktop: DriveStep[] = [
  {
    element: '#goBackBtn-desktop',
    popover: {
      title: '⬅️ Go Back',
      description:
        'Click here anytime to return to the Files Folder.',
      side: 'right',
    },
  },
  {
    element: '#file-filter',
    popover: {
      title: '🔍 Filter by File Type',
      description: 'Narrow down what you see — PDFs, Word docs, PowerPoint, images, and more.',
      side: 'left',
    },
  },
  {
    element: '#uploadFilesBtn',
    popover: {
      title: '⬆️ Upload Files',
      description: 'Click here to upload a new file to this folder. Max 10 MB per file.',
      side: 'left',
    },
  },
  {
    element: '#storageBar',
    popover: {
      title: '💾 Storage Usage',
      description: 'Track how much of your 1 GB storage you\'ve used across all your files.',
      side: 'bottom',
    },
  },
  {
    element: '#filesGrid',
    popover: {
      title: '📄 Your Files',
      description: 'Click any file to preview it right in the browser.',
      side: 'top',
    },
  },
  {
    element: '#fileOptionsBtn',
    popover: {
      title: '⋮ File Options',
      description: 'Click this icon on any file to rename, download, or delete it.',
      side: 'right',
    },
  },
]

// ─── Course Folder Tablet (md, 768px–1023px) ────────────────────────────────
const coursefolderTablet: DriveStep[] = [
  {
    element: '#goBackBtn',
    popover: {
      title: '⬅️ Go Back',
      description:
        'Click here anytime to return to the Files Folder.',
      side: 'right',
    },
  },
  {
    element: '#file-filter',
    popover: {
      title: '🔍 Filter by File Type',
      description: 'Narrow down what you see — PDFs, Word docs, PowerPoint, images, and more.',
      side: 'left',
    },
  },
  {
    element: '#uploadFilesBtn',
    popover: {
      title: '⬆️ Upload Files',
      description: 'Tap here to upload a new file to this course folder. Max 10 MB per file.',
      side: 'left',
    },
  },
  {
    element: '#storageBar',
    popover: {
      title: '💾 Storage Usage',
      description: 'Track how much of your 1 GB storage you\'ve used across all your files.',
      side: 'bottom',
    },
  },
  {
    element: '#filesGrid',
    popover: {
      title: '📄 Your Files',
      description: 'Tap any file to preview it right in the browser.',
      side: 'top',
    },
  },
  {
    element: '#fileOptionsBtn',
    popover: {
      title: '⋮ File Options',
      description: 'Tap this icon on any file to rename, download, or delete it.',
      side: 'left',
    },
  },
]

// ─── Course Folder Mobile (below 768px) ─────────────────────────────────────
const coursefolderMobile: DriveStep[] = [
  {
    element: '#goBackBtn-mobile',
    popover: {
      title: '⬅️ Go Back',
      description:
        'Click here anytime to return to the Files Folder.',
      side: 'right',
    },
  },
  {
    element: '#file-filter',
    popover: {
      title: '🔍 Filter by File Type',
      description: 'Narrow down what you see — PDFs, Word docs, PowerPoint, images, and more.',
      side: 'bottom',
    },
  },
  {
    element: '#uploadFilesBtn',
    popover: {
      title: '⬆️ Upload Files',
      description: 'Tap here to upload a new file to this course folder. Max 10 MB per file.',
      side: 'bottom',
    },
  },
  {
    element: '#storageBar',
    popover: {
      title: '💾 Storage Usage',
      description: 'Track how much of your 1 GB storage you\'ve used across all your files.',
      side: 'bottom',
    },
  },
  {
    element: '#filesGrid',
    popover: {
      title: '📄 Your Files',
      description: 'Tap any file to preview it right in the browser.',
      side: 'top',
    },
  },
  {
    element: '#fileOptionsBtn',
    popover: {
      title: '⋮ File Options',
      description: 'Tap this icon on any file to rename, download, or delete it.',
      side: 'top',
    },
  },
]
// ─── Study Generator Desktop (lg+, 1024px+) ─────────────────────────────────
const studygeneratorDesktop: DriveStep[] = [
  {
    element: '#localFilesBtn',
    popover: {
      title: '💻 Upload a Local File',
      description: 'Click here to upload a file straight from your device.',
      side: 'bottom',
    },
  },
  {
    element: '#courseFilesBtn',
    popover: {
      title: '📁 Use a File',
      description: 'Already uploaded a file to one of your course folders? Pick it here instead.',
      side: 'bottom',
    },
  },
  {
    element: '#quizTabBtn',
    popover: {
      title: '📝 Quiz Mode',
      description: 'Generate multiple-choice questions based on your uploaded file.',
      side: 'bottom',
    },
  },
  {
    element: '#flashcardTabBtn',
    popover: {
      title: '🃏 Flashcard Mode',
      description: 'Generate flashcards instead, great for quick review and memorization.',
      side: 'bottom',
    },
  },
  {
    element: '#itemsSelect',
    popover: {
      title: '🔢 Number of Items',
      description: 'Choose how many questions or flashcards you want generated.',
      side: 'top',
    },
  },
  {
    element: '#randomItemsBtn',
    popover: {
      title: '🎲 Feeling Random?',
      description: 'Let Study Buddy pick a random number of items for you.',
      side: 'top',
    },
  },
  {
    element: '#generateNowBtn',
    popover: {
      title: '🚀 Generate',
      description: 'Once you\'re ready, click here to generate your quiz or flashcards.',
      side: 'top',
    },
  },
]

// ─── Study Generator Tablet (md, 768px–1023px) ──────────────────────────────
const studygeneratorTablet: DriveStep[] = [
  {
    element: '#tour-btn',
    popover: {
      title: '❓ Need Help Anytime?',
      description: 'Tap this button whenever you need a tour of the current page.',
      side: 'top',
    },
  },
  {
    element: '#localFilesBtn',
    popover: {
      title: '💻 Upload a Local File',
      description: 'Tap here to upload a file straight from your device.',
      side: 'bottom',
    },
  },
  {
    element: '#courseFilesBtn',
    popover: {
      title: '📁 Use a File',
      description: 'Already uploaded a file to one of your course folders? Pick it here instead.',
      side: 'bottom',
    },
  },
  {
    element: '#quizTabBtn',
    popover: {
      title: '📝 Quiz Mode',
      description: 'Generate multiple-choice questions based on your uploaded file.',
      side: 'bottom',
    },
  },
  {
    element: '#flashcardTabBtn',
    popover: {
      title: '🃏 Flashcard Mode',
      description: 'Generate flashcards instead, great for quick review and memorization.',
      side: 'bottom',
    },
  },
  {
    element: '#itemsSelect',
    popover: {
      title: '🔢 Number of Items',
      description: 'Choose how many questions or flashcards you want generated.',
      side: 'top',
    },
  },
  {
    element: '#randomItemsBtn',
    popover: {
      title: '🎲 Feeling Random?',
      description: 'Let Study Buddy pick a random number of items for you.',
      side: 'top',
    },
  },
  {
    element: '#generateNowBtn',
    popover: {
      title: '🚀 Generate',
      description: 'Once you\'re ready, tap here to generate your quiz or flashcards.',
      side: 'top',
    },
  },
]

// ─── Study Generator Mobile (below 768px) ───────────────────────────────────
const studygeneratorMobile: DriveStep[] = [
  {
    element: '#localFilesBtn',
    popover: {
      title: '💻 Upload a Local File',
      description: 'Tap here to upload a file straight from your device.',
      side: 'bottom',
    },
  },
  {
    element: '#courseFilesBtn',
    popover: {
      title: '📁 Use a File',
      description: 'Already uploaded a file to one of your course folders? Pick it here instead.',
      side: 'bottom',
    },
  },
  {
    element: '#quizTabBtn',
    popover: {
      title: '📝 Quiz Mode',
      description: 'Generate multiple-choice questions based on your uploaded file.',
      side: 'bottom',
    },
  },
  {
    element: '#flashcardTabBtn',
    popover: {
      title: '🃏 Flashcard Mode',
      description: 'Generate flashcards instead, great for quick review and memorization.',
      side: 'bottom',
    },
  },
  {
    element: '#itemsSelect',
    popover: {
      title: '🔢 Number of Items',
      description: 'Choose how many questions or flashcards you want generated.',
      side: 'top',
    },
  },
  {
    element: '#randomItemsBtn',
    popover: {
      title: '🎲 Feeling Random?',
      description: 'Let Study Buddy pick a random number of items for you.',
      side: 'top',
    },
  },
  {
    element: '#generateNowBtn',
    popover: {
      title: '🚀 Generate',
      description: 'Once you\'re ready, tap here to generate your quiz or flashcards.',
      side: 'top',
    },
  },
]
// ─── Generated History Desktop (lg+, 1024px+) ───────────────────────────────
const generatedhistoryDesktop: DriveStep[] = [
  {
    element: '#genTypeSelect',
    popover: {
      title: '🔀 Switch View',
      description: 'Toggle between your Quiz history and Flashcard history here.',
      side: 'left',
    },
  },
  {
    element: '#genSearchBar',
    popover: {
      title: '🔍 Search History',
      description: 'Quickly find a past quiz or flashcard set by file name.',
      side: 'left',
    },
  },
  {
    element: '#genTable',
    popover: {
      title: '📋 Your Generated Materials',
      description: 'View, retake, or delete any previously generated quiz or flashcard set from here.',
      side: 'top',
    },
  },
  {
    element: '#viewBtn',
    popover: {
      title: '👁️ View',
      description: 'Click here to review this quiz or flashcard set in detail.',
      side: 'left',
    },
  },
  {
    element: '#retakeBtn',
    popover: {
      title: '🔄 Retake',
      description: 'Click here to retake this quiz with a fresh attempt.',
      side: 'left',
    },
  },
  {
    element: '#deleteBtn',
    popover: {
      title: '🗑️ Delete',
      description: 'Click here to move this item to Recently Deleted.',
      side: 'left',
    },
  },
]

// ─── Generated History Tablet (md, 768px–1023px) ────────────────────────────
const generatedhistoryTablet: DriveStep[] = [
  {
    element: '#genTypeSelect',
    popover: {
      title: '🔀 Switch View',
      description: 'Tap to toggle between your Quiz history and Flashcard history.',
      side: 'bottom',
    },
  },
  {
    element: '#genSearchBar',
    popover: {
      title: '🔍 Search History',
      description: 'Quickly find a past quiz or flashcard set by file name.',
      side: 'bottom',
    },
  },
  {
    element: '#genTable',
    popover: {
      title: '📋 Your Generated Materials',
      description: 'View, retake, or delete any previously generated quiz or flashcard set from here.',
      side: 'bottom',
    },
  },
  {
    element: '#viewBtn',
    popover: {
      title: '👁️ View',
      description: 'Tap here to review this quiz or flashcard set in detail.',
      side: 'left',
    },
  },
  {
    element: '#retakeBtn',
    popover: {
      title: '🔄 Retake',
      description: 'Tap here to retake this quiz with a fresh attempt.',
      side: 'left',
    },
  },
  {
    element: '#deleteBtn',
    popover: {
      title: '🗑️ Delete',
      description: 'Tap here to move this item to Recently Deleted.',
      side: 'left',
    },
  },
]

// ─── Generated History Mobile (below 768px) ─────────────────────────────────
const generatedhistoryMobile: DriveStep[] = [
  {
    element: '#genTypeSelect',
    popover: {
      title: '🔀 Switch View',
      description: 'Tap to toggle between your Quiz history and Flashcard history.',
      side: 'bottom',
    },
  },
  {
    element: '#genSearchBar',
    popover: {
      title: '🔍 Search History',
      description: 'Quickly find a past quiz or flashcard set by file name.',
      side: 'bottom',
    },
  },
  {
    element: '#genTable',
    popover: {
      title: '📋 Your Generated Materials',
      description: 'View, retake, or delete any previously generated quiz or flashcard set from here.',
      side: 'bottom',
    },
  },
  {
    element: '#viewBtn',
    popover: {
      title: '👁️ View',
      description: 'Tap here to review this quiz or flashcard set in detail.',
      side: 'bottom',
    },
  },
  {
    element: '#retakeBtn',
    popover: {
      title: '🔄 Retake',
      description: 'Tap here to retake this quiz with a fresh attempt.',
      side: 'bottom',
    },
  },
  {
    element: '#deleteBtn',
    popover: {
      title: '🗑️ Delete',
      description: 'Tap here to move this item to Recently Deleted.',
      side: 'bottom',
    },
  },
]
// ─── Recently Deleted Desktop (lg+, 1024px+) ────────────────────────────────
const recentlydeletedDesktop: DriveStep[] = [
  {
    element: '#filterTypeSelect',
    popover: {
      title: '🔀 Filter by Type',
      description: 'Switch between To Do, Notes, Class Schedule, My Files, Quiz, and Flashcard items.',
      side: 'left',
    },
  },
  {
    element: '#deletedSearchBar',
    popover: {
      title: '🔍 Search',
      description: 'Quickly find a deleted item by name.',
      side: 'left',
    },
  },
  {
    element: '#deletedTable',
    popover: {
      title: '🗑️ Deleted Items',
      description: 'Items stay here for 30 days before being permanently removed.',
      side: 'over',
    },
  },
  {
    element: '#restoreBtn',
    popover: {
      title: '♻️ Restore',
      description: 'Click here to bring this item back to where it came from.',
      side: 'left',
    },
  },
  {
    element: '#permaDeleteBtn',
    popover: {
      title: '❌ Delete Forever',
      description: 'Click here to permanently delete this item. This cannot be undone.',
      side: 'left',
    },
  },
]

// ─── Recently Deleted Tablet (md, 768px–1023px) ─────────────────────────────
const recentlydeletedTablet: DriveStep[] = [
  {
    element: '#filterTypeSelect',
    popover: {
      title: '🔀 Filter by Type',
      description: 'Switch between To Do, Notes, Class Schedule, My Files, Quiz, and Flashcard items.',
      side: 'left',
    },
  },
  {
    element: '#deletedSearchBar',
    popover: {
      title: '🔍 Search',
      description: 'Quickly find a deleted item by name.',
      side: 'left',
    },
  },
  {
    element: '#deletedTable',
    popover: {
      title: '🗑️ Deleted Items',
      description: 'Items stay here for 30 days before being permanently removed.',
      side: 'over',
    },
  },
  {
    element: '#restoreBtn',
    popover: {
      title: '♻️ Restore',
      description: 'Tap here to bring this item back to where it came from.',
      side: 'left',
    },
  },
  {
    element: '#permaDeleteBtn',
    popover: {
      title: '❌ Delete Forever',
      description: 'Tap here to permanently delete this item. This cannot be undone.',
      side: 'left',
    },
  },
]

// ─── Recently Deleted Mobile (below 768px) ──────────────────────────────────
const recentlydeletedMobile: DriveStep[] = [
  {
    element: '#filterTypeSelect',
    popover: {
      title: '🔀 Filter by Type',
      description: 'Switch between To Do, Notes, Class Schedule, My Files, Quiz, and Flashcard items.',
      side: 'bottom',
    },
  },
  {
    element: '#deletedSearchBar',
    popover: {
      title: '🔍 Search',
      description: 'Quickly find a deleted item by name.',
      side: 'bottom',
    },
  },
  {
    element: '#deletedTable',
    popover: {
      title: '🗑️ Deleted Items',
      description: 'Items stay here for 30 days before being permanently removed.',
      side: 'over',
    },
  },
  {
    element: '#restoreBtn',
    popover: {
      title: '♻️ Restore',
      description: 'Tap here to bring this item back to where it came from.',
      side: 'bottom',
    },
  },
  {
    element: '#permaDeleteBtn',
    popover: {
      title: '❌ Delete Forever',
      description: 'Tap here to permanently delete this item. This cannot be undone.',
      side: 'bottom',
    },
  },
]
// ─── Account Desktop (lg+, 1024px+) ─────────────────────────────────────────
const accountDesktop: DriveStep[] = [
  {
    element: '#navBasicInfo',
    popover: {
      title: '👤 Basic Info',
      description: 'Update your name, profile photo, and other basic account details here.',
      side: 'right',
    },
  },
  {
    element: '#navPassword',
    popover: {
      title: '🔒 Password',
      description: 'Change your account password here.',
      side: 'right',
    },
  },
  {
    element: '#navTerms',
    popover: {
      title: '📄 Terms of Service',
      description: 'Review the Terms of Service for Study Buddy.',
      side: 'right',
    },
  },
  {
    element: '#navPrivacy',
    popover: {
      title: '🛡️ Privacy Policy',
      description: 'Review how your data is handled in our Privacy Policy.',
      side: 'right',
    },
  },

]

// ─── Account Tablet (md, 768px–1023px) ──────────────────────────────────────
const accountTablet: DriveStep[] = [
  {
    element: '#mobileNavBasicInfo',
    popover: {
      title: '👤 Basic Info',
      description: 'Tap here to update your name, profile photo, and other basic account details.',
      side: 'top',
    },
  },
  {
    element: '#mobileNavPassword',
    popover: {
      title: '🔒 Password',
      description: 'Tap here to change your account password.',
      side: 'top',
    },
  },
  {
    element: '#mobileNavTerms',
    popover: {
      title: '📄 Terms of Service',
      description: 'Tap here to review the Terms of Service.',
      side: 'top',
    },
  },
  {
    element: '#mobileNavPrivacy',
    popover: {
      title: '🛡️ Privacy Policy',
      description: 'Tap here to review the Privacy Policy.',
      side: 'top',
    },
  },
  
]

// ─── Account Mobile (below 768px) ───────────────────────────────────────────
const accountMobile: DriveStep[] = [
  {
    element: '#mobileNavBasicInfo',
    popover: {
      title: '👤 Basic Info',
      description: 'Tap here to update your name, profile photo, and other basic account details.',
      side: 'top',
      popoverClass: 'study-buddy-tour tour-bottom-anchor', // 👈 added
    },
  },
  {
    element: '#mobileNavPassword',
    popover: {
      title: '🔒 Password',
      description: 'Tap here to change your account password.',
      side: 'top',
      popoverClass: 'study-buddy-tour tour-bottom-anchor', // 👈 added
    },
  },
  {
    element: '#mobileNavTerms',
    popover: {
      title: '📄 Terms of Service',
      description: 'Tap here to review the Terms of Service.',
      side: 'top',
      popoverClass: 'study-buddy-tour tour-bottom-anchor', // 👈 added
    },
  },
  {
    element: '#mobileNavPrivacy',
    popover: {
      title: '🛡️ Privacy Policy',
      description: 'Tap here to review the Privacy Policy.',
      side: 'top',
      popoverClass: 'study-buddy-tour tour-bottom-anchor', // 👈 added
    },
  },
  
]
// ─── Tour steps map ─────────────────────────────────────────────────────────
export const tourSteps: Record<string, {
  desktop: DriveStep[]
  tablet: DriveStep[]
  mobile: DriveStep[]
}> = {
  dashboard: {
    desktop: dashboardDesktop,
    tablet:  dashboardTablet,
    mobile:  dashboardMobile,
  },
  todolist: {                   
    desktop: todolistDesktop,
    tablet:  todolistTablet,
    mobile:  todolistMobile,
  },
  notes: {                             
    desktop: notesDesktop,
    tablet:  notesTablet,
    mobile:  notesMobile,
  },
  classschedule: { 
    desktop: classscheduleDesktop, 
    tablet: classscheduleTablet,
    mobile: classscheduleMobile 
  }, 
  courses: { 
    desktop: coursesDesktop,
    tablet: coursesTablet,       
    mobile: coursesMobile 
  }, 
  coursefolder: { 
    desktop: coursefolderDesktop,  
    tablet: coursefolderTablet,  
    mobile: coursefolderMobile 
  }, 
  studygenerator: { 
    desktop: studygeneratorDesktop, 
    tablet: studygeneratorTablet, 
    mobile: studygeneratorMobile 
  }, 
  generatedhistory: {                             
    desktop: generatedhistoryDesktop,
    tablet:  generatedhistoryTablet,
    mobile:  generatedhistoryMobile,
  },
   recentlydeleted: {                      
    desktop: recentlydeletedDesktop,
    tablet:  recentlydeletedTablet,
    mobile:  recentlydeletedMobile,
  },
  account: {
    desktop: accountDesktop,
    tablet:  accountTablet,
    mobile:  accountMobile,
  },
}

// ─── startTour ──────────────────────────────────────────────────────────────
export function startTour(
  page: keyof typeof tourSteps,

  onOpenSidebar?: () => void,
  onCloseSidebar?: () => void,
  onTourEnd?: () => void   // ← NEW: 6th param
) {
  const w = window.innerWidth

  const rawSteps =
    w >= 1024 ? tourSteps[page].desktop :
    w >= 768  ? tourSteps[page].tablet  :
                tourSteps[page].mobile

  if (!rawSteps?.length) return

  // Some elements only appear once the user opens something mid-tour
  // (sidebar, FAB quick actions) — never filter those out even though
  // they're not in the DOM yet when the tour starts.
  const dynamicIds = ['#sidebar', '#fabClearAllBtn', '#fabAddTaskBtn', '#fabClearScheduleBtn', '#fabAddScheduleBtn']
  // Skip any step whose target simply doesn't exist right now — e.g. a
  // new user with no tasks yet has no #taskCard / #taskOptionsBtn to show.
  const steps = rawSteps.filter((step) => {
    if (!step.element || typeof step.element !== 'string') return true
    if (dynamicIds.includes(step.element)) return true
    return !!document.querySelector(step.element)
  })

  if (!steps.length) return

  const driverObj = driver({
    showProgress: true,
    animate: true,
    smoothScroll: true,
    overlayOpacity: 0.4,
    popoverClass: 'study-buddy-tour',
    nextBtnText: 'Next →',
    prevBtnText: '← Back',
    doneBtnText: 'Done',
    allowClose: false,
    stagePadding: 9,
    stageRadius: 12,
    onPopoverRender: (popover) => {
      const closeBtn = document.createElement('button')
      closeBtn.innerText = '✕'
      closeBtn.style.cssText = `
        position: absolute; top: 10px; right: 10px;
        background: none; border: none; font-size: 16px;
        cursor: pointer; color: #666; line-height: 1;
      `
      closeBtn.onclick = () => driverObj.destroy()
      popover.wrapper.appendChild(closeBtn)
    },
    onNextClick: (_element, step) => {
      if (step.element === '#sidebar-btn' && onOpenSidebar) {
        onOpenSidebar()
        setTimeout(() => driverObj.moveNext(), 400)
        return
      }
      if (step.element === '#sidebar' && onCloseSidebar) {
        onCloseSidebar()
        setTimeout(() => driverObj.moveNext(), 300)
        return
      }
      // ── To-Do List FAB: open it when leaving the FAB trigger step ──
      if (step.element === '#taskFabBtn') {
        document.querySelector<HTMLButtonElement>('#taskFabBtn')?.click()
        setTimeout(() => driverObj.moveNext(), 300)
        return
      }
      // ── To-Do List FAB: close it after showing the last FAB action ──
      if (step.element === '#fabAddTaskBtn') {
        document.querySelector<HTMLButtonElement>('#taskFabBtn')?.click()
        setTimeout(() => driverObj.moveNext(), 300)
        return
      }
     // ── Class Schedule FAB: open it when leaving the FAB trigger step ──
     if (step.element === '#scheduleFabBtn') {
       document.querySelector<HTMLButtonElement>('#scheduleFabBtn')?.click()
       setTimeout(() => driverObj.moveNext(), 300)
       return
     }
     // ── Class Schedule FAB: close it after showing the last FAB action ──
     if (step.element === '#fabAddScheduleBtn') {
       document.querySelector<HTMLButtonElement>('#scheduleFabBtn')?.click()
       setTimeout(() => driverObj.moveNext(), 300)
       return
     }
      driverObj.moveNext()
    },
    onDestroyed: () => {          // ← NEW: fires on Done, ✕, Escape, overlay click
      onTourEnd?.()
    },
    steps,
  })

  driverObj.drive()
}