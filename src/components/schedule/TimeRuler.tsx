'use client'

import { VIEW_START_MINUTES, VIEW_DURATION, EARLY_VIEW_START_MINUTES, EARLY_VIEW_DURATION, minutesToTime } from '@/lib/time'

interface TimeRulerProps {
  hourHeight?: number
}

export function TimeRuler({ hourHeight = 180 }: TimeRulerProps) {
  const mainHours = Array.from({ length: 19 }, (_, i) => i + 6)
  const earlyHours = Array.from({ length: 6 }, (_, i) => i)

  return (
    <div className="w-16 shrink-0 flex flex-col border-r border-border">
      <div className="relative bg-muted/30" style={{ height: hourHeight * 18 }}>
        {mainHours.map((hour) => {
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

      <div className="h-0.5 bg-border/50" />

      <div className="flex items-center justify-center py-1 bg-muted/20 border-b border-border">
        <span className="text-[10px] text-muted-foreground">0:00 - 6:00</span>
      </div>

      <div className="relative" style={{ height: hourHeight * 6 }}>
        {earlyHours.map((hour) => {
          const minutes = hour * 60
          const top = ((minutes - EARLY_VIEW_START_MINUTES) / EARLY_VIEW_DURATION) * 100

          return (
            <div
              key={`early-${hour}`}
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
    </div>
  )
}