# 时间块日程规划系统 - 数据库设计

## 1. ER 图

```
┌─────────────┐       ┌────────────────┐       ┌──────────────┐
│    User     │       │   TimeBlock    │       │     Task     │
├─────────────┤       ├────────────────┤       ├──────────────┤
│ id          │◄──────│ userId         │       │ id           │
│ email       │       │ id             │       │ userId       │
│ name        │       │ name           │       │ title        │
│ password    │       │ color          │       │ description  │
│ createdAt   │       │ date           │       │ duration     │
│ updatedAt   │       │ startTime      │       │ priority     │
└─────────────┘       │ endTime        │       │ status       │
                      │ position       │       │ tags         │
                      │ createdAt      │       │ timeBlockId  │
                      │ updatedAt      │       │ blockPosition│
                      └───────┬────────┘       │ completedAt  │
                              │                │ createdAt    │
                              │                │ updatedAt    │
                              │                └──────┬───────┘
                              │                       │
                              └───────────────────────┘
                              (1 个时间块包含多个任务)

┌─────────────┐       ┌────────────────┐       ┌──────────────┐
│    User     │       │    TaskLog     │       │   Template   │
├─────────────┤       ├────────────────┤       ├──────────────┤
│ id          │◄──────│ userId         │       │ id           │
│             │       │ id             │       │ userId       │
│             │       │ taskId         │       │ name         │
│             │       │ date           │       │ description  │
│             │       │ action         │       │ blocks       │
│             │       │ reason         │       │ isPublic     │
│             │       │ details        │       │ createdAt    │
│             │       │ createdAt      │       │ updatedAt    │
│             │       └────────────────┘       └──────────────┘
```

---

## 2. Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== 用户表 ====================
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  password  String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  // 关联
  tasks     Task[]
  timeBlocks TimeBlock[]
  logs      TaskLog[]
  templates Template[]
}

// ==================== 任务表 ====================
model Task {
  id             String    @id @default(cuid())
  userId         String
  title          String
  description    String?
  duration       Int       // 预估时长（分钟）
  priority       Priority  @default(MEDIUM)
  status         TaskStatus @default(PENDING)
  tags           String[]  // 标签数组
  color          String?   // 自定义颜色

  // 时间块关联
  timeBlockId    String?
  blockPosition  Int?      // 在时间块内的排序位置

  // 完成时间
  completedAt    DateTime?

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  timeBlock      TimeBlock? @relation(fields: [timeBlockId], references: [id], onDelete: SetNull)
  logs           TaskLog[]

  @@index([userId])
  @@index([timeBlockId])
  @@index([status])
}

// ==================== 时间块表 ====================
model TimeBlock {
  id          String    @id @default(cuid())
  userId      String
  name        String
  color       String    // 背景颜色（HEX）
  date        DateTime  // 所属日期（仅日期部分）

  // 时间范围（分钟数，0-1440，对应 00:00-24:00）
  startTime   Int       // 开始时间（分钟），如 540 = 09:00
  endTime     Int       // 结束时间（分钟），如 660 = 11:00

  position    Int       // 同一天内的排序（一般按 startTime 排）

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks       Task[]

  @@index([userId, date])
}

// ==================== 任务日志表 ====================
model TaskLog {
  id        String   @id @default(cuid())
  userId    String
  taskId    String?
  taskTitle String   // 任务标题快照
  date      DateTime // 日志日期
  action    LogAction
  reason    String?  // 原因（作废时填写）
  details   String?  // 详细说明

  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  task      Task?    @relation(fields: [taskId], references: [id], onDelete: SetNull)

  @@index([userId, date])
}

