# Windows 上编译 .exe 全流程

## 准备工作

1. 安装 Node.js 20+ https://nodejs.org
2. 打开 PowerShell 或 Git Bash

## 编译步骤

```powershell
# 1. 克隆项目
git clone <仓库地址> stuwise
cd stuwise

# 2. 安装依赖
npm install

# 3. 构建前端 + 打包服务端
npm run build:dist

# 4. 生成 .exe
cd dist/stuwise
npx nexe server.cjs -o stuwise.exe --target win-x64-20.11.0

# 5. 验证
.\stuwise.exe
# 打开浏览器 http://localhost:3000 → 点右上角 ⚙ 设置 API Key
```

## 分发

将 `dist/stuwise/stuwise.exe` 发给用户，用户：
1. 双击 `stuwise.exe`
2. 浏览器打开 `http://localhost:3000`
3. 点 ⚙ → 输入自己的 API Key → 保存
4. 开始使用

> API Key 不预置在 exe 中，由用户自行配置。
