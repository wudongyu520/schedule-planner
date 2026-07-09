'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { useUIStore } from '@/store/uiStore'

export interface ContextMenuItem {
  label: string
  icon?: string
  onClick: () => void
  danger?: boolean
  separator?: boolean
}

interface ContextMenuProps {
  id: string
  items: ContextMenuItem[]
  x: number
  y: number
  onClose: () => void
}

export function ContextMenu({ id, items, x, y, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { menuId, closeMenu } = useUIStore()

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        e.stopPropagation()
        closeMenu()
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu()
        onClose()
      }
    }

    document.addEventListener('click', handleClick, true)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [closeMenu, onClose])

  useEffect(() => {
    if (menuId !== id) {
      onClose()
    }
  }, [menuId, id, onClose])

  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 200),
    top: Math.min(y, window.innerHeight - 300),
    zIndex: 1000,
  }

  return (
    <div
      ref={ref}
      style={style}
      className="min-w-[160px] py-1 bg-background rounded-lg shadow-xl border border-border overflow-hidden backdrop-blur-sm"
    >
      {items.map((item, index) => (
        <div key={index}>
          {item.separator && <div className="my-1 border-t border-border" />}
          <button
            onClick={(e) => {
              e.stopPropagation()
              item.onClick()
              closeMenu()
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