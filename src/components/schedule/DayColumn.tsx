'use client'

import { MINUTES_IN_DAY, isToday, getNowMinutes } from '@/lib/time'
import { useEffect, useState } from 'react'

interface DayColumnProps {
  date: Date
  hourHeight?: number
  children?: React.ReactNode
}

export function DayColumn({ date, hourHeight = 60, children }: DayColumnProps) {
  const [nowMinutes, setNowMinutes] = useState(getNowMinutes())
  const today = isToday(date)

  useEffect(() => {
    if (!today) return

    const timer = setInterval(() => {
      setNowMinutes(getNowMinutes())
    }, 60000)

    return () => clearInterval(timer)
  }, [today])

  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div
      className="relative flex-1 min-w-[120px] border-r border-border last:border-r-0"
      style={{ height: hourHeight * 24 }}
    >
      {hours.map((hour) => (
        <div
          key={hour}
          className="absolute left-0 right-0 border-t border-border/50"
          style={{ top: `${(hour * 60 / MINUTES_IN_DAY) * 100}%` }}
        />
      ))}

      {today && (
        <div
          className="absolute left-0 right-0 z-20 pointer-events-none"
          style={{ top: `${(nowMinutes / MINUTES_IN_DAY) * 100}%` }}
        >
          <div className="relative">
            <div className="absolute left-0 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500" />
            <div className="absolute left-2 right-0 h-0.5 bg-red-500 -translate-y-1/2" />
          </div>
        </div>
      )}

      <div className="relative w-full h-full">
        {children}
      </div>
    </div>
  )
}
