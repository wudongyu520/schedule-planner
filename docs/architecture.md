# 时间块日程规划系统 - 技术架构设计

## 1. 整体架构

### 1.1 架构图

```
┌─────────────────────────────────────────────────────────┐
│                        客户端                             │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐    │
│  │  UI 组件    │  │  状态管理   │  │  拖拽系统    │    │
│  │  (shadcn)   │  │  (Zustand)  │  │  (dnd-kit)   │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘    │
│         └────────────────┼─────────────────┘            │
│                          ▼                              │
│                ┌──────────────────┐                     │
│                │ TanStack Query   │                     │
│                │  (数据层)        │                     │
│                └────────┬─────────┘                     │
└─────────────────────────┼───────────────────────────────┘
                          │ HTTP/API
┌─────────────────────────┼───────────────────────────────┐
│                     Next.js 服务端                       │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐    │
│  │ Route Handlers │  Server Actions  │  API Routes │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘    │
│         └────────────────┼─────────────────┘            │
│                          ▼                              │
│                ┌──────────────────┐                     │
│                │   Prisma ORM     │                     │
│                └────────┬─────────┘                     │
└─────────────────────────┼───────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────┐
│                   PostgreSQL 数据库                     │
└─────────────────────────────────────────────────────────┘
```

### 1.2 架构说明

- **前端框架**：Next.js 14+ (App Router) + React 19
- **渲染策略**：
  - 主要页面：Client Component（交互密集型，拖拽多）
  - 登录/注册：Server Component + Server Actions
  - 静态资源：自动优化

---

## 2. 目录结构

```
schedule-planner/
├── prisma/
│   └── schema.prisma          # 数据库模型
├── public/                    # 静态资源
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # 根布局
│   │   ├── page.tsx           # 首页（周视图）
│   │   ├── day/               # 日视图
│   │   │   └── [date]/page.tsx
│   │   ├── month/             # 月视图
│   │   │   └── [date]/page.tsx
│   │   ├── login/page.tsx     # 登录
│   │   ├── register/page.tsx  # 注册
│   │   └── api/               # API 路由
│   │       ├── timeblocks/    # 时间块 API
│   │       ├── tasks/         # 任务 API
│   │       ├── templates/     # 模板 API
│   │       └── logs/          # 日志 API
│   ├── components/            # 组件
│   │   ├── schedule/          # 日程相关组件
│   │   │   ├── WeekView.tsx         # 周视图
│   │   │   ├── DayView.tsx          # 日视图
│   │   │   ├── MonthView.tsx        # 月视图
│   │   │   ├── DayColumn.tsx        # 天列（时间轴）
│   │   │   ├── TimeBlock.tsx        # 时间块（功能区）
│   │   │   ├── TaskItem.tsx         # 任务项
│   │   │   ├── TaskPanel.tsx        # 任务面板
│   │   │   ├── NowTimeline.tsx      # 当前时间线
│   │   │   └── TimeRuler.tsx        # 时间刻度
│   │   ├── ui/                # shadcn/ui 组件
│   │   └── layout/            # 布局组件
│   ├── lib/                   # 工具库
│   │   ├── prisma.ts          # Prisma 客户端
│   │   ├── utils.ts           # 通用工具
│   │   ├── time.ts            # 时间计算工具
│   │   └── validators.ts      # Zod 校验
│   ├── store/                 # Zustand 状态
│   │   ├── useTaskStore.ts
│   │   ├── useTimeBlockStore.ts
│   │   └── useUIStore.ts
│   ├── hooks/                 # 自定义 Hooks
│   │   ├── useDragDrop.ts     # 拖拽逻辑
│   │   ├── useNowTime.ts      # 当前时间
│   │   └── useTimeBlock.ts    # 时间块操作
│   ├── types/                 # TypeScript 类型
│   │   ├── task.ts
│   │   ├── timeblock.ts
│   │   └── index.ts
│   └── styles/                # 全局样式
│       └── globals.css
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. 核心模块设计

### 3.1 时间轴系统 (Timeline System)

**核心概念**：
- 一天 = 24小时 = 1440分钟
- 时间轴高度 = 每小时高度 × 24
- 时间块的 top 和 height 用分钟计算

**时间工具函数**：
```typescript
// 时间计算工具
interface TimeUtils {
  // 将分钟数转换为时间字符串（如 540 → "09:00"）
  minutesToTime: (minutes: number) => string
  
