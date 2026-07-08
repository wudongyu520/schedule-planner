import { create } from 'zustand'
import type { Priority, TaskStatus } from '@/types/task'

export interface TaskData {
  id: string
  title: string
  description: string | null
  duration: number
  priority: Priority
  status: TaskStatus
  timeBlockId: string | null
  blockPosition: number | null
  completed: boolean
}

export interface TaskLogData {
  id: string
  taskTitle: string
  date: string
  action: string
  reason: string | null
  createdAt: string
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  HIGH: { label: '高', color: 'text-red-600', bg: 'bg-red-500/15' },
  MEDIUM: { label: '中', color: 'text-orange-600', bg: 'bg-orange-500/15' },
  LOW: { label: '低', color: 'text-blue-600', bg: 'bg-blue-500/15' },
}

type SortMode = 'default' | 'priority' | 'duration' | 'title'

interface TaskStore {
  tasks: TaskData[]
  logs: TaskLogData[]
  sortMode: SortMode
  loaded: boolean
  clipboardTask: TaskData | null

  loadFromDB: () => Promise<void>
  addTask: (task: Omit<TaskData, 'id' | 'status' | 'timeBlockId' | 'blockPosition' | 'completed'>) => string
  updateTask: (id: string, updates: Partial<Omit<TaskData, 'id'>>) => void
  removeTask: (id: string) => void
  assignToBlock: (taskId: string, blockId: string, position: number) => void
  removeFromBlock: (taskId: string) => void
  toggleComplete: (taskId: string) => void
  getTasksByBlock: (blockId: string) => TaskData[]
  getUnscheduledTasks: () => TaskData[]
  canAssignToBlock: (taskId: string, blockId: string, blockDuration: number) => boolean
  getBlockTaskDuration: (blockId: string) => number
  setSortMode: (mode: SortMode) => void
  expireTasksFromBlock: (blockId: string, reason: string) => void
  loadLogs: () => Promise<void>
  copyTask: (id: string) => void
  pasteTask: () => string | null
}

function genId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
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
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  } catch { /* ignore */ }
}

async function apiDelete(url: string) {
  try {
    await fetch(url, { method: 'DELETE' })
  } catch { /* ignore */ }
}

const PRIORITY_WEIGHT: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  logs: [],
  sortMode: 'default',
  loaded: false,
  clipboardTask: null,

  loadFromDB: async () => {
    try {
      const res = await fetch('/api/tasks')
      if (!res.ok) return
      const data = await res.json()
      set({ tasks: data, loaded: true })
    } catch { /* ignore */ }
  },

  loadLogs: async () => {
    try {
      const res = await fetch('/api/logs')
      if (!res.ok) return
      const data = await res.json()
      set({ logs: data })
    } catch { /* ignore */ }
  },

  addTask: (task) => {
    const id = genId()
    const newTask: TaskData = {
      ...task,
      id,
      status: 'PENDING',
      timeBlockId: null,
      blockPosition: null,
      completed: false,
    }
    set((state) => ({ tasks: [...state.tasks, newTask] }))
    apiPost('/api/tasks', newTask)
    return id
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
    apiPut(`/api/tasks/${id}`, updates)
  },

  removeTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }))
    apiDelete(`/api/tasks/${id}`)
  },

  assignToBlock: (taskId, blockId, position) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, timeBlockId: blockId, blockPosition: position, status: 'SCHEDULED' }
          : t
      ),
    }))
    apiPut(`/api/tasks/${taskId}`, { timeBlockId: blockId, blockPosition: position, status: 'SCHEDULED' })
  },

  removeFromBlock: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, timeBlockId: null, blockPosition: null, status: 'PENDING' }
          : t
      ),
    }))
    apiPut(`/api/tasks/${taskId}`, { timeBlockId: null, blockPosition: null, status: 'PENDING' })
  },

  toggleComplete: (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId)
    if (!task) return
    const newCompleted = !task.completed
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, completed: newCompleted, status: newCompleted ? 'COMPLETED' : 'PENDING' }
          : t
      ),
    }))
    apiPut(`/api/tasks/${taskId}`, {
      completed: newCompleted,
      status: newCompleted ? 'COMPLETED' : 'PENDING',
    })
  },

  getTasksByBlock: (blockId) => {
    return get()
      .tasks.filter((t) => t.timeBlockId === blockId)
      .sort((a, b) => (a.blockPosition ?? 0) - (b.blockPosition ?? 0))
  },

  getUnscheduledTasks: () => {
    const { tasks, sortMode } = get()
    const unscheduled = tasks.filter((t) => t.timeBlockId === null)
    const sorted = unscheduled.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      switch (sortMode) {
        case 'priority':
          return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
        case 'duration':
          return b.duration - a.duration
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })
    return sorted
  },

  getBlockTaskDuration: (blockId) => {
    return get()
      .tasks.filter((t) => t.timeBlockId === blockId && !t.completed)
      .reduce((sum, t) => sum + t.duration, 0)
  },

  canAssignToBlock: (taskId, blockId, blockDuration) => {
    const task = get().tasks.find((t) => t.id === taskId)
    if (!task) return false

    const otherTasksInBlock = get().tasks.filter(
      (t) => t.timeBlockId === blockId && t.id !== taskId && !t.completed
    )
    const otherDuration = otherTasksInBlock.reduce((sum, t) => sum + t.duration, 0)

    return otherDuration + task.duration <= blockDuration
  },

  setSortMode: (mode) => set({ sortMode: mode }),

  expireTasksFromBlock: (blockId, reason) => {
    const tasksToExpire = get().tasks.filter(
      (t) => t.timeBlockId === blockId && !t.completed
    )
    if (tasksToExpire.length === 0) return

    const now = new Date().toISOString().split('T')[0]

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.timeBlockId === blockId && !t.completed
          ? { ...t, status: 'EXPIRED', timeBlockId: null, blockPosition: null }
          : t
      ),
      logs: [
        ...tasksToExpire.map((t) => ({
          id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          taskTitle: t.title,
          date: now,
          action: 'EXPIRED',
          reason,
          createdAt: new Date().toISOString(),
        })),
        ...state.logs,
      ],
    }))

    tasksToExpire.forEach((t) => {
      apiPut(`/api/tasks/${t.id}`, { status: 'EXPIRED', timeBlockId: null, blockPosition: null })
      apiPost('/api/logs', {
        taskTitle: t.title,
        date: now,
        action: 'EXPIRED',
        reason,
      })
    })
  },

  copyTask: (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    set({ clipboardTask: { ...task } })
  },

  pasteTask: () => {
    const clipboard = get().clipboardTask
    if (!clipboard) return null

    const id = genId()
    const newTask: TaskData = {
      ...clipboard,
      id,
      status: 'PENDING',
      timeBlockId: null,
      blockPosition: null,
      completed: false,
      title: `${clipboard.title} (副本)`,
    }

    set((state) => ({ tasks: [...state.tasks, newTask] }))
    apiPost('/api/tasks', newTask)
    return id
  },
}))
