import prisma from './prisma'

export const DEFAULT_USER_EMAIL = 'default@local'

// 通过 upsert 获取/创建默认用户，返回其 id
export async function getDefaultUserId(): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: DEFAULT_USER_EMAIL },
    update: {},
    create: {
      email: DEFAULT_USER_EMAIL,
      name: '默认用户',
      password: 'default',
    },
  })
  return user.id
}

// 将 YYYY-MM-DD 字符串转为 UTC DateTime（数据库存储格式）
export function dateStringToDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`)
}

// 将 DateTime 转为 YYYY-MM-DD 字符串（前端使用格式）
export function dateToDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}
