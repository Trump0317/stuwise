import esbuild from "esbuild";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const frontendDir = resolve("dist/client");
let indexHtml = "";
try {
  indexHtml = readFileSync(resolve(frontendDir, "index.html"), "utf-8");
} catch {
  console.warn("dist/client/index.html 不存在，请先运行 npm run build");
}

// 将前端静态文件内联
const injectCode = `
// Auto-generated: embedded frontend
const EMBEDDED_HTML = ${JSON.stringify(indexHtml)};
`;

await esbuild.build({
  entryPoints: ["server/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: "dist/standalone/server.mjs",
  external: [
    "@earendil-works/*",  // pi packages 有原生模块，external
    "dotenv",
  ],
  banner: {
    js: injectCode,
  },
  define: {
    "process.env.NODE_ENV": "'production'",
  },
});

console.log("✅ dist/standalone/server.mjs");
