'use client'

import { MINUTES_IN_DAY, VIEW_START_MINUTES, VIEW_DURATION, isToday, getNowMinutes, formatDate, snapToGrid } from '@/lib/time'
import { useEffect, useState, useRef, type MouseEvent } from 'react'
import { useTimeBlockStore } from '@/store/timeBlockStore'
import { TimeBlockItem } from './TimeBlockItem'
import { ContextMenu, type ContextMenuItem } from '@/components/ui/ContextMenu'

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
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; clickMinutes: number } | null>(null)

  useEffect(() => {
    if (!today) return
    const timer = setInterval(() => setNowMinutes(getNowMinutes()), 60000)
    return () => clearInterval(timer)
  }, [today])

  const handleDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const clickMinutes = snapToGrid((y / (hourHeight * 18)) * VIEW_DURATION + VIEW_START_MINUTES)

    const defaultDuration = 60
    let start = clickMinutes - defaultDuration / 2
    let end = clickMinutes + defaultDuration / 2

    if (start < VIEW_START_MINUTES) {
      end -= start - VIEW_START_MINUTES
      start = VIEW_START_MINUTES
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

  const hours = Array.from({ length: 18 }, (_, i) => i + 6)

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 min-w-[120px] border-r border-border last:border-r-0 ${
        today ? 'bg-green-500/[0.03]' : ''
      }`}
      style={{ height: hourHeight * 18 }}
      onDoubleClick={handleDoubleClick}
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
        setContextMenu({ x: e.clientX, y: e.clientY, clickMinutes })
      }}
    >
      {today && (
        <div className="absolute inset-0 pointer-events-none border-2 border-green-400/60 rounded-sm z-[1]" />
      )}
      {hours.map((hour) => (
        <div
          key={hour}
          className="hour-line absolute left-0 right-0 border-t border-border/50"
          style={{ top: `${((hour * 60 - VIEW_START_MINUTES) / VIEW_DURATION) * 100}%` }}
        />
      ))}

      {dayBlocks.map((block) => (
        <TimeBlockItem key={block.id} block={block} hourHeight={hourHeight} isTodayColumn={today} />
      ))}

      {today && nowMinutes >= VIEW_START_MINUTES && (
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

      {contextMenu && (
        <ContextMenu
          items={[
            {
              label: '新建功能区',
              icon: '+',
              onClick: () => {
                const defaultDuration = 60
                let start = contextMenu.clickMinutes - defaultDuration / 2
                let end = contextMenu.clickMinutes + defaultDuration / 2
                if (start < VIEW_START_MINUTES) {
                  end -= start - VIEW_START_MINUTES
                  start = VIEW_START_MINUTES
                }
                if (end > MINUTES_IN_DAY) {
                  start -= (end - MINUTES_IN_DAY)
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
