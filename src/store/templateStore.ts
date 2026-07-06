import { create } from 'zustand'
import { formatDate, getWeekDates, type TimeRange } from '@/lib/time'
import { useTimeBlockStore, type TimeBlockData } from './timeBlockStore'

export interface TemplateData {
  id: string
  name: string
  createdAt: number
  blocks: Array<{
    dayOfWeek: number // 0 = 周一, 6 = 周日
    name: string
    color: string
    startTime: number
    endTime: number
  }>
}

interface TemplateStore {
  templates: TemplateData[]

  createFromWeek: (name: string, weekStartDate: Date) => string
  applyToWeek: (templateId: string, weekStartDate: Date) => boolean
  deleteTemplate: (id: string) => void
  updateTemplateName: (id: string, name: string) => void
}

function genId(): string {
  return `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  templates: [],

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
    return template.id
  },

  applyToWeek: (templateId, weekStartDate) => {
    const template = get().templates.find((t) => t.id === templateId)
    if (!template) return false

    const weekDates = getWeekDates(weekStartDate)
    const { addBlock } = useTimeBlockStore.getState()

    let allSuccess = true

    template.blocks.forEach((tplBlock) => {
      const date = weekDates[tplBlock.dayOfWeek]
      if (!date) return
      const dateStr = formatDate(date)
      const result = addBlock(dateStr, tplBlock.startTime, tplBlock.endTime)
      if (result) {
        const { blocks, updateBlock } = useTimeBlockStore.getState()
        const newBlock = blocks.find((b) => b.id === result)
        if (newBlock) {
          updateBlock(result, { name: tplBlock.name, color: tplBlock.color })
        }
      } else {
        allSuccess = false
      }
    })

    return allSuccess
  },

  deleteTemplate: (id) => {
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
    }))
  },

  updateTemplateName: (id, name) => {
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id ? { ...t, name } : t
      ),
    }))
  },
}))
