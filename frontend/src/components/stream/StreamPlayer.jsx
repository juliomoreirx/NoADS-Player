import { memo, useCallback, useRef, useState, useEffect } from 'react'
import {
  Play, Pause, Volume2, VolumeX, Volume1,
  Maximize2, Minimize2, X
} from 'lucide-react'
import { useStreamPlayer } from '../../hooks/useStreamPlayer'
import { useStreamLoader } from '../../hooks/useStreamLoader'
import { StatusBadge } from '../ui/StatusBadge'
import { StreamSkeleton } from '../ui/StreamSkeleton'
import { ErrorOverlay } from '../ui/ErrorOverlay'
import { PlatformIcon } from '../../assets/icons/PlatformIcons'
import useStreamStore from '../../store/streamStore'
import { cn, getPlatformColor } from '../../lib/utils'

const StreamPlayer = memo(function StreamPlayer({ streamId }) {
  const stream = useStreamStore(s => s.streams.find(x => x.id === streamId))
  const globalMuted = useStreamStore(s => s.globalMuted)
  const removeStream = useStreamStore(s => s.removeStream)
  const setActiveStream = useStreamStore(s => s.setActiveStream)

  const { reload } = useStreamLoader(streamId)
  const { videoRef, playerState, errorType, retry, retryCount } = useStreamPlayer({
    streamId,
    proxiedUrl: stream?.url || null,
    isMuted: globalMuted,
  })

  // ── Local player controls state ──
  const [isPaused, setIsPaused] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const volumeHideTimer = useRef(null)
  const containerRef = useRef(null)

  // Sync global mute → local mute
  useEffect(() => {
    if (globalMuted) setIsMuted(true)
  }, [globalMuted])

  // Apply volume/mute to video element
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.volume = volume
    video.muted = isMuted || globalMuted
  }, [volume, isMuted, globalMuted, videoRef])

  // Track fullscreen changes (Esc key, etc.)
  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFSChange)
    return () => document.removeEventListener('fullscreenchange', onFSChange)
  }, [])

  // ── Handlers ──
  const handleTogglePlay = useCallback((e) => {
    e.stopPropagation()
    const video = videoRef.current
    if (!video) return
    if (video.paused) { video.play(); setIsPaused(false) }
    else { video.pause(); setIsPaused(true) }
  }, [videoRef])

  const handleToggleMute = useCallback((e) => {
    e.stopPropagation()
    setIsMuted(prev => {
      const next = !prev
      if (videoRef.current) videoRef.current.muted = next || globalMuted
      return next
    })
  }, [videoRef, globalMuted])

  const handleVolumeChange = useCallback((e) => {
    e.stopPropagation()
    const val = parseFloat(e.target.value)
    setVolume(val)
    setIsMuted(val === 0)
    if (videoRef.current) {
      videoRef.current.volume = val
      videoRef.current.muted = val === 0 || globalMuted
    }
  }, [videoRef, globalMuted])

  const handleFullscreen = useCallback((e) => {
    e.stopPropagation()
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) el.requestFullscreen().catch(() => {})
    else document.exitFullscreen().catch(() => {})
  }, [])

  const handleRemove = useCallback((e) => {
    e.stopPropagation()
    removeStream(streamId)
  }, [removeStream, streamId])

  const handleVolumeEnter = () => {
    clearTimeout(volumeHideTimer.current)
    setShowVolumeSlider(true)
  }
  const handleVolumeLeave = () => {
    volumeHideTimer.current = setTimeout(() => setShowVolumeSlider(false), 350)
  }

  const VolumeIcon = (isMuted || globalMuted || volume === 0) ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  if (!stream) return null

  const isLoading = stream.status === 'loading' || stream.status === 'bypassing'
  const isError = stream.status === 'error'
  const isOffline = stream.status === 'offline'
  const showSkeleton = isLoading || isOffline || (isError && !stream.url)
  const showPlayer = stream.status === 'online' || stream.url
  const showPlayerError = showPlayer && (playerState === 'error' || playerState === 'fatal')
  const accentColor = getPlatformColor(stream.platform)
  const effectiveMuted = isMuted || globalMuted
  const displayVolume = effectiveMuted ? 0 : volume

  return (
    <>
      {/* Inline CSS for volume slider thumb */}
      <style>{`
        .vol-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 3px;
          border-radius: 9999px;
          outline: none;
          cursor: pointer;
          background: linear-gradient(
            to right,
            ${accentColor} 0%,
            ${accentColor} ${displayVolume * 100}%,
            rgba(255,255,255,0.2) ${displayVolume * 100}%,
            rgba(255,255,255,0.2) 100%
          );
        }
        .vol-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          box-shadow: 0 0 3px rgba(0,0,0,0.5);
          transition: transform 0.1s;
        }
        .vol-slider::-webkit-slider-thumb:hover {
          transform: scale(1.3);
        }
        .vol-slider::-moz-range-thumb {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #fff;
          border: none;
          cursor: pointer;
        }
      `}</style>

      <div
        ref={containerRef}
        className={cn(
          'relative flex flex-col overflow-hidden rounded-lg border bg-black group',
          'border-white/5 hover:border-white/15 transition-colors duration-200',
          'animate-scale-in w-full h-full'
        )}
        onClick={() => setActiveStream(streamId)}
        style={{ '--accent': accentColor }}
      >
        {/* Platform accent line at top */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] z-20 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}90, transparent)` }}
        />

        {/* ── Top bar: channel + status + remove ── */}
        <div className={cn(
          'absolute top-0 left-0 right-0 z-30 flex items-center gap-1.5 px-2 py-1.5',
          'bg-gradient-to-b from-black/85 to-transparent',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
          'pointer-events-none group-hover:pointer-events-auto'
        )}>
          <PlatformIcon platform={stream.platform} size={13} />
          <span className="text-xs font-mono text-white/80 truncate max-w-[130px] leading-none">
            {stream.username}
          </span>
          <StatusBadge status={stream.status === 'online' ? playerState : stream.status} />
          <div className="ml-auto">
            <button
              onClick={handleRemove}
              title="Remover stream"
              className="w-6 h-6 flex items-center justify-center rounded glass border border-white/10 text-white/40 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all"
            >
              <X size={11} />
            </button>
          </div>
        </div>

        {/* ── Video area ── */}
        <div className="relative flex-1 min-h-0 bg-black">
          {showSkeleton && <StreamSkeleton status={stream.status} />}

          <video
            ref={videoRef}
            className={cn('w-full h-full object-contain', !showPlayer && 'invisible')}
            muted={effectiveMuted}
            autoPlay
            playsInline
            onPlay={() => setIsPaused(false)}
            onPause={() => setIsPaused(true)}
          />

          {showPlayerError && (
            <ErrorOverlay errorType={errorType} onRetry={retry} retryCount={retryCount} />
          )}

          {isOffline && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <PlatformIcon platform={stream.platform} size={28} className="opacity-20" />
              <p className="text-white/20 text-xs font-mono tracking-widest uppercase">Offline</p>
              <button
                onClick={(e) => { e.stopPropagation(); reload() }}
                className="text-xs font-mono text-white/30 hover:text-white/60 transition-colors underline underline-offset-4"
              >
                Verificar novamente
              </button>
            </div>
          )}
        </div>

        {/* ── Bottom control bar ── */}
        <div className={cn(
          'absolute bottom-0 left-0 right-0 z-30',
          'bg-gradient-to-t from-black/95 via-black/60 to-transparent',
          'px-2 pb-1.5 pt-8',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
          'pointer-events-none group-hover:pointer-events-auto'
        )}>

          {/* Stream title */}
          {stream.title && stream.status === 'online' && (
            <p className="text-white/45 text-[10px] font-mono truncate mb-1 px-0.5 leading-tight">
              {stream.title}
            </p>
          )}

          {/* Controls row */}
          <div className="flex items-center gap-0.5">

            {/* Play / Pause */}
            <ControlBtn onClick={handleTogglePlay} title={isPaused ? 'Retomar' : 'Pausar'}>
              {isPaused
                ? <Play size={14} className="fill-current" />
                : <Pause size={14} className="fill-current" />
              }
            </ControlBtn>

            {/* Volume group */}
            <div
              className="flex items-center gap-1"
              onMouseEnter={handleVolumeEnter}
              onMouseLeave={handleVolumeLeave}
            >
              <ControlBtn onClick={handleToggleMute} title={effectiveMuted ? 'Desmutar' : 'Mutar'}>
                <VolumeIcon size={14} />
              </ControlBtn>

              {/* Expanding slider */}
              <div
                className={cn(
                  'flex items-center overflow-hidden transition-all duration-200',
                  showVolumeSlider ? 'w-[68px] opacity-100' : 'w-0 opacity-0'
                )}
                onClick={e => e.stopPropagation()}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={displayVolume}
                  onChange={handleVolumeChange}
                  className="vol-slider w-full"
                />
              </div>

              {/* Volume percent */}
              <span
                className={cn(
                  'text-[10px] font-mono text-white/45 transition-all duration-200 select-none tabular-nums',
                  showVolumeSlider ? 'w-7 opacity-100' : 'w-0 opacity-0 overflow-hidden'
                )}
              >
                {Math.round(displayVolume * 100)}%
              </span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Fullscreen */}
            <ControlBtn
              onClick={handleFullscreen}
              title={isFullscreen ? 'Sair do fullscreen' : 'Tela cheia'}
            >
              {isFullscreen
                ? <Minimize2 size={13} />
                : <Maximize2 size={13} />
              }
            </ControlBtn>

          </div>
        </div>
      </div>
    </>
  )
}, (prev, next) => prev.streamId === next.streamId)

function ControlBtn({ children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'w-7 h-7 flex items-center justify-center rounded flex-shrink-0',
        'text-white/65 hover:text-white',
        'hover:bg-white/10 active:scale-90',
        'transition-all duration-100'
      )}
    >
      {children}
    </button>
  )
}

export default StreamPlayer