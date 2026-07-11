import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getDefaultUserId, dateStringToDate } from '@/lib/defaultUser'

interface ImportBlock {
  id?: string
  name: string
  color: string
  date: string
  startTime: number
  endTime: number
  position?: number
  locked?: boolean
}

interface ImportTask {
  id?: string
  title: string
  description?: string | null
  duration: number
  priority?: string
  status?: string
  tags?: string[]
  color?: string | null
  timeBlockId?: string | null
  blockPosition?: number | null
  completed?: boolean
  completedAt?: string | null
}

interface ImportTemplate {
  name: string
  description?: string | null
  blocks: unknown
  isPublic?: boolean
}

interface ImportLog {
  taskTitle: string
  taskId?: string | null
  date: string
  action: string
  reason?: string | null
  details?: string | null
}

interface ImportData {
  tasks?: ImportTask[]
  timeBlocks?: ImportBlock[]
  templates?: ImportTemplate[]
  logs?: ImportLog[]
}

// POST /api/import - 导入 JSON 数据
export async function POST(request: NextRequest) {
  try {
    const userId = await getDefaultUserId()
    const body = (await request.json()) as ImportData

    const { tasks, timeBlocks, templates, logs } = body

    const result = {
      timeBlocks: 0,
      tasks: 0,
      templates: 0,
      logs: 0,
    }

    // 使用事务保证导入的原子性
    await prisma.$transaction(async (tx) => {
      // 覆盖模式：先删除用户的所有旧数据（注意外键依赖顺序）
      await tx.taskLog.deleteMany({ where: { userId } })
      await tx.task.deleteMany({ where: { userId } })
      await tx.timeBlock.deleteMany({ where: { userId } })
      await tx.template.deleteMany({ where: { userId } })

      // 导入时间块
      if (Array.isArray(timeBlocks) && timeBlocks.length > 0) {
        for (const b of timeBlocks) {
          if (!b.name || !b.color || !b.date || b.startTime === undefined || b.endTime === undefined) {
            continue
          }
          const blockData = {
            userId,
            name: b.name,
            color: b.color,
            date: dateStringToDate(b.date),
            startTime: Number(b.startTime),
            endTime: Number(b.endTime),
            position: b.position !== undefined ? Number(b.position) : 0,
            locked: b.locked === true,
          }
          if (b.id) {
            await tx.timeBlock.create({ data: { ...blockData, id: b.id } })
          } else {
            await tx.timeBlock.create({ data: blockData })
          }
          result.timeBlocks++
        }
      }

      // 导入任务
      if (Array.isArray(tasks) && tasks.length > 0) {
        for (const t of tasks) {
          if (!t.title || t.duration === undefined) {
            continue
          }
          const taskData = {
            userId,
            title: t.title,
            description: t.description ?? null,
            duration: Number(t.duration),
            priority: (t.priority as 'HIGH' | 'MEDIUM' | 'LOW') ?? 'MEDIUM',
            status: (t.status as 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED') ?? 'PENDING',
            tags: t.tags ?? [],
            color: t.color ?? null,
            timeBlockId: t.timeBlockId ?? null,
            blockPosition: t.blockPosition !== undefined ? Number(t.blockPosition) : null,
            completed: t.completed === true,
            completedAt: t.completedAt ? new Date(t.completedAt) : null,
          }
          if (t.id) {
            await tx.task.create({ data: { ...taskData, id: t.id } })
          } else {
            await tx.task.create({ data: taskData })
          }
          result.tasks++
        }
      }

      // 导入模板
      if (Array.isArray(templates) && templates.length > 0) {
        for (const tpl of templates) {
          if (!tpl.name || tpl.blocks === undefined) {
            continue
          }
          await tx.template.create({
            data: {
              userId,
              name: tpl.name,
              description: tpl.description ?? null,
              blocks: tpl.blocks as object,
              isPublic: tpl.isPublic === true,
            },
          })
          result.templates++
        }
      }

      // 导入日志
      if (Array.isArray(logs) && logs.length > 0) {
        for (const l of logs) {
          if (!l.taskTitle || !l.date || !l.action) {
            continue
          }
          await tx.taskLog.create({
            data: {
              userId,
              taskId: l.taskId ?? null,
              taskTitle: l.taskTitle,
              date: dateStringToDate(l.date),
              action: l.action as 'CREATED' | 'SCHEDULED' | 'UNSCHEDULED' | 'COMPLETED' | 'EXPIRED' | 'EDITED' | 'DELETED',
              reason: l.reason ?? null,
              details: l.details ?? null,
            },
          })
          result.logs++
        }
      }
    })

    return NextResponse.json({ success: true, imported: result })
  } catch (error) {
    console.error('导入数据失败:', error)
    return NextResponse.json({ error: '导入数据失败' }, { status: 500 })
  }
}
