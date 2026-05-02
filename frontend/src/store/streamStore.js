import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

let streamIdCounter = 0

const useStreamStore = create(
  subscribeWithSelector((set, get) => ({
    // ── Streams ────────────────────────────────────────────────────────
    streams: [],

    addStream: (platform, username) => {
      const id = ++streamIdCounter
      set(state => ({
        streams: [
          ...state.streams,
          {
            id,
            platform,
            username: username.trim().toLowerCase(),
            status: 'loading', // loading | online | offline | error | bypassing
            url: null,
            title: null,
            chatVisible: true,
            error: null,
          },
        ],
      }))
      return id
    },

    removeStream: (id) => {
      set(state => ({
        streams: state.streams.filter(s => s.id !== id),
      }))
    },

    updateStream: (id, patch) => {
      set(state => ({
        streams: state.streams.map(s => s.id === id ? { ...s, ...patch } : s),
      }))
    },

    toggleChat: (id) => {
      set(state => ({
        streams: state.streams.map(s =>
          s.id === id ? { ...s, chatVisible: !s.chatVisible } : s
        ),
      }))
    },

    reorderStreams: (from, to) => {
      set(state => {
        const arr = [...state.streams]
        const [moved] = arr.splice(from, 1)
        arr.splice(to, 0, moved)
        return { streams: arr }
      })
    },

    // ── Global Controls ────────────────────────────────────────────────
    globalMuted: false,
    cinemaMode: false,
    sidebarOpen: true,
    activeStreamId: null, // focused/primary stream

    toggleMuteAll: () => set(state => ({ globalMuted: !state.globalMuted })),
    toggleCinemaMode: () => set(state => ({ cinemaMode: !state.cinemaMode })),
    toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
    setActiveStream: (id) => set({ activeStreamId: id }),

    // ── HLS Quality Control (concurrency) ─────────────────────────────
    // Tracks active HLS instances for concurrency management
    hlsInstances: new Map(), // id -> hls instance

    registerHls: (id, instance) => {
      set(state => {
        const map = new Map(state.hlsInstances)
        map.set(id, instance)
        return { hlsInstances: map }
      })
      // If > 4 streams, degrade lowest priority ones
      get()._manageQuality()
    },

    unregisterHls: (id) => {
      set(state => {
        const map = new Map(state.hlsInstances)
        map.delete(id)
        return { hlsInstances: map }
      })
    },

    _manageQuality: () => {
      const { hlsInstances, streams, activeStreamId } = get()
      if (hlsInstances.size <= 3) return

      streams.forEach((stream, index) => {
        const instance = hlsInstances.get(stream.id)
        if (!instance) return

        const isActive = stream.id === activeStreamId
        const isPriority = index < 2 || isActive

        // Auto quality for background streams
        if (!isPriority && instance.currentLevel !== -1) {
          instance.currentLevel = -1 // HLS auto
          instance.autoLevelEnabled = true
        }
      })
    },
  }))
)

export default useStreamStore
