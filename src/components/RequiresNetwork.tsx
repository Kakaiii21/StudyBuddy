import { useNetworkStatus } from '../hooks/useNetworkStatus'

interface Props {
  children: React.ReactNode
  moduleName?: string
}

export function RequiresNetwork({ children, moduleName = 'This feature' }: Props) {
  const isOnline = useNetworkStatus()

  if (!isOnline) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '48px 24px',
        textAlign: 'center',
        color: 'var(--color-text-secondary)',
      }}>
        <span style={{ fontSize: '2rem' }}>📶</span>
        <p style={{ fontWeight: 500, margin: 0 }}>{moduleName} requires an internet connection.</p>
        <p style={{ fontSize: '0.875rem', margin: 0 }}>
          Your notes, tasks, and schedule are still available offline.
        </p>
      </div>
    )
  }

  return <>{children}</>
}