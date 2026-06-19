import fs from "node:fs/promises";
import path from "node:path";

interface OutputItem {
  name: string;
  path: string;
  type: "image" | "file" | "link";
  time: string;
  size: number;
}

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);
const FILE_EXT = new Set([".md", ".txt", ".json", ".js", ".ts", ".py", ".css", ".html", ".pdf"]);

function getType(ext: string): "image" | "file" {
  return IMAGE_EXT.has(ext) ? "image" : "file";
}

export async function listOutputs(sessionId?: string, type = "all"): Promise<OutputItem[]> {
  const baseDir = path.join(process.cwd(), "data");
  let results: OutputItem[] = [];

  // 有 sessionId → 扫描该 session 的 outputs 子目录
  if (sessionId) {
    const dir = path.join(baseDir, "sessions", sessionId, "outputs");
    results = await scanDir(dir, false);
  } else {
    // 无 sessionId → 扫描所有 sessions 的 outputs + data/ 根目录旧产物
    results = await scanDir(path.join(baseDir, "sessions"), true);
    const legacy = await scanDir(baseDir, true);
    results = [...results, ...legacy];
  }

  if (type === "image") return results.filter((r) => r.type === "image");
  if (type === "file") return results.filter((r) => r.type === "file");
  return results;
}

async function scanDir(dir: string, recursive: boolean): Promise<OutputItem[]> {
  const results: OutputItem[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory() && recursive && e.name !== "sessions") {
        const sub = await scanDir(full, true);
        results.push(...sub);
      } else if (e.isFile() && e.name !== ".gitkeep") {
        const ext = path.extname(e.name).toLowerCase();
        if (IMAGE_EXT.has(ext) || FILE_EXT.has(ext)) {
          const stat = await fs.stat(full);
          results.push({
            name: e.name,
            path: path.relative(path.join(process.cwd(), "data"), full),
            type: getType(ext),
            time: stat.mtime.toISOString(),
            size: stat.size,
          });
        }
      }
    }
  } catch { /* directory doesn't exist yet */ }
  return results;
}
