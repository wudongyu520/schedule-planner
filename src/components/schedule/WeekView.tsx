'use client'

import { useState, useCallback } from 'react'
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent, PointerSensor, TouchSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { getWeekDates, addWeeks, addDays, formatDate } from '@/lib/time'
import { DateHeader, type ViewMode } from './DateHeader'
import { TimeRuler } from './TimeRuler'
import { DayColumn } from './DayColumn'
import { TaskPanel } from './TaskPanel'
import { MonthView } from './MonthView'
import { useTaskStore, PRIORITY_CONFIG } from '@/store/taskStore'
import { useTimeBlockStore } from '@/store/timeBlockStore'
import { useDataInit } from '@/hooks/useDataInit'
import { useTaskExpiration } from '@/hooks/useTaskExpiration'

// 任务列 droppable 包装
function TaskListDropZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'task-list-dropzone',
    data: { type: 'task-list' },
  })

  return (
    <div
      ref={setNodeRef}
      className={`transition-colors ${isOver ? 'bg-primary/5' : ''}`}
    >
      {children}
    </div>
  )
}

interface WeekViewProps {
  hourHeight?: number
}

export function WeekView({ hourHeight = 180 }: WeekViewProps) {
  const ready = useDataInit()
  useTaskExpiration()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const { tasks, assignToBlock, removeFromBlock, canAssignToBlock } = useTaskStore()
  const { blocks: timeBlocks } = useTimeBlockStore()
  const weekDates = getWeekDates(currentDate)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    })
  )

  const handlePrevWeek = () => setCurrentDate(addWeeks(currentDate, -1))
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1))
  const handlePrevDay = () => setCurrentDate(addDays(currentDate, -1))
  const handleNextDay = () => setCurrentDate(addDays(currentDate, 1))
  const handlePrevMonth = () => {
    const d = new Date(currentDate)
    d.setDate(1)
    d.setMonth(d.getMonth() - 1)
    setCurrentDate(d)
  }
  const handleNextMonth = () => {
    const d = new Date(currentDate)
    d.setDate(1)
    d.setMonth(d.getMonth() + 1)
    setCurrentDate(d)
  }
  const handleToday = () => setCurrentDate(new Date())

  const handleDragStart = (e: DragStartEvent) => {
    setActiveTaskId(e.active.id as string)
  }

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    setActiveTaskId(null)

    const { active, over } = e
    if (!over) return

    const overData = over.data.current
    const taskId = active.id as string

    // 拖回任务列表
    if (overData?.type === 'task-list') {
      removeFromBlock(taskId)
      return
    }

    // 拖到功能区
    if (overData?.type !== 'block') return

    const blockId = overData.blockId
    const targetBlock = timeBlocks.find((b) => b.id === blockId)
    if (!targetBlock) return

    const blockDuration = targetBlock.endTime - targetBlock.startTime

    if (!canAssignToBlock(taskId, blockId, blockDuration)) {
      return
    }

    const blockTasks = tasks.filter((t) => t.timeBlockId === blockId)
    const maxPos = blockTasks.length > 0
      ? Math.max(...blockTasks.map((t) => t.blockPosition ?? 0))
      : -1

    assignToBlock(taskId, blockId, maxPos + 1)
  }, [timeBlocks, tasks, canAssignToBlock, assignToBlock, removeFromBlock])

  const activeTask = activeTaskId ? tasks.find((t) => t.id === activeTaskId) : null

  const displayDates = viewMode === 'day' ? [currentDate] : weekDates

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <div className="text-sm text-muted-foreground">加载数据中...</div>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col md:flex-row h-full bg-background">
        {/* 移动端: 任务面板改为底部抽屉式 */}
        <div className="md:w-64 md:shrink-0 md:border-r md:border-border order-2 md:order-1">
          <TaskListDropZone>
            <TaskPanel />
          </TaskListDropZone>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden order-1 md:order-2">
          <DateHeader
            weekDates={weekDates}
            currentDate={currentDate}
            viewMode={viewMode}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
            onPrevDay={handlePrevDay}
            onNextDay={handleNextDay}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
            onViewModeChange={setViewMode}
          />

          {viewMode === 'month' ? (
            <MonthView
              currentDate={currentDate}
              onDateClick={(d) => {
                setCurrentDate(d)
                setViewMode('day')
              }}
            />
          ) : (
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="flex min-w-full">
                <TimeRuler hourHeight={hourHeight} />
                <div className="flex flex-1 min-w-0">
                  {displayDates.map((date, index) => (
                    <DayColumn
                      key={`${formatDate(date)}-${index}`}
                      date={date}
                      hourHeight={hourHeight}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="p-2 rounded-md border border-border bg-background shadow-lg cursor-grabbing w-48">
            <div className="flex items-start gap-2">
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_CONFIG[activeTask.priority].bg} ${PRIORITY_CONFIG[activeTask.priority].color} font-medium shrink-0`}>
                {PRIORITY_CONFIG[activeTask.priority].label}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{activeTask.title}</div>
              </div>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
