const BASE_URL = ''

/**
 * Fetches stream metadata from the backend.
 * Backend uses Puppeteer to bypass Cloudflare and extract the HLS URL.
 */
export async function fetchStreamInfo(platform, username) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 45000) // Puppeteer can take up to 45s

  try {
    const res = await fetch(`${BASE_URL}/api/stream/${platform}/${username}`, {
      signal: controller.signal,
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const data = await res.json()
    return data
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Builds a proxied HLS URL that routes through our backend proxy.
 * This is necessary because CDN servers block direct browser requests (CORS).
 */
export function buildProxiedUrl(rawUrl) {
  return `/api/proxy?url=${encodeURIComponent(rawUrl)}`
}

/**
 * Returns the chat embed URL for the given platform.
 * Note: Twitch requires a parent= parameter matching the host domain.
 */
export function getChatUrl(platform, username) {
  const host = window.location.hostname

  if (platform === 'kick') {
    return `https://kick.com/popout/${username}/chat`
  }

  if (platform === 'twitch') {
    return `https://www.twitch.tv/embed/${username}/chat?parent=${host}`
  }

  return null
}

/**
 * Simple suggestions list - in a real app, this would hit an API.
 */
export const POPULAR_STREAMS = {
  twitch: ['xqc', 'shroud', 'pokimane', 'summit1g', 'lirik', 'nl_kripp'],
  kick: ['xqc', 'trainwreck', 'adin', 'destiny', 'hasanabi'],
}
