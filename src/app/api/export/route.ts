import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getDefaultUserId, dateToDateString } from '@/lib/defaultUser'

// GET /api/export - 导出全部数据为 JSON
export async function GET() {
  try {
    const userId = await getDefaultUserId()

    const [tasks, timeBlocks, templates, logs] = await Promise.all([
      prisma.task.findMany({ where: { userId } }),
      prisma.timeBlock.findMany({ where: { userId } }),
      prisma.template.findMany({ where: { userId } }),
      prisma.taskLog.findMany({ where: { userId } }),
    ])

    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks,
      timeBlocks: timeBlocks.map((b) => ({
        ...b,
        date: dateToDateString(b.date),
      })),
      templates,
      logs: logs.map((l) => ({
        ...l,
        date: dateToDateString(l.date),
      })),
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error('导出数据失败:', error)
    return NextResponse.json({ error: '导出数据失败' }, { status: 500 })
  }
}
