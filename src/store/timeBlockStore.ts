import { create } from 'zustand'
import { formatDate, snapToGrid, checkOverlap, type TimeRange } from '@/lib/time'

export interface TimeBlockData {
  id: string
  date: string // YYYY-MM-DD
  name: string
  color: string
  startTime: number
  endTime: number
  locked: boolean
}

export const BLOCK_COLORS = [
  { name: '蓝色', value: '#3b82f6', bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-700' },
  { name: '绿色', value: '#22c55e', bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-700' },
  { name: '橙色', value: '#f97316', bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-700' },
  { name: '紫色', value: '#a855f7', bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-700' },
  { name: '粉色', value: '#ec4899', bg: 'bg-pink-500/20', border: 'border-pink-500', text: 'text-pink-700' },
  { name: '青色', value: '#06b6d4', bg: 'bg-cyan-500/20', border: 'border-cyan-500', text: 'text-cyan-700' },
]

interface TimeBlockStore {
  blocks: TimeBlockData[]
  selectedBlockId: string | null
  loaded: boolean

  loadFromDB: () => Promise<void>
  addBlock: (date: string, startTime: number, endTime: number) => string | null
  updateBlock: (id: string, updates: Partial<Omit<TimeBlockData, 'id'>>) => boolean
  removeBlock: (id: string) => void
  selectBlock: (id: string | null) => void
  getBlocksByDate: (date: string) => TimeBlockData[]
  toggleLock: (id: string) => void
}

function genId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

async function apiPost(url: string, data: unknown) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.ok ? await res.json() : null
  } catch { return null }
}

async function apiPut(url: string, data: unknown) {
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.ok
  } catch { return false }
}

async function apiDelete(url: string) {
  try {
    await fetch(url, { method: 'DELETE' })
  } catch { /* ignore */ }
}

export const useTimeBlockStore = create<TimeBlockStore>((set, get) => ({
  blocks: [],
  selectedBlockId: null,
  loaded: false,

  loadFromDB: async () => {
    try {
      const res = await fetch('/api/blocks')
      if (!res.ok) return
      const data = await res.json()
      set({ blocks: data, loaded: true })
    } catch { /* ignore */ }
  },

  addBlock: (date, startTime, endTime) => {
    const start = snapToGrid(startTime)
    const end = snapToGrid(endTime)
    if (end - start < 5) return null

    const existingBlocks = get().blocks.filter((b) => b.date === date)
    const newRange: TimeRange = { startTime: start, endTime: end }
    const hasOverlap = existingBlocks.some((b) => checkOverlap(b, newRange))
    if (hasOverlap) return null

    const color = BLOCK_COLORS[existingBlocks.length % BLOCK_COLORS.length].value
    const id = genId()
    const block: TimeBlockData = {
      id,
      date,
      name: '功能区',
      color,
      startTime: start,
      endTime: end,
      locked: false,
    }

    set((state) => ({ blocks: [...state.blocks, block] }))
    apiPost('/api/blocks', block)
    return id
  },

  updateBlock: (id, updates) => {
    const state = get()
    const block = state.blocks.find((b) => b.id === id)
    if (!block) return false

    if (block.locked && (updates.startTime !== undefined || updates.endTime !== undefined)) {
      return false
    }

    const newStart = updates.startTime !== undefined ? snapToGrid(updates.startTime) : block.startTime
    const newEnd = updates.endTime !== undefined ? snapToGrid(updates.endTime) : block.endTime

    if (newEnd - newStart < 5) return false

    if (updates.startTime !== undefined || updates.endTime !== undefined) {
      const otherBlocks = state.blocks.filter((b) => b.id !== id && b.date === block.date)
      const newRange: TimeRange = { startTime: newStart, endTime: newEnd }
      const hasOverlap = otherBlocks.some((b) => checkOverlap(b, newRange))
      if (hasOverlap) return false
    }

    set((state) => ({
      blocks: state.blocks.map((b) =>
        b.id === id ? { ...b, ...updates, startTime: newStart, endTime: newEnd } : b
      ),
    }))
    apiPut(`/api/blocks/${id}`, { ...updates, startTime: newStart, endTime: newEnd })
    return true
  },

  removeBlock: (id) => {
    set((state) => ({
      blocks: state.blocks.filter((b) => b.id !== id),
      selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
    }))
    apiDelete(`/api/blocks/${id}`)
  },

  selectBlock: (id) => set({ selectedBlockId: id }),

  getBlocksByDate: (date) => {
    return get().blocks.filter((b) => b.date === date)
  },

  toggleLock: (id) => {
    const block = get().blocks.find((b) => b.id === id)
    if (!block) return
    const newLocked = !block.locked
    set((state) => ({
      blocks: state.blocks.map((b) =>
        b.id === id ? { ...b, locked: newLocked } : b
      ),
    }))
    apiPut(`/api/blocks/${id}`, { locked: newLocked })
  },
}))
