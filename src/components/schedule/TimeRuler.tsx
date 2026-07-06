'use client'

import { MINUTES_IN_DAY, minutesToTime } from '@/lib/time'

interface TimeRulerProps {
  hourHeight?: number
}

export function TimeRuler({ hourHeight = 60 }: TimeRulerProps) {
  const hours = Array.from({ length: 25 }, (_, i) => i)

  return (
    <div
      className="relative w-16 shrink-0 border-r border-border bg-muted/30"
      style={{ height: hourHeight * 24 }}
    >
      {hours.map((hour) => {
        const minutes = hour * 60
        const top = (minutes / MINUTES_IN_DAY) * 100
        const isHalfHour = false

        return (
          <div
            key={hour}
            className="absolute left-0 right-0 flex items-start justify-end pr-2"
            style={{ top: `${top}%` }}
          >
            <span className="text-xs text-muted-foreground -translate-y-1/2">
              {minutesToTime(minutes)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
