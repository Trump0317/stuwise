/**
 * 将 dist/stuwise/ 打包为独立 .exe
 * 使用 Node.js SEA (Single Executable Application)
 * 
 * 需要：安装 node --experimental-sea-config
 * 参考：https://nodejs.org/api/single-executable-applications.html
 */

import { writeFileSync, mkdirSync, execSync } from "node:fs";
import { resolve } from "node:path";

const distDir = resolve("dist/stuwise");
const seaDir = resolve("dist/sea");
mkdirSync(seaDir, { recursive: true });

// SEA config
const seaConfig = {
  main: resolve(distDir, "server.mjs"),
  output: resolve(seaDir, "sea-prep.blob"),
  disableExperimentalSEAWarning: true,
};

writeFileSync(resolve(seaDir, "sea-config.json"), JSON.stringify(seaConfig, null, 2));

console.log("步骤 1: 生成 blob...");
execSync(`node --experimental-sea-config ${resolve(seaDir, "sea-config.json")}`, {
  cwd: distDir,
  stdio: "inherit",
});

console.log("\n步骤 2: 复制 node 可执行文件...");
const nodeExe = process.execPath;
execSync(`cp "${nodeExe}" ${resolve(seaDir, "stuwise")}`, { stdio: "inherit" });

console.log("\n步骤 3: 注入 blob...");
// Platform-specific postject command
// macOS: codesign --remove-signature stuwise
// npx postject stuwise NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
// codesign --sign - stuwise

console.log(`
⚠️  .exe 生成需要平台特定工具。
请参考 Node.js SEA 文档手动完成剩余步骤：
https://nodejs.org/api/single-executable-applications.html

便携版已生成到 dist/stuwide/，包含所有运行时文件。
Windows 用户可直接运行 start.bat（需安装 Node.js）。
`);
