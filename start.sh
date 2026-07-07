#!/bin/sh
set -e

echo "=== 同步数据库结构 ==="
npx prisma db push --accept-data-loss || echo "警告: 数据库同步失败，继续启动..."

echo "=== 启动应用 ==="
npx next start
