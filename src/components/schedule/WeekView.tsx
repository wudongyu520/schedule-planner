'use client'

import { useState } from 'react'
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { getWeekDates, addWeeks } from '@/lib/time'
import { DateHeader } from './DateHeader'
import { TimeRuler } from './TimeRuler'
import { DayColumn } from './DayColumn'
import { TaskPanel } from './TaskPanel'
import { useTaskStore, PRIORITY_CONFIG } from '@/store/taskStore'
import { useTimeBlockStore } from '@/store/timeBlockStore'

interface WeekViewProps {
  hourHeight?: number
}

export function WeekView({ hourHeight = 60 }: WeekViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const { tasks, assignToBlock, canAssignToBlock } = useTaskStore()
  const { blocks: timeBlocks } = useTimeBlockStore()
  const weekDates = getWeekDates(currentDate)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  const handlePrevWeek = () => setCurrentDate(addWeeks(currentDate, -1))
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1))
  const handleToday = () => setCurrentDate(new Date())

  const handleDragStart = (e: DragStartEvent) => {
    setActiveTaskId(e.active.id as string)
  }

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveTaskId(null)

    const { active, over } = e
    if (!over) return

    const overData = over.data.current
    if (overData?.type !== 'block') return

    const blockId = overData.blockId
    const taskId = active.id as string

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
  }

  const activeTask = activeTaskId ? tasks.find((t) => t.id === activeTaskId) : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full bg-background">
        <TaskPanel />

        <div className="flex-1 flex flex-col overflow-hidden">
          <DateHeader
            weekDates={weekDates}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
            onToday={handleToday}
          />

          <div className="flex-1 overflow-y-auto">
            <div className="flex">
              <TimeRuler hourHeight={hourHeight} />
              <div className="flex flex-1">
                {weekDates.map((date, index) => (
                  <DayColumn key={index} date={date} hourHeight={hourHeight} />
                ))}
              </div>
            </div>
          </div>
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
