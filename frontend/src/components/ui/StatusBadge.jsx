import { cn } from '../../lib/utils'

const STATUS_CONFIG = {
  loading: {
    dot: 'bg-yellow-400 animate-pulse',
    text: 'Conectando',
    textColor: 'text-yellow-400',
  },
  bypassing: {
    dot: 'bg-orange-400 animate-pulse',
    text: 'Bypass CF',
    textColor: 'text-orange-400',
  },
  online: {
    dot: 'bg-red-500 animate-pulse-slow',
    text: 'AO VIVO',
    textColor: 'text-red-400',
  },
  offline: {
    dot: 'bg-slate-500',
    text: 'Offline',
    textColor: 'text-slate-400',
  },
  error: {
    dot: 'bg-red-600',
    text: 'Erro',
    textColor: 'text-red-500',
  },
  buffering: {
    dot: 'bg-blue-400 animate-pulse',
    text: 'Buffering',
    textColor: 'text-blue-400',
  },
  playing: {
    dot: 'bg-red-500 animate-pulse-slow',
    text: 'AO VIVO',
    textColor: 'text-red-400',
  },
}

export function StatusBadge({ status, className }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.loading

  return (
    <div className={cn(
      'flex items-center gap-1.5 glass rounded-full px-2.5 py-1 text-xs font-mono no-select',
      className
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot)} />
      <span className={cn('tracking-wider uppercase', config.textColor)}>
        {config.text}
      </span>
    </div>
  )
}
