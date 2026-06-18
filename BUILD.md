# Windows 上编译 .exe 全流程

## 准备工作

1. 安装 Node.js 20+ https://nodejs.org
2. 打开 PowerShell 或 Git Bash

## 步骤

```powershell
# 1. 克隆项目
git clone <仓库地址> stuwise
cd stuwise

# 2. 安装依赖
npm install

# 3. 配置 API Key（二选一）
#    方式 A: 编辑 .env 文件
notepad .env
#    方式 B: 启动后在设置面板输入

# 4. 构建
npm run build:dist

# 5. 打包 exe
cd dist/stuwise
npx nexe server.cjs -o stuwise.exe --target win-x64-20.11.0

# 6. 验证
.\stuwise.exe
# 打开浏览器 http://localhost:3000
```

## 最终产物

```
dist/stuwise/stuwise.exe   ← 拷到任意 Windows 双击运行
```

> **注意**：如果 nexe 下载 Node 二进制失败，加 `--build` 参数自行编译（耗时较长）。

## 便携版（不需要 .exe）

```powershell
npm run build:dist
cd dist/stuwise
.\start.bat
```
