# 新手入门指南 - Next.js / React 快速上手

> 这份指南专门为不太熟悉 Next.js 和 React 的你准备。我们会从最基础的概念讲起，让你快速理解项目中用到的技术。

---

## 目录

1. [React 核心概念](#1-react-核心概念)
2. [TypeScript 基础](#2-typescript-基础)
3. [Next.js 基础](#3-nextjs-基础)
4. [Tailwind CSS 基础](#4-tailwind-css-基础)
5. [项目工具链](#5-项目工具链)
6. [常见问题 FAQ](#6-常见问题-faq)

---

## 1. React 核心概念

### 1.1 什么是 React？

React 是一个用于构建用户界面的 JavaScript 库。它的核心思想是：**UI = f(State)**（界面是状态的函数）。

简单说：**状态变了，界面自动更新**。

### 1.2 组件 (Component)

React 应用由一个个组件组成。组件就是可复用的 UI 片段。

**函数组件**（我们用这种）：
```tsx
// 一个最简单的组件
function Welcome() {
  return <h1>你好，世界！</h1>
}
```

**组件嵌套**：
```tsx
function App() {
  return (
    <div>
      <Welcome />   {/* 使用组件 */}
      <Welcome />   {/* 可以复用多次 */}
    </div>
  )
}
```

### 1.3 Props（属性）

Props 是组件的输入参数，从父组件传给子组件。

```tsx
// 子组件：接收 name 属性
function Greeting({ name }: { name: string }) {
  return <p>你好，{name}！</p>
}

// 父组件：传入属性
function App() {
  return (
    <div>
      <Greeting name="小明" />
      <Greeting name="小红" />
    </div>
  )
}
```

### 1.4 State（状态）

State 是组件内部的数据，状态改变会触发界面重新渲染。

使用 `useState` Hook：
```tsx
'use client'  // Next.js 中使用状态需要加这个

import { useState } from 'react'

function Counter() {
  // 定义状态：count 是值，setCount 是修改函数
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>当前计数：{count}</p>
      <button onClick={() => setCount(count + 1)}>
        加 1
      </button>
    </div>
  )
}
```

**重要原则**：
- 不要直接修改 state，要用 set 函数
- state 更新是异步的
- state 是组件私有的

### 1.5 useEffect（副作用）

useEffect 用于处理"副作用"：数据获取、订阅、手动操作 DOM 等。

```tsx
'use client'

import { useState, useEffect } from 'react'

function Clock() {
  const [time, setTime] = useState(new Date())

  // 组件挂载后执行，返回的函数在卸载时执行
  useEffect(() => {
    // 每秒更新时间
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    // 清理函数：组件卸载时清除定时器
    return () => clearInterval(timer)
  }, [])  // 空依赖数组：只执行一次

  return <p>当前时间：{time.toLocaleTimeString()}</p>
}
```

**依赖数组**：
- `[]`：只在挂载时执行一次
- `[count]`：count 变化时执行
- 不传：每次渲染都执行

### 1.6 常用 Hook 速查

| Hook | 用途 |
|------|------|
| `useState` | 管理状态 |
| `useEffect` | 处理副作用 |
| `useMemo` | 缓存计算结果 |
| `useCallback` | 缓存函数 |
| `useRef` | 获取 DOM 引用 / 保存不触发渲染的值 |

---

## 2. TypeScript 基础

### 2.1 为什么用 TypeScript？

TypeScript = JavaScript + 类型系统

好处：
- 代码提示更准确
- 编译时发现错误
- 重构更安全
- 代码文档化

### 2.2 基本类型

```typescript
// 基本类型
let name: string = '小明'
let age: number = 25
let isStudent: boolean = true
let nothing: null = null
let undef: undefined = undefined

// 数组
let numbers: number[] = [1, 2, 3]
let names: string[] = ['a', 'b']

// 对象
let person: { name: string; age: number } = {
  name: '小明',
  age: 25,
}
```

### 2.3 接口 (interface)

接口用于定义对象的形状：
```typescript
interface User {
  id: string
  name: string
  email: string
  age?: number  // ? 表示可选
}

const user: User = {
  id: '1',
  name: '小明',
  email: 'xiaoming@example.com',
}
```

### 2.4 类型别名 (type)

和 interface 类似，更灵活：
```typescript
type Priority = 'high' | 'medium' | 'low'  // 联合类型

type Task = {
  id: string
  title: string
  priority: Priority
}
```

### 2.5 泛型

泛型让类型可以参数化：
```typescript
// 一个通用的响应类型
interface ApiResponse<T> {
  data: T
  success: boolean
  message: string
}

// 使用
const response: ApiResponse<User> = {
  data: { id: '1', name: '小明', email: 'x@x.com' },
  success: true,
  message: 'ok',
}
```

### 2.6 React + TypeScript

```tsx
// 组件 Props 类型
interface ButtonProps {
  text: string
  onClick: () => void
  disabled?: boolean
}

function Button({ text, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {text}
    </button>
  )
}

// useState 类型
const [count, setCount] = useState<number>(0)
const [user, setUser] = useState<User | null>(null)
```

---

## 3. Next.js 基础

### 3.1 什么是 Next.js？

Next.js 是 React 的全栈框架，提供了：
- 路由系统
- 服务端渲染
- API 路由
- 静态资源优化
- 等等...

我们用的是 **App Router**（Next.js 13+ 的新路由系统）。

### 3.2 路由系统

App Router 基于文件系统，文件夹就是路由：

```
src/app/
├── page.tsx              → /
├── layout.tsx            → 全局布局
├── login/
│   └── page.tsx          → /login
├── day/
│   └── [date]/
│       └── page.tsx      → /day/2024-01-01  (动态路由)
└── api/
    └── tasks/
        └── route.ts      → /api/tasks  (API 路由)
```

### 3.3 Server Component vs Client Component

这是 Next.js 最重要的概念！

**Server Component（默认）**：
- 在服务器上运行
- 可以直接访问数据库
- 没有交互（不能用 useState、onClick 等）
- 好处：性能好，SEO 友好

**Client Component（加 'use client'）**：
- 在浏览器上运行
- 可以用状态、事件监听
- 有交互的组件都需要加

**什么时候用 Client Component？**
- 需要 `useState`, `useEffect`, `useRef` 等 Hooks
- 需要 `onClick`, `onChange` 等事件
- 需要访问浏览器 API（window, document, localStorage）
- 使用拖拽、动画等交互库

**简单记忆**：
- 页面、布局 → Server Component
- 有交互的组件 → Client Component（加 'use client'）

### 3.4 Layout（布局）

`layout.tsx` 是布局文件，会包裹所有子页面：

```tsx
// src/app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        {/* 公共导航栏 */}
        <nav>导航</nav>
        {/* 子页面内容 */}
        {children}
      </body>
    </html>
  )
}
```

### 3.5 Page（页面）

`page.tsx` 是页面内容：
```tsx
// src/app/page.tsx → 首页
export default function HomePage() {
  return <h1>欢迎使用时辰日程</h1>
}
```

### 3.6 API Routes（API 路由）

在 `app/api/` 下的 `route.ts` 文件就是 API：

```tsx
// src/app/api/tasks/route.ts
import { NextResponse } from 'next/server'

// GET /api/tasks
export async function GET() {
  const tasks = await prisma.task.findMany()
  return NextResponse.json(tasks)
}

// POST /api/tasks
export async function POST(request: Request) {
  const data = await request.json()
  const task = await prisma.task.create({ data })
  return NextResponse.json(task, { status: 201 })
}
```

### 3.7 动态路由

用 `[param]` 文件夹表示动态参数：

```
src/app/day/[date]/page.tsx
```

```tsx
// src/app/day/[date]/page.tsx
export default function DayPage({
  params,
}: {
  params: { date: string }
}) {
  return <h1>日期：{params.date}</h1>
}
```

---

## 4. Tailwind CSS 基础

### 4.1 什么是 Tailwind？

Tailwind 是一个"原子化 CSS 框架"。不用写 CSS 文件，直接在 HTML 上加 class。

**传统方式**：
```html
<div class="card">内容</div>
<style>
.card {
  padding: 16px;
  background: white;
  border-radius: 8px;
}
</style>
```

**Tailwind 方式**：
```html
<div class="p-4 bg-white rounded-lg">内容</div>
```

### 4.2 常用类名速查

#### 布局
```html
<div class="flex">              /* display: flex */
<div class="flex flex-col">     /* 垂直排列 */
<div class="grid grid-cols-3">  /* 3列网格 */
<div class="w-full">            /* width: 100% */
<div class="h-screen">          /* height: 100vh */
```

#### 间距
```html
<div class="p-4">       /* padding: 16px (1=4px) */
<div class="m-2">       /* margin: 8px */
<div class="mt-4">      /* margin-top: 16px */
<div class="px-6">      /* padding-left/right: 24px */
```

#### 颜色
```html
<div class="bg-blue-500">    /* 背景蓝色 */
<div class="text-white">     /* 文字白色 */
<div class="border-gray-200"> /* 边框灰色 */
```

#### 文字
```html
<p class="text-sm">      /* 小字体 */
<p class="text-lg">      /* 大字体 */
<p class="font-bold">    /* 粗体 */
<p class="text-center">  /* 居中 */
```

#### 圆角与阴影
```html
<div class="rounded">        /* 小圆角 */
<div class="rounded-lg">     /* 大圆角 */
<div class="rounded-full">   /* 圆形 */
<div class="shadow">         /* 阴影 */
```

### 4.3 响应式

加前缀表示屏幕尺寸：
```html
<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7">
  <!-- 手机1列，平板3列，桌面7列 -->
</div>
```

| 前缀 | 断点 | 设备 |
|------|------|------|
| (默认) | < 640px | 手机 |
| `sm:` | ≥ 640px | 手机横屏 |
| `md:` | ≥ 768px | 平板 |
| `lg:` | ≥ 1024px | 笔记本 |
| `xl:` | ≥ 1280px | 桌面 |

### 4.4 自定义颜色

在 `tailwind.config.ts` 中配置：
```ts
export default {
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        'zone-work': '#dbeafe',
      },
    },
  },
}
```

使用：
```html
<div class="bg-zone-work text-primary">自定义颜色</div>
```

---

## 5. 项目工具链

### 5.1 包管理器：pnpm

我们用 pnpm（比 npm 快，省空间）。

常用命令：
```bash
pnpm install          # 安装依赖
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器
pnpm add 包名         # 安装包
pnpm add -D 包名      # 安装开发依赖
```

### 5.2 Prisma（数据库 ORM）

Prisma 让我们用 TypeScript 操作数据库，不用写 SQL。

常用命令：
```bash
pnpm prisma generate     # 生成 Prisma Client
pnpm prisma migrate dev  # 创建并执行迁移
pnpm prisma studio       # 打开数据库可视化界面
```

### 5.3 shadcn/ui（组件库）

shadcn/ui 不是传统的组件库，它会把组件代码复制到你的项目里，你可以随意修改。

常用命令：
```bash
npx shadcn@latest init      # 初始化
npx shadcn@latest add button  # 添加按钮组件
```

### 5.4 Zustand（状态管理）

轻量级状态管理，比 Redux 简单很多。

```typescript
// store.ts
import { create } from 'zustand'

interface CountStore {
  count: number
  increment: () => void
  decrement: () => void
}

export const useCountStore = create<CountStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}))
```

使用：
```tsx
'use client'

function Counter() {
  const { count, increment } = useCountStore()
  return <button onClick={increment}>{count}</button>
}
```

### 5.5 TanStack Query（数据请求）

用于管理服务端状态（请求、缓存、同步）。

```tsx
'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// 查询数据
const { data, isLoading, error } = useQuery({
  queryKey: ['tasks'],
  queryFn: () => fetch('/api/tasks').then(res => res.json()),
})

// 修改数据
const queryClient = useQueryClient()
const mutation = useMutation({
  mutationFn: (newTask) => 
    fetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(newTask),
    }).then(res => res.json()),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })  // 刷新列表
  },
})
```

### 5.6 React Hook Form + Zod（表单）

```tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// 定义校验规则
const schema = z.object({
  title: z.string().min(1, '标题不能为空'),
  duration: z.number().min(1, '时长至少1分钟'),
})

type FormData = z.infer<typeof schema>

function TaskForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => {
    console.log(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      {errors.title && <p>{errors.title.message}</p>}
      <button type="submit">提交</button>
    </form>
  )
}
```

### 5.7 dnd-kit（拖拽）

现代拖拽库，性能好，支持触摸。

核心概念：
- `DndContext`：拖拽上下文，包裹所有拖拽元素
- `useDraggable`：让元素可拖拽
- `useDroppable`：让元素可放置
- `DragOverlay`：拖拽时的预览层

---

## 6. 常见问题 FAQ

### Q1: 'use client' 是什么？什么时候加？

**A**：在组件文件顶部加 `'use client'` 表示这是客户端组件。

需要加的情况：
- 使用了 `useState`, `useEffect` 等 React Hooks
- 使用了 `onClick`, `onChange` 等事件
- 使用了浏览器 API（window, document, localStorage）
- 使用了交互库（dnd-kit, 动画库等）

不需要加的情况：
- 纯展示组件，没有任何交互
- 页面组件（但如果页面里有交互，需要把交互部分抽到子组件里加 'use client'）

### Q2: 为什么状态更新了界面没变化？

**A**：常见原因：
1. 直接修改了 state 对象，而不是用 set 函数
2. 用了 `useRef` 存值，ref 变化不会触发重新渲染
3. 条件判断有问题

**记住**：永远用 set 函数更新状态。

### Q3: useEffect 无限循环怎么办？

**A**：检查依赖数组：
- 如果依赖了一个对象/数组，每次渲染都是新的引用，会无限循环
- 解决：用 `useMemo` 包裹对象，或者把依赖拆成基本类型

### Q4: 怎么调试？

**A**：
- 浏览器开发者工具 → Console 看日志
- React DevTools 浏览器扩展（看组件状态）
- 用 `console.log()` 打印
- VS Code 断点调试

### Q5: 报错看不懂怎么办？

**A**：
1. 先看报错信息的第一行，通常已经告诉你问题了
2. 看调用栈，找自己写的代码文件
3. 复制报错信息搜索（Google / 百度）
4. 问 AI，附上完整报错和相关代码

### Q6: 项目启动不了？

**A**：按顺序检查：
1. `node -v` 看 Node 版本（需要 18+）
2. `pnpm install` 安装依赖了吗
3. `.env` 文件配置了吗
4. 数据库启动了吗
5. 端口被占用了吗（默认 3000）

---

## 学习资源推荐

### 官方文档（最权威）
- React 中文文档：https://zh-hans.react.dev/
- Next.js 文档：https://nextjs.org/docs
- TypeScript 中文：https://www.typescriptlang.org/zh/
- Tailwind CSS：https://tailwindcss.com/

### 视频教程
- B站搜 "Next.js 13 教程"
- YouTube：CodeWithAntonio, Web Dev Simplified

### 实践建议
1. **边做边学**，不要等"学完了"再开始
2. **小步快跑**，每次改一点，验证后再继续
3. **多 console.log**，理解数据流
4. **别怕报错**，报错是最好的老师

---

## 下一步

看完这份指南后，你应该对项目技术栈有了基本了解。接下来我们会从 **Phase 0: 环境搭建** 开始，一步步把项目做出来。

有任何不懂的地方，随时问我！
