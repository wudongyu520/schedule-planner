import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getDefaultUserId } from '@/lib/defaultUser'
import { Priority, TaskStatus } from '@/generated/prisma/client'

const VALID_PRIORITIES = Object.values(Priority) as string[]
const VALID_STATUSES = Object.values(TaskStatus) as string[]

// GET /api/tasks - 获取所有任务
export async function GET() {
  try {
    const userId = await getDefaultUserId()
    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('获取任务失败:', error)
    return NextResponse.json({ error: '获取任务失败' }, { status: 500 })
  }
}

// POST /api/tasks - 创建任务
export async function POST(request: NextRequest) {
  try {
    const userId = await getDefaultUserId()
    const body = await request.json()

    const { title, description, duration, priority, status, tags, color, timeBlockId, blockPosition } = body

    if (!title || duration === undefined) {
      return NextResponse.json(
        { error: '缺少必填字段: title, duration' },
        { status: 400 }
      )
    }

    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { error: `priority 必须是: ${VALID_PRIORITIES.join(', ')}` },
        { status: 400 }
      )
    }

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status 必须是: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const task = await prisma.task.create({
      data: {
        userId,
        title,
        description: description ?? null,
        duration: Number(duration),
        priority: priority ?? Priority.MEDIUM,
        status: status ?? TaskStatus.PENDING,
        tags: tags ?? [],
        color: color ?? null,
        timeBlockId: timeBlockId ?? null,
        blockPosition: blockPosition !== undefined ? Number(blockPosition) : null,
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('创建任务失败:', error)
    return NextResponse.json({ error: '创建任务失败' }, { status: 500 })
  }
}
