#!/bin/sh
set -e

echo "=== 同步数据库结构 ==="
npx prisma db push --accept-data-loss 2>/dev/null || echo "数据库同步失败，继续启动..."

echo "=== 启动应用 ==="
node server.js