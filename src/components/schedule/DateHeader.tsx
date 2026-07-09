'use client'

import { getDayShortName, isToday, addDays } from '@/lib/time'
import { useTimeBlockStore } from '@/store/timeBlockStore'

export type ViewMode = 'day' | 'week' | 'month'

interface DateHeaderProps {
  weekDates: Date[]
  currentDate: Date
  viewMode: ViewMode
  onPrevWeek: () => void
  onNextWeek: () => void
  onPrevDay: () => void
  onNextDay: () => void
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  onViewModeChange: (mode: ViewMode) => void
}

export function DateHeader({
  weekDates,
  currentDate,
  viewMode,
  onPrevWeek,
  onNextWeek,
  onPrevDay,
  onNextDay,
  onPrevMonth,
  onNextMonth,
  onToday,
  onViewModeChange,
  showDateRow = true,
}: DateHeaderProps & { showDateRow?: boolean }) {
  const startDate = weekDates[0]
  const endDate = weekDates[6]
  const { blocks, toggleAllLock } = useTimeBlockStore()
  const allLocked = blocks.every((b) => b.locked)

  const formatMonth = (date: Date) => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`
  }

  const displayDates = viewMode === 'day' ? [currentDate] : weekDates

  return (
    <div className="border-b border-border shrink-0">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          {viewMode === 'week' && (
            <>
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
            </>
          )}
          {viewMode === 'day' && (
            <>
              <button
                onClick={onPrevDay}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                aria-label="前一天"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={onNextDay}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                aria-label="后一天"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          {viewMode === 'month' && (
            <>
              <button
                onClick={onPrevMonth}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                aria-label="上一月"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={onNextMonth}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                aria-label="下一月"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          <button
            onClick={onToday}
            className="px-3 py-1 text-sm rounded-md border border-input hover:bg-muted transition-colors ml-1"
          >
            今天
          </button>
        </div>

        <div className="text-sm font-medium">
          {viewMode === 'month'
            ? formatMonth(currentDate)
            : viewMode === 'day'
            ? `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月${currentDate.getDate()}日 ${getDayShortName(currentDate)}`
            : `${formatMonth(startDate)} ${startDate.getDate()}日 - ${endDate.getMonth() + 1}月${endDate.getDate()}日`}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleAllLock}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              allLocked
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
            title={allLocked ? '解锁所有功能区' : '锁定所有功能区'}
          >
            <span>{allLocked ? '🔒' : '🔓'}</span>
            <span>{allLocked ? '已锁定' : '全部锁定'}</span>
          </button>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === mode
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode === 'day' ? '日' : mode === 'week' ? '周' : '月'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showDateRow && viewMode !== 'month' && (
        <div className="flex">
          <div className="w-16 shrink-0 border-r border-border" />
          <div className="flex flex-1">
            {displayDates.map((date, index) => {
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
      )}
    </div>
  )
}
