'use client'

import { useEffect, useRef, type ReactNode } from 'react'

export interface ContextMenuItem {
  label: string
  icon?: string
  onClick: () => void
  danger?: boolean
  separator?: boolean
}

interface ContextMenuProps {
  items: ContextMenuItem[]
  x: number
  y: number
  onClose: () => void
}

export function ContextMenu({ items, x, y, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // 计算位置，确保不超出屏幕
  const style: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    zIndex: 100,
  }

  return (
    <div
      ref={ref}
      style={style}
      className="min-w-[160px] py-1 bg-background rounded-lg shadow-xl border border-border overflow-hidden"
    >
      {items.map((item, index) => (
        <div key={index}>
          {item.separator && <div className="my-1 border-t border-border" />}
          <button
            onClick={() => {
              item.onClick()
              onClose()
            }}
            className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-muted transition-colors ${
              item.danger ? 'text-destructive' : 'text-foreground'
            }`}
          >
            {item.icon && <span className="text-xs">{item.icon}</span>}
            {item.label}
          </button>
        </div>
      ))}
    </div>
  )
}
