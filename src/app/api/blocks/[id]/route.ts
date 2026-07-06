import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getDefaultUserId, dateStringToDate, dateToDateString } from '@/lib/defaultUser'

// PUT /api/blocks/[id] - 更新时间块
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getDefaultUserId()
    const body = await request.json()

    // 确认时间块属于当前用户
    const existing = await prisma.timeBlock.findFirst({
      where: { id, userId },
    })
    if (!existing) {
      return NextResponse.json({ error: '时间块不存在' }, { status: 404 })
    }

    const { name, color, date, startTime, endTime, position, locked } = body

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (color !== undefined) data.color = color
    if (date !== undefined) data.date = dateStringToDate(date)
    if (startTime !== undefined) data.startTime = Number(startTime)
    if (endTime !== undefined) data.endTime = Number(endTime)
    if (position !== undefined) data.position = Number(position)
    if (locked !== undefined) data.locked = locked === true

    const block = await prisma.timeBlock.update({
      where: { id },
      data,
    })

    return NextResponse.json({ ...block, date: dateToDateString(block.date) })
  } catch (error) {
    console.error('更新时间块失败:', error)
    return NextResponse.json({ error: '更新时间块失败' }, { status: 500 })
  }
}

// DELETE /api/blocks/[id] - 删除时间块
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getDefaultUserId()

    const existing = await prisma.timeBlock.findFirst({
      where: { id, userId },
    })
    if (!existing) {
      return NextResponse.json({ error: '时间块不存在' }, { status: 404 })
    }

    await prisma.timeBlock.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除时间块失败:', error)
    return NextResponse.json({ error: '删除时间块失败' }, { status: 500 })
  }
}
