import { useEffect, useCallback } from 'react'
import useStreamStore from '../store/streamStore'
import { fetchStreamInfo, buildProxiedUrl } from '../services/streamService'

/**
 * useStreamLoader - Triggers backend fetch for a single stream.
 *
 * This hook is intentionally separate from useStreamPlayer because:
 * - Network fetching (Puppeteer bypass) can take 30-45s
 * - We want to show "bypassing" state independently of player state
 * - Retry logic for network is different from HLS retry logic
 */
export function useStreamLoader(streamId) {
  const stream = useStreamStore(s => s.streams.find(x => x.id === streamId))
  const updateStream = useStreamStore(s => s.updateStream)

  const load = useCallback(async () => {
    if (!stream) return

    updateStream(streamId, { status: 'bypassing' })

    try {
      const data = await fetchStreamInfo(stream.platform, stream.username)

      if (data.online && data.url) {
        const proxiedUrl = buildProxiedUrl(data.url)
        updateStream(streamId, {
          status: 'online',
          url: proxiedUrl,
          title: data.title || stream.username,
        })
      } else {
        updateStream(streamId, {
          status: 'offline',
          title: data.title || stream.username,
        })
      }
    } catch (err) {
      console.error(`[Loader ${streamId}] Failed:`, err)
      updateStream(streamId, {
        status: 'error',
        error: err.message,
      })
    }
  }, [streamId, stream, updateStream])

  useEffect(() => {
    load()
  }, []) // Only run once on mount

  return { reload: load }
}
