import fs from "node:fs/promises";
import type { AgentHarness } from "@earendil-works/pi-agent-core";
import { $ } from "./state";

const COMPACT_THRESHOLD = 80;

export async function shouldCompact(): Promise<boolean> {
  if (!$.currentSessionPath) return false;
  try {
    const content = await fs.readFile($.currentSessionPath, "utf-8");
    const lines = content.split("\n").filter((l) => l.trim());
    return lines.length - 1 > COMPACT_THRESHOLD;
  } catch { return false; }
}

export async function autoCompactSession(harness: AgentHarness) {
  if (!(await shouldCompact())) return null;
  try {
    console.log("[compact] 自动压缩...");
    const result = await harness.compact();
    console.log(`[compact] 完成: ${result.summary.substring(0, 80)}...`);
    return result;
  } catch (err) {
    console.error("[compact] 失败:", err);
    return null;
  }
}
