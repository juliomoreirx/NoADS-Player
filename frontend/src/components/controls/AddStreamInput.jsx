import { useState, useRef, useCallback, useEffect } from 'react'
import { Search, Plus, ChevronDown } from 'lucide-react'
import { KickIcon, TwitchIcon } from '../../assets/icons/PlatformIcons'
import useStreamStore from '../../store/streamStore'
import { POPULAR_STREAMS } from '../../services/streamService'
import { cn } from '../../lib/utils'

export function AddStreamInput() {
  const [username, setUsername] = useState('')
  const [platform, setPlatform] = useState('twitch')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [platformOpen, setPlatformOpen] = useState(false)
  const inputRef = useRef(null)
  const addStream = useStreamStore(s => s.addStream)

  const handleAdd = useCallback((name = username) => {
    const trimmed = name.trim()
    if (!trimmed) return
    addStream(platform, trimmed)
    setUsername('')
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }, [username, platform, addStream])

  const handleInput = (value) => {
    setUsername(value)
    if (value.length >= 1) {
      const list = POPULAR_STREAMS[platform] || []
      const filtered = list.filter(s =>
        s.toLowerCase().startsWith(value.toLowerCase()) && s !== value
      )
      setSuggestions(filtered.slice(0, 5))
      setShowSuggestions(filtered.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') {
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  const PLATFORMS = [
    { id: 'twitch', label: 'Twitch', icon: TwitchIcon, color: '#9147ff' },
    { id: 'kick', label: 'Kick', icon: KickIcon, color: '#53fc18' },
  ]

  const activePlatform = PLATFORMS.find(p => p.id === platform)
  const PlatformIconComp = activePlatform?.icon

  return (
    <div className="relative flex gap-2">
      {/* Platform selector */}
      <div className="relative">
        <button
          onClick={() => setPlatformOpen(v => !v)}
          className={cn(
            'h-9 flex items-center gap-2 px-3 rounded-lg text-xs font-mono transition-all',
            'glass border border-white/8 hover:border-white/15',
            'text-white/70 hover:text-white'
          )}
        >
          <PlatformIconComp
            size={13}
            className={platform === 'twitch' ? 'text-twitch' : 'text-kick'}
          />
          <span className="hidden sm:inline">{activePlatform?.label}</span>
          <ChevronDown size={10} className={cn('transition-transform', platformOpen && 'rotate-180')} />
        </button>

        {platformOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 min-w-[120px] rounded-lg overflow-hidden glass-heavy border border-white/10 animate-slide-up">
            {PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => { setPlatform(p.id); setPlatformOpen(false) }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-mono transition-colors text-left',
                  platform === p.id
                    ? 'text-white bg-white/8'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                )}
              >
                <p.icon size={12} style={{ color: p.color }} />
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search input */}
      <div className="relative flex-1">
        <div className={cn(
          'flex items-center h-9 rounded-lg overflow-hidden transition-all',
          'glass border border-white/8 focus-within:border-white/20',
        )}>
          <Search size={13} className="ml-3 text-white/30 flex-shrink-0" />
          <input
            ref={inputRef}
            value={username}
            onChange={e => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Nome do canal..."
            className="flex-1 h-full bg-transparent px-2.5 text-xs font-mono text-white placeholder-white/20 outline-none"
            spellCheck={false}
          />
        </div>

        {/* Autocomplete dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg overflow-hidden glass-heavy border border-white/10 animate-slide-up">
            {suggestions.map(s => (
              <button
                key={s}
                onMouseDown={() => handleAdd(s)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-left text-white/50 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Search size={10} className="text-white/20" />
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add button */}
      <button
        onClick={() => handleAdd()}
        disabled={!username.trim()}
        className={cn(
          'h-9 w-9 flex items-center justify-center rounded-lg flex-shrink-0 transition-all',
          'border border-white/10 text-white/50',
          username.trim()
            ? 'bg-white/8 hover:bg-white/15 hover:text-white hover:border-white/20 active:scale-95'
            : 'opacity-30 cursor-not-allowed'
        )}
      >
        <Plus size={15} />
      </button>
    </div>
  )
}
