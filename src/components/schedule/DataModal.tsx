'use client'

import { useState } from 'react'

interface DataModalProps {
  onClose: () => void
  onDataChanged: () => void
}

export function DataModal({ onClose, onDataChanged }: DataModalProps) {
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState('')

  const handleExport = async () => {
    try {
      const res = await fetch('/api/export')
      if (!res.ok) {
        setMessage('导出失败')
        return
      }
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `schedule-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMessage('导出成功')
    } catch {
      setMessage('导出失败')
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setMessage('')

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        const result = await res.json()
        setMessage(`导入成功：${result.tasks || 0} 个任务，${result.timeBlocks || 0} 个功能区，${result.templates || 0} 个模板`)
        onDataChanged()
      } else {
        setMessage('导入失败：文件格式不正确')
      }
    } catch {
      setMessage('导入失败：文件解析错误')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[400px] bg-background rounded-xl shadow-2xl border border-border overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-base font-semibold">数据管理</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-muted"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <button
              onClick={handleExport}
              className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              导出全部数据
            </button>
            <p className="text-xs text-muted-foreground mt-1.5 text-center">
              下载包含所有任务、功能区和模板的 JSON 文件
            </p>
          </div>

          <div className="border-t border-border pt-4">
            <label className="block">
              <span className="text-sm font-medium">导入数据</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={importing}
                className="mt-2 w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-muted file:text-foreground file:font-medium file:cursor-pointer hover:file:bg-muted/80 file:transition-colors"
              />
            </label>
            <p className="text-xs text-muted-foreground mt-1.5">
              导入会覆盖现有数据，请先导出备份
            </p>
          </div>

          {message && (
            <div className={`text-sm text-center p-2 rounded-lg ${
              message.includes('失败') ? 'bg-red-500/10 text-red-600' : 'bg-green-500/10 text-green-600'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
