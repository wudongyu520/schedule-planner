'use client'

import { useState, useEffect, useRef } from 'react'
import type { Priority } from '@/types/task'
import { PRIORITY_CONFIG } from '@/store/taskStore'
import { useTimeBlockStore, type TimeBlockData } from '@/store/timeBlockStore'

interface TaskEditModalProps {
  mode: 'create' | 'edit'
  initialTitle?: string
  initialDescription?: string | null
  initialDuration?: number
  initialPriority?: Priority
  initialTimeBlockId?: string | null
  onSave: (data: {
    title: string
    description: string | null
    duration: number
    priority: Priority
  }) => void
  onClose: () => void
  onDelete?: () => void
  onMoveOut?: () => void
}

const DURATION_PRESETS = [5, 10, 15, 30, 45, 60, 90, 120]

export function TaskEditModal({
  mode,
  initialTitle = '',
  initialDescription = null,
  initialDuration = 30,
  initialPriority = 'MEDIUM',
  initialTimeBlockId = null,
  onSave,
  onClose,
  onDelete,
  onMoveOut,
}: TaskEditModalProps) {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription || '')
  const [duration, setDuration] = useState(initialDuration)
  const [priority, setPriority] = useState<Priority>(initialPriority)
  const { blocks } = useTimeBlockStore()
  const modalRef = useRef<HTMLDivElement>(null)

  const currentBlock = initialTimeBlockId
    ? blocks.find((b: TimeBlockData) => b.id === initialTimeBlockId)
    : null

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      description: description.trim() || null,
      duration,
      priority,
    })
  }

  const formatDuration = (m: number) => {
    if (m >= 60) {
      const h = Math.floor(m / 60)
      const min = m % 60
      return min > 0 ? `${h}h${min}min` : `${h}h`
    }
    return `${m}min`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="w-96 bg-background rounded-xl shadow-2xl border border-border overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-base font-semibold">
            {mode === 'create' ? '新建任务' : '编辑任务'}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">任务名称</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              placeholder="输入任务名称"
              className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">备注</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="可选"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium">时长</label>
              <span className="text-sm font-semibold text-primary">{formatDuration(duration)}</span>
            </div>
            <input
              type="range"
              min={5}
              max={240}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {DURATION_PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    duration === d
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  {formatDuration(d)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">优先级</label>
            <div className="grid grid-cols-3 gap-2">
              {(['HIGH', 'MEDIUM', 'LOW'] as Priority[]).map((p) => {
                const cfg = PRIORITY_CONFIG[p]
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 text-sm rounded-lg border-2 transition-all ${
                      priority === p
                        ? 'border-foreground/20 font-semibold scale-[1.02]'
                        : 'border-border hover:border-border/80'
                    } ${cfg.bg} ${cfg.color}`}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {currentBlock && (
            <div className="pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2">
                当前在功能区：<span className="font-medium text-foreground">{currentBlock.name}</span>
              </div>
              <button
                type="button"
                onClick={onMoveOut}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors"
              >
                移出此功能区
              </button>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {mode === 'edit' && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2.5 text-sm font-medium text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors"
              >
                删除
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {mode === 'create' ? '创建' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
