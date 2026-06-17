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
