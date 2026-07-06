export type Priority = 'HIGH' | 'MEDIUM' | 'LOW'

export type TaskStatus = 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'

export interface Task {
  id: string
  userId: string
  title: string
  description: string | null
  duration: number
  priority: Priority
  status: TaskStatus
  tags: string[]
  color: string | null
  timeBlockId: string | null
  blockPosition: number | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}