  // 将时间字符串转换为分钟数（如 "09:00" → 540）
  timeToMinutes: (time: string) => number
  
  // 计算时间块在时间轴上的 top 百分比
  getTopPercent: (startMinutes: number) => number
  
  // 计算时间块在时间轴上的 height 百分比
  getHeightPercent: (startMinutes: number, endMinutes: number) => number
  
  // 获取当前时间的分钟数
  getNowMinutes: () => number
  
  // 四舍五入到最近的粒度（如5分钟）
  roundToGranularity: (minutes: number, granularity?: number) => number
}
```

**时间轴布局**：
- 左侧：时间刻度（每小时一个）
- 主体：时间块区域
- 时间块用绝对定位：top + height
- 当前时间线：绝对定位，top 值实时更新

### 3.2 拖拽系统 (Drag & Drop)

使用 `@dnd-kit/core` 实现多种拖拽场景：

#### 3.2.1 时间块拖拽
三种拖拽模式：
1. **移动模式**：拖拽时间块中间，整体上下移动，开始结束时间同步变
2. **调整顶部**：拖拽时间块上边缘，只改变开始时间
3. **调整底部**：拖拽时间块下边缘，只改变结束时间

**碰撞检测**：
- 拖拽时检测与其他时间块的重叠
- 不允许重叠，到达边界时阻止
- 可选：吸附效果（接近时自动对齐）

#### 3.2.2 创建时间块
- 在空白时间轴上按下鼠标并拖拽
- 拖拽过程中显示预览时间块
- 松手后创建时间块，弹出编辑表单

#### 3.2.3 任务拖拽
- 从任务面板拖拽到时间块
- 时间块内调整任务顺序
- 跨时间块拖拽移动任务
- 拖拽回任务面板取消安排

**实现要点**：
- 使用 `DndContext` 统一管理
- 可放置区域：每个时间块 + 任务面板
- 可拖拽元素：每个任务 + 每个时间块
- 拖拽时显示半透明预览
- 碰撞检测使用 `pointerWithin` + 自定义检测

### 3.3 状态管理 (Zustand)

```typescript
// Task Store
interface TaskStore {
  tasks: Task[]
  addTask: (task: Omit<Task, 'id'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTaskToBlock: (taskId: string, blockId: string, position: number) => void
  moveTaskToPanel: (taskId: string) => void
  completeTask: (id: string) => void
  uncompleteTask: (id: string) => void
}

// TimeBlock Store
interface TimeBlockStore {
  timeBlocks: TimeBlock[]
  addTimeBlock: (block: Omit<TimeBlock, 'id'>) => void
  updateTimeBlock: (id: string, updates: Partial<TimeBlock>) => void
  deleteTimeBlock: (id: string) => void
  moveTimeBlock: (id: string, newStart: number) => void
  resizeTimeBlock: (id: string, edge: 'top' | 'bottom', newTime: number) => void
}

// UI Store
interface UIStore {
  currentView: 'week' | 'day' | 'month'
  currentDate: Date
  selectedTaskId: string | null
  selectedBlockId: string | null
  showTaskDialog: boolean
  showBlockDialog: boolean
  isDragging: boolean
}
```

### 3.4 数据持久化 (TanStack Query + Prisma)

**数据同步策略**：
- 本地状态（Zustand）：UI 交互使用，响应快
- 服务端状态（TanStack Query）：与数据库同步
- 乐观更新：先更新本地，后台同步，失败回滚

**API 设计**：
```
# 时间块
GET    /api/timeblocks?date=xxx     # 获取某天时间块
POST   /api/timeblocks              # 创建时间块
PATCH  /api/timeblocks/:id          # 更新时间块
DELETE /api/timeblocks/:id          # 删除时间块

# 任务
GET    /api/tasks                   # 获取任务列表
POST   /api/tasks                   # 创建任务
PATCH  /api/tasks/:id               # 更新任务
DELETE /api/tasks/:id               # 删除任务

# 模板
GET    /api/templates               # 获取模板列表
POST   /api/templates               # 创建模板
POST   /api/templates/:id/apply     # 应用模板

# 日志
GET    /api/logs?date=xxx           # 获取某天日志
POST   /api/logs                    # 创建日志
```

### 3.5 时间线系统 (Now Timeline)

**实现原理**：
- 每秒（或每分钟）更新当前时间
- 计算当前时间在时间轴上的位置（百分比或像素）
- 使用 CSS `top` 绝对定位
- 精确到分钟（可切换秒级）

**时间块切换检测**：
- 每分钟检查当前处于哪个时间块
- 时间块变化时触发切换逻辑
- 切换时：
  1. 找出上一个时间块
  2. 将其中未完成任务移回任务面板
  3. 高优先级任务标记"待重排"
  4. 记录日志

**性能优化**：
- 使用 `requestAnimationFrame` 平滑动画
- 只在视图可见时更新
- 页面隐藏时暂停更新

### 3.6 时间块重叠处理

**算法**：
```
检测两个时间块是否重叠：
  blockA.start < blockB.end && blockA.end > blockB.start

拖拽时的处理：
  1. 计算拖拽后的新位置
  2. 检测与所有其他时间块的重叠
  3. 如果重叠：
     - 阻止放置（回退到原位置）
     - 或：自动调整相邻时间块（推挤效果）
```

---

## 4. 数据库设计（概要）

详见 [database.md](./database.md)

核心表：
- `User` - 用户
- `Task` - 任务
- `TimeBlock` - 时间块（功能区）
- `TaskLog` - 任务日志
- `Template` - 时间块模板

---

## 5. 部署架构

### 5.1 Docker 部署

```
┌──────────────────────────────────┐
│         Docker Compose           │
│  ┌────────────┐  ┌────────────┐  │
│  │  Next.js   │  │ PostgreSQL │  │
│  │  (App)     │  │            │  │
│  └─────┬──────┘  └─────┬──────┘  │
│        └───────┬───────┘         │
│                ▼                 │
│         Nginx (反向代理)          │
└──────────────────────────────────┘
```

### 5.2 云服务器部署

- 操作系统：Ubuntu 22.04
- 容器运行时：Docker + Docker Compose
- 反向代理：Nginx
- SSL：Let's Encrypt
- 域名：绑定你的域名

---

## 6. 技术选型说明

| 技术 | 选型理由 |
|------|----------|
| Next.js 14 | 全栈框架，App Router，API Routes 内置 |
| React 19 | 最新特性，更好的并发渲染 |
| TypeScript | 类型安全，减少运行时错误 |
| Tailwind CSS | 原子化 CSS，开发效率高 |
| shadcn/ui | 高质量组件，可定制，复制即用 |
| dnd-kit | 现代拖拽库，性能好，支持触摸，支持多种拖拽场景 |
| Zustand | 轻量状态管理，简单易用 |
| TanStack Query | 服务端状态管理，缓存/同步/重试 |
| React Hook Form | 表单管理，性能好 |
| Zod | TypeScript 优先的校验库 |
| Prisma | 类型安全的 ORM，开发体验好 |
| PostgreSQL | 关系型数据库，功能强大 |
| Docker | 容器化部署，环境一致性 |
