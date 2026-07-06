import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getDefaultUserId, dateToDateString } from '@/lib/defaultUser'

// GET /api/logs - 获取任务日志
export async function GET(request: NextRequest) {
  try {
    const userId = await getDefaultUserId()
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    const where: { userId: string; taskId?: string } = { userId }
    if (taskId) {
      where.taskId = taskId
    }

    const logs = await prisma.taskLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    const result = logs.map((l) => ({
      ...l,
      date: dateToDateString(l.date),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('获取日志失败:', error)
    return NextResponse.json({ error: '获取日志失败' }, { status: 500 })
  }
}
