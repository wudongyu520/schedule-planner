#!/bin/bash

set -e

echo "======================================"
echo "  日程规划系统 - 一键部署脚本"
echo "======================================"

# 1. 更新代码
echo ""
echo "[1/5] 更新代码..."
git pull

# 2. 停止旧服务
echo ""
echo "[2/5] 停止旧服务..."
docker-compose down

# 3. 构建镜像
echo ""
echo "[3/5] 构建镜像..."
docker-compose build --no-cache

# 4. 启动服务
echo ""
echo "[4/5] 启动服务..."
docker-compose up -d

# 5. 查看状态
echo ""
echo "[5/5] 查看状态..."
sleep 3
docker-compose ps

echo ""
echo "======================================"
echo "  部署完成！"
echo "  访问地址: http://服务器IP:3000"
echo "======================================"