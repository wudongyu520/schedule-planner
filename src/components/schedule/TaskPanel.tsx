export function TaskPanel() {
  return (
    <div className="w-64 shrink-0 border-r border-border bg-background flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">任务列表</h2>
        <p className="text-xs text-muted-foreground mt-1">拖拽任务到时间块中</p>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="text-sm text-muted-foreground text-center py-8">
          <svg className="w-12 h-12 mx-auto mb-2 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          暂无任务
        </div>
      </div>
      <div className="p-4 border-t border-border">
        <button className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
          + 新建任务
        </button>
      </div>
    </div>
  )
}
