'use client'

import { useRef, useState, useCallback, type MouseEvent, useEffect } from 'react'
import { MINUTES_IN_DAY, minutesToTime, timeToMinutes, snapToGrid } from '@/lib/time'
import { useTimeBlockStore, type TimeBlockData, BLOCK_COLORS } from '@/store/timeBlockStore'

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
  const [showEditor, setShowEditor] = useState(false)
  const [editName, setEditName] = useState(block.name)
  const [editStart, setEditStart] = useState(minutesToTime(block.startTime))
  const [editEnd, setEditEnd] = useState(minutesToTime(block.endTime))
  const [editColor, setEditColor] = useState(block.color)
  const editorRef = useRef<HTMLDivElement>(null)

  const selected = selectedBlockId === block.id

  const topPercent = (block.startTime / MINUTES_IN_DAY) * 100
  const heightPercent = ((block.endTime - block.startTime) / MINUTES_IN_DAY) * 100

  useEffect(() => {
    if (showEditor) {
      setEditName(block.name)
      setEditStart(minutesToTime(block.startTime))
      setEditEnd(minutesToTime(block.endTime))
      setEditColor(block.color)
    }
  }, [showEditor, block.name, block.startTime, block.endTime, block.color])

  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
        setShowEditor(false)
      }
    }
    if (showEditor) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEditor])

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
          newStart = Math.max(0, Math.min(newStart, dragStartEnd.current - 5))
          updateBlock(block.id, { startTime: newStart })
        } else if (dragMode.current === 'resize-bottom') {
          let newEnd = dragStartEnd.current + deltaMinutes
          newEnd = Math.max(dragStartStart.current + 5, Math.min(newEnd, MINUTES_IN_DAY))
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

  const handleSave = () => {
    const startMin = timeToMinutes(editStart)
    const endMin = timeToMinutes(editEnd)
    if (endMin - startMin < 5) {
      alert('时长至少5分钟')
      return
    }
    const success = updateBlock(block.id, {
      name: editName,
      startTime: startMin,
      endTime: endMin,
      color: editColor,
    })
    if (!success) {
      alert('时间与其他功能区重叠')
      return
    }
    setShowEditor(false)
  }

  const handleDelete = () => {
    if (confirm(`删除"${block.name}"？`)) {
      removeBlock(block.id)
      setShowEditor(false)
    }
  }

  return (
    <>
      <div
        className={`absolute left-1 right-1 rounded-md border-2 cursor-grab transition-shadow group ${
          selected ? 'shadow-lg ring-2 ring-offset-1' : ''
        } ${isDragging ? 'opacity-80' : ''}`}
        style={{
          top: `${topPercent}%`,
          height: `${heightPercent}%`,
          backgroundColor: `${block.color}25`,
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
          setShowEditor(true)
        }}
      >
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-4 rounded-full cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center"
          style={{ backgroundColor: block.color }}
          onMouseDown={handleMouseDown('resize-top')}
        >
          <div className="w-3 h-0.5 rounded-full bg-white/60" />
        </div>

        <div
          className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={handleMouseDown('resize-top')}
        />

        <div className="px-2 pt-2 pb-1 pointer-events-none">
          <div className="text-xs font-semibold truncate" style={{ color: block.color }}>
            {block.name}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {minutesToTime(block.startTime)} - {minutesToTime(block.endTime)}
          </div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={handleMouseDown('resize-bottom')}
        />

        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-4 rounded-full cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center"
          style={{ backgroundColor: block.color }}
          onMouseDown={handleMouseDown('resize-bottom')}
        >
          <div className="w-3 h-0.5 rounded-full bg-white/60" />
        </div>
      </div>

      {showEditor && (
        <div
          className="fixed z-50 w-56 p-3 bg-background rounded-lg shadow-xl border border-border"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          ref={editorRef}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="text-sm font-semibold mb-3">编辑功能区</div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">名称</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">开始</label>
                <input
                  type="time"
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                  step={300}
                  className="w-full px-2 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">结束</label>
                <input
                  type="time"
                  value={editEnd}
                  onChange={(e) => setEditEnd(e.target.value)}
                  step={300}
                  className="w-full px-2 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">颜色</label>
              <div className="flex gap-1.5">
                {BLOCK_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setEditColor(c.value)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      editColor === c.value ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                className="flex-1 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                保存
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-xs font-medium text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
