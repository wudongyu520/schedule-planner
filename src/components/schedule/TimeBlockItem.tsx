'use client'

import { useRef, useState, useCallback, type MouseEvent } from 'react'
import { MINUTES_IN_DAY, minutesToTime, snapToGrid } from '@/lib/time'
import { useTimeBlockStore, type TimeBlockData } from '@/store/timeBlockStore'

interface TimeBlockItemProps {
  block: TimeBlockData
  hourHeight: number
}

type DragMode = 'move' | 'resize-top' | 'resize-bottom' | null

export function TimeBlockItem({ block, hourHeight }: TimeBlockItemProps) {
  const { updateBlock, removeBlock, selectBlock, selectedBlockId } = useTimeBlockStore()
  const dragMode = useRef<DragMode>(null)
  const dragStartY = useRef(0)
  const dragStartStart = useRef(0)
  const dragStartEnd = useRef(0)
  const [isDragging, setIsDragging] = useState(false)

  const selected = selectedBlockId === block.id

  const topPercent = (block.startTime / MINUTES_IN_DAY) * 100
  const heightPercent = ((block.endTime - block.startTime) / MINUTES_IN_DAY) * 100

  const handleMouseDown = useCallback(
    (mode: DragMode) => (e: MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()

      dragMode.current = mode
      dragStartY.current = e.clientY
      dragStartStart.current = block.startTime
      dragStartEnd.current = block.endTime
      setIsDragging(true)
      selectBlock(block.id)

      const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
        if (!dragMode.current) return

        const deltaY = moveEvent.clientY - dragStartY.current
        const deltaMinutes = snapToGrid((deltaY / hourHeight) * 60)

        if (dragMode.current === 'move') {
          const duration = dragStartEnd.current - dragStartStart.current
          let newStart = dragStartStart.current + deltaMinutes
          let newEnd = newStart + duration

          if (newStart < 0) {
            newStart = 0
            newEnd = duration
          }
          if (newEnd > MINUTES_IN_DAY) {
            newEnd = MINUTES_IN_DAY
            newStart = MINUTES_IN_DAY - duration
          }

          updateBlock(block.id, { startTime: newStart, endTime: newEnd })
        } else if (dragMode.current === 'resize-top') {
          let newStart = dragStartStart.current + deltaMinutes
          newStart = Math.max(0, Math.min(newStart, block.endTime - 5))
          updateBlock(block.id, { startTime: newStart })
        } else if (dragMode.current === 'resize-bottom') {
          let newEnd = dragStartEnd.current + deltaMinutes
          newEnd = Math.max(block.startTime + 5, Math.min(newEnd, MINUTES_IN_DAY))
          updateBlock(block.id, { endTime: newEnd })
        }
      }

      const handleMouseUp = () => {
        dragMode.current = null
        setIsDragging(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = mode === 'move' ? 'grabbing' : 'ns-resize'
      document.body.style.userSelect = 'none'
    },
    [block, hourHeight, updateBlock, selectBlock]
  )

  return (
    <div
      className={`absolute left-1 right-1 rounded-md border-2 overflow-hidden cursor-grab transition-shadow ${
        selected ? 'shadow-lg ring-2 ring-offset-1' : ''
      } ${isDragging ? 'opacity-80' : ''}`}
      style={{
        top: `${topPercent}%`,
        height: `${heightPercent}%`,
        backgroundColor: `${block.color}30`,
        borderColor: block.color,
        boxShadow: selected ? `0 0 0 2px ${block.color}40` : undefined,
      }}
      onMouseDown={handleMouseDown('move')}
      onClick={(e) => {
        e.stopPropagation()
        selectBlock(block.id)
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (confirm(`删除"${block.name}"？`)) {
          removeBlock(block.id)
        }
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize"
        style={{ backgroundColor: block.color }}
        onMouseDown={handleMouseDown('resize-top')}
      />

      <div className="px-2 pt-3 pb-1 pointer-events-none">
        <div className="text-xs font-semibold truncate" style={{ color: block.color }}>
          {block.name}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {minutesToTime(block.startTime)} - {minutesToTime(block.endTime)}
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize"
        style={{ backgroundColor: block.color }}
        onMouseDown={handleMouseDown('resize-bottom')}
      />
    </div>
  )
}
