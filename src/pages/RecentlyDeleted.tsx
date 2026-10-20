import  { useState, useMemo , useEffect} from 'react'
import Sidebar from '../components/Sidebar'
import { useRecentlyDeleted } from '../hooks/useRecentlyDeleted'
import { daysRemaining } from '../services/recentlyDeletedService'
import type { DeletedItemType , DeletedItem} from '../services/recentlyDeletedService'
import { useAuth } from '../hooks/useAuth'
import { useTour } from '../hooks/useTour'
import { useTheme, type Theme } from '../context/ThemeContext'


const PAGE_TYPES: DeletedItemType[] = [
  'To Do',
  'Notes',
  'Class Schedule',
  'Course',
  'Quiz',
  'Flashcard',
]
const PAGE_TYPE_LABELS: Record<DeletedItemType, string> = {
  'To Do': 'To Do',
  'Notes': 'Notes',
  'Class Schedule': 'Class Schedule',
  'Course': 'My Files',
  'Quiz': 'Quiz',
  'Flashcard': 'Flashcard',
}


function DaysBadge({ days }: { days: number }) {
  const isUrgent = days <= 7
  const isWarning = days <= 14

  return (
    <span
      className={`text-xs lg:text-[10px] xl:text-[11px] 2xl:text-[13px] 3xl:text-[15px] font-semibold px-2 py-0.5 rounded-full ${
        isUrgent
          ? 'bg-red-100 text-red-600'
          : isWarning
          ? 'bg-yellow-100 text-yellow-600'
          : 'bg-green-100 text-green-600'
      }`}
    >
      {days}d left
    </span>
  )
}

  function ConfirmModal({
    itemName,
    onConfirm,
    onCancel,
  }: {
    itemName: string
    onConfirm: () => void
    onCancel: () => void
  }) {
    const [confirming, setConfirming] = useState(false)

    const handleConfirm = async () => {
      if (confirming) return
      setConfirming(true)
      await onConfirm()
    }

    return (
      <div   className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
        <div className='bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4'>
          <h2 className='text-lg font-bold text-gray-800 mb-2'>Permanently Delete?</h2>
          <p className='text-sm text-gray-500 mb-6'>
            <span className='font-semibold text-gray-700'>"{itemName}"</span> will be permanently
            deleted and cannot be recovered. Any associated files will also be removed.
          </p>
          <div className='flex gap-3 justify-end'>
            <button
              onClick={onCancel}
              disabled={confirming}
              className='px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className='px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {confirming ? 'Moving...' : 'Delete Forever'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  function RestoreConfirmModal({
    itemName,
    onConfirm,
    onCancel,
  }: {
    itemName: string
    onConfirm: () => void
    onCancel: () => void
  }) {
    const [restoring, setRestoring] = useState(false)

    const handleConfirm = async () => {
      if (restoring) return
      setRestoring(true)
      await onConfirm()
    }

    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
        <div className='bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4'>
          <h2 className='text-lg font-bold text-gray-800 mb-2'>Restore Item?</h2>
          <p className='text-sm text-gray-500 mb-6'>
            <span className='font-semibold text-gray-700'>"{itemName}"</span> will be restored
            to its original location.
          </p>
          <div className='flex gap-3 justify-end'>
            <button
              onClick={onCancel}
              disabled={restoring}
              className='px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={restoring}
              className='px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {restoring ? 'Restoring...' : 'Restore'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  function FolderRestoreModal({
    itemName,
    fileCount,
    onRestoreFolderOnly,
    onRestoreWithFiles,
    onCancel,
  }: {
    itemName: string
    fileCount: number
    onRestoreFolderOnly: () => void
    onRestoreWithFiles: () => void
    onCancel: () => void
  }) {
    const [restoring, setRestoring] = useState<'folder' | 'withFiles' | null>(null)

    const handleFolderOnly = async () => {
      if (restoring) return
      setRestoring('folder')
      await onRestoreFolderOnly()
    }

    const handleWithFiles = async () => {
      if (restoring) return
      setRestoring('withFiles')
      await onRestoreWithFiles()
    }

    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
        <div className='bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4'>
          <h2 className='text-lg font-bold text-gray-800 mb-2'>Restore Folder?</h2>
          <p className='text-sm text-gray-500 mb-6'>
            <span className='font-semibold text-gray-700'>"{itemName}"</span> also has{' '}
            <span className='font-semibold text-gray-700'>
              {fileCount} deleted {fileCount === 1 ? 'file' : 'files'}
            </span>{' '}
            in Recently Deleted. Would you like to restore those too?
          </p>
          <div className='flex flex-col gap-2'>
            <button
              onClick={handleWithFiles}
              disabled={restoring !== null}
              className='px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {restoring === 'withFiles' ? 'Restoring...' : 'Restore Folder + Files'}
            </button>
            <button
              onClick={handleFolderOnly}
              disabled={restoring !== null}
              className='px-4 py-2 rounded-lg text-sm font-medium border border-primary-600 text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {restoring === 'folder' ? 'Restoring...' : 'Restore Folder Only'}
            </button>
            <button
              onClick={onCancel}
              disabled={restoring !== null}
              className='px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50'
            >
              Cancel
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

function RecentlyDeleted() {
      const { theme } = useTheme()

  const { user } = useAuth()
  const [selectedType, setSelectedType] = useState<DeletedItemType>('To Do')
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmItem, setConfirmItem] = useState<{ id: string; name: string } | null>(null)
  const [orphanRestoreItem, setOrphanRestoreItem] = useState<DeletedItem | null>(null)
  const [restoreConfirmItem, setRestoreConfirmItem] = useState<DeletedItem | null>(null)
  const [folderRestoreItem, setFolderRestoreItem] = useState<DeletedItem | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const { startTour } = useTour(
    'recentlydeleted',
    false,
    () => {}, () => {},
    user
  )
  const {
    items,
    loading,
    error,
    restoreError,
    clearRestoreError,
    actionLoading,
    handleRestore,
    handlePermanentDelete,
    orphanedFileIds,
  } = useRecentlyDeleted()

  
const filtered = useMemo(() => {
  return items.filter((item) => {
    const matchesType = item.type === selectedType
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const isRestoredFolder = item.name === 'Restored Files' && item.type === 'Course'
    return matchesType && matchesSearch && !isRestoredFolder
  })
}, [items, selectedType, searchQuery])

  const handleDeleteClick = (id: string, name: string) => {
    setConfirmItem({ id, name })
  }

  const handleConfirmDelete = async () => {
    if (!confirmItem) return
    const item = items.find((i) => i.id === confirmItem.id)
    if (item) await handlePermanentDelete(item)
    setConfirmItem(null)
  }

  const getChildDeletedFiles = (folderItem: DeletedItem) => {
    return items.filter((i) => {
      if (i.type !== 'Course' || !i.data?.fileUrl) return false
      const parts = i.originalCollection.split('/')
      const parentCourseId = parts[3]
      return parentCourseId === folderItem.originalDocId
    })
  }

  const handleRestoreClick = (item: DeletedItem) => {
    if (orphanedFileIds.has(item.id)) {
      setOrphanRestoreItem(item)
      return
    }

    const isFolder = item.type === 'Course' && !item.data?.fileUrl
    if (isFolder) {
      const childFiles = getChildDeletedFiles(item)
      if (childFiles.length > 0) {
        setFolderRestoreItem(item)
        return
      }
    }

    setRestoreConfirmItem(item)
  }

  const handleConfirmRestore = async () => {
    if (!restoreConfirmItem) return
    await handleRestore(restoreConfirmItem)
    setRestoreConfirmItem(null)
  }

  const handleRestoreFolderOnly = async () => {
    if (!folderRestoreItem) return
    await handleRestore(folderRestoreItem)
    setFolderRestoreItem(null)
  }

  const handleRestoreFolderWithFiles = async () => {
    if (!folderRestoreItem) return
    const childFiles = getChildDeletedFiles(folderRestoreItem)

    await handleRestore(folderRestoreItem)
    for (const file of childFiles) {
      await handleRestore(file)
    }
    setFolderRestoreItem(null)
  }

  return (
  <div className='flex h-screen bg-white dark:bg-[#010409] warm:bg-[#FBF1E8]'>
      <div className='lg:p-3 '>
        <Sidebar />      
      </div>


      {confirmItem && (
        <ConfirmModal
          itemName={confirmItem.name}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmItem(null)}
        />
      )}
              {restoreConfirmItem && (
                  <RestoreConfirmModal
                    itemName={restoreConfirmItem.name}
                    onConfirm={handleConfirmRestore}
                    onCancel={() => setRestoreConfirmItem(null)}
                  />
                )}
              {folderRestoreItem && (
                  <FolderRestoreModal
                    itemName={folderRestoreItem.name}
                    fileCount={getChildDeletedFiles(folderRestoreItem).length}
                    onRestoreFolderOnly={handleRestoreFolderOnly}
                    onRestoreWithFiles={handleRestoreFolderWithFiles}
                    onCancel={() => setFolderRestoreItem(null)}
                  />
                )}
              {orphanRestoreItem && (
                  <OrphanRestoreModal
                    itemName={orphanRestoreItem.name}
                    onConfirm={async () => {
                      await handleRestore(orphanRestoreItem)
                      setOrphanRestoreItem(null)
                    }}
                    onCancel={() => setOrphanRestoreItem(null)}
                  />
                )}

        <div className='flex-1 flex flex-col overflow-hidden'>

              {/* Top Bar — mobile only */}
        <div className='lg:hidden flex items-center justify-between px-4 sm:px-6 py-2 bg-tranparent  top-0 left-0 right-0 z-10 relative'>
          <p className='absolute warm:text-[#623627] left-1/2 -translate-x-1/2 font-inter mt-4 font-semibold text-md text-[#B3B3B3] uppercase'>Recently Deleted</p>
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
      <main  className="flex-1  w-full  overflow-auto p-2 px-5 md:px-7  md:py-0 md:pt-0 py-0  lg:p-2 lg:pt-2 2xl:pt-0  pt-1">
        <div className="min-h-screen  w-full flex flex-col">
            <p className='hidden lg:flex justify-center lg:justify-start w-full lg:pl-3 2xl:ml-0 3xl:ml-0
            font-inter font-semibold text-sm md:text-md lg:text-[10px] xl:text-[12px] 2xl:text-[14px] 3xl:text-[16px] text-[#B3B3B3] uppercase
            mt-2 md:mt-4 lg:mt-1 xl:mt-2 2xl:mt-4 '>Recently Deleted</p>

          {/* Restore Error Toast */}
          {restoreError && (
            <div className='flex items-center justify-between bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4'>
              <span>{restoreError}</span>
              <button
                onClick={clearRestoreError}
                className='ml-4 text-red-400 hover:text-red-600 font-bold text-lg leading-none'
              >
                ×
              </button>
            </div>
          )}

          {/* Filters */}
          <div className='flex flex-row lg:flex-row sm:items-center sm:justify-end gap-3 mb-6'>
            <select
              id='filterTypeSelect'
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DeletedItemType)}
              className='w-40 border border-primary-800 rounded-md  dark:bg-white 
              px-3 py-2 lg:py-1.5 xl:py-2 lg:rounded-sm 3xl:w-52 md:py-2
              text-[10px] lg:text-[12px] xl:text-[13px] 2xl:text-[14px] 3xl:text-[19px]
              font-roboto text-primary-600
              focus:outline-none focus:ring-1 focus:ring-primary-600 bg-white cursor-pointer'
              aria-label='Filter by page type'
            >
{PAGE_TYPES.map((t) => (
  <option key={t} value={t}>{PAGE_TYPE_LABELS[t]}</option>
))}
            </select>

            <div className="relative order-1 lg:order-2 flex items-center w-full lg:max-w-[180px] xl:max-w-[220px] 2xl:max-w-[260px]">
              <input
              id='deletedSearchBar'
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full border border-primary-800 rounded-md
                  py-2 pl-3 pr-8 bg-transparent dark:border-white dark:text-white dark:placeholder:text-white
                  text-[10px] lg:text-[8px] xl:text-[10px] 2xl:text-[14px] 3xl:text-[17px]
                  font-inter text-primary-800 placeholder:text-primary-800
                  focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                  transition-all duration-200"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute right-2 w-3.5 h-3.5 dark:text-white lg:w-3 lg:h-3 xl:w-3.5 xl:h-3.5 2xl:w-4 2xl:h-4 text-primary-800 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>
{!isOnline && (
  <div className='bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs rounded-xl px-4 py-2 mb-4'>
    You're offline — restore and permanent delete are disabled until you reconnect.
  </div>
)}

          {/* Recent label */}
          <div className='flex items-center gap-3 mb-4 lg:ml-3.5 xl:ml-3 2xl:ml-4 3xl:ml-5'>
            <p className='whitespace-nowrap lg:text-xs text-primary-600 dark:text-white font-semibold'>Recent</p>
            <hr className='flex-1 border-t warm:border-black border-primary-100' />
          </div>

          {/* Table */}
          {!loading && !error && (
            <div id='deletedTable' className='w-full'>
              <div className='grid grid-cols-[1.2fr_0.5fr_0.5fr_0.5fr] gap-2 pb-3 lg:pb-2  dark:text-white warm:border-black  border-b text-gray-500 warm:text-[#623627] text-xs font-medium lg:ml-3.5 xl:ml-3 2xl:ml-4 3xl:ml-5'>
                <p className='lg:text-[9px] xl:text-[11px] 2xl:text-[13px] 3xl:text-[15px]'>Name</p>
                <p className='text-center lg:text-[9px] xl:text-[11px] 2xl:text-[13px] 3xl:text-[15px]'>Expires</p>
                <p className='text-center lg:text-[9px] xl:text-[11px] 2xl:text-[13px] 3xl:text-[15px]'>Restore</p>
                <p className='text-center lg:text-[9px] xl:text-[11px] 2xl:text-[13px] 3xl:text-[15px]'>Delete</p>
              </div>

              {filtered.length === 0 ? (
<p className='text-gray-400  warm:text-[#623627]  dark:text-white font-roboto text-center lg:text-[9px] xl:text-[11px] 2xl:text-[13px] 3xl:text-[15px] py-10'>
  No deleted {PAGE_TYPE_LABELS[selectedType]} items
</p>
              ) : (
                filtered.map((item) => {
                  const days = daysRemaining(item.deletedAt)
                  const isActing = actionLoading === item.id
                  return (
                    <div
                      key={item.id}
                      className={`py-2 lg:py-1 2xl:py-2 3xl:py-3 ${isActing ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <div className='grid grid-cols-[1.2fr_0.5fr_0.5fr_0.5fr] gap-x-2 gap-y-0 items-center lg:ml-3.5 xl:ml-3 2xl:ml-4 3xl:ml-5'>
                        <div className='min-w-0'>
                          <p className='text-xs dark:text-white md:text-sm lg:text-[10px] xl:text-[11px] 2xl:text-[15px] 3xl:text-[17px] font-semibold text-primary-600 break-all leading-tight'>
                            {item.name}
                            {item.type === 'Course' && (
                              <span className={`ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                item.data?.fileUrl
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-orange-100 text-orange-600'
                              }`}>
                                {item.data?.fileUrl ? '📄 File' : '📁 Folder'}
                              </span>
                            )}
                          </p>
                        </div>

                        <div className='flex justify-center text-sm md:text-base lg:text-[13px] xl:text-[14px] 2xl:text-[14px] 3xl:text-[18px]'>
                          <DaysBadge days={days} />
                        </div>

<div className='flex justify-center'>
  <button
    id='restoreBtn'
    aria-label={`Restore ${item.name}`}
    onClick={() => handleRestoreClick(item)}
    disabled={isActing || !isOnline}
    title={!isOnline ? 'Connect to restore items' : undefined}
  >
    {isActing ? (
      <span className='w-5 h-5 flex items-center justify-center text-primary-600 text-xs'>⏳</span>
    ) : (
      <img
        src='/Restore.png'
        alt='Restore'
        className={`lg:w-4 lg:h-4 2xl:w-5 2xl:h-5 dark:brightness-0 dark:invert 3xl:w-6 3xl:h-6 w-5 h-5 select-none ${
          isOnline ? 'cursor-pointer hover:opacity-70' : 'opacity-30 cursor-not-allowed'
        }`}
        onContextMenu={(e) => e.preventDefault()}
        draggable={false}
      />
    )}
  </button>
</div>

<div className='flex justify-center'>
  <button
    id='permaDeleteBtn'
    aria-label={`Delete ${item.name}`}
    onClick={() => handleDeleteClick(item.id, item.name)}
    disabled={isActing || !isOnline}
    title={!isOnline ? 'Connect to permanently delete' : undefined}
  >
    <img
      src='/delete.png'
      alt='Delete'
      className={`lg:w-4 lg:h-4 2xl:w-5 2xl:h-5 3xl:w-6 dark:brightness-0 dark:invert 3xl:h-6 w-5 h-5 select-none ${
        isOnline ? 'cursor-pointer hover:opacity-70' : 'opacity-30 cursor-not-allowed'
      }`}
      onContextMenu={(e) => e.preventDefault()}
      draggable={false}
    />
  </button>
</div>

                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* States */}
          {loading && (
            <p className='text-gray-400 font-roboto text-center py-10'>Loading...</p>
          )}

          {error && (
            <div className='flex-1 flex items-center justify-center py-20 text-red-500 text-sm'>
              {error}
            </div>
          )}

        </div>
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
      </main>
      </div>
    </div>
  )
}
function OrphanRestoreModal({
  itemName,
  onConfirm,
  onCancel,
}: {
  itemName: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const [restoring, setRestoring] = useState(false)

  const handleConfirm = async () => {
    if (restoring) return
    setRestoring(true)
    await onConfirm()
  }

  return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4'>
        <div className='flex items-center gap-3 mb-3'>
          <span className='text-2xl'>📁</span>
          <h2 className='text-lg font-bold text-gray-800'>Original Folder Not Found</h2>
        </div>
        <p className='text-sm text-gray-500 mb-3'>
          The original folder for <span className='font-semibold text-gray-700'>"{itemName}"</span> no longer exists.
        </p>
        <div className='bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-5'>
          <p className='text-xs text-blue-700'>
            This file will be restored to a <span className='font-bold'>Restored Files</span> folder in your My Files instead.
          </p>
        </div>
        <div className='flex gap-3 justify-end'>
          <button
            onClick={onCancel}
            disabled={restoring}
            className='px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50'
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={restoring}
            className='px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {restoring ? 'Restoring...' : 'Restore Anyway'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RecentlyDeleted