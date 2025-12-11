const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const

export const formatBytes = (bytes: number | undefined | null): string => {
  if (!bytes || bytes <= 0) {
    return '0 B'
  }

  const magnitude = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** magnitude
  const formatted = value >= 10 || magnitude === 0 ? value.toFixed(0) : value.toFixed(1)

  return `${formatted} ${units[magnitude]}`
}

export const stripExtension = (fileName: string): string => {
  const lastDot = fileName.lastIndexOf('.')
  if (lastDot === -1) {
    return fileName
  }
  return fileName.slice(0, lastDot)
}

export const deriveFileName = (originalName: string, extension: string): string => {
  const normalizedExtension = extension.startsWith('.') ? extension.slice(1) : extension
  const safeBase = stripExtension(originalName).trim() || 'converted'
  return `${safeBase}.${normalizedExtension}`
}

export const getAspectRatio = (width: number, height: number): string => {
  const normalizedWidth = Math.round(width)
  const normalizedHeight = Math.round(height)

  const gcd = (a: number, b: number): number => {
    return b === 0 ? Math.abs(a) : gcd(b, a % b)
  }

  const divisor = gcd(normalizedWidth, normalizedHeight)
  return `${normalizedWidth / divisor}:${normalizedHeight / divisor}`
}
