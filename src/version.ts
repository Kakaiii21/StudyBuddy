// src/version.ts

export interface ChangelogEntry {
  version: number
  release: string
  date: string
  summary: string
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: 4,
    release: '2.2',
    date: '2026-08-17',
    summary: 'In the fourth release of the Study Buddy system, a new voluntary donation button was added, allowing users to optionally support the platform.',
  },
  {
    version: 3,
    release: '2.1',
    date: '2026-08-12',
    summary: 'In the third release of the Study Buddy system, the class schedule creation process was improved. Instead of adding one day at a time, users can now add a subject once and schedule multiple days, times, rooms, and room types together in a single "Add Class Schedule" modal.',
  },
  {
    version: 2,
    release: '2.0',
    date: '2026-07-04',
    summary: 'In the second release of the Study Buddy system, the entire platform underwent a major UI/UX redesign, including a refreshed layout, updated styling, and an overall new look and feel.',
  },
  {
    version: 1,
    release: '1.0',
    date: '2026-06-02',
    summary: 'The first initial release of Study Buddy, deployed on Firebase Hosting (no custom domain yet).',
  },
]

export const CURRENT_VERSION: ChangelogEntry = CHANGELOG[0]