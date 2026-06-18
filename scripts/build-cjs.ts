import esbuild from "esbuild";
import { resolve } from "node:path";

// Bundle to CJS for nexe compatibility
await esbuild.build({
  entryPoints: ["server/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "dist/stuwise/server.cjs",
  external: ["@earendil-works/*", "dotenv"],
  define: { "process.env.NODE_ENV": "'production'" },
});

console.log("✅ dist/stuwise/server.cjs");
