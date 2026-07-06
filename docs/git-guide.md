# Git 仓库管理与提交规范

> 这份指南教你如何管理 Git 仓库、提交代码、以及团队协作规范。

---

## 目录

1. [Git 基础](#1-git-基础)
2. [仓库初始化](#2-仓库初始化)
3. [分支管理策略](#3-分支管理策略)
4. [提交规范](#4-提交规范)
5. [常用 Git 命令速查](#5-常用-git-命令速查)
6. [常见问题](#6-常见问题)

---

## 1. Git 基础

### 1.1 什么是 Git？

Git 是一个**分布式版本控制系统**，用于：
- 记录代码的每一次修改
- 可以随时回退到任意版本
- 多人协作开发
- 代码备份

### 1.2 核心概念

```
工作区 → 暂存区 → 本地仓库 → 远程仓库
 (wd)     (stage)    (repo)    (remote)
```

- **工作区**：你正在编辑的文件
- **暂存区**：准备提交的文件（git add）
- **本地仓库**：你电脑上的版本历史（git commit）
- **远程仓库**：GitHub/Gitee 上的仓库（git push）

---

## 2. 仓库初始化

### 2.1 方式一：新建仓库推送到远程

```bash
# 进入项目目录
cd schedule-planner

# 初始化 Git 仓库
git init

# 创建 .gitignore（必须！）
cat > .gitignore << 'EOF'
# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage

# Next.js
.next/
out/

# Production
build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo

# Prisma
prisma/migrations/*_dev.db

# IDE
.vscode
.idea
*.swp
*.swo
EOF

# 添加所有文件
git add .

# 第一次提交
git commit -m "init: 项目初始化"

# 关联远程仓库（先在 GitHub/Gitee 创建空仓库）
git remote add origin <你的仓库地址>

# 推送到远程
git push -u origin main
```

### 2.2 方式二：克隆现有仓库

```bash
# 克隆仓库
git clone <你的仓库地址>

# 进入目录
cd schedule-planner

# 安装依赖
pnpm install
```

### 2.3 远程仓库平台选择

| 平台 | 地址 | 特点 |
|------|------|------|
| GitHub | github.com | 全球最大，生态好，国内访问慢 |
| Gitee | gitee.com | 国内平台，速度快 |
| GitLab | gitlab.com | 可私有部署，功能全 |

**推荐**：如果主要在国内访问，用 Gitee；如果需要国际化，用 GitHub。

---

## 3. 分支管理策略

### 3.1 分支模型

我们采用简化版的 Git Flow：

```
main ──────────────────────────────  主分支，稳定版本
  │
  └── develop ────────────────────  开发分支
        │
        ├── feature/task-module   ← 功能分支
        ├── feature/zone-module
        └── fix/login-bug         ← Bug修复分支
```

### 3.2 分支说明

| 分支 | 说明 | 从哪来 | 合并到 |
|------|------|--------|--------|
| `main` | 主分支，生产环境代码 | - | - |
| `develop` | 开发分支，最新代码 | main | main |
| `feature/xxx` | 功能分支，开发新功能 | develop | develop |
| `fix/xxx` | Bug修复分支 | develop 或 main | develop |
| `hotfix/xxx` | 线上紧急修复 | main | main + develop |

### 3.3 开发流程

```
1. 从 develop 创建 feature 分支
2. 在 feature 分支上开发
3. 开发完成后合并回 develop
4. develop 测试通过后合并到 main
5. 打 tag 发布
```

### 3.4 常用分支操作

```bash
# 查看所有分支
git branch -a

# 创建并切换分支
git checkout -b feature/task-module develop

# 切换分支
git checkout main

# 合并分支（先切到目标分支）
git checkout develop
git merge feature/task-module

# 删除分支
git branch -d feature/task-module

# 删除远程分支
git push origin --delete feature/task-module
```

---

## 4. 提交规范

### 4.1 提交信息格式

采用 **Conventional Commits** 规范：

```
<type>(<scope>): <subject>

<body>  # 可选，详细描述

<footer>  # 可选，如 BREAKING CHANGE
```

### 4.2 Type 类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加任务创建功能` |
| `fix` | 修复Bug | `fix: 修复拖拽时任务消失的问题` |
| `docs` | 文档更新 | `docs: 更新README` |
| `style` | 代码格式（不影响功能） | `style: 调整缩进` |
| `refactor` | 重构（不新增功能，不修bug） | `refactor: 重命名变量` |
| `perf` | 性能优化 | `perf: 优化列表渲染性能` |
| `test` | 测试相关 | `test: 添加任务模块单元测试` |
| `chore` | 构建/工具相关 | `chore: 更新依赖版本` |
| `init` | 项目初始化 | `init: 项目初始化` |

### 4.3 好的提交 vs 坏的提交

**✅ 好的提交**：
```
feat(task): 支持拖拽任务到功能区

- 实现任务从面板到功能区的拖拽
- 实现功能区内任务排序
- 添加拖拽预览效果
- 修复跨日拖拽的边界问题
```

**❌ 坏的提交**：
```
更新了一些东西
```
```
修复bug
```
```
asdfghjkl
```

### 4.4 提交原则

1. **原子性**：一个提交只做一件事
2. **清晰性**：提交信息要能说明改了什么
3. **频率**：不要攒一大堆才提交，随时提交
4. **可回滚**：确保每个提交都能独立通过编译

### 4.5 示例

```bash
# 好的提交
git commit -m "feat(zone): 功能区支持颜色自定义"

git commit -m "fix(timeline): 修复时间线跨天显示错误"

git commit -m "docs(prd): 更新需求文档，添加月视图说明"

git commit -m "refactor(task): 提取任务拖拽逻辑为自定义hook"

git commit -m "chore: 升级 next.js 到 14.2"
```

---

## 5. 常用 Git 命令速查

### 5.1 基础操作

```bash
# 查看状态
git status

# 查看修改内容
git diff

# 添加文件到暂存区
git add 文件名
git add .  # 所有文件

# 提交
git commit -m "提交信息"

# 推送
git push

# 拉取
git pull
```

### 5.2 历史查看

```bash
# 查看提交历史
git log
git log --oneline  # 一行显示
git log --graph    # 图形化显示

# 查看某次提交的修改
git show commit-hash
```

### 5.3 撤销操作

```bash
# 撤销工作区修改（未 add）
git checkout -- 文件名
git restore 文件名

# 撤销暂存（已 add 未 commit）
git reset HEAD 文件名
git restore --staged 文件名

# 撤销上一次提交（已 commit 未 push）
git reset --soft HEAD~1  # 保留修改，只撤销commit
git reset --hard HEAD~1  # 不保留修改，彻底撤销（慎用！）

# 撤销已 push 的提交（用 revert，不修改历史）
git revert commit-hash
```

### 5.4 暂存（Stash）

```bash
# 暂存当前修改
git stash

# 查看暂存列表
git stash list

# 恢复暂存
git stash pop

# 丢弃暂存
git stash drop
```

### 5.5 标签（Tag）

```bash
# 创建标签
git tag v1.0.0

# 查看标签
git tag

# 推送标签
git push --tags

# 删除本地标签
git tag -d v1.0.0

# 删除远程标签
git push origin --delete v1.0.0
```

---

## 6. 常见问题

### Q1: 代码冲突了怎么办？

**场景**：pull 或 merge 时出现冲突

**解决步骤**：
1. 打开冲突文件，找到 `<<<<<<<` 标记
2. 手动合并代码，保留需要的部分
3. 删除冲突标记
4. `git add 冲突文件`
5. `git commit` 完成合并

### Q2: 提交错了分支怎么办？

```bash
# 1. 撤销这次提交（保留修改）
git reset --soft HEAD~1

# 2. 暂存修改
git stash

# 3. 切换到正确的分支
git checkout correct-branch

# 4. 恢复修改
git stash pop

# 5. 重新提交
git add .
git commit -m "xxx"
```

### Q3: 不小心提交了敏感信息怎么办？

1. 立即修改敏感信息（改密码等）
2. 从 Git 历史中彻底删除（需要重写历史）
3. 强制推送（会影响其他人，慎用）

**推荐工具**：`git-filter-repo`

### Q4: .gitignore 不生效？

原因：文件已经被 Git 跟踪了

解决：
```bash
# 从暂存区移除（保留本地文件）
git rm --cached 文件名

# 提交
git commit -m "chore: 移除被误跟踪的文件"
```

### Q5: 如何查看是谁写的某行代码？

```bash
git blame 文件名
```

### Q6: 远程仓库地址变了怎么办？

```bash
# 查看当前远程地址
git remote -v

# 修改远程地址
git remote set-url origin 新地址
```

---

## 项目 .gitignore 模板

```gitignore
# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage

# Next.js
.next/
out/

# Production
build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Prisma
prisma/migrations/*_dev.db
prisma/dev.db

# IDE
.vscode
.idea
*.swp
*.swo
*.iml

# OS
Thumbs.db

# Logs
logs
*.log

# Cache
.cache
.parcel-cache
.turbo
```

---

## 检查清单

- [ ] Git 仓库已初始化
- [ ] .gitignore 已配置
- [ ] 远程仓库已关联
- [ ] 第一次提交已推送
- [ ] 了解分支策略
- [ ] 掌握提交规范
- [ ] 会解决基本冲突

---

## 学习资源

- [Pro Git 中文版](https://git-scm.com/book/zh/v2)
- [廖雪峰 Git 教程](https://www.liaoxuefeng.com/wiki/896043488029600)
- [交互式 Git 练习](https://learngitbranching.js.org/)

---

准备好了吗？我们马上开始 Phase 0：环境搭建！
