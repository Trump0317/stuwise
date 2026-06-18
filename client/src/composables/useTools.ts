import { ref } from "vue";

export function useTools() {
  const tools = ref<Array<{ name: string; description: string; enabled: boolean }>>([]);

  async function fetchTools() {
    try {
      const res = await fetch("/api/tools");
      const data = await res.json();
      tools.value = data.data?.tools || [];
    } catch { /* ignore */ }
  }

  async function toggleTool(name: string) {
    try {
      const res = await fetch(`/api/tools/${name}`, { method: "PUT" });
      const data = await res.json();
      if (data.ok) {
        tools.value = tools.value.map((t) =>
          t.name === name ? { ...t, enabled: data.data.enabled } : t
        );
      }
    } catch { /* ignore */ }
  }

  return { tools, fetchTools, toggleTool };
}
