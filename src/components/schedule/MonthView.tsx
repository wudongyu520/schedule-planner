'use client'

import { getDayShortName, isToday, formatDate, getMonthDates } from '@/lib/time'
import { useTimeBlockStore } from '@/store/timeBlockStore'
import { useTaskStore } from '@/store/taskStore'

interface MonthViewProps {
  currentDate: Date
  onDateClick: (date: Date) => void
}

export function MonthView({ currentDate, onDateClick }: MonthViewProps) {
  const { blocks } = useTimeBlockStore()
  const { tasks } = useTaskStore()

  const monthDates = getMonthDates(currentDate)
  const weeks: Date[][] = []

  for (let i = 0; i < monthDates.length; i += 7) {
    weeks.push(monthDates.slice(i, i + 7))
  }

  const currentMonth = currentDate.getMonth()

  const getBlockCount = (date: Date) => {
    const dateStr = formatDate(date)
    return blocks.filter((b) => b.date === dateStr).length
  }

  const getTaskCount = (date: Date) => {
    const dateStr = formatDate(date)
    const dayBlocks = blocks.filter((b) => b.date === dateStr)
    const blockIds = dayBlocks.map((b) => b.id)
    return tasks.filter((t) => t.timeBlockId && blockIds.includes(t.timeBlockId)).length
  }

  const getCompletedCount = (date: Date) => {
    const dateStr = formatDate(date)
    const dayBlocks = blocks.filter((b) => b.date === dateStr)
    const blockIds = dayBlocks.map((b) => b.id)
    return tasks.filter((t) => t.timeBlockId && blockIds.includes(t.timeBlockId) && t.completed).length
  }

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {weekDays.map((day, i) => (
            <div
              key={i}
              className={`py-2 text-center text-xs font-medium ${
                i === 0 || i === 6 ? 'text-red-500' : 'text-muted-foreground'
              }`}
            >
              周{day}
            </div>
          ))}
        </div>

        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b border-border last:border-b-0">
            {week.map((date, dayIndex) => {
              const today = isToday(date)
              const isCurrentMonth = date.getMonth() === currentMonth
              const blockCount = getBlockCount(date)
              const taskCount = getTaskCount(date)
              const completedCount = getCompletedCount(date)

              return (
                <div
                  key={dayIndex}
                  onClick={() => onDateClick(date)}
                  className={`min-h-[90px] p-2 border-r border-border last:border-r-0 cursor-pointer hover:bg-muted/30 transition-colors ${
                    !isCurrentMonth ? 'bg-muted/20 opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                        today
                          ? 'bg-primary text-primary-foreground'
                          : isCurrentMonth
                          ? ''
                          : 'text-muted-foreground'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {taskCount > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {completedCount}/{taskCount}
                      </span>
                    )}
                  </div>

                  {blockCount > 0 && (
                    <div className="mt-1 space-y-0.5">
                      <div className="text-[10px] text-muted-foreground">
                        {blockCount}个功能区
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
