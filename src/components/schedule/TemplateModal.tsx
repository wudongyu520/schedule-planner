'use client'

import { useState } from 'react'
import { formatDate, getWeekDates } from '@/lib/time'
import { useTemplateStore } from '@/store/templateStore'

interface TemplateModalProps {
  currentDate: Date
  onClose: () => void
}

export function TemplateModal({ currentDate, onClose }: TemplateModalProps) {
  const { templates, createFromWeek, applyToDateRange, deleteTemplate } = useTemplateStore()
  const [newTemplateName, setNewTemplateName] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showApply, setShowApply] = useState<string | null>(null)
  const [applyStartDate, setApplyStartDate] = useState(formatDate(currentDate))
  const [applyEndDate, setApplyEndDate] = useState(formatDate(currentDate))

  const weekStart = getWeekDates(currentDate)[0]

  const handleCreate = () => {
    if (!newTemplateName.trim()) return
    createFromWeek(newTemplateName.trim(), weekStart)
    setNewTemplateName('')
    setShowCreate(false)
  }

  const handleApply = (templateId: string) => {
    const start = new Date(applyStartDate)
    const end = new Date(applyEndDate)
    if (end < start) {
      alert('结束日期不能早于开始日期')
      return
    }
    const { success, failed } = applyToDateRange(templateId, start, end)
    if (failed > 0) {
      alert(`应用完成：${success}周成功，${failed}周因重叠部分跳过`)
    } else {
      alert(`应用完成：${success}周全部成功`)
    }
    setShowApply(null)
    onClose()
  }

  const formatDateLabel = (d: Date) => {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[440px] max-h-[80vh] bg-background rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col"
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-base font-semibold">功能区模板</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-4 border-b border-border">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            + 将本周保存为模板
          </button>

          {showCreate && (
            <div className="mt-3 p-3 bg-muted/40 rounded-lg space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">模板名称</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="例如：标准工作周"
                  autoFocus
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                将保存本周（{formatDateLabel(getWeekDates(currentDate)[0])} - {formatDateLabel(getWeekDates(currentDate)[6])}）的所有功能区
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="flex-1 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  保存
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm font-medium border border-input rounded-lg hover:bg-muted transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {templates.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              暂无模板，先创建一个吧
            </div>
          )}

          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{tpl.name}</div>
                <div className="text-xs text-muted-foreground">
                  {tpl.blocks.length} 个功能区
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setShowApply(tpl.id)
                    setApplyStartDate(formatDate(currentDate))
                    setApplyEndDate(formatDate(currentDate))
                  }}
                  className="flex-1 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                >
                  应用到...
                </button>
                <button
                  onClick={() => {
                    if (confirm(`删除模板"${tpl.name}"？`)) {
                      deleteTemplate(tpl.id)
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 transition-colors"
                >
                  删除
                </button>
              </div>

              {showApply === tpl.id && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">开始日期</label>
                      <input
                        type="date"
                        value={applyStartDate}
                        onChange={(e) => setApplyStartDate(e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">结束日期</label>
                      <input
                        type="date"
                        value={applyEndDate}
                        onChange={(e) => setApplyEndDate(e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    将应用到该区间内每一周（周一至周日），已有功能区的日期会自动跳过重叠部分
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApply(tpl.id)}
                      className="flex-1 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      确认应用
                    </button>
                    <button
                      onClick={() => setShowApply(null)}
                      className="px-3 py-1.5 text-xs font-medium border border-input rounded-md hover:bg-muted transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
