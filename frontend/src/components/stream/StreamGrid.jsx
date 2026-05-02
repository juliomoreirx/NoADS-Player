import { useMemo, useState } from 'react'
import StreamPlayer from './StreamPlayer'
import useStreamStore from '../../store/streamStore'
import { Tv2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export function StreamGrid({ cinemaMode }) {
  const streams = useStreamStore(s => s.streams)
  const streamIds = useMemo(() => streams.map(s => s.id), [streams])
  const count = streamIds.length

  // Which stream's chat is shown in the sidebar
  const [activeChatId, setActiveChatId] = useState(null)

  // Auto-select first stream's chat when streams change
  const effectiveActiveChatId = activeChatId && streams.find(s => s.id === activeChatId)
    ? activeChatId
    : (streams[0]?.id ?? null)

  if (count === 0) {
    return <EmptyState />
  }

  const gridStyle = getGridStyle(count)
  const activeStream = streams.find(s => s.id === effectiveActiveChatId)
  const chatUrl = activeStream
    ? activeStream.platform === 'kick'
      ? `https://kick.com/popout/${activeStream.username}/chat`
      : `https://www.twitch.tv/embed/${activeStream.username}/chat?parent=${window.location.hostname}`
    : null

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* ── Video Grid ── */}
      <div
        className="flex-1 min-w-0 p-1 gap-1"
        style={{
          display: 'grid',
          ...gridStyle,
        }}
      >
        {streamIds.map((id, index) => {
          const isLastOdd = count % 2 !== 0 && index === count - 1 && count > 1
          const isThirdInRow = count === 3 && index === 2
          return (
            <div
              key={id}
              className="min-h-0 min-w-0"
              style={{
                gridColumn: (isLastOdd || isThirdInRow) ? 'span 2' : 'span 1',
              }}
            >
              <StreamPlayer streamId={id} />
            </div>
          )
        })}
      </div>

      {/* ── Unified Chat Sidebar ── */}
      <div
        className={cn(
          'flex-shrink-0 flex flex-col border-l border-white/8',
          'bg-[#0e0e10]',
          cinemaMode && 'hidden'
        )}
        style={{ width: '260px' }}
      >
        {/* Channel tabs */}
        <div className="flex items-center gap-0 border-b border-white/8 px-1 pt-1 flex-wrap">
          {streams.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveChatId(s.id)}
              className={cn(
                'px-3 py-1.5 text-xs font-mono rounded-t transition-colors truncate max-w-[80px]',
                s.id === effectiveActiveChatId
                  ? 'bg-white/10 text-white border-b-2 border-[#9147ff]'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              )}
              title={s.username}
            >
              {s.username}
            </button>
          ))}
        </div>

        {/* Chat label */}
        <div className="px-3 py-1.5 border-b border-white/5">
          <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
            Chat da transmissão
          </span>
        </div>

        {/* Chat iframe */}
        <div className="flex-1 min-h-0 relative">
          {chatUrl ? (
            <iframe
              key={effectiveActiveChatId}
              src={chatUrl}
              className="w-full h-full border-none"
              title={`Chat - ${activeStream?.username}`}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white/20 text-xs font-mono">
              Sem chat
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getGridStyle(count) {
  if (count === 1) return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' }
  if (count === 2) return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr' }
  if (count === 3 || count === 4) return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' }
  if (count <= 6) return { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: count <= 3 ? '1fr' : '1fr 1fr' }
  return { gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr' }
}

function EmptyState() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6 animate-fade-in">
      <div
        className="absolute inset-0 opacity-[0.015] bg-grid-pattern bg-grid"
        style={{ maskImage: 'radial-gradient(ellipse 60% 60% at center, black 0%, transparent 100%)' }}
      />
      <div className="relative flex flex-col items-center gap-4 text-center">
        <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center border border-white/5">
          <Tv2 size={32} className="text-white/20" />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-white/40 mb-1">Nenhuma stream ativa</h2>
          <p className="text-sm font-mono text-white/20">Adicione um canal Twitch ou Kick para começar</p>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <PlatformHint color="#9147ff" label="Twitch" />
          <div className="w-px h-8 bg-white/10" />
          <PlatformHint color="#53fc18" label="Kick" />
        </div>
      </div>
    </div>
  )
}

function PlatformHint({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-xs font-mono text-white/30">{label}</span>
    </div>
  )
}