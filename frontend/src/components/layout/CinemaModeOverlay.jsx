import { useEffect } from 'react'
import { Clapperboard } from 'lucide-react'
import useStreamStore from '../../store/streamStore'
import { cn } from '../../lib/utils'

export function CinemaModeOverlay() {
  const cinemaMode = useStreamStore(s => s.cinemaMode)
  const toggleCinemaMode = useStreamStore(s => s.toggleCinemaMode)

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && cinemaMode) {
        toggleCinemaMode()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [cinemaMode, toggleCinemaMode])

  if (!cinemaMode) return null

  return (
    <button
      onClick={toggleCinemaMode}
      className={cn(
        'fixed top-4 right-4 z-[100] flex items-center gap-2 px-3 py-2 rounded-full',
        'glass-heavy border border-white/10 text-white/30 hover:text-white/70 transition-all',
        'text-xs font-mono animate-fade-in'
      )}
    >
      <Clapperboard size={11} />
      <span>Sair do Cinema (Esc)</span>
    </button>
  )
}
