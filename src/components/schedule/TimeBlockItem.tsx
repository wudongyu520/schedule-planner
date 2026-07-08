'use client'

import { useRef, useState, useCallback, type MouseEvent, useEffect } from 'react'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import { MINUTES_IN_DAY, VIEW_START_MINUTES, VIEW_END_MINUTES, VIEW_DURATION, EARLY_VIEW_START_MINUTES, EARLY_VIEW_END_MINUTES, EARLY_VIEW_DURATION, minutesToTime, timeToMinutes, snapToGrid, roundToGranularity, isToday } from '@/lib/time'
import { useTimeBlockStore, type TimeBlockData, BLOCK_COLORS } from '@/store/timeBlockStore'
import { useTaskStore, PRIORITY_CONFIG, type TaskData } from '@/store/taskStore'
import { TaskEditModal } from './TaskEditModal'
import { ContextMenu, type ContextMenuItem } from '@/components/ui/ContextMenu'
import { useUIStore } from '@/store/uiStore'
import type { Priority } from '@/types/task'

interface TimeBlockItemProps {
  block: TimeBlockData
  hourHeight: number
  isTodayColumn?: boolean
  isEarlyView?: boolean
}

type DragMode = 'move' | 'resize-top' | 'resize-bottom' | null

function BlockTaskItem({
  task,
  blockColor,
  onEdit,
}: {
  task: TaskData
  blockColor: string
  onEdit: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { type: 'task', taskId: task.id, fromBlockId: task.timeBlockId },
  })

  const pCfg = PRIORITY_CONFIG[task.priority]
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const { openMenu } = useUIStore()

  const menuItems: ContextMenuItem[] = [
    {
      label: task.completed ? '标记为未完成' : '标记为完成',
      icon: task.completed ? '↩' : '✓',
      onClick: () => useTaskStore.getState().toggleComplete(task.id),
    },
    {
      label: '编辑',
      icon: '✎',
      onClick: onEdit,
    },
    {
      label: '移回任务列表',
      icon: '←',
      onClick: () => useTaskStore.getState().removeFromBlock(task.id),
    },
    { label: '', separator: true, onClick: () => {} },
    {
      label: '删除',
      icon: '✕',
      danger: true,
      onClick: () => {
        if (confirm(`删除任务"${task.title}"？`)) useTaskStore.getState().removeTask(task.id)
      },
    },
  ]

  return (
    <>
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] bg-background/90 border border-border/50 cursor-grab hover:shadow-sm transition-shadow ${
          task.completed ? 'opacity-50' : ''
        } ${isDragging ? 'opacity-30' : ''}`}
        onMouseDown={(e) => e.stopPropagation()}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          openMenu(`task-${task.id}`)
          setContextMenu({ x: e.clientX, y: e.clientY })
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          onEdit()
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: task.priority === 'HIGH' ? '#ef4444' : task.priority === 'MEDIUM' ? '#f97316' : '#3b82f6' }}
        />
        <span className={`flex-1 truncate ${task.completed ? 'line-through' : ''}`}>
          {task.title}
        </span>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {task.duration >= 60 ? `${Math.floor(task.duration / 60)}h${task.duration % 60 > 0 ? `${task.duration % 60}m` : ''}` : `${task.duration}m`}
        </span>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            useTaskStore.getState().toggleComplete(task.id)
          }}
          className="shrink-0 text-muted-foreground hover:text-green-600 w-4 h-4 flex items-center justify-center rounded hover:bg-green-500/10"
          title="标记完成"
        >
          {task.completed ? '↩' : '✓'}
        </button>
      </div>

      {contextMenu && (
        <ContextMenu
          id={`task-${task.id}`}
          items={menuItems}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  )
}

export function TimeBlockItem({ block, hourHeight, isTodayColumn = false, isEarlyView = false }: TimeBlockItemProps) {
  const { updateBlock, updateBlockLocal, syncBlock, removeBlock, selectBlock, selectedBlockId, toggleLock, copyBlock, duplicateBlock } = useTimeBlockStore()
  const { tasks, removeFromBlock, toggleComplete, updateTask, removeTask, assignToBlock, canAssignToBlock, getBlockTaskDuration } = useTaskStore()
  const dragMode = useRef<DragMode>(null)
  const dragStartY = useRef(0)
  const dragStartStart = useRef(0)
  const dragStartEnd = useRef(0)
  const rafRef = useRef<number | null>(null)
  const pendingDelta = useRef(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editName, setEditName] = useState(block.name)
  const [editStart, setEditStart] = useState(minutesToTime(block.startTime))
  const [editEnd, setEditEnd] = useState(minutesToTime(block.endTime))
  const [editColor, setEditColor] = useState(block.color)
  const editorRef = useRef<HTMLDivElement>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [blockContextMenu, setBlockContextMenu] = useState<{ x: number; y: number } | null>(null)
  const { openMenu: openBlockMenu } = useUIStore()

  const { isOver, setNodeRef, active } = useDroppable({
    id: `droppable-${block.id}`,
    data: { type: 'block', blockId: block.id },
  })

  const selected = selectedBlockId === block.id

  let visibleStart: number
  let visibleEnd: number
  let topPercent: number
  let heightPercent: number
  let isFullyOutsideView: boolean

  if (isEarlyView) {
    visibleStart = Math.max(block.startTime, EARLY_VIEW_START_MINUTES)
    visibleEnd = Math.min(block.endTime, EARLY_VIEW_END_MINUTES)
    isFullyOutsideView = visibleStart >= visibleEnd
    topPercent = ((visibleStart - EARLY_VIEW_START_MINUTES) / EARLY_VIEW_DURATION) * 100
    heightPercent = ((visibleEnd - visibleStart) / EARLY_VIEW_DURATION) * 100
  } else {
    visibleStart = Math.max(block.startTime, VIEW_START_MINUTES)
    visibleEnd = Math.min(block.endTime, VIEW_END_MINUTES)
    isFullyOutsideView = visibleStart >= visibleEnd
    topPercent = ((visibleStart - VIEW_START_MINUTES) / VIEW_DURATION) * 100
    heightPercent = ((visibleEnd - visibleStart) / VIEW_DURATION) * 100
  }

  const blockDuration = block.endTime - block.startTime
  const totalTaskDuration = getBlockTaskDuration(block.id)
  const durationPercent = Math.min(100, (totalTaskDuration / blockDuration) * 100)
  const isOverCapacity = totalTaskDuration > blockDuration

  const blockTasks = tasks
    .filter((t) => t.timeBlockId === block.id)
    .sort((a, b) => (a.blockPosition ?? 0) - (b.blockPosition ?? 0))

  const completedCount = tasks.filter((t) => t.timeBlockId === block.id && t.completed).length
  const totalCount = tasks.filter((t) => t.timeBlockId === block.id).length

  const activeTaskId = active?.data.current?.taskId
  const canDrop =
    activeTaskId && active.data.current?.type === 'task'
      ? canAssignToBlock(activeTaskId, block.id, blockDuration)
      : false

  useEffect(() => {
    if (showEditor) {
      setEditName(block.name)
      setEditStart(minutesToTime(block.startTime))
      setEditEnd(minutesToTime(block.endTime))
      setEditColor(block.color)
    }
  }, [showEditor, block.name, block.startTime, block.endTime, block.color])

  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
        setShowEditor(false)
      }
    }
    if (showEditor) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEditor])

  const handleMouseDown = useCallback(
    (mode: DragMode) => (e: MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()

      if (block.locked) return

      dragMode.current = mode
      dragStartY.current = e.clientY
      dragStartStart.current = block.startTime
      dragStartEnd.current = block.endTime
      setIsDragging(true)
      selectBlock(block.id)

      const applyDelta = () => {
        rafRef.current = null
        const deltaMinutes = roundToGranularity((pendingDelta.current / hourHeight) * 60)

        const viewMin = isEarlyView ? EARLY_VIEW_START_MINUTES : VIEW_START_MINUTES
        const viewMax = isEarlyView ? EARLY_VIEW_END_MINUTES : VIEW_END_MINUTES

        if (dragMode.current === 'move') {
          const duration = dragStartEnd.current - dragStartStart.current
          let newStart = dragStartStart.current + deltaMinutes
          let newEnd = newStart + duration

          if (newStart < viewMin) {
            newStart = viewMin
            newEnd = duration + viewMin
          }
          if (newEnd > viewMax) {
            newEnd = viewMax
            newStart = viewMax - duration
          }

          updateBlockLocal(block.id, { startTime: newStart, endTime: newEnd })
        } else if (dragMode.current === 'resize-top') {
          let newStart = dragStartStart.current + deltaMinutes
          newStart = Math.max(viewMin, Math.min(newStart, dragStartEnd.current - 5))
          updateBlockLocal(block.id, { startTime: newStart })
        } else if (dragMode.current === 'resize-bottom') {
          let newEnd = dragStartEnd.current + deltaMinutes
          newEnd = Math.max(dragStartStart.current + 5, Math.min(newEnd, viewMax))
          updateBlockLocal(block.id, { endTime: newEnd })
        }
      }

      const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
        if (!dragMode.current) return
        pendingDelta.current = moveEvent.clientY - dragStartY.current
        if (rafRef.current === null) {
          rafRef.current = requestAnimationFrame(applyDelta)
        }
      }

      const handleMouseUp = () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
        // 最后应用一次确保位置准确
        applyDelta()
        // 松手时同步到数据库
        syncBlock(block.id)
        dragMode.current = null
        setIsDragging(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = mode === 'move' ? 'grabbing' : 'ns-resize'
      document.body.style.userSelect = 'none'
    },
    [block, hourHeight, updateBlockLocal, syncBlock, selectBlock, block.locked]
  )

  const handleSave = () => {
    const startMin = timeToMinutes(editStart)
    const endMin = timeToMinutes(editEnd)
    if (endMin - startMin < 5) {
      alert('时长至少5分钟')
      return
    }
    const success = updateBlock(block.id, {
      name: editName,
      startTime: startMin,
      endTime: endMin,
      color: editColor,
    })
    if (!success) {
      alert('时间与其他功能区重叠')
      return
    }
    setShowEditor(false)
  }

  const handleDelete = () => {
    if (confirm(`删除"${block.name}"？`)) {
      tasks.forEach((t) => {
        if (t.timeBlockId === block.id) {
          removeFromBlock(t.id)
        }
      })
      removeBlock(block.id)
      setShowEditor(false)
    }
  }

  const editingTask = editingTaskId ? tasks.find((t) => t.id === editingTaskId) : null

  const handleSaveTaskEdit = (data: {
    title: string
    description: string | null
    duration: number
    priority: Priority
  }) => {
    if (!editingTaskId) return
    if (editingTask?.timeBlockId) {
      const bd = block.endTime - block.startTime
      const otherDuration = tasks
        .filter((t) => t.timeBlockId === editingTask.timeBlockId && t.id !== editingTaskId && !t.completed)
        .reduce((s, t) => s + t.duration, 0)
      if (otherDuration + data.duration > bd) {
        alert('时长超过功能区总时长')
        return
      }
    }
    updateTask(editingTaskId, data)
    setEditingTaskId(null)
  }

  const handleDeleteTaskEdit = () => {
    if (!editingTaskId) return
    removeTask(editingTaskId)
    setEditingTaskId(null)
  }

  const formatDuration = (m: number) => {
    if (m >= 60) {
      const h = Math.floor(m / 60)
      const min = m % 60
      return min > 0 ? `${h}h${min}m` : `${h}h`
    }
    return `${m}m`
  }

  if (isFullyOutsideView) {
    return null
  }

  return (
    <>
      <div
        ref={setNodeRef}
        className={`absolute left-1 right-1 rounded-lg border-2 transition-all group ${
          block.locked ? 'cursor-default' : 'cursor-grab'
        } ${selected ? 'shadow-lg' : ''} ${isDragging ? 'opacity-80' : ''} ${
          isOver && canDrop
            ? 'ring-2 ring-green-500 ring-offset-1 scale-[1.01]'
            : isOver && !canDrop
            ? 'ring-2 ring-red-500 ring-offset-1'
            : ''
        }`}
        style={{
          top: `${topPercent}%`,
          height: `${heightPercent}%`,
          backgroundColor: `${block.color}18`,
          borderColor: block.color,
          boxShadow: selected ? `0 0 0 2px ${block.color}40` : undefined,
        }}
        onMouseDown={handleMouseDown('move')}
        onClick={(e) => {
          e.stopPropagation()
          selectBlock(block.id)
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          setShowEditor(true)
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          openBlockMenu(`block-${block.id}`)
          setBlockContextMenu({ x: e.clientX, y: e.clientY })
        }}
      >
        {!block.locked && (
          <>
            <div
              className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-10 h-5 rounded-full cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center shadow-sm"
              style={{ backgroundColor: block.color }}
              onMouseDown={handleMouseDown('resize-top')}
            >
              <div className="w-4 h-0.5 rounded-full bg-white/70" />
            </div>

            <div
              className="absolute top-0 left-0 right-0 h-4 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-[5]"
              onMouseDown={handleMouseDown('resize-top')}
            />
          </>
        )}

        <div className="px-2.5 pt-2 pb-1.5 h-full flex flex-col overflow-hidden">
          <div className="flex items-center justify-between shrink-0 gap-1">
            <div className="flex items-center gap-1 min-w-0">
              {block.locked && (
                <span className="text-[10px] shrink-0" title="已锁定">🔒</span>
              )}
              <div className="text-xs font-bold truncate" style={{ color: block.color }}>
                {block.name}
              </div>
            </div>
            <div className="text-[10px] font-medium text-muted-foreground shrink-0">
              <span className={completedCount > 0 ? 'text-green-600' : ''}>{completedCount}</span>
              <span className="text-muted-foreground/50">/</span>
              <span>{totalCount}</span>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 shrink-0">
            {minutesToTime(block.startTime)} - {minutesToTime(block.endTime)}
          </div>

          <div className="mt-1.5 shrink-0">
            <div className="flex items-center justify-between text-[10px] mb-0.5">
              <span className="text-muted-foreground">
                {formatDuration(totalTaskDuration)} / {formatDuration(blockDuration)}
              </span>
              <span className={isOverCapacity ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
                {Math.round(durationPercent)}%
              </span>
            </div>
            <div className="h-1 bg-background/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isOverCapacity ? 'bg-red-500' : ''}`}
                style={{
                  width: `${durationPercent}%`,
                  backgroundColor: isOverCapacity ? undefined : block.color,
                }}
              />
            </div>
          </div>

          {blockTasks.length > 0 && (
            <div className="mt-2 space-y-1 overflow-y-auto flex-1 pr-0.5 -mr-0.5">
              {blockTasks.map((task) => (
                <BlockTaskItem
                  key={task.id}
                  task={task}
                  blockColor={block.color}
                  onEdit={() => setEditingTaskId(task.id)}
                />
              ))}
            </div>
          )}

          {blockTasks.length === 0 && !isOver && (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground/60">拖拽任务到这里</span>
            </div>
          )}

          {isOver && activeTaskId && (
            <div
              className={`mt-2 px-2 py-1.5 rounded-md text-[10px] text-center border border-dashed ${
                canDrop
                  ? 'border-green-500 text-green-600 bg-green-500/10'
                  : 'border-red-500 text-red-600 bg-red-500/10'
              }`}
            >
              {canDrop ? '松开放置任务' : '时长不足，无法放置'}
            </div>
          )}
        </div>

        {!block.locked && (
          <>
            <div
              className="absolute bottom-0 left-0 right-0 h-4 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-[5]"
              onMouseDown={handleMouseDown('resize-bottom')}
            />

            <div
              className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-10 h-5 rounded-full cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center shadow-sm"
              style={{ backgroundColor: block.color }}
              onMouseDown={handleMouseDown('resize-bottom')}
            >
              <div className="w-4 h-0.5 rounded-full bg-white/70" />
            </div>
          </>
        )}
      </div>

      {showEditor && (
        <div
          className="fixed z-50 w-64 p-4 bg-background rounded-xl shadow-2xl border border-border"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          ref={editorRef}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="text-sm font-semibold mb-3">编辑功能区</div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">名称</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">开始</label>
                <input
                  type="time"
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                  step={300}
                  className="w-full px-2.5 py-1.5 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">结束</label>
                <input
                  type="time"
                  value={editEnd}
                  onChange={(e) => setEditEnd(e.target.value)}
                  step={300}
                  className="w-full px-2.5 py-1.5 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">颜色</label>
              <div className="flex gap-2">
                {BLOCK_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setEditColor(c.value)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                      editColor === c.value ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-border">
              <span className="text-xs text-muted-foreground">锁定功能区</span>
              <button
                onClick={() => toggleLock(block.id)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  block.locked ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-background shadow-sm transition-transform ${
                    block.locked ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                className="flex-1 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                保存
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-xs font-medium text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {blockContextMenu && (
        <ContextMenu
          id={`block-${block.id}`}
          items={[
            {
              label: '复制',
              icon: '⧉',
              onClick: () => {
                copyBlock(block.id)
                setBlockContextMenu(null)
              },
            },
            {
              label: '复制副本',
              icon: '⎘',
              onClick: () => {
                const newId = duplicateBlock(block.id)
                if (!newId) alert('下方空间不足，无法创建副本')
                setBlockContextMenu(null)
              },
            },
            { label: '', separator: true, onClick: () => {} },
            {
              label: block.locked ? '解锁' : '锁定',
              icon: block.locked ? '🔓' : '🔒',
              onClick: () => {
                toggleLock(block.id)
                setBlockContextMenu(null)
              },
            },
            {
              label: '编辑',
              icon: '✎',
              onClick: () => {
                setShowEditor(true)
                setBlockContextMenu(null)
              },
            },
            { label: '', separator: true, onClick: () => {} },
            {
              label: '删除',
              icon: '✕',
              danger: true,
              onClick: () => {
                if (confirm(`删除"${block.name}"？`)) {
                  tasks.forEach((t) => {
                    if (t.timeBlockId === block.id) {
                      removeFromBlock(t.id)
                    }
                  })
                  removeBlock(block.id)
                }
                setBlockContextMenu(null)
              },
            },
          ]}
          x={blockContextMenu.x}
          y={blockContextMenu.y}
          onClose={() => setBlockContextMenu(null)}
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
          onSave={handleSaveTaskEdit}
          onClose={() => setEditingTaskId(null)}
          onDelete={handleDeleteTaskEdit}
          onMoveOut={() => {
            if (!editingTaskId) return
            removeFromBlock(editingTaskId)
            setEditingTaskId(null)
          }}
        />
      )}
    </>
  )
}
