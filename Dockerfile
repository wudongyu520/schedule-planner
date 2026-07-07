# ==========================================
# 阶段 1: 安装依赖并生成 Prisma Client
# ==========================================
FROM node:22-alpine AS deps
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

RUN npx prisma generate
RUN npm run build

# ==========================================
# 阶段 3: 最终运行镜像
# ==========================================
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制 standalone 产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 复制 Prisma 相关文件（用于 db push）
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# 创建启动脚本
COPY --chown=nextjs:nodejs start.sh ./start.sh
RUN chmod +x ./start.sh

USER nextjs

EXPOSE 3000

CMD ["sh", "./start.sh"]