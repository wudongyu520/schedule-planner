import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getDefaultUserId } from '@/lib/defaultUser'

// PUT /api/tasks/[id] - 更新任务
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getDefaultUserId()
    const body = await request.json()

    const existing = await prisma.task.findFirst({
      where: { id, userId },
    })
    if (!existing) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }

    const {
      title,
      description,
      duration,
      priority,
      status,
      tags,
      color,
      timeBlockId,
      blockPosition,
      completedAt,
    } = body

    const data: Record<string, unknown> = {}
    if (title !== undefined) data.title = title
    if (description !== undefined) data.description = description
    if (duration !== undefined) data.duration = Number(duration)
    if (priority !== undefined) data.priority = priority
    if (status !== undefined) data.status = status
    if (tags !== undefined) data.tags = tags
    if (color !== undefined) data.color = color
    if (timeBlockId !== undefined) data.timeBlockId = timeBlockId
    if (blockPosition !== undefined) data.blockPosition = Number(blockPosition)
    if (completedAt !== undefined) {
      data.completedAt = completedAt ? new Date(completedAt) : null
    }

    const task = await prisma.task.update({
      where: { id },
      data,
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('更新任务失败:', error)
    return NextResponse.json({ error: '更新任务失败' }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] - 删除任务
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getDefaultUserId()

    const existing = await prisma.task.findFirst({
      where: { id, userId },
    })
    if (!existing) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }

    await prisma.task.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除任务失败:', error)
    return NextResponse.json({ error: '删除任务失败' }, { status: 500 })
  }
}
