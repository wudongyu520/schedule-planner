'use client'

import { useEffect, useState } from 'react'
import { useTaskStore } from '@/store/taskStore'

interface LogModalProps {
  onClose: () => void
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  CREATED: { label: '创建', color: 'text-blue-600' },
  SCHEDULED: { label: '安排', color: 'text-green-600' },
  UNSCHEDULED: { label: '取消安排', color: 'text-orange-600' },
  COMPLETED: { label: '完成', color: 'text-green-700' },
  EXPIRED: { label: '作废', color: 'text-red-600' },
  EDITED: { label: '编辑', color: 'text-gray-600' },
  DELETED: { label: '删除', color: 'text-red-700' },
}

export function LogModal({ onClose }: LogModalProps) {
  const { logs, loadLogs } = useTaskStore()
  const [filterDate, setFilterDate] = useState('')

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const filteredLogs = filterDate
    ? logs.filter((l) => l.date === filterDate)
    : logs

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[560px] max-h-[80vh] bg-background rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col"
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-base font-semibold">操作日志</h3>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-2 py-1 text-xs border border-input rounded-md bg-background"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                清除
              </button>
            )}
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-xl leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-muted"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              暂无日志记录
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => {
                const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: 'text-gray-600' }
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className={`text-xs font-medium shrink-0 ${actionInfo.color}`}>
                      {actionInfo.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{log.taskTitle}</div>
                      {log.reason && (
                        <div className="text-xs text-muted-foreground mt-0.5">{log.reason}</div>
                      )}
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {log.date} {new Date(log.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
