import { cn } from '../../lib/utils'

export function StreamSkeleton({ status }) {
  const isActive = status === 'loading' || status === 'bypassing'

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-void-200 overflow-hidden">
      {/* Animated background grid */}
      <div
        className="absolute inset-0 opacity-30 bg-grid-pattern bg-grid"
        style={{ maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 100%)' }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Spinning loader */}
        {isActive && (
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-white/5 border-t-white/40 animate-spin" />
            <div className="absolute inset-1 rounded-full border border-white/5 border-b-white/20 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
          </div>
        )}

        <div className="flex flex-col items-center gap-2 text-center px-8">
          <span className="text-xs font-mono text-white/30 tracking-[0.2em] uppercase">
            {status === 'bypassing'
              ? '⚡ Bypassando Cloudflare...'
              : status === 'loading'
              ? 'Iniciando Puppeteer...'
              : status === 'offline'
              ? 'Canal Offline'
              : status === 'error'
              ? 'Falha na conexão'
              : 'Aguardando stream...'}
          </span>

          {/* Progress dots */}
          {isActive && (
            <div className="flex gap-1.5 mt-2">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full bg-white/20 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Skeleton bars at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-12 flex items-center px-4 gap-3">
        <div className="skeleton w-6 h-6 rounded-full" />
        <div className="skeleton h-3 rounded flex-1 max-w-[140px]" />
        <div className="ml-auto skeleton h-6 w-16 rounded-full" />
      </div>
    </div>
  )
}
