// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAgent } from "../../client/src/composables/useAgent";
import type { ChatMessage } from "../../client/src/types";

// Mock fetch
const mockFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
globalThis.fetch = mockFetch;

function getMessages(agent: ReturnType<typeof useAgent>): ChatMessage[] {
  return agent.timeline.value
    .filter((t) => t.kind === "message" && t.message)
    .map((t) => t.message!);
}

function lastMsg(agent: ReturnType<typeof useAgent>): ChatMessage | undefined {
  const msgs = getMessages(agent);
  return msgs[msgs.length - 1];
}

describe("useAgent._handleEvent", () => {
  let agent: ReturnType<typeof useAgent>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    agent = useAgent();
  });

  afterEach(() => {
    agent.abort();
  });

  describe("agent_start", () => {
    it("应设置 isRunning = true 并清除 error", () => {
      agent.error.value = "旧错误";
      agent._handleEvent({ type: "agent_start" });
      expect(agent.isRunning.value).toBe(true);
      expect(agent.error.value).toBeNull();
    });
  });

  describe("message_start", () => {
    it("应创建空 assistant 消息并标记 isStreaming", () => {
      agent._handleEvent({
        type: "message_start",
        message: { role: "assistant", content: [] },
      });

      const msg = lastMsg(agent);
      expect(msg).toBeDefined();
      expect(msg!.role).toBe("assistant");
      expect(msg!.content).toBe("");
      expect(msg!.isStreaming).toBe(true);
    });

    it("应跳过 user 消息（前端已手动添加）", () => {
      agent._handleEvent({
        type: "message_start",
        message: { role: "user", content: [{ type: "text", text: "hi" }] },
      });

      expect(getMessages(agent).length).toBe(0);
    });
  });

  describe("message_update", () => {
    it("应追加 text_delta 增量到当前 streaming 消息", () => {
      agent._handleEvent({
        type: "message_start",
        message: { role: "assistant", content: [] },
      });
      agent._handleEvent({
        type: "message_update",
        assistantMessageEvent: { type: "text_delta", delta: "你好" },
      });
      agent._handleEvent({
        type: "message_update",
        assistantMessageEvent: { type: "text_delta", delta: "世界" },
      });

      expect(lastMsg(agent)!.content).toBe("你好世界");
    });

    it("非 text_delta 事件应忽略", () => {
      agent._handleEvent({
        type: "message_start",
        message: { role: "assistant", content: [] },
      });
      agent._handleEvent({
        type: "message_update",
        assistantMessageEvent: { type: "thinking_delta", delta: "思考中..." },
      });

      expect(lastMsg(agent)!.content).toBe("");
    });

    it("无当前 assistant 消息时应安全跳过", () => {
      expect(() => {
        agent._handleEvent({
          type: "message_update",
          assistantMessageEvent: { type: "text_delta", delta: "x" },
        });
      }).not.toThrow();
      expect(getMessages(agent).length).toBe(0);
    });
  });

  describe("message_end", () => {
    it("应将 isStreaming 置为 false", () => {
      agent._handleEvent({
        type: "message_start",
        message: { role: "assistant", content: [] },
      });
      agent._handleEvent({ type: "message_end" });

      expect(lastMsg(agent)!.isStreaming).toBe(false);
    });
  });

  describe("agent_end", () => {
    it("应设置 isRunning = false", () => {
      agent.isRunning.value = true;
      agent._handleEvent({ type: "agent_end" });
      expect(agent.isRunning.value).toBe(false);
    });
  });

  describe("完整事件序列", () => {
    it("从 message_start 到 agent_end 的完整流", () => {
      agent._handleEvent({ type: "agent_start" });
      expect(agent.isRunning.value).toBe(true);

      agent._handleEvent({
        type: "message_start",
        message: { role: "assistant", content: [] },
      });
      expect(getMessages(agent).length).toBe(1);

      agent._handleEvent({
        type: "message_update",
        assistantMessageEvent: { type: "text_delta", delta: "Hello" },
      });
      expect(lastMsg(agent)!.content).toBe("Hello");

      agent._handleEvent({ type: "message_end" });
      expect(lastMsg(agent)!.isStreaming).toBe(false);

      agent._handleEvent({ type: "agent_end" });
      expect(agent.isRunning.value).toBe(false);
    });
  });
});

describe("useAgent — 状态操作", () => {
  let agent: ReturnType<typeof useAgent>;

  beforeEach(() => {
    localStorage.clear();
    agent = useAgent();
  });

  afterEach(() => {
    agent.abort();
  });

  it("初始状态应为空", () => {
    expect(agent.timeline.value).toEqual([]);
    expect(agent.isRunning.value).toBe(false);
    expect(agent.error.value).toBeNull();
  });

  it("clearError 应清除错误", () => {
    agent.error.value = "连接断开";
    agent.clearError();
    expect(agent.error.value).toBeNull();
  });

  it("abort 应重置 isRunning", () => {
    agent.isRunning.value = true;
    agent._handleEvent({
      type: "message_start",
      message: { role: "assistant", content: [] },
    });

    agent.abort();

    expect(agent.isRunning.value).toBe(false);
    expect(lastMsg(agent)!.isStreaming).toBe(false);
  });
});
