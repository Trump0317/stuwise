import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

interface Skill {
  name: string;
  description: string;
  content: string;
  filePath: string;
  disableModelInvocation?: boolean;
}

interface SkillDiagnostic {
  type: "warning" | "error";
  code: string;
  message: string;
  path: string;
}

/**
 * 加载 skills 目录下的 SKILL.md 文件（跨平台实现）
 * 替代 pi-agent-core 的 loadSkills，修复 Windows 路径 bug
 */
export function loadSkillsLocal(skillsDir: string): { skills: Skill[]; diagnostics: SkillDiagnostic[] } {
  const skills: Skill[] = [];
  const diagnostics: SkillDiagnostic[] = [];

  if (!existsSync(skillsDir)) {
    diagnostics.push({ type: "warning", code: "not_found", message: `Skills dir not found: ${skillsDir}`, path: skillsDir });
    return { skills, diagnostics };
  }

  try {
    const entries = readdirSync(skillsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      if (entry.isDirectory()) {
        const skillMd = join(skillsDir, entry.name, "SKILL.md");
        if (existsSync(skillMd)) {
          try {
            const content = readFileSync(skillMd, "utf-8");
            const { name, description } = parseFrontmatter(content);
            skills.push({
              name: name || entry.name,
              description: description || "",
              content,
              filePath: skillMd,
            });
          } catch (err) {
            diagnostics.push({ type: "error", code: "read_failed", message: String(err), path: skillMd });
          }
        }
      }
    }
  } catch (err) {
    diagnostics.push({ type: "error", code: "readdir_failed", message: String(err), path: skillsDir });
  }

  return { skills, diagnostics };
}

function parseFrontmatter(content: string): { name?: string; description?: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const frontmatter: Record<string, string> = {};
  for (const line of match[1]!.split("\n")) {
    const colon = line.indexOf(":");
    if (colon > 0) {
      const key = line.slice(0, colon).trim();
      const val = line.slice(colon + 1).trim();
      frontmatter[key] = val;
    }
  }
  return { name: frontmatter.name, description: frontmatter.description };
}
