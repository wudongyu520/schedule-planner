'use client'

import { useEffect, useState } from 'react'
import { useTaskStore } from '@/store/taskStore'
import { useTimeBlockStore } from '@/store/timeBlockStore'
import { useTemplateStore } from '@/store/templateStore'

export function useDataInit() {
  const [ready, setReady] = useState(false)
  const loadTasks = useTaskStore((s) => s.loadFromDB)
  const loadBlocks = useTimeBlockStore((s) => s.loadFromDB)
  const loadTemplates = useTemplateStore((s) => s.loadFromDB)

  useEffect(() => {
    Promise.all([loadTasks(), loadBlocks(), loadTemplates()]).then(() => {
      setReady(true)
    })
  }, [loadTasks, loadBlocks, loadTemplates])

  return ready
}
