'use client'

import { useEffect, useRef } from 'react'
import { formatDate } from '@/lib/time'
import { useTimeBlockStore } from '@/store/timeBlockStore'
import { useTaskStore } from '@/store/taskStore'

/**
 * 任务作废机制
 * 每分钟检查当前时间是否跨过了某个功能区的 endTime
 * 如果跨过，该功能区内未完成的任务自动作废
 */
export function useTaskExpiration() {
  const lastCheckedMinute = useRef<number | null>(null)

  useEffect(() => {
    const check = () => {
      const now = new Date()
      const todayStr = formatDate(now)
      const currentMinutes = now.getHours() * 60 + now.getMinutes()

      const last = lastCheckedMinute.current

      // 首次执行只记录基准时间，不处理过期
      if (last === null) {
        lastCheckedMinute.current = currentMinutes
        return
      }

      // 如果分钟数没变（或回退），跳过
      if (currentMinutes <= last) {
        lastCheckedMinute.current = currentMinutes
        return
      }

      const { blocks } = useTimeBlockStore.getState()
      const { expireTasksFromBlock, tasks } = useTaskStore.getState()

      // 找今天的功能区，endTime 在上次检查和现在之间的
      const expiredBlocks = blocks.filter(
        (b) =>
          b.date === todayStr &&
          b.endTime > last &&
          b.endTime <= currentMinutes
      )

      expiredBlocks.forEach((block) => {
        const hasUncompleted = tasks.some(
          (t) => t.timeBlockId === block.id && !t.completed
        )
        if (hasUncompleted) {
          expireTasksFromBlock(block.id, `功能区"${block.name}"已结束(${Math.floor(block.endTime / 60)}:${(block.endTime % 60).toString().padStart(2, '0')})`)
        }
      })

      lastCheckedMinute.current = currentMinutes
    }

    // 首次执行
    check()

    // 每分钟检查一次
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [])
}
