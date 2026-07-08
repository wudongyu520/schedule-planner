'use client'

import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { useTaskStore, PRIORITY_CONFIG, type TaskData } from '@/store/taskStore'
import { useSettingsStore } from '@/store/settingsStore'
import { TaskEditModal } from './TaskEditModal'
import { TemplateModal } from './TemplateModal'
import { LogModal } from './LogModal'
import { DataModal } from './DataModal'
import { ContextMenu, type ContextMenuItem } from '@/components/ui/ContextMenu'
import { useUIStore } from '@/store/uiStore'
import type { Priority } from '@/types/task'

function TaskCard({ task, onEdit }: { task: TaskData; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { type: 'task', task },
  })

  const { toggleComplete, removeTask } = useTaskStore()
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const { openMenu } = useUIStore()

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    openMenu(`panel-task-${task.id}`)
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  const menuItems: ContextMenuItem[] = [
    {
      label: task.completed ? '标记为未完成' : '标记为完成',
      icon: task.completed ? '↩' : '✓',
      onClick: () => toggleComplete(task.id),
    },
    {
      label: '复制',
      icon: '⧉',
      onClick: () => {
        useTaskStore.getState().copyTask(task.id)
      },
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

  const pCfg = PRIORITY_CONFIG[task.priority]

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
        className={`group p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all select-none ${
          isDragging ? 'opacity-30 scale-95' : 'hover:shadow-md hover:border-primary/30'
        } ${
          task.completed
            ? 'bg-muted/30 border-border/50'
            : 'bg-white border-border hover:border-primary/30'
        }`}
      >
        <div className="flex items-start gap-2.5">
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleComplete(task.id)
            }}
            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              task.completed
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-border hover:border-primary'
            }`}
          >
            {task.completed && <span className="text-[10px]">✓</span>}
          </button>

          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium leading-tight ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {task.title}
            </div>
            {task.description && (
              <div className="text-xs text-muted-foreground mt-0.5 truncate">
                {task.description}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${pCfg.bg} ${pCfg.color}`}>
                {pCfg.label}
              </span>
              <span className="text-[10px] text-muted-foreground">
                ⏱ {Math.floor(task.duration / 60)}h{task.duration % 60 > 0 ? `${task.duration % 60}m` : ''}
              </span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity p-1"
          >
            <span className="text-xs">✎</span>
          </button>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          id={`panel-task-${task.id}`}
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
  const { hourHeight, setHourHeight } = useSettingsStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showLogModal, setShowLogModal] = useState(false)
  const [showDataModal, setShowDataModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [sortMode, setLocalSortMode] = useState<'default' | 'priority' | 'duration' | 'title'>('default')

  const unscheduledTasks = getUnscheduledTasks()

  const editingTask = editingTaskId
    ? useTaskStore.getState().tasks.find((t) => t.id === editingTaskId)
    : null

  const completedCount = unscheduledTasks.filter((t) => t.completed).length
  const pendingCount = unscheduledTasks.filter((t) => !t.completed).length

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
    <div className="flex flex-col h-full bg-muted/20">
      <div className="px-4 py-3 bg-white border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">待办任务</h2>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="px-1.5 py-0.5 bg-green-500/10 text-green-600 rounded font-medium">{completedCount} 已完成</span>
            <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium">{pendingCount} 待处理</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">排序</span>
          <select
            value={sortMode}
            onChange={(e) => handleSortChange(e.target.value as 'default' | 'priority' | 'duration' | 'title')}
            className="text-xs px-2 py-1 border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="default">默认</option>
            <option value="priority">按优先级</option>
            <option value="duration">按时长</option>
            <option value="title">按名称</option>
          </select>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto p-3 space-y-2"
        onDragOver={(e) => e.preventDefault()}
      >
        {unscheduledTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">📝</div>
            <div className="text-sm text-muted-foreground">暂无待安排任务</div>
            <div className="text-xs text-muted-foreground/60 mt-1">点击下方按钮创建</div>
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

      <div className="p-3 border-t border-border bg-white space-y-2 shrink-0">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <span className="text-lg">+</span>
          <span>新建任务</span>
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex-1 py-2 px-3 text-xs font-medium border border-input rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-center gap-1"
          >
            <span>📋</span>
            <span>模板</span>
          </button>
          <button
            onClick={() => setShowLogModal(true)}
            className="flex-1 py-2 px-3 text-xs font-medium border border-input rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-center gap-1"
          >
            <span>📝</span>
            <span>日志</span>
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex-1 py-2 px-3 text-xs font-medium border border-input rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-center gap-1"
          >
            <span>⚙️</span>
            <span>设置</span>
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

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">设置</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">时间刻度高度</span>
                  <span className="text-sm text-muted-foreground">{hourHeight}px/小时</span>
                </label>
                <input
                  type="range"
                  min="60"
                  max="300"
                  value={hourHeight}
                  onChange={(e) => setHourHeight(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>紧凑</span>
                  <span>适中</span>
                  <span>宽松</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 py-2 px-4 text-sm font-medium border border-input rounded-lg hover:bg-muted/50 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}