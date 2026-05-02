import { useMemo } from 'react'
import StreamPlayer from './StreamPlayer'
import useStreamStore from '../../store/streamStore'
import { Tv2 } from 'lucide-react'

/**
 * StreamGrid - Manages the dynamic multi-stream layout.
 *
 * LAYOUT ALGORITHM:
 * Uses CSS Grid with dynamic template columns/rows.
 * For 3 streams, the last item gets `grid-column: span 2` to
 * maintain visual balance.
 *
 * WHY CSS GRID OVER FLEXBOX:
 * Grid handles "orphaned" streams elegantly with span directives.
 * Flexbox would require wrapping hacks and JS calculations.
 *
 * PERFORMANCE:
 * - useMemo on stream IDs prevents recalculating grid on status updates
 * - Each StreamPlayer is a separate memoized tree
 * - Grid only changes on stream add/remove, not on any internal state change
 */
export function StreamGrid({ cinemaMode }) {
  const streams = useStreamStore(s => s.streams)
  const streamIds = useMemo(() => streams.map(s => s.id), [streams])
  const count = streamIds.length

  if (count === 0) {
    return <EmptyState />
  }

  const gridStyle = getGridStyle(count)

  return (
    <div
      className="w-full h-full p-1.5 gap-1.5"
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
            <div className="w-full h-full">
              <StreamPlayer streamId={id} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function getGridStyle(count) {
  if (count === 1) {
    return {
      gridTemplateColumns: '1fr',
      gridTemplateRows: '1fr',
    }
  }
  if (count === 2) {
    return {
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr',
    }
  }
  if (count === 3 || count === 4) {
    return {
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
    }
  }
  if (count <= 6) {
    return {
      gridTemplateColumns: '1fr 1fr 1fr',
      gridTemplateRows: count <= 3 ? '1fr' : '1fr 1fr',
    }
  }
  return {
    gridTemplateColumns: 'repeat(3, 1fr)',
    gridAutoRows: '1fr',
  }
}

function EmptyState() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6 animate-fade-in">
      {/* Background decoration */}
      <div
        className="absolute inset-0 opacity-[0.015] bg-grid-pattern bg-grid"
        style={{ maskImage: 'radial-gradient(ellipse 60% 60% at center, black 0%, transparent 100%)' }}
      />

      <div className="relative flex flex-col items-center gap-4 text-center">
        <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center border border-white/5">
          <Tv2 size={32} className="text-white/20" />
        </div>

        <div>
          <h2 className="text-xl font-display font-bold text-white/40 mb-1">
            Nenhuma stream ativa
          </h2>
          <p className="text-sm font-mono text-white/20">
            Adicione um canal Twitch ou Kick para começar
          </p>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <PlatformHint platform="twitch" color="#9147ff" label="Twitch" />
          <div className="w-px h-8 bg-white/10" />
          <PlatformHint platform="kick" color="#53fc18" label="Kick" />
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
