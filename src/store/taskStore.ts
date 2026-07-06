import { create } from 'zustand'
import type { Priority, TaskStatus } from '@/types/task'

export interface TaskData {
  id: string
  title: string
  description: string | null
  duration: number // 预计时长（分钟）
  priority: Priority
  status: TaskStatus
  timeBlockId: string | null
  blockPosition: number | null
  completed: boolean
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  HIGH: { label: '高', color: 'text-red-600', bg: 'bg-red-500/15' },
  MEDIUM: { label: '中', color: 'text-orange-600', bg: 'bg-orange-500/15' },
  LOW: { label: '低', color: 'text-blue-600', bg: 'bg-blue-500/15' },
}

interface TaskStore {
  tasks: TaskData[]

  addTask: (task: Omit<TaskData, 'id' | 'status' | 'timeBlockId' | 'blockPosition' | 'completed'>) => string
  updateTask: (id: string, updates: Partial<Omit<TaskData, 'id'>>) => void
  removeTask: (id: string) => void
  assignToBlock: (taskId: string, blockId: string, position: number) => void
  removeFromBlock: (taskId: string) => void
  toggleComplete: (taskId: string) => void
  getTasksByBlock: (blockId: string) => TaskData[]
  getUnscheduledTasks: () => TaskData[]
}

function genId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],

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
    return id
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  },

  removeTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }))
  },

  assignToBlock: (taskId, blockId, position) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, timeBlockId: blockId, blockPosition: position, status: 'SCHEDULED' }
          : t
      ),
    }))
  },

  removeFromBlock: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, timeBlockId: null, blockPosition: null, status: 'PENDING' }
          : t
      ),
    }))
  },

  toggleComplete: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, completed: !t.completed, status: !t.completed ? 'COMPLETED' : 'PENDING' }
          : t
      ),
    }))
  },

  getTasksByBlock: (blockId) => {
    return get()
      .tasks.filter((t) => t.timeBlockId === blockId)
      .sort((a, b) => (a.blockPosition ?? 0) - (b.blockPosition ?? 0))
  },

  getUnscheduledTasks: () => {
    return get().tasks.filter((t) => t.timeBlockId === null && !t.completed)
  },
}))
