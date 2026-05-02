import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Computes CSS grid properties based on stream count.
 * Prioritizes 16:9 ratio and balanced layouts.
 *
 * Layout strategy:
 * - 1 stream: full screen
 * - 2 streams: side by side (50/50)
 * - 3 streams: 2 top, 1 bottom centered
 * - 4+ streams: dynamic grid columns
 */
export function getGridConfig(count) {
  if (count === 0) return { cols: 1, rows: 1 }
  if (count === 1) return { cols: 1, rows: 1 }
  if (count === 2) return { cols: 2, rows: 1 }
  if (count === 3) return { cols: 2, rows: 2 } // last item spans 2 cols
  if (count === 4) return { cols: 2, rows: 2 }
  if (count <= 6) return { cols: 3, rows: 2 }
  return { cols: 3, rows: Math.ceil(count / 3) }
}

export function getPlatformColor(platform) {
  if (platform === 'kick') return '#53fc18'
  if (platform === 'twitch') return '#9147ff'
  return '#ffffff'
}

export function getPlatformGlow(platform) {
  if (platform === 'kick') return 'shadow-kick-glow'
  if (platform === 'twitch') return 'shadow-twitch-glow'
  return ''
}
