import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getDefaultUserId } from '@/lib/defaultUser'

// DELETE /api/templates/[id] - 删除模板
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getDefaultUserId()

    const existing = await prisma.template.findFirst({
      where: { id, userId },
    })
    if (!existing) {
      return NextResponse.json({ error: '模板不存在' }, { status: 404 })
    }

    await prisma.template.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除模板失败:', error)
    return NextResponse.json({ error: '删除模板失败' }, { status: 500 })
  }
}
