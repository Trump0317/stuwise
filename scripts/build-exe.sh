#!/usr/bin/env bash
# 构建 Windows .exe（需在 Linux 上安装 mingw-w64 + node-source）
set -e

cd "$(dirname "$0")/.."

echo "=== 1. 构建前端 ==="
npm run build:client

echo "=== 2. 构建 dist/stuwide/ ==="
npx tsx scripts/build-dist.ts

echo "=== 3. CJS 打包 ==="
npx tsx scripts/build-cjs.ts

echo "=== 4. nexe 打包 .exe ==="
cd dist/stuwise
npx nexe server.cjs -o stuwise.exe --build --python=$(which python3) 2>&1 || {
  echo ""
  echo "⚠️  nexe --build 需要编译 Node.js，耗时长（~10分钟）且需要 build-essential"
  echo ""
  echo "方案 A: 在 Windows 上运行此脚本（nexe 直接下载预编译 Node）"
  echo "方案 B: 安装 build-essential 后重试"
  echo "方案 C: 直接使用 dist/stuwise/start.bat（需 Node.js）"
  exit 1
}

echo ""
echo "✅ dist/stuwise/stuwise.exe 生成完成"
