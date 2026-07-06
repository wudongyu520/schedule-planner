# 部署指南 - Docker + 云服务器

> 这份指南会一步步教你如何把项目部署到云服务器上，使用 Docker 容器化部署。

---

## 目录

1. [部署架构概览](#1-部署架构概览)
2. [本地 Docker 配置](#2-本地-docker-配置)
3. [云服务器准备](#3-云服务器准备)
4. [部署流程](#4-部署流程)
5. [域名与 SSL](#5-域名与-ssl)
6. [数据库备份](#6-数据库备份)
7. [常见问题](#7-常见问题)

---

## 1. 部署架构概览

```
                    互联网
                       │
                       ▼
              ┌────────────────┐
              │   Nginx        │  ← 反向代理 + SSL
              │   (宿主机)     │
              └───────┬────────┘
                      │
              ┌───────▼────────┐
              │  Docker Compose│
              │                │
              │ ┌────────────┐ │
              │ │  Next.js   │ │  ← 应用容器
              │ │  (App)    │ │
              │ └─────┬──────┘ │
              │       │        │
              │ ┌─────▼──────┐ │
              │ │ PostgreSQL │ │  ← 数据库容器
              │ │            │ │
              │ └────────────┘ │
              └────────────────┘
```

### 组件说明

| 组件 | 作用 | 端口 |
|------|------|------|
| Next.js App | 前端 + API | 3000 |
| PostgreSQL | 数据库 | 5432（内部） |
| Nginx | 反向代理 + SSL | 80, 443 |

---

## 2. 本地 Docker 配置

### 2.1 Dockerfile

创建 `Dockerfile`：
```dockerfile
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --frozen-lockfile

# 复制源码
COPY . .

# 生成 Prisma Client
RUN pnpm prisma generate

# 构建
RUN pnpm build

# 运行阶段
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动命令：先执行数据库迁移，再启动应用
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm start"]
```

### 2.2 docker-compose.yml

创建 `docker-compose.yml`：
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/schedule_planner?schema=public
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=your-secret-key-change-in-production
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=schedule_planner
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### 2.3 .dockerignore

创建 `.dockerignore`：
```
node_modules
.next
.git
.gitignore
.env.local
.env.development
.env.production
*.log
.DS_Store
```

### 2.4 本地测试 Docker

```bash
# 构建并启动
docker compose up -d --build

# 查看日志
docker compose logs -f

# 停止
docker compose down
```

---

## 3. 云服务器准备

### 3.1 服务器配置建议

| 配置 | 最低 | 推荐 |
|------|------|------|
| CPU | 2核 | 4核 |
| 内存 | 2GB | 4GB |
| 硬盘 | 40GB | 80GB |
| 带宽 | 1Mbps | 3Mbps+ |
| 系统 | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### 3.2 服务器初始化

以 root 用户登录服务器，执行以下命令：

```bash
# 更新系统
apt update && apt upgrade -y

# 安装基础工具
apt install -y curl wget git vim ufw

# 创建新用户（避免用 root）
adduser deploy
usermod -aG sudo deploy

# 切换到新用户
su - deploy
```

### 3.3 安装 Docker

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 把当前用户加入 docker 组（免 sudo）
sudo usermod -aG docker $USER

# 重新登录使生效
exit
su - deploy

# 验证安装
docker --version
docker compose version
```

### 3.4 配置防火墙

```bash
# 允许 SSH
sudo ufw allow 22

# 允许 HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

---

## 4. 部署流程

### 4.1 方式一：Git 拉取部署（推荐）

**步骤 1：在服务器上拉取代码**
```bash
# 进入工作目录
cd ~
git clone <你的仓库地址> schedule-planner
cd schedule-planner
```

**步骤 2：配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
vim .env
```

`.env` 内容示例：
```env
# 数据库
DATABASE_URL=postgresql://postgres:你的强密码@db:5432/schedule_planner?schema=public

# NextAuth
NEXTAUTH_URL=https://你的域名
NEXTAUTH_SECRET=用命令生成一串随机字符串
```

生成 NEXTAUTH_SECRET：
```bash
openssl rand -hex 32
```

**步骤 3：启动服务**
```bash
# 构建并启动
docker compose up -d --build

# 查看日志
docker compose logs -f app
```

**步骤 4：验证**
```bash
# 查看容器状态
docker compose ps

# 访问测试（应该返回 200）
curl -I http://localhost:3000
```

### 4.2 方式二：CI/CD 自动部署（进阶）

使用 GitHub Actions 自动部署。在项目中创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Server

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ~/schedule-planner
            git pull
            docker compose up -d --build
            docker compose prune -f
```

在 GitHub 仓库 Settings → Secrets 中配置：
- `SERVER_HOST`：服务器IP
- `SERVER_USER`：用户名
- `SSH_PRIVATE_KEY`：SSH私钥

### 4.3 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker compose up -d --build

# 查看日志确认正常
docker compose logs -f --tail=50
```

### 4.4 回滚

```bash
# 查看历史版本
git log --oneline

# 回滚到某个版本
git reset --hard <commit-hash>

# 重新构建
docker compose up -d --build
```

---

## 5. 域名与 SSL

### 5.1 域名解析

在你的域名服务商添加 DNS 记录：
- 类型：A 记录
- 主机：@ 或 www
- 值：你的服务器IP

### 5.2 安装 Nginx

```bash
sudo apt install -y nginx
```

### 5.3 配置 Nginx 反向代理

创建配置文件：
```bash
sudo vim /etc/nginx/sites-available/schedule-planner
```

内容：
```nginx
server {
    listen 80;
    server_name 你的域名.com www.你的域名.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

启用配置：
```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/schedule-planner /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

### 5.4 配置 SSL（HTTPS）

使用 Let's Encrypt 免费证书：

```bash
# 安装 certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取并安装证书
sudo certbot --nginx -d 你的域名.com -d www.你的域名.com
```

Certbot 会自动配置 Nginx 并设置自动续期。

### 5.5 验证 HTTPS

访问 `https://你的域名.com`，应该能看到小锁图标。

---

## 6. 数据库备份

### 6.1 手动备份

```bash
# 备份数据库
docker compose exec db pg_dump -U postgres schedule_planner > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker compose exec -T db psql -U postgres schedule_planner < backup_20240101.sql
```

### 6.2 自动备份脚本

创建备份脚本 `~/backup.sh`：
```bash
#!/bin/bash

BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=30

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
cd ~/schedule-planner
docker compose exec -T db pg_dump -U postgres schedule_planner > $BACKUP_DIR/db_$DATE.sql

# 压缩
gzip $BACKUP_DIR/db_$DATE.sql

# 删除30天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +$KEEP_DAYS -delete

echo "Backup completed: db_$DATE.sql.gz"
```

设置定时任务：
```bash
chmod +x ~/backup.sh

# 编辑 crontab
crontab -e

# 添加（每天凌晨2点备份）
0 2 * * * ~/backup.sh >> ~/backup.log 2>&1
```

---

## 7. 常见问题

### Q1: 容器启动失败怎么办？

```bash
# 查看日志
docker compose logs app

# 查看所有日志
docker compose logs

# 进入容器调试
docker compose exec app sh
```

### Q2: 数据库连不上？

1. 检查 `DATABASE_URL` 是否正确
2. 确认 db 容器是否启动：`docker compose ps db`
3. 查看 db 日志：`docker compose logs db`
4. 应用启动前需要等数据库就绪（我们用了 depends_on，但 PostgreSQL 可能还没完全就绪）

解决方案：在启动脚本中加重试逻辑，或者用 `wait-for-it` 脚本。

### Q3: 端口被占用？

```bash
# 查看端口占用
sudo lsof -i :3000
sudo lsof -i :5432

# 修改 docker-compose.yml 中的端口映射
```

### Q4: 内存不够怎么办？

- 增加 swap 分区
- 降低 Node.js 内存使用：`NODE_OPTIONS=--max-old-space-size=512`
- 升级服务器配置

### Q5: 如何查看应用日志？

```bash
# 实时查看
docker compose logs -f app

# 查看最后100行
docker compose logs --tail=100 app

# 查看错误日志
docker compose logs app | grep ERROR
```

### Q6: 服务器安全加固建议？

1. 禁用 root 密码登录，只用 SSH key
2. 修改 SSH 默认端口（22 → 其他）
3. 安装 fail2ban 防止暴力破解
4. 定期更新系统
5. 数据库端口不对外暴露（我们的配置只在内部网络）

---

## 部署检查清单

部署完成后，逐项检查：

- [ ] 网站可以正常访问
- [ ] HTTPS 正常（小锁图标）
- [ ] 数据库连接正常
- [ ] 用户可以注册登录
- [ ] 数据可以正常保存
- [ ] 刷新页面数据不丢失
- [ ] 数据库备份正常
- [ ] 错误日志没有异常
- [ ] 响应速度正常

---

## 下一步

部署是最后一步，现在我们先专注于开发。等代码写得差不多了，再回来按这份指南部署。

有任何部署相关的问题，随时问我！
