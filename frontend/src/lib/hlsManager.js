import Hls from 'hls.js'

/**
 * HlsManager - Singleton that manages all HLS.js instances.
 *
 * WHY: With 4+ simultaneous streams, we need centralized control over:
 * - Quality levels (CPU/bandwidth management)
 * - Error recovery strategies
 * - Memory cleanup on stream removal
 *
 * DESIGN: Not a React hook because HLS instances outlive component renders
 * and need imperative control. The React layer subscribes via callbacks.
 */
class HlsManager {
  constructor() {
    this.instances = new Map() // streamId -> { hls, callbacks }
  }

  /**
   * Creates and configures an HLS.js instance optimized for live streaming.
   */
  create(streamId, videoEl, proxiedUrl, callbacks = {}) {
    if (!Hls.isSupported()) {
      console.warn('[HlsManager] HLS.js not supported in this browser')
      return null
    }

    // Destroy existing instance if re-creating
    this.destroy(streamId)

    const hls = new Hls({
      // Live stream optimizations
      liveSyncDurationCount: 3,
      liveMaxLatencyDurationCount: 10,
      maxBufferLength: 20,         // Reduced from default 30s (saves memory for multi-stream)
      maxMaxBufferLength: 30,
      maxBufferSize: 30 * 1000000, // 30MB per stream cap
      maxBufferHole: 0.5,

      // Auto quality: let HLS.js choose based on bandwidth
      autoStartLoad: true,
      startLevel: -1,              // Auto select initial quality

      // Fragmented MP4 support (Twitch uses this)
      enableWorker: true,
      lowLatencyMode: false,

      // Retry config for flaky CDNs
      manifestLoadingMaxRetry: 4,
      levelLoadingMaxRetry: 6,
      fragLoadingMaxRetry: 6,
      manifestLoadingRetryDelay: 1000,
      levelLoadingRetryDelay: 1000,
      fragLoadingRetryDelay: 1000,
    })

    hls.loadSource(proxiedUrl)
    hls.attachMedia(videoEl)

    // Event handlers
    hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
      callbacks.onReady?.()
      videoEl.play().catch(() => {
        // Autoplay blocked - will need user interaction
        callbacks.onAutoplayBlocked?.()
      })
    })

    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            // Try to recover network errors
            hls.startLoad()
            callbacks.onError?.('network', data)
            break
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError()
            callbacks.onError?.('media', data)
            break
          default:
            // Cannot recover
            this.destroy(streamId)
            callbacks.onFatalError?.(data)
        }
      } else {
        callbacks.onWarning?.(data)
      }
    })

    hls.on(Hls.Events.FRAG_LOADED, () => {
      callbacks.onFragmentLoaded?.()
    })

    this.instances.set(streamId, { hls, callbacks })

    // Auto quality management: degrade background streams
    this._rebalanceQuality()

    return hls
  }

  destroy(streamId) {
    const entry = this.instances.get(streamId)
    if (entry) {
      entry.hls.destroy()
      this.instances.delete(streamId)
      this._rebalanceQuality()
    }
  }

  /**
   * When > 3 instances exist, enable auto-quality for lower priority streams.
   * Priority = lower index in the stream list (first added = highest priority).
   */
  _rebalanceQuality() {
    const ids = [...this.instances.keys()]
    ids.forEach((id, index) => {
      const entry = this.instances.get(id)
      if (!entry) return
      const { hls } = entry

      if (this.instances.size > 3 && index >= 2) {
        // Background stream: force auto quality
        hls.currentLevel = -1
        hls.autoLevelEnabled = true
      }
    })
  }

  getInstance(streamId) {
    return this.instances.get(streamId)?.hls
  }

  getCount() {
    return this.instances.size
  }
}

// Singleton export
export const hlsManager = new HlsManager()
