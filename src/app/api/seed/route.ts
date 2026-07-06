import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { DEFAULT_USER_EMAIL } from '@/lib/defaultUser'

// POST /api/seed - 创建默认用户
export async function POST() {
  try {
    const user = await prisma.user.upsert({
      where: { email: DEFAULT_USER_EMAIL },
      update: {},
      create: {
        email: DEFAULT_USER_EMAIL,
        name: '默认用户',
        password: 'default',
      },
    })

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      name: user.name,
    })
  } catch (error) {
    console.error('创建默认用户失败:', error)
    return NextResponse.json({ error: '创建默认用户失败' }, { status: 500 })
  }
}
