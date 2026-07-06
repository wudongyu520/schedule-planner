'use client'

import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { useTaskStore, PRIORITY_CONFIG, type TaskData } from '@/store/taskStore'
import { TaskEditModal } from './TaskEditModal'
import { TemplateModal } from './TemplateModal'
import { LogModal } from './LogModal'
import { DataModal } from './DataModal'
import { ContextMenu, type ContextMenuItem } from '@/components/ui/ContextMenu'
import type { Priority } from '@/types/task'

function TaskCard({ task, onEdit }: { task: TaskData; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { type: 'task', task },
  })

  const { toggleComplete, removeTask } = useTaskStore()
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  const menuItems: ContextMenuItem[] = [
    {
      label: task.completed ? '标记为未完成' : '标记为完成',
      icon: task.completed ? '↩' : '✓',
      onClick: () => toggleComplete(task.id),
    },
    {
      label: '编辑',
      icon: '✎',
      onClick: onEdit,
    },
    { label: '', separator: true, onClick: () => {} },
    {
      label: '删除',
      icon: '✕',
      danger: true,
      onClick: () => {
        if (confirm(`删除任务"${task.title}"？`)) removeTask(task.id)
      },
    },
  ]

  return (
    <>
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        onContextMenu={handleContextMenu}
        onDoubleClick={(e) => {
          e.stopPropagation()
          onEdit()
        }}
        className={`p-2.5 rounded-lg border cursor-grab active:cursor-grabbing transition-all select-none ${
          isDragging ? 'opacity-30' : 'hover:shadow-sm'
        } ${
          task.completed
            ? 'bg-muted/30 border-border opacity-60'
            : 'bg-background border-border hover:border-primary/30'
        }`}
      >
        <div className="flex items-start gap-2">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${PRIORITY_CONFIG[task.priority].bg} ${PRIORITY_CONFIG[task.priority].color}`}
          >
            {PRIORITY_CONFIG[task.priority].label}
          </span>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium truncate ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </div>
            {task.description && (
              <div className="text-xs text-muted-foreground truncate mt-0.5">
                {task.description}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground mt-1">
              ⏱ {Math.floor(task.duration / 60)}h{task.duration % 60 > 0 ? `${task.duration % 60}m` : ''}
            </div>
          </div>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          items={menuItems}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  )
}

export function TaskPanel() {
  const { addTask, getUnscheduledTasks, setSortMode } = useTaskStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showLogModal, setShowLogModal] = useState(false)
  const [showDataModal, setShowDataModal] = useState(false)
  const [sortMode, setLocalSortMode] = useState<'default' | 'priority' | 'duration' | 'title'>('default')

  const unscheduledTasks = getUnscheduledTasks()

  const editingTask = editingTaskId
    ? useTaskStore.getState().tasks.find((t) => t.id === editingTaskId)
    : null

  const handleSortChange = (mode: 'default' | 'priority' | 'duration' | 'title') => {
    setLocalSortMode(mode)
    setSortMode(mode)
  }

  const handleSaveCreate = (data: { title: string; description: string | null; duration: number; priority: Priority }) => {
    addTask(data)
    setShowCreateModal(false)
  }

  const handleSaveEdit = (data: { title: string; description: string | null; duration: number; priority: Priority }) => {
    if (!editingTaskId) return
    useTaskStore.getState().updateTask(editingTaskId, data)
    setEditingTaskId(null)
  }

  const handleDeleteEdit = () => {
    if (!editingTaskId) return
    useTaskStore.getState().removeTask(editingTaskId)
    setEditingTaskId(null)
  }

  const handleDataChanged = () => {
    window.location.reload()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">任务列表</h2>
          <span className="text-xs text-muted-foreground">{unscheduledTasks.length}</span>
        </div>
        <div className="flex items-center gap-1 mt-2">
          <span className="text-[10px] text-muted-foreground shrink-0">排序</span>
          <select
            value={sortMode}
            onChange={(e) => handleSortChange(e.target.value as 'default' | 'priority' | 'duration' | 'title')}
            className="text-xs px-1.5 py-0.5 border border-input rounded bg-background flex-1"
          >
            <option value="default">默认</option>
            <option value="priority">按优先级</option>
            <option value="duration">按时长</option>
            <option value="title">按名称</option>
          </select>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto p-2 space-y-2"
        onDragOver={(e) => e.preventDefault()}
      >
        {unscheduledTasks.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            <div>暂无待安排任务</div>
            <div className="mt-1">点击下方按钮创建</div>
          </div>
        )}
        {unscheduledTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={() => setEditingTaskId(task.id)}
          />
        ))}
      </div>

      <div className="p-2 border-t border-border space-y-1.5 shrink-0">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full py-2 px-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          + 新建任务
        </button>
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex-1 py-1.5 px-2 text-xs font-medium border border-input rounded-lg hover:bg-muted transition-colors"
          >
            📋 模板
          </button>
          <button
            onClick={() => setShowLogModal(true)}
            className="flex-1 py-1.5 px-2 text-xs font-medium border border-input rounded-lg hover:bg-muted transition-colors"
          >
            📝 日志
          </button>
          <button
            onClick={() => setShowDataModal(true)}
            className="flex-1 py-1.5 px-2 text-xs font-medium border border-input rounded-lg hover:bg-muted transition-colors"
          >
            💾 数据
          </button>
        </div>
      </div>

      {showCreateModal && (
        <TaskEditModal
          mode="create"
          onSave={handleSaveCreate}
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

      {showTemplateModal && (
        <TemplateModal
          currentDate={new Date()}
          onClose={() => setShowTemplateModal(false)}
        />
      )}

      {showLogModal && <LogModal onClose={() => setShowLogModal(false)} />}

      {showDataModal && (
        <DataModal
          onClose={() => setShowDataModal(false)}
          onDataChanged={handleDataChanged}
        />
      )}
    </div>
  )
}
