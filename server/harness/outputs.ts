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

async function scanDir(dir: string, baseDir: string, results: OutputItem[]) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        await scanDir(full, baseDir, results);
      } else if (e.isFile() && e.name !== ".gitkeep") {
        const ext = path.extname(e.name).toLowerCase();
        if (IMAGE_EXT.has(ext) || FILE_EXT.has(ext)) {
          const stat = await fs.stat(full);
          results.push({
            name: e.name,
            path: path.relative(baseDir, full),
            type: getType(ext),
            time: stat.mtime.toISOString(),
            size: stat.size,
          });
        }
      }
    }
  } catch { /* ignore */ }
}

export async function listOutputs(type: string): Promise<OutputItem[]> {
  const baseDir = process.cwd();
  const results: OutputItem[] = [];

  // 扫描 data/ 目录
  await scanDir(path.join(baseDir, "data"), baseDir, results);

  // 过滤
  if (type === "image") return results.filter((r) => r.type === "image");
  if (type === "file") return results.filter((r) => r.type === "file");

  // "all" 或 "link"（link 暂不处理）
  return results;
}
