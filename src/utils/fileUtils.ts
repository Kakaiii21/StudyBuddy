export function parseFileSizeToBytes(sizeStr: string): number {
  const [value, unit] = sizeStr.trim().split(' ')
  const num = parseFloat(value)
  switch (unit?.toUpperCase()) {
    case 'KB': return num * 1024
    case 'MB': return num * 1024 * 1024
    case 'GB': return num * 1024 * 1024 * 1024
    default: return num
  }
}

export const STORAGE_LIMIT = 1 * 1024 * 1024 * 1024