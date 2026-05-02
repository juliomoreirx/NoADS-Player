import { Volume2, VolumeX, Clapperboard, LayoutGrid, PanelLeft } from 'lucide-react'
import { AddStreamInput } from '../controls/AddStreamInput'
import useStreamStore from '../../store/streamStore'
import { cn } from '../../lib/utils'

export function Topbar() {
  const globalMuted = useStreamStore(s => s.globalMuted)
  const cinemaMode = useStreamStore(s => s.cinemaMode)
  const streamCount = useStreamStore(s => s.streams.length)
  const toggleMuteAll = useStreamStore(s => s.toggleMuteAll)
  const toggleCinemaMode = useStreamStore(s => s.toggleCinemaMode)

  return (
    <header
      className={cn(
        'relative flex-shrink-0 flex items-center gap-3 px-4 py-2.5 z-50',
        'glass-heavy border-b border-white/5',
        'transition-all duration-500',
        cinemaMode && 'opacity-0 pointer-events-none h-0 py-0 overflow-hidden'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-2 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
          <LayoutGrid size={13} className="text-white/60" />
        </div>
        <span className="text-sm font-display font-bold tracking-tight text-white/90 hidden sm:block">
          viewflix
        </span>
        {streamCount > 0 && (
          <span className="text-xs font-mono text-white/25 hidden md:block">
            {streamCount} stream{streamCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-white/8 flex-shrink-0 hidden sm:block" />

      {/* Add stream input — takes remaining space */}
      <div className="flex-1 max-w-md">
        <AddStreamInput />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Global controls */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Mute All */}
        <TopbarButton
          onClick={toggleMuteAll}
          active={globalMuted}
          title={globalMuted ? 'Desmutar todos' : 'Mutar todos'}
        >
          {globalMuted
            ? <VolumeX size={13} />
            : <Volume2 size={13} />}
        </TopbarButton>

        {/* Cinema Mode */}
        <TopbarButton
          onClick={toggleCinemaMode}
          active={cinemaMode}
          title="Modo Cinema"
          highlight
        >
          <Clapperboard size={13} />
        </TopbarButton>
      </div>
    </header>
  )
}

function TopbarButton({ children, onClick, active, title, highlight }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'w-8 h-8 flex items-center justify-center rounded-lg transition-all text-white/50',
        'border',
        active
          ? highlight
            ? 'bg-white/10 border-white/20 text-white'
            : 'bg-white/8 border-white/15 text-white/80'
          : 'glass border-white/8 hover:bg-white/8 hover:text-white hover:border-white/15'
      )}
    >
      {children}
    </button>
  )
}
