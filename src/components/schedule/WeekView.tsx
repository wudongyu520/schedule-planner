'use client'

import { useState } from 'react'
import { getWeekDates, addWeeks } from '@/lib/time'
import { DateHeader } from './DateHeader'
import { TimeRuler } from './TimeRuler'
import { DayColumn } from './DayColumn'
import { TaskPanel } from './TaskPanel'

interface WeekViewProps {
  hourHeight?: number
}

export function WeekView({ hourHeight = 60 }: WeekViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const weekDates = getWeekDates(currentDate)

  const handlePrevWeek = () => {
    setCurrentDate(addWeeks(currentDate, -1))
  }

  const handleNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  return (
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
  )
}
