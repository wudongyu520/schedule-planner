'use client'

import { MINUTES_IN_DAY, isToday, getNowMinutes, formatDate, snapToGrid } from '@/lib/time'
import { useEffect, useState, useRef, type MouseEvent } from 'react'
import { useTimeBlockStore } from '@/store/timeBlockStore'
import { TimeBlockItem } from './TimeBlockItem'

interface DayColumnProps {
  date: Date
  hourHeight?: number
}

export function DayColumn({ date, hourHeight = 60 }: DayColumnProps) {
  const [nowMinutes, setNowMinutes] = useState(getNowMinutes())
  const today = isToday(date)
  const dateStr = formatDate(date)
  const { blocks, addBlock, selectBlock } = useTimeBlockStore()
  const dayBlocks = blocks.filter((b) => b.date === dateStr)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!today) return
    const timer = setInterval(() => setNowMinutes(getNowMinutes()), 60000)
    return () => clearInterval(timer)
  }, [today])

  const handleDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const clickMinutes = snapToGrid((y / (hourHeight * 24)) * MINUTES_IN_DAY)

    const defaultDuration = 60
    let start = clickMinutes - defaultDuration / 2
    let end = clickMinutes + defaultDuration / 2

    if (start < 0) {
      end -= start
      start = 0
    }
    if (end > MINUTES_IN_DAY) {
      start -= (end - MINUTES_IN_DAY)
      end = MINUTES_IN_DAY
    }

    const id = addBlock(dateStr, start, end)
    if (id) {
      selectBlock(id)
    } else {
      alert('该时间段与已有时间块重叠')
    }
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 min-w-[120px] border-r border-border last:border-r-0 ${
        today ? 'bg-green-500/[0.03]' : ''
      }`}
      style={{ height: hourHeight * 24 }}
      onDoubleClick={handleDoubleClick}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('hour-line')) {
          selectBlock(null)
        }
      }}
    >
      {today && (
        <div className="absolute inset-0 pointer-events-none border-2 border-green-400/60 rounded-sm z-[1]" />
      )}
      {hours.map((hour) => (
        <div
          key={hour}
          className="hour-line absolute left-0 right-0 border-t border-border/50"
          style={{ top: `${(hour * 60 / MINUTES_IN_DAY) * 100}%` }}
        />
      ))}

      {dayBlocks.map((block) => (
        <TimeBlockItem key={block.id} block={block} hourHeight={hourHeight} isTodayColumn={today} />
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
    </div>
  )
}
