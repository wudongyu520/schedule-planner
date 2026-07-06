import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getDefaultUserId, dateStringToDate, dateToDateString } from '@/lib/defaultUser'

// GET /api/blocks - 获取所有时间块
export async function GET() {
  try {
    const userId = await getDefaultUserId()
    const blocks = await prisma.timeBlock.findMany({
      where: { userId },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })

    const result = blocks.map((b) => ({
      ...b,
      date: dateToDateString(b.date),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('获取时间块失败:', error)
    return NextResponse.json({ error: '获取时间块失败' }, { status: 500 })
  }
}

// POST /api/blocks - 创建时间块
export async function POST(request: NextRequest) {
  try {
    const userId = await getDefaultUserId()
    const body = await request.json()

    const { name, color, date, startTime, endTime, position, locked } = body

    if (!name || !color || !date || startTime === undefined || endTime === undefined) {
      return NextResponse.json(
        { error: '缺少必填字段: name, color, date, startTime, endTime' },
        { status: 400 }
      )
    }

    const block = await prisma.timeBlock.create({
      data: {
        userId,
        name,
        color,
        date: dateStringToDate(date),
        startTime: Number(startTime),
        endTime: Number(endTime),
        position: position !== undefined ? Number(position) : 0,
        locked: locked === true,
      },
    })

    return NextResponse.json(
      { ...block, date: dateToDateString(block.date) },
      { status: 201 }
    )
  } catch (error) {
    console.error('创建时间块失败:', error)
    return NextResponse.json({ error: '创建时间块失败' }, { status: 500 })
  }
}