// ==================== 模板表 ====================
model Template {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  blocks      Json     // 时间块配置的 JSON
  isPublic    Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

// ==================== 枚举 ====================
enum Priority {
  HIGH    // 高优先级
  MEDIUM  // 中优先级
  LOW     // 低优先级
}

enum TaskStatus {
  PENDING     // 待安排（在任务面板中）
  SCHEDULED   // 已安排（在时间块中）
  COMPLETED   // 已完成
  CANCELLED   // 已取消
  EXPIRED     // 已过期（时间块切换作废）
}

enum LogAction {
  CREATED       // 创建
  SCHEDULED     // 安排
  UNSCHEDULED   // 取消安排
  COMPLETED     // 完成
  EXPIRED       // 过期作废
  EDITED        // 编辑
  DELETED       // 删除
}
```

---

## 3. 表结构详解

### 3.1 User（用户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 用户ID（cuid） |
| email | String | 邮箱（唯一） |
| name | String? | 用户名 |
| password | String | 密码（哈希后） |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

### 3.2 Task（任务表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 任务ID |
| userId | String | 所属用户 |
| title | String | 任务标题 |
| description | String? | 任务描述 |
| duration | Int | 预估时长（分钟） |
| priority | Priority | 优先级（HIGH/MEDIUM/LOW） |
| status | TaskStatus | 状态 |
| tags | String[] | 标签数组 |
| color | String? | 自定义颜色 |
| timeBlockId | String? | 所属时间块ID |
| blockPosition | Int? | 时间块内排序 |
| completedAt | DateTime? | 完成时间 |

**状态流转**：
```
PENDING → SCHEDULED → COMPLETED
   ↓          ↓
EXPIRED  EXPIRED（时间块切换）
```

### 3.3 TimeBlock（时间块表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 时间块ID |
| userId | String | 所属用户 |
| name | String | 时间块名称 |
| color | String | 背景颜色（HEX） |
| date | DateTime | 所属日期 |
| startTime | Int | 开始时间（分钟，0-1440） |
| endTime | Int | 结束时间（分钟，0-1440） |
| position | Int | 排序位置 |

**时间计算示例**：
| 分钟数 | 时间 |
|--------|------|
| 0 | 00:00 |
| 60 | 01:00 |
| 540 | 09:00 |
| 720 | 12:00 |
| 1020 | 17:00 |
| 1440 | 24:00 |

**约束**：
- startTime < endTime
- startTime >= 0
- endTime <= 1440
- 同一用户同一天的时间块不能重叠（应用层保证）

### 3.4 TaskLog（任务日志表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 日志ID |
| userId | String | 所属用户 |
| taskId | String? | 关联任务ID |
| taskTitle | String | 任务标题快照 |
| date | DateTime | 日志日期 |
| action | LogAction | 操作类型 |
| reason | String? | 原因（作废时） |
| details | String? | 详细说明 |

### 3.5 Template（模板表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 模板ID |
| userId | String | 所属用户 |
| name | String | 模板名称 |
| description | String? | 模板描述 |
| blocks | Json | 时间块配置JSON |
| isPublic | Boolean | 是否公开 |

**blocks JSON 结构**：
```json
[
  {
    "name": "晨间学习",
    "color": "#dbeafe",
    "startTime": 420,
    "endTime": 540
  },
  {
    "name": "深度工作",
    "color": "#dcfce7",
    "startTime": 570,
    "endTime": 720
  }
]
```

---

## 4. 关键查询示例

### 4.1 获取某天的所有时间块及任务

```prisma
const blocks = await prisma.timeBlock.findMany({
  where: {
    userId: 'xxx',
    date: {
      gte: startOfDay(date),
      lt: endOfDay(date),
    },
  },
  include: {
    tasks: {
      orderBy: {
        blockPosition: 'asc',
      },
    },
  },
  orderBy: {
    startTime: 'asc',
  },
})
```

### 4.2 获取待安排的任务

```prisma
const pendingTasks = await prisma.task.findMany({
  where: {
    userId: 'xxx',
    status: 'PENDING',
  },
  orderBy: [
    { priority: 'desc' },
    { createdAt: 'desc' },
  ],
})
```

### 4.3 获取某天的日志

```prisma
const logs = await prisma.taskLog.findMany({
  where: {
    userId: 'xxx',
    date: {
      gte: startOfDay(date),
      lt: endOfDay(date),
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
})
```

### 4.4 检测时间块重叠

```typescript
// 检测新时间块是否与现有时间块重叠
function hasOverlap(
  blocks: TimeBlock[],
  startTime: number,
  endTime: number,
  excludeId?: string
): boolean {
  return blocks.some(block => {
    if (excludeId && block.id === excludeId) return false
    return startTime < block.endTime && endTime > block.startTime
  })
}
```

### 4.5 获取当前时间所在的时间块

```typescript
function getCurrentBlock(
  blocks: TimeBlock[],
  nowMinutes: number
): TimeBlock | null {
  return blocks.find(
    block => nowMinutes >= block.startTime && nowMinutes < block.endTime
  ) || null
}
```

---

## 5. 索引策略

- `User.email`：唯一索引，登录查询
- `Task.userId`：用户任务列表查询
- `Task.timeBlockId`：时间块任务查询
- `Task.status`：按状态筛选
- `TimeBlock.userId + date`：复合索引，按天查询时间块
- `TaskLog.userId + date`：复合索引，按天查询日志

---

## 6. 数据迁移注意事项

1. **时间字段统一用分钟数**：startTime/endTime 存 Int（分钟），方便计算
2. **date 字段只存日期**：timezone 问题，存 UTC 日期
3. **软删除考虑**：目前用硬删除，如果需要可加 `deletedAt` 字段
4. **多用户隔离**：所有查询都必须加 `userId` 条件
