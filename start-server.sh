#!/bin/bash

# PPTX to JSON Next.js 服务启动脚本

echo "🚀 启动 PPTX to JSON 服务..."

# 检查端口是否被占用
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口 3000 已被占用，尝试停止现有服务..."
    pkill -f "next start" 2>/dev/null || true
    sleep 2
fi

# 确保依赖已安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 构建应用（如果 .next 目录不存在）
if [ ! -d ".next" ]; then
    echo "🔨 构建应用..."
    npm run build:next
fi

# 启动生产服务器
echo "🌟 启动生产服务器..."
npm run start &

# 等待服务启动
sleep 3

# 测试服务是否正常
echo "🔍 测试服务状态..."
if curl -f -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ 服务启动成功！"
    echo ""
    echo "🎯 访问地址:"
    echo "   主页: http://localhost:3000"
    echo "   API文档: http://localhost:3000/api-docs"
    echo "   健康检查: http://localhost:3000/api/health"
    echo ""
    echo "💡 提示: 使用 Ctrl+C 停止服务"
else
    echo "❌ 服务启动失败，请检查错误信息"
    exit 1
fi

# 保持脚本运行
wait