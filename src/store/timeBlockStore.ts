import { create } from 'zustand'
import { formatDate, snapToGrid, checkOverlap, type TimeRange } from '@/lib/time'

export interface TimeBlockData {
  id: string
  date: string // YYYY-MM-DD
  name: string
  color: string
  startTime: number // 分钟
  endTime: number // 分钟
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

  addBlock: (date: string, startTime: number, endTime: number) => string | null
  updateBlock: (id: string, updates: Partial<Omit<TimeBlockData, 'id'>>) => boolean
  removeBlock: (id: string) => void
  selectBlock: (id: string | null) => void
  getBlocksByDate: (date: string) => TimeBlockData[]
}

function genId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const useTimeBlockStore = create<TimeBlockStore>((set, get) => ({
  blocks: [],
  selectedBlockId: null,

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
    }

    set((state) => ({ blocks: [...state.blocks, block] }))
    return id
  },

  updateBlock: (id, updates) => {
    const state = get()
    const block = state.blocks.find((b) => b.id === id)
    if (!block) return false

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
    return true
  },

  removeBlock: (id) => {
    set((state) => ({
      blocks: state.blocks.filter((b) => b.id !== id),
      selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
    }))
  },

  selectBlock: (id) => set({ selectedBlockId: id }),

  getBlocksByDate: (date) => {
    return get().blocks.filter((b) => b.date === date)
  },
}))
