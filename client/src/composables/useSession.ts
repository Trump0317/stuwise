import { ref } from "vue";
import type { SessionInfo } from "../types";

export function useSession() {
  const sessions = ref<SessionInfo[]>([]);
  const currentSessionId = ref<string | null>(null);

  async function fetchSessions() {
    try {
      const res = await fetch("/api/session");
      const data = await res.json();
      sessions.value = data.data?.sessions || [];
    } catch { /* ignore */ }
  }

  async function loadSession(id: string) {
    try {
      const res = await fetch(`/api/session/${id}`);
      const data = await res.json();
      const raw = data.data?.messages || [];
      currentSessionId.value = id;
      return raw.map((m: any) => ({
        id: "",
        role: m.role,
        content: typeof m.content === "string"
          ? m.content
          : m.content?.map((c: any) => c.text || "").join("") || "",
        timestamp: m.timestamp || Date.now(),
      }));
    } catch {
      return null;
    }
  }

  async function createSession() {
    try {
      const res = await fetch("/api/session", { method: "POST" });
      const data = await res.json();
      if (data.data?.session) {
        sessions.value = [data.data.session, ...sessions.value];
        return data.data.session.id;
      }
    } catch { /* ignore */ }
    return null;
  }

  async function deleteSession(id: string) {
    try {
      await fetch(`/api/session/${id}`, { method: "DELETE" });
      sessions.value = sessions.value.filter((s) => s.id !== id);
      return sessions.value[0]?.id || null;
    } catch {
      return currentSessionId.value;
    }
  }

  async function switchSession(id: string) {
    try {
      await fetch(`/api/session/${id}`, { method: "PUT" });
      return await loadSession(id);
    } catch {
      return null;
    }
  }

  return { sessions, currentSessionId, fetchSessions, loadSession, createSession, deleteSession, switchSession };
}
