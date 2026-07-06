'use client'

import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { useTaskStore, PRIORITY_CONFIG, type TaskData } from '@/store/taskStore'
import { TaskEditModal } from './TaskEditModal'
import type { Priority } from '@/types/task'

function DraggableTask({ task, onEdit }: { task: TaskData; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { type: 'task', taskId: task.id },
  })

  const priorityCfg = PRIORITY_CONFIG[task.priority]

  const formatDuration = (m: number) => {
    if (m >= 60) {
      const h = Math.floor(m / 60)
      const min = m % 60
      return min > 0 ? `${h}h${min}m` : `${h}h`
    }
    return `${m}m`
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-2.5 rounded-lg border border-border bg-background cursor-grab hover:shadow-md hover:border-border/80 transition-all group ${
        isDragging ? 'opacity-40 scale-[0.98]' : ''
      }`}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onEdit()
      }}
    >
      <div className="flex items-start gap-2">
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${priorityCfg.bg} ${priorityCfg.color} font-medium shrink-0 mt-0.5`}>
          {priorityCfg.label}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{task.title}</div>
          {task.description && (
            <div className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] text-muted-foreground font-medium">
          {formatDuration(task.duration)}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="text-[11px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted"
          >
            编辑
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              useTaskStore.getState().removeTask(task.id)
            }}
            className="text-[11px] text-muted-foreground hover:text-destructive px-1.5 py-0.5 rounded hover:bg-destructive/10"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  )
}

export function TaskPanel() {
  const { tasks, addTask, removeTask, updateTask, toggleComplete } = useTaskStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

  const unscheduledTasks = tasks.filter((t) => t.timeBlockId === null && !t.completed)
  const completedCount = tasks.filter((t) => t.completed).length

  const editingTask = editingTaskId ? tasks.find((t) => t.id === editingTaskId) : null

  const handleCreate = (data: {
    title: string
    description: string | null
    duration: number
    priority: Priority
  }) => {
    addTask(data)
    setShowCreateModal(false)
  }

  const handleSaveEdit = (data: {
    title: string
    description: string | null
    duration: number
    priority: Priority
  }) => {
    if (!editingTaskId) return
    updateTask(editingTaskId, data)
    setEditingTaskId(null)
  }

  const handleDeleteEdit = () => {
    if (!editingTaskId) return
    removeTask(editingTaskId)
    setEditingTaskId(null)
  }

  return (
    <div className="w-72 shrink-0 border-r border-border bg-background flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">任务列表</h2>
          <span className="text-xs text-muted-foreground">
            {unscheduledTasks.length} 待安排 · {completedCount} 已完成
          </span>
        </div>
        <div className="mt-3 p-2.5 rounded-lg bg-muted/40 text-xs text-muted-foreground space-y-1">
          <p>💡 双击时间轴创建功能区</p>
          <p>💡 拖拽任务到功能区安排</p>
          <p>💡 双击任务编辑详情</p>
        </div>
      </div>

      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        {unscheduledTasks.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-12">
            <svg className="w-14 h-14 mx-auto mb-3 text-muted-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            暂无待安排任务
          </div>
        )}

        {unscheduledTasks.map((task) => (
          <DraggableTask
            key={task.id}
            task={task}
            onEdit={() => setEditingTaskId(task.id)}
          />
        ))}
      </div>

      <div className="p-3 border-t border-border">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          + 新建任务
        </button>
      </div>

      {showCreateModal && (
        <TaskEditModal
          mode="create"
          onSave={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingTask && (
        <TaskEditModal
          mode="edit"
          initialTitle={editingTask.title}
          initialDescription={editingTask.description}
          initialDuration={editingTask.duration}
          initialPriority={editingTask.priority}
          initialTimeBlockId={editingTask.timeBlockId}
          onSave={handleSaveEdit}
          onClose={() => setEditingTaskId(null)}
          onDelete={handleDeleteEdit}
          onMoveOut={() => {
            if (!editingTaskId) return
            useTaskStore.getState().removeFromBlock(editingTaskId)
            setEditingTaskId(null)
          }}
        />
      )}
    </div>
  )
}
