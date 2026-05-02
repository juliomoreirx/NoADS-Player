import { RefreshCw, WifiOff, AlertTriangle } from 'lucide-react'
import { cn } from '../../lib/utils'

export function ErrorOverlay({ errorType, onRetry, retryCount, maxRetries = 3 }) {
  const isFatal = errorType === 'fatal' || retryCount >= maxRetries
  const isNetwork = errorType === 'network'

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-void-200/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 text-center px-6 animate-scale-in">
        {/* Icon */}
        <div className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center',
          isFatal ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'
        )}>
          {isNetwork
            ? <WifiOff size={24} />
            : isFatal
            ? <AlertTriangle size={24} />
            : <AlertTriangle size={24} />}
        </div>

        {/* Message */}
        <div>
          <p className="text-white/80 text-sm font-display font-semibold mb-1">
            {isFatal ? 'Falha Fatal no Stream' : 'Fragmento Falhou'}
          </p>
          <p className="text-white/30 text-xs font-mono">
            {isFatal
              ? 'O stream não pôde ser recuperado'
              : isNetwork
              ? 'Erro de rede — reconectando...'
              : `Erro de mídia (tentativa ${retryCount}/${maxRetries})`}
          </p>
        </div>

        {/* Retry button */}
        {!isFatal && (
          <button
            onClick={onRetry}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono transition-all',
              'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20',
              'text-white/70 hover:text-white active:scale-95'
            )}
          >
            <RefreshCw size={12} className={retryCount > 0 ? 'animate-spin' : ''} />
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  )
}
