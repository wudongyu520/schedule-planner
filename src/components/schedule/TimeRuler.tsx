'use client'

import { VIEW_START_MINUTES, VIEW_DURATION, minutesToTime } from '@/lib/time'

interface TimeRulerProps {
  hourHeight?: number
}

export function TimeRuler({ hourHeight = 180 }: TimeRulerProps) {
  // 6:00 到 24:00，共 18 个小时刻度 + 末尾 24:00
  const hours = Array.from({ length: 19 }, (_, i) => i + 6)

  return (
    <div
      className="relative w-16 shrink-0 border-r border-border bg-muted/30"
      style={{ height: hourHeight * 18 }}
    >
      {hours.map((hour) => {
        const minutes = hour * 60
        const top = ((minutes - VIEW_START_MINUTES) / VIEW_DURATION) * 100

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
