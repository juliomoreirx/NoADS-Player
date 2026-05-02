import { memo, useCallback } from 'react'
import { Volume2, VolumeX, MessageSquare, MessageSquareOff, X, Maximize2 } from 'lucide-react'
import { useStreamPlayer } from '../../hooks/useStreamPlayer'
import { useStreamLoader } from '../../hooks/useStreamLoader'
import { StatusBadge } from '../ui/StatusBadge'
import { StreamSkeleton } from '../ui/StreamSkeleton'
import { ErrorOverlay } from '../ui/ErrorOverlay'
import { PlatformIcon } from '../../assets/icons/PlatformIcons'
import useStreamStore from '../../store/streamStore'
import { cn, getPlatformColor } from '../../lib/utils'

/**
 * StreamPlayer - Renders a single stream card with video + chat.
 *
 * MEMOIZATION STRATEGY:
 * Wrapped in React.memo with a custom equality check. Only re-renders when:
 * - `url` changes (new stream loaded)
 * - `chatVisible` changes (toggle chat)
 * - `status` changes (loading states)
 * - `isMuted` changes (global mute)
 *
 * HLS instance changes are handled imperatively via useStreamPlayer hook
 * and DO NOT trigger re-renders.
 */
const StreamPlayer = memo(function StreamPlayer({ streamId }) {
  const stream = useStreamStore(s => s.streams.find(x => x.id === streamId))
  const globalMuted = useStreamStore(s => s.globalMuted)
  const removeStream = useStreamStore(s => s.removeStream)
  const toggleChat = useStreamStore(s => s.toggleChat)
  const setActiveStream = useStreamStore(s => s.setActiveStream)

  const { reload } = useStreamLoader(streamId)

  const { videoRef, playerState, errorType, retry, retryCount } = useStreamPlayer({
    streamId,
    proxiedUrl: stream?.url || null,
    isMuted: globalMuted,
  })

  const handleRemove = useCallback(() => removeStream(streamId), [removeStream, streamId])
  const handleToggleChat = useCallback(() => toggleChat(streamId), [toggleChat, streamId])
  const handleFocus = useCallback(() => setActiveStream(streamId), [setActiveStream, streamId])

  if (!stream) return null

  const isLoading = stream.status === 'loading' || stream.status === 'bypassing'
  const isError = stream.status === 'error'
  const isOffline = stream.status === 'offline'
  const showSkeleton = isLoading || isOffline || (isError && !stream.url)
  const showPlayer = stream.status === 'online' || stream.url

  const showPlayerError = showPlayer && (playerState === 'error' || playerState === 'fatal')

  const accentColor = getPlatformColor(stream.platform)

  // Build chat URL
  const chatUrl = stream.platform === 'kick'
    ? `https://kick.com/popout/${stream.username}/chat`
    : `https://www.twitch.tv/embed/${stream.username}/chat?parent=${window.location.hostname}`

  return (
    <div
      className={cn(
        'relative flex overflow-hidden rounded-xl border bg-void-200 group',
        'border-white/5 hover:border-white/10 transition-colors duration-300',
        'animate-scale-in'
      )}
      onClick={handleFocus}
      style={{ '--accent': accentColor }}
    >
      {/* === VIDEO PANEL === */}
      <div className="relative flex-1 bg-black min-w-0">

        {/* Top overlay bar */}
        <div className={cn(
          'absolute top-0 left-0 right-0 z-30 flex items-center gap-2 p-2',
          'bg-gradient-to-b from-black/70 to-transparent',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-200'
        )}>
          {/* Platform icon + username */}
          <div className="flex items-center gap-1.5">
            <PlatformIcon platform={stream.platform} size={14} />
            <span className="text-xs font-mono text-white/80 truncate max-w-[120px]">
              {stream.username}
            </span>
          </div>

          {/* Status */}
          <StatusBadge status={stream.status === 'online' ? playerState : stream.status} />

          {/* Controls */}
          <div className="ml-auto flex items-center gap-1">
            <ControlButton
              onClick={handleToggleChat}
              title={stream.chatVisible ? 'Ocultar chat' : 'Mostrar chat'}
            >
              {stream.chatVisible
                ? <MessageSquare size={13} />
                : <MessageSquareOff size={13} />}
            </ControlButton>

            <ControlButton onClick={handleRemove} title="Remover" danger>
              <X size={13} />
            </ControlButton>
          </div>
        </div>

        {/* Skeleton / Error states */}
        {showSkeleton && <StreamSkeleton status={stream.status} />}

        {/* Video element - always rendered to avoid DOM re-creation */}
        <video
          ref={videoRef}
          className={cn(
            'w-full h-full object-contain',
            !showPlayer && 'invisible'
          )}
          muted={globalMuted}
          autoPlay
          playsInline
        />

        {/* HLS player error overlay */}
        {showPlayerError && (
          <ErrorOverlay
            errorType={errorType}
            onRetry={retry}
            retryCount={retryCount}
          />
        )}

        {/* Offline state */}
        {isOffline && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <PlatformIcon platform={stream.platform} size={32} className="opacity-20" />
            <p className="text-white/20 text-xs font-mono tracking-widest uppercase">Offline</p>
            <button
              onClick={reload}
              className="text-xs font-mono text-white/30 hover:text-white/60 transition-colors underline underline-offset-4"
            >
              Verificar novamente
            </button>
          </div>
        )}

        {/* Bottom gradient bar with title */}
        {stream.title && stream.status === 'online' && (
          <div className={cn(
            'absolute bottom-0 left-0 right-0 px-3 py-2',
            'bg-gradient-to-t from-black/80 to-transparent',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-200'
          )}>
            <p className="text-white/60 text-xs font-mono truncate">{stream.title}</p>
          </div>
        )}

        {/* Platform color accent line at top */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)` }}
        />
      </div>

      {/* === CHAT PANEL === */}
      {/*
        Chat is lazily rendered: iframe is only added to DOM when chatVisible.
        This prevents 4 iframes from all polling Twitch/Kick servers simultaneously.
        Chat state is preserved in Zustand so show/hide is instant without re-fetch.
      */}
      <div
        className={cn(
          'flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out',
          'border-l border-white/5',
          stream.chatVisible ? 'w-[260px] opacity-100' : 'w-0 opacity-0'
        )}
      >
        {stream.chatVisible && (
          <iframe
            src={chatUrl}
            className="w-full h-full"
            title={`Chat - ${stream.username}`}
            loading="lazy"
          />
        )}
      </div>
    </div>
  )
}, (prev, next) => {
  // Custom equality: only re-render on meaningful changes
  // HLS state is managed imperatively, not through props
  const prevStream = prev
  const nextStream = next
  return prev.streamId === next.streamId
})

// Small helper button component
function ControlButton({ children, onClick, title, danger = false }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick?.() }}
      title={title}
      className={cn(
        'w-7 h-7 flex items-center justify-center rounded-lg transition-all',
        'glass border border-white/10 text-white/50',
        danger
          ? 'hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
          : 'hover:bg-white/10 hover:text-white hover:border-white/20',
      )}
    >
      {children}
    </button>
  )
}

export default StreamPlayer
