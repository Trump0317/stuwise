import { ref } from "vue";
import type { OutputItem } from "../types";

export function useOutputs() {
  const outputs = ref<OutputItem[]>([]);
  const loading = ref(false);

  async function fetchOutputs(type = "all") {
    loading.value = true;
    try {
      const res = await fetch(`/api/outputs?type=${type}`);
      const data = await res.json();
      outputs.value = data.data?.outputs || [];
    } catch { /* ignore */ }
    loading.value = false;
  }

  return { outputs, loading, fetchOutputs };
}
