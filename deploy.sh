#!/bin/bash

# FirePath 一键部署脚本

echo "🔥 FirePath 部署脚本"
echo "===================="
echo ""

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 安装 Vercel CLI..."
    npm install -g vercel
fi

# 构建前端
echo "🔨 构建前端应用..."
cd client
npm run build
cd ..

# 部署到 Vercel
echo "🚀 部署到 Vercel..."
vercel --prod

echo ""
echo "✅ 部署完成！"
echo ""
echo "📱 下一步："
echo "1. 在手机上打开部署的URL"
echo "2. 添加到主屏幕"
echo "3. 开始使用 FirePath！"

