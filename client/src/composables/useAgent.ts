import { ref } from "vue";
import type { ChatMessage, TimelineItem } from "../types";
import { nextId } from "../types";
import { TOOL_LABELS } from "./constants";
import { useSession } from "./useSession";
import { useSkills } from "./useSkills";

function toTimeline(msgs: ChatMessage[]): TimelineItem[] {
  return msgs.map((m) => ({ id: m.id, kind: "message" as const, message: m, tool: null }));
}

function extractToolResult(result: any): string {
  if (!result?.content) return "";
  const texts = result.content
    .filter((c: any) => c.type === "text")
    .map((c: any) => c.text as string);
  return texts.join("\n").slice(0, 500);
}

export function useAgent() {
  const timeline = ref<TimelineItem[]>([]);
  const isRunning = ref(false);
  const error = ref<string | null>(null);

  const session = useSession();
  const skill = useSkills();

  let eventSource: EventSource | null = null;
  let currentAssistantId: string | null = null;

  // === init (由 App.vue onMounted 调用) ===

  async function init() {
    await session.fetchSessions();
    await skill.fetchSkills();
    if (session.sessions.value.length > 0) {
      const msgs = await session.loadSession(session.sessions.value[0].id);
      if (msgs) {
        const messages: ChatMessage[] = msgs.map((m: any) => ({
          ...m,
          id: nextId(),
        }));
        timeline.value = toTimeline(messages);
      }
    }
  }

  // === send ===

  async function send(text: string): Promise<void> {
    if (isRunning.value) return;
    isRunning.value = true;
    error.value = null;

    const userMsg: ChatMessage = {
      id: nextId(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    timeline.value = [...timeline.value, { id: userMsg.id, kind: "message", message: userMsg, tool: null }];

    eventSource = new EventSource("/api/events");
    currentAssistantId = null;

    eventSource.onmessage = (e) => {
      try { handleEvent(JSON.parse(e.data)); } catch { /* ignore */ }
    };

    eventSource.onerror = () => {
      cleanup();
      isRunning.value = false;
      if (currentAssistantId) {
        timeline.value = timeline.value.map((t) =>
          t.kind === "message" && t.message!.id === currentAssistantId
            ? { ...t, message: { ...t.message!, isStreaming: false } }
            : t
        );
      }
      error.value = "连接断开，请重试";
    };

    await new Promise((r) => setTimeout(r, 300));

    try {
      const res = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!data.ok) {
        error.value = data.error || "请求失败";
        cleanup();
        isRunning.value = false;
      } else if (data.data?.stopReason === "error" && !currentAssistantId) {
        error.value = "AI 请求失败";
        cleanup();
        isRunning.value = false;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : "网络错误";
      cleanup();
      isRunning.value = false;
    }
  }

  function cleanup() {
    if (eventSource) {
      eventSource.onmessage = null;
      eventSource.close();
      eventSource = null;
    }
  }

  function abort() {
    fetch("/api/abort", { method: "POST" }).catch(() => {});
    cleanup();
    if (currentAssistantId) {
      timeline.value = timeline.value.map((t) =>
        t.kind === "message" && t.message!.id === currentAssistantId
          ? { ...t, message: { ...t.message!, isStreaming: false } }
          : t
      );
    }
    isRunning.value = false;
  }

  function steer(editedText: string) {
    if (timeline.value.length < 2) return;
    let userIdx = -1;
    for (let i = timeline.value.length - 1; i >= 0; i--) {
      const item = timeline.value[i];
      if (item.kind === "message" && item.message?.role === "user") { userIdx = i; break; }
    }
    if (userIdx < 0) return;
    const userItem = timeline.value[userIdx];
    if (userItem.kind === "message" && userItem.message) {
      userItem.message.content = editedText;
    }
    timeline.value = timeline.value.slice(0, userIdx + 1);
    send(editedText);
  }

  // === SSE event handler ===

  function handleEvent(event: any) {
    switch (event.type) {
      case "agent_start":
        isRunning.value = true;
        error.value = null;
        break;

      case "message_start": {
        const msg = event.message;
        if (msg.role === "assistant") {
          currentAssistantId = nextId();
          timeline.value = [...timeline.value, {
            id: currentAssistantId,
            kind: "message",
            message: {
              id: currentAssistantId,
              role: "assistant",
              content: "",
              timestamp: Date.now(),
              isStreaming: true,
            },
            tool: null,
          }];
        }
        break;
      }

      case "message_update": {
        if (!currentAssistantId) return;
        const ae = event.assistantMessageEvent;
        if (ae?.type === "text_delta" && typeof ae.delta === "string") {
          timeline.value = timeline.value.map((t) =>
            t.kind === "message" && t.message!.id === currentAssistantId
              ? { ...t, message: { ...t.message!, content: t.message!.content + ae.delta } }
              : t
          );
        }
        break;
      }

      case "message_end":
        timeline.value = timeline.value.map((t) =>
          t.kind === "message" && t.message!.id === currentAssistantId
            ? { ...t, message: { ...t.message!, isStreaming: false } }
            : t
        );
        break;

      case "agent_end":
        isRunning.value = false;
        cleanup();
        break;

      case "tool_execution_start":
        timeline.value = [...timeline.value, {
          id: event.toolCallId,
          kind: "tool",
          message: null,
          tool: {
            id: event.toolCallId,
            name: event.toolName,
            label: TOOL_LABELS[event.toolName] || event.toolName,
            state: "running",
          },
        }];
        break;

      case "tool_execution_end":
        timeline.value = timeline.value.map((t) =>
          t.kind === "tool" && t.tool!.id === event.toolCallId
            ? { ...t, tool: { ...t.tool!, state: event.isError ? "error" : "done", result: extractToolResult(event.result) } }
            : t,
        );
        break;
    }
  }

  // === session actions ===

  async function createSession() {
    const id = await session.createSession();
    if (id) {
      const msgs = await session.loadSession(id);
      if (msgs) timeline.value = toTimeline(msgs.map((m: any) => ({ ...m, id: nextId() })));
    }
  }

  async function deleteSession(id: string) {
    const nextSid = await session.deleteSession(id);
    if (nextSid) {
      const msgs = await session.loadSession(nextSid);
      if (msgs) timeline.value = toTimeline(msgs.map((m: any) => ({ ...m, id: nextId() })));
    } else {
      timeline.value = [];
    }
  }

  async function switchSession(id: string) {
    const msgs = await session.switchSession(id);
    if (msgs) timeline.value = toTimeline(msgs.map((m: any) => ({ ...m, id: nextId() })));
  }

  function clearError() { error.value = null; }

  return {
    timeline,
    sessions: session.sessions,
    currentSessionId: session.currentSessionId,
    skills: skill.skills,
    isRunning, error,
    send, abort, clearError,
    createSession, deleteSession, switchSession,
    steer, followUp: send,
    toggleSkill: skill.toggleSkill,
    _handleEvent: handleEvent,
  };
}
