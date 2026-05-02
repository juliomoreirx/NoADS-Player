import { Topbar } from './components/layout/Topbar'
import { StreamGrid } from './components/stream/StreamGrid'
import { CinemaModeOverlay } from './components/layout/CinemaModeOverlay'
import useStreamStore from './store/streamStore'
import { cn } from './lib/utils'

export default function App() {
  const cinemaMode = useStreamStore(s => s.cinemaMode)

  return (
    <div className="flex flex-col w-screen h-screen bg-void overflow-hidden">
      {/* Subtle noise texture overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.025] mix-blend-overlay"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '128px' }}
      />

      {/* Header */}
      <Topbar />

      {/* Main content grid */}
      <main
        className={cn(
          'flex-1 min-h-0 relative transition-all duration-500',
        )}
      >
        <StreamGrid cinemaMode={cinemaMode} />
      </main>

      {/* Cinema mode hint overlay */}
      <CinemaModeOverlay />
    </div>
  )
}
