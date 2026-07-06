'use client'

import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { useTaskStore, PRIORITY_CONFIG, type TaskData } from '@/store/taskStore'
import type { Priority } from '@/types/task'

function DraggableTask({ task }: { task: TaskData }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { type: 'task', taskId: task.id },
  })

  const priorityCfg = PRIORITY_CONFIG[task.priority]

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-2 rounded-md border border-border bg-background cursor-grab hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${priorityCfg.bg} ${priorityCfg.color} font-medium shrink-0`}>
          {priorityCfg.label}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{task.title}</div>
          {task.description && (
            <div className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-muted-foreground">
          {task.duration >= 60 ? `${Math.floor(task.duration / 60)}h${task.duration % 60 > 0 ? `${task.duration % 60}m` : ''}` : `${task.duration}m`}
        </span>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            useTaskStore.getState().removeTask(task.id)
          }}
          className="text-[10px] text-muted-foreground hover:text-destructive"
        >
          删除
        </button>
      </div>
    </div>
  )
}

export function TaskPanel() {
  const { tasks, addTask } = useTaskStore()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(30)
  const [priority, setPriority] = useState<Priority>('MEDIUM')

  const unscheduledTasks = tasks.filter((t) => t.timeBlockId === null && !t.completed)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addTask({
      title: title.trim(),
      description: description.trim() || null,
      duration,
      priority,
    })
    setTitle('')
    setDescription('')
    setDuration(30)
    setPriority('MEDIUM')
    setShowForm(false)
  }

  return (
    <div className="w-64 shrink-0 border-r border-border bg-background flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">任务列表</h2>
        <div className="mt-3 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground space-y-1">
          <p>💡 双击时间轴创建功能区</p>
          <p>💡 拖拽任务到功能区中</p>
          <p>💡 双击功能区编辑设置</p>
        </div>
      </div>

      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        {unscheduledTasks.length === 0 && !showForm && (
          <div className="text-sm text-muted-foreground text-center py-8">
            <svg className="w-12 h-12 mx-auto mb-2 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            暂无任务
          </div>
        )}

        {unscheduledTasks.map((task) => (
          <DraggableTask key={task.id} task={task} />
        ))}

        {showForm && (
          <form onSubmit={handleSubmit} className="p-3 border border-border rounded-md space-y-3 bg-muted/30">
            <div>
              <input
                type="text"
                placeholder="任务名称"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                className="w-full px-2 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="备注（可选）"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">时长（分钟）</label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">优先级</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full px-2 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="HIGH">高</option>
                  <option value="MEDIUM">中</option>
                  <option value="LOW">低</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                添加
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 text-xs font-medium border border-input rounded-md hover:bg-muted transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="p-3 border-t border-border">
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {showForm ? '取消' : '+ 新建任务'}
        </button>
      </div>
    </div>
  )
}
