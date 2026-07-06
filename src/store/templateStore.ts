import { create } from 'zustand'
import { formatDate, getWeekDates } from '@/lib/time'
import { useTimeBlockStore } from './timeBlockStore'

export interface TemplateData {
  id: string
  name: string
  createdAt: number
  blocks: Array<{
    dayOfWeek: number
    name: string
    color: string
    startTime: number
    endTime: number
  }>
}

interface TemplateStore {
  templates: TemplateData[]
  loaded: boolean

  loadFromDB: () => Promise<void>
  createFromWeek: (name: string, weekStartDate: Date) => string
  applyToWeek: (templateId: string, weekStartDate: Date) => boolean
  applyToDateRange: (templateId: string, startDate: Date, endDate: Date) => { success: number; failed: number }
  deleteTemplate: (id: string) => void
}

function genId(): string {
  return `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
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

async function apiDelete(url: string) {
  try {
    await fetch(url, { method: 'DELETE' })
  } catch { /* ignore */ }
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  templates: [],
  loaded: false,

  loadFromDB: async () => {
    try {
      const res = await fetch('/api/templates')
      if (!res.ok) return
      const data = await res.json()
      const templates: TemplateData[] = data.map((t: { id: string; name: string; blocks: unknown; createdAt: string }) => ({
        id: t.id,
        name: t.name,
        createdAt: new Date(t.createdAt).getTime(),
        blocks: t.blocks as TemplateData['blocks'],
      }))
      set({ templates, loaded: true })
    } catch { /* ignore */ }
  },

  createFromWeek: (name, weekStartDate) => {
    const weekDates = getWeekDates(weekStartDate)
    const { blocks } = useTimeBlockStore.getState()

    const templateBlocks: TemplateData['blocks'] = []

    weekDates.forEach((date, dayIndex) => {
      const dateStr = formatDate(date)
      const dayBlocks = blocks.filter((b) => b.date === dateStr)
      dayBlocks.forEach((b) => {
        templateBlocks.push({
          dayOfWeek: dayIndex,
          name: b.name,
          color: b.color,
          startTime: b.startTime,
          endTime: b.endTime,
        })
      })
    })

    const template: TemplateData = {
      id: genId(),
      name,
      createdAt: Date.now(),
      blocks: templateBlocks,
    }

    set((state) => ({ templates: [...state.templates, template] }))
    apiPost('/api/templates', { id: template.id, name: template.name, blocks: template.blocks })
    return template.id
  },

  applyToWeek: (templateId, weekStartDate) => {
    const template = get().templates.find((t) => t.id === templateId)
    if (!template) return false

    const weekDates = getWeekDates(weekStartDate)
    const { addBlock, updateBlock } = useTimeBlockStore.getState()

    let allSuccess = true

    template.blocks.forEach((tplBlock) => {
      const date = weekDates[tplBlock.dayOfWeek]
      if (!date) return
      const dateStr = formatDate(date)
      const result = addBlock(dateStr, tplBlock.startTime, tplBlock.endTime)
      if (result) {
        updateBlock(result, { name: tplBlock.name, color: tplBlock.color })
      } else {
        allSuccess = false
      }
    })

    return allSuccess
  },

  applyToDateRange: (templateId, startDate, endDate) => {
    const startWeek = getWeekDates(startDate)[0]
    const endWeek = getWeekDates(endDate)[0]

    let success = 0
    let failed = 0

    const cursor = new Date(startWeek)
    while (cursor <= endWeek) {
      const result = get().applyToWeek(templateId, new Date(cursor))
      if (result) {
        success++
      } else {
        failed++
      }
      cursor.setDate(cursor.getDate() + 7)
    }

    return { success, failed }
  },

  deleteTemplate: (id) => {
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
    }))
    apiDelete(`/api/templates/${id}`)
  },
}))
