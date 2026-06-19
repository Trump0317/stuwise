import { ref, type Ref } from "vue";
import type { OutputItem } from "../types";

export function useOutputs(sessionId: Ref<string | null>) {
  const outputs = ref<OutputItem[]>([]);
  const loading = ref(false);

  async function fetchOutputs(type = "all") {
    loading.value = true;
    try {
      const sid = sessionId.value ? `&sessionId=${sessionId.value}` : "";
      const res = await fetch(`/api/outputs?type=${type}${sid}`);
      const data = await res.json();
      outputs.value = data.data?.outputs || [];
    } catch { /* ignore */ }
    loading.value = false;
  }

  return { outputs, loading, fetchOutputs };
}
