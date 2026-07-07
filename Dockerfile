# ==========================================
# 阶段 1: 安装依赖并生成 Prisma Client
# ==========================================
FROM node:22-alpine AS deps
# Alpine 镜像必须安装 libc6-compat 才能正常运行 Prisma Engine
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm config set registry https://registry.npmmirror.com/ && \
    npm install

# ==========================================
# 阶段 2: 构建 Next.js 项目
# ==========================================
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 在打包前必须注入环境变量（如果你的 build 过程需要连接数据库验证）
# 或者在 schema.prisma 里确保没有强依赖 build 时的数据库连接
RUN npx prisma generate
RUN npm run build

# ==========================================
# 阶段 3: 最终运行镜像（体积最小）
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 增加安全安全性，不使用 root 用户运行
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 仅复制 Standalone 模式所需的最小产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]