'use client'

import { MINUTES_IN_DAY, VIEW_START_MINUTES, VIEW_END_MINUTES, VIEW_DURATION, EARLY_VIEW_START_MINUTES, EARLY_VIEW_END_MINUTES, EARLY_VIEW_DURATION, isToday, getNowMinutes, formatDate, snapToGrid } from '@/lib/time'
import { useEffect, useState, useRef, type MouseEvent } from 'react'
import { useTimeBlockStore } from '@/store/timeBlockStore'
import { TimeBlockItem } from './TimeBlockItem'
import { ContextMenu, type ContextMenuItem } from '@/components/ui/ContextMenu'
import { useUIStore } from '@/store/uiStore'

interface DayColumnProps {
  date: Date
  hourHeight?: number
}

export function DayColumn({ date, hourHeight = 180 }: DayColumnProps) {
  const [nowMinutes, setNowMinutes] = useState(getNowMinutes())
  const today = isToday(date)
  const dateStr = formatDate(date)
  const { blocks, addBlock, selectBlock, clipboardBlock, pasteBlock } = useTimeBlockStore()
  const dayBlocks = blocks.filter((b) => b.date === dateStr)
  const containerRef = useRef<HTMLDivElement>(null)
  const earlyContainerRef = useRef<HTMLDivElement>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; clickMinutes: number; isEarly: boolean } | null>(null)
  const { openMenu } = useUIStore()

  useEffect(() => {
    if (!today) return
    const timer = setInterval(() => setNowMinutes(getNowMinutes()), 60000)
    return () => clearInterval(timer)
  }, [today])

  const handleDoubleClick = (e: MouseEvent<HTMLDivElement>, isEarly = false) => {
    const container = isEarly ? earlyContainerRef.current : containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const y = e.clientY - rect.top
    const baseMinutes = isEarly ? EARLY_VIEW_START_MINUTES : VIEW_START_MINUTES
    const viewDuration = isEarly ? EARLY_VIEW_DURATION : VIEW_DURATION
    const viewHeight = isEarly ? hourHeight * 6 : hourHeight * 18
    
    const clickMinutes = snapToGrid((y / viewHeight) * viewDuration + baseMinutes)

    const defaultDuration = 60
    let start = clickMinutes - defaultDuration / 2
    let end = clickMinutes + defaultDuration / 2

    if (start < 0) {
      end -= start
      start = 0
    }
    if (end > MINUTES_IN_DAY) {
      start -= end - MINUTES_IN_DAY
      end = MINUTES_IN_DAY
    }

    const id = addBlock(dateStr, start, end)
    if (id) {
      selectBlock(id)
    } else {
      alert('该时间段与已有时间块重叠')
    }
  }

  const mainBlocks = dayBlocks.filter((b) => b.endTime > VIEW_START_MINUTES)
  const earlyBlocks = dayBlocks.filter((b) => b.startTime < VIEW_START_MINUTES)

  const mainHours = Array.from({ length: 18 }, (_, i) => i + 6)
  const earlyHours = Array.from({ length: 6 }, (_, i) => i)

  return (
    <div className={`flex-1 min-w-[120px] flex flex-col border-r border-border last:border-r-0 ${today ? 'bg-green-500/[0.03]' : ''}`}>
      <div
        ref={containerRef}
        className="relative flex-1"
        style={{ height: hourHeight * 18 }}
        onDoubleClick={(e) => handleDoubleClick(e, false)}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('hour-line')) {
            selectBlock(null)
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          if (!containerRef.current) return
          const rect = containerRef.current.getBoundingClientRect()
          const y = e.clientY - rect.top
          const clickMinutes = snapToGrid((y / (hourHeight * 18)) * VIEW_DURATION + VIEW_START_MINUTES)
          openMenu(`day-${dateStr}`)
          setContextMenu({ x: e.clientX, y: e.clientY, clickMinutes, isEarly: false })
        }}
      >
        {today && (
          <div className="absolute inset-0 pointer-events-none border-2 border-green-400/60 rounded-sm z-[1]" />
        )}
        {mainHours.map((hour) => (
          <div
            key={hour}
            className="hour-line absolute left-0 right-0 border-t border-border/50"
            style={{ top: `${((hour * 60 - VIEW_START_MINUTES) / VIEW_DURATION) * 100}%` }}
          />
        ))}

        {mainBlocks.map((block) => (
          <TimeBlockItem key={block.id} block={block} hourHeight={hourHeight} isTodayColumn={today} />
        ))}

        {today && nowMinutes >= VIEW_START_MINUTES && nowMinutes <= VIEW_END_MINUTES && (
          <div
            className="absolute left-0 right-0 z-20 pointer-events-none"
            style={{ top: `${((nowMinutes - VIEW_START_MINUTES) / VIEW_DURATION) * 100}%` }}
          >
            <div className="relative">
              <div className="absolute left-0 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500" />
              <div className="absolute left-2 right-0 h-0.5 bg-red-500 -translate-y-1/2" />
            </div>
          </div>
        )}
      </div>

      <div className="h-0.5 bg-border/50" />

      <div className="flex items-center justify-center py-1 bg-muted/20 border-b border-border">
        <span className="text-[10px] text-muted-foreground">0:00 - 6:00</span>
      </div>

      <div
        ref={earlyContainerRef}
        className="relative"
        style={{ height: hourHeight * 6 }}
        onDoubleClick={(e) => handleDoubleClick(e, true)}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('early-hour-line')) {
            selectBlock(null)
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          if (!earlyContainerRef.current) return
          const rect = earlyContainerRef.current.getBoundingClientRect()
          const y = e.clientY - rect.top
          const clickMinutes = snapToGrid((y / (hourHeight * 6)) * EARLY_VIEW_DURATION + EARLY_VIEW_START_MINUTES)
          openMenu(`day-early-${dateStr}`)
          setContextMenu({ x: e.clientX, y: e.clientY, clickMinutes, isEarly: true })
        }}
      >
        {earlyHours.map((hour) => (
          <div
            key={`early-${hour}`}
            className="early-hour-line absolute left-0 right-0 border-t border-border/50"
            style={{ top: `${((hour * 60 - EARLY_VIEW_START_MINUTES) / EARLY_VIEW_DURATION) * 100}%` }}
          />
        ))}

        {earlyBlocks.map((block) => (
          <TimeBlockItem key={block.id} block={block} hourHeight={hourHeight} isTodayColumn={today} isEarlyView />
        ))}

        {today && nowMinutes >= EARLY_VIEW_START_MINUTES && nowMinutes < EARLY_VIEW_END_MINUTES && (
          <div
            className="absolute left-0 right-0 z-20 pointer-events-none"
            style={{ top: `${((nowMinutes - EARLY_VIEW_START_MINUTES) / EARLY_VIEW_DURATION) * 100}%` }}
          >
            <div className="relative">
              <div className="absolute left-0 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500" />
              <div className="absolute left-2 right-0 h-0.5 bg-red-500 -translate-y-1/2" />
            </div>
          </div>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          id={`day-${contextMenu.isEarly ? 'early-' : ''}${dateStr}`}
          items={[
            {
              label: '新建功能区',
              icon: '+',
              onClick: () => {
                const defaultDuration = 60
                let start = contextMenu.clickMinutes - defaultDuration / 2
                let end = contextMenu.clickMinutes + defaultDuration / 2
                if (start < 0) {
                  end -= start
                  start = 0
                }
                if (end > MINUTES_IN_DAY) {
                  start -= end - MINUTES_IN_DAY
                  end = MINUTES_IN_DAY
                }
                const id = addBlock(dateStr, start, end)
                if (id) selectBlock(id)
                else alert('该时间段与已有时间块重叠')
                setContextMenu(null)
              },
            },
            {
              label: clipboardBlock ? `粘贴"${clipboardBlock.name}"` : '粘贴（无内容）',
              icon: '⎘',
              onClick: () => {
                if (!clipboardBlock) {
                  setContextMenu(null)
                  return
                }
                const id = pasteBlock(dateStr, contextMenu.clickMinutes - (clipboardBlock.endTime - clipboardBlock.startTime) / 2)
                if (!id) alert('该时间段与已有时间块重叠或超出范围')
                setContextMenu(null)
              },
            },
          ]}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}