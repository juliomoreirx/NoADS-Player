import { useEffect, useRef, useCallback, useState } from 'react'
import Hls from 'hls.js'
import { hlsManager } from '../lib/hlsManager'

/**
 * useStreamPlayer - Custom hook encapsulating all HLS.js lifecycle logic.
 *
 * RESPONSIBILITIES:
 * - Mount/unmount HLS instance tied to video element lifecycle
 * - Track playback state (buffering, error, ready)
 * - Expose retry mechanism for fatal errors
 * - Handle mute changes without re-creating HLS instance
 *
 * WHY A HOOK: Separating HLS logic from rendering means StreamPlayer
 * component only re-renders when visual state changes, not on every
 * HLS internal event.
 */
export function useStreamPlayer({ streamId, proxiedUrl, isMuted }) {
  const videoRef = useRef(null)
  const [playerState, setPlayerState] = useState('idle') // idle | loading | buffering | playing | error | fatal
  const [errorType, setErrorType] = useState(null)
  const retryCountRef = useRef(0)
  const MAX_RETRIES = 3

  const initPlayer = useCallback(() => {
    const video = videoRef.current
    if (!video || !proxiedUrl) return

    setPlayerState('loading')
    setErrorType(null)

    const hls = hlsManager.create(streamId, video, proxiedUrl, {
      onReady: () => {
        retryCountRef.current = 0
        setPlayerState('buffering')
      },
      onAutoplayBlocked: () => {
        // User needs to click play - still show player
        setPlayerState('playing')
      },
      onFragmentLoaded: () => {
        setPlayerState('playing')
      },
      onError: (type, data) => {
        console.warn(`[Player ${streamId}] ${type} error:`, data.details)
        setErrorType(type)
        setPlayerState('error')
      },
      onFatalError: (data) => {
        console.error(`[Player ${streamId}] Fatal error:`, data.details)
        setPlayerState('fatal')
        setErrorType('fatal')
      },
      onWarning: (data) => {
        // Non-fatal: log but don't change state
        console.warn(`[Player ${streamId}] Warning:`, data.details)
      },
    })

    // Fallback for Safari native HLS
    if (!hls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = proxiedUrl
      video.addEventListener('loadedmetadata', () => setPlayerState('playing'), { once: true })
    }
  }, [streamId, proxiedUrl])

  // Init player when URL is available
  useEffect(() => {
    if (proxiedUrl) {
      initPlayer()
    }
    return () => {
      hlsManager.destroy(streamId)
    }
  }, [streamId, proxiedUrl, initPlayer])

  // Sync mute state without touching HLS instance
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.muted = isMuted
    }
  }, [isMuted])

  // Handle playing event from video element
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlaying = () => setPlayerState('playing')
    const handleWaiting = () => {
      if (playerState === 'playing') setPlayerState('buffering')
    }
    const handleStalled = () => setPlayerState('error')

    video.addEventListener('playing', handlePlaying)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('stalled', handleStalled)

    return () => {
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('stalled', handleStalled)
    }
  }, [playerState])

  const retry = useCallback(() => {
    if (retryCountRef.current >= MAX_RETRIES) {
      setPlayerState('fatal')
      return
    }
    retryCountRef.current++
    initPlayer()
  }, [initPlayer])

  return {
    videoRef,
    playerState,
    errorType,
    retry,
    retryCount: retryCountRef.current,
  }
}
