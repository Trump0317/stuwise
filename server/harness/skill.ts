import { $, getHarness } from "./state";

export function getSkillsWithStatus() {
  return $.allSkills.map((s) => ({ name: s.name, description: s.description, enabled: $.skillEnabled.get(s.name) !== false }));
}

export async function toggleSkill(name: string): Promise<boolean> {
  const cur = $.skillEnabled.get(name) !== false;
  $.skillEnabled.set(name, !cur);
  const h = getHarness();
  const r = h.getResources();
  const sk = r.skills || [];
  if (cur) h.setResources({ ...r, skills: sk.filter((s) => s.name !== name) });
  else { const s = $.allSkills.find((x) => x.name === name); if (s) h.setResources({ ...r, skills: [...sk, s] }); }
  return !cur;
}

export function getToolsWithStatus() {
  return $.allToolNames.map((name) => ({
    name,
    description: (TOOL_LABELS as Record<string,string>)[name] || name,
    enabled: $.toolEnabled.get(name) !== false,
  }));
}

const TOOL_LABELS: Record<string, string> = {
  read: "读取文件", write: "写入文件", edit: "编辑文件",
  ls: "列出目录", grep: "搜索文本", find: "查找文件",
  bash: "执行命令", web_search: "搜索网络", web_fetch: "抓取网页",
};

export async function toggleTool(name: string): Promise<boolean> {
  const cur = $.toolEnabled.get(name) !== false;
  $.toolEnabled.set(name, !cur);
  const h = getHarness();
  const active = $.allToolNames.filter((n) => $.toolEnabled.get(n) !== false);
  await h.setActiveTools(active);
  return !cur;
}
