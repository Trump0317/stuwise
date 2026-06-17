import { ref } from "vue";

export function useSkills() {
  const skills = ref<Array<{ name: string; description: string; enabled: boolean }>>([]);

  async function fetchSkills() {
    try {
      const res = await fetch("/api/skills");
      const data = await res.json();
      skills.value = data.data?.skills || [];
    } catch { /* ignore */ }
  }

  async function toggleSkill(name: string) {
    try {
      const res = await fetch(`/api/skills/${name}`, { method: "PUT" });
      const data = await res.json();
      if (data.ok) {
        skills.value = skills.value.map((s) =>
          s.name === name ? { ...s, enabled: data.data.enabled } : s
        );
      }
    } catch { /* ignore */ }
  }

  return { skills, fetchSkills, toggleSkill };
}
