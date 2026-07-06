'use client'

import { getWeekDates, getDayShortName, isToday, formatDate } from '@/lib/time'

interface DateHeaderProps {
  weekDates: Date[]
  onPrevWeek: () => void
  onNextWeek: () => void
  onToday: () => void
}

export function DateHeader({ weekDates, onPrevWeek, onNextWeek, onToday }: DateHeaderProps) {
  const startDate = weekDates[0]
  const endDate = weekDates[6]

  const formatMonth = (date: Date) => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`
  }

  return (
    <div className="border-b border-border">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevWeek}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="上一周"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={onNextWeek}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="下一周"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={onToday}
            className="px-3 py-1 text-sm rounded-md border border-input hover:bg-muted transition-colors"
          >
            今天
          </button>
        </div>
        <div className="text-sm font-medium">
          {formatMonth(startDate)} {startDate.getDate()}日 - {endDate.getMonth() + 1}月{endDate.getDate()}日
        </div>
        <div className="w-24" />
      </div>

      <div className="flex">
        <div className="w-16 shrink-0 border-r border-border" />
        <div className="flex flex-1">
          {weekDates.map((date, index) => {
            const today = isToday(date)
            return (
              <div
                key={index}
                className={`flex-1 min-w-[120px] flex flex-col items-center py-2 border-r border-border last:border-r-0 ${
                  today ? 'bg-primary/5' : ''
                }`}
              >
                <span className={`text-xs ${today ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {getDayShortName(date)}
                </span>
                <span
                  className={`text-lg font-semibold mt-0.5 w-8 h-8 flex items-center justify-center rounded-full ${
                    today ? 'bg-primary text-primary-foreground' : ''
                  }`}
                >
                  {date.getDate()}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
