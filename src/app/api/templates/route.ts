import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getDefaultUserId } from '@/lib/defaultUser'

// GET /api/templates - 获取所有模板
export async function GET() {
  try {
    const userId = await getDefaultUserId()
    const templates = await prisma.template.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('获取模板失败:', error)
    return NextResponse.json([])
  }
}

// POST /api/templates - 创建模板
export async function POST(request: NextRequest) {
  try {
    const userId = await getDefaultUserId()
    const body = await request.json()

    const { name, description, blocks, isPublic } = body

    if (!name || blocks === undefined) {
      return NextResponse.json(
        { error: '缺少必填字段: name, blocks' },
        { status: 400 }
      )
    }

    const template = await prisma.template.create({
      data: {
        id: body.id,
        userId,
        name,
        description: description ?? null,
        blocks,
        isPublic: isPublic === true,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('创建模板失败:', error)
    return NextResponse.json({ error: '创建模板失败' }, { status: 500 })
  }
}
