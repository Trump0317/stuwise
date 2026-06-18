import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { cpSync } from "node:fs";
import { resolve } from "node:path";
import esbuild from "esbuild";

const distDir = resolve("dist/stuwise");

// 1. Clean
cpSync(resolve("dist/client"), resolve(distDir, "client"), { recursive: true, force: true });

// 2. Bundle server
const indexPath = resolve("server/index.ts");
await esbuild.build({
  entryPoints: [indexPath],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: resolve(distDir, "server.mjs"),
  external: ["@earendil-works/*", "dotenv"],
  define: { "process.env.NODE_ENV": "'production'" },
});

// 3. Copy runtime dependencies
const runtimeDirs = ["tools", "skills"];
for (const dir of runtimeDirs) {
  if (existsSync(dir)) {
    cpSync(dir, resolve(distDir, dir), { recursive: true, force: true });
  }
}

// 4. Copy .env.example
if (existsSync(".env.example")) {
  copyFileSync(".env.example", resolve(distDir, ".env.example"));
}

// 5. Create launch scripts
// Windows
writeFileSync(resolve(distDir, "start.bat"), `@echo off
if not exist .env copy .env.example .env
echo Starting Stuwise...
echo Open http://localhost:3000 in your browser
node server.mjs
pause
`);

// Linux/Mac
writeFileSync(resolve(distDir, "start.sh"), `#!/bin/bash
[ ! -f .env ] && cp .env.example .env
echo "Starting Stuwise..."
echo "Open http://localhost:3000 in your browser"
node server.mjs
`);
import { chmodSync } from "node:fs";
try { chmodSync(resolve(distDir, "start.sh"), 0o755); } catch {}

// 6. Create README
writeFileSync(resolve(distDir, "README.txt"), `Stuwise v0.1.0

Requirements: Node.js 20+

Usage:
  Windows:  double-click start.bat
  Mac/Linux: ./start.sh

  Then open http://localhost:3000 in your browser.

Configuration:
  Edit .env file to set your API key and model.
`);

console.log("✅ dist/stuwise/ 打包完成");
