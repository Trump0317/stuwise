import { Hono } from "hono";
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";

export function convertRoute() {
  const app = new Hono();

  app.post("/convert", async (c) => {
    try {
      const body = await c.req.parseBody();
      const file = body.file as File | undefined;
      if (!file) return c.json({ ok: false, error: "缺少 file 字段" }, 400);

      const ext = file.name.toLowerCase().split(".").pop();
      if (!ext || !["docx", "md"].includes(ext)) {
        return c.json({ ok: false, error: "仅支持 .docx 和 .md 文件" }, 400);
      }

      const skill = c.req.query("skill") || "experiment-report";
      const script = resolve(process.cwd(), `skills/${skill}/scripts/convert.ts`);

      const buffer = Buffer.from(await file.arrayBuffer());

      if (ext === "md") {
        return c.json({ ok: true, data: { markdown: buffer.toString("utf-8"), name: file.name } });
      }

      // DOCX: 存临时文件，调 skill 脚本转换
      const dir = mkdtempSync(join(tmpdir(), "stuwise-"));
      const tmpFile = join(dir, file.name);
      writeFileSync(tmpFile, buffer);

      try {
        const result = execFileSync("npx", ["tsx", script, tmpFile], { encoding: "utf-8", timeout: 30000 });
        return c.json(JSON.parse(result));
      } catch (e: any) {
        if (e.stdout) return c.json(JSON.parse(e.stdout));
        throw e;
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    } catch (err) {
      return c.json({ ok: false, error: (err as Error).message }, 500);
    }
  });

  return app;
}
