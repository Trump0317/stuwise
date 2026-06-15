// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAgent } from "../../client/src/composables/useAgent";

// Mock fetch
const mockFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
globalThis.fetch = mockFetch;

describe("useAgent._handleEvent", () => {
  let agent: ReturnType<typeof useAgent>;

  beforeEach(() => {
    vi.clearAllMocks();
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
      const prevLength = agent.messages.value.length;
      agent._handleEvent({ type: "message_start" });

      expect(agent.messages.value.length).toBe(prevLength + 1);
      const msg = agent.messages.value[agent.messages.value.length - 1];
      expect(msg.role).toBe("assistant");
      expect(msg.content).toBe("");
      expect(msg.isStreaming).toBe(true);
    });

    it("多次 message_start 应创建多条独立消息", () => {
      agent._handleEvent({ type: "message_start" });
      agent._handleEvent({ type: "message_end" });
      agent._handleEvent({ type: "message_start" });

      expect(agent.messages.value.length).toBe(2);
      expect(agent.messages.value[1].content).toBe("");
      expect(agent.messages.value[1].isStreaming).toBe(true);
    });
  });

  describe("message_update", () => {
    it("应追加 text_delta 增量到当前 streaming 消息", () => {
      agent._handleEvent({ type: "message_start" });
      agent._handleEvent({
        type: "message_update",
        assistantMessageEvent: { type: "text_delta", delta: "你好" },
      });
      agent._handleEvent({
        type: "message_update",
        assistantMessageEvent: { type: "text_delta", delta: "世界" },
      });

      const msg = agent.messages.value[agent.messages.value.length - 1];
      expect(msg.content).toBe("你好世界");
    });

    it("非 text_delta 事件应忽略", () => {
      agent._handleEvent({ type: "message_start" });
      agent._handleEvent({
        type: "message_update",
        assistantMessageEvent: { type: "thinking_delta", delta: "思考中..." },
      });

      const msg = agent.messages.value[agent.messages.value.length - 1];
      expect(msg.content).toBe("");
    });

    it("无当前 assistant 消息时应安全跳过（不会崩溃）", () => {
      expect(() => {
        agent._handleEvent({
          type: "message_update",
          assistantMessageEvent: { type: "text_delta", delta: "x" },
        });
      }).not.toThrow();
      expect(agent.messages.value.length).toBe(0);
    });
  });

  describe("message_end", () => {
    it("应将 isStreaming 置为 false", () => {
      agent._handleEvent({ type: "message_start" });
      agent._handleEvent({ type: "message_end" });

      const msg = agent.messages.value[agent.messages.value.length - 1];
      expect(msg.isStreaming).toBe(false);
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

      agent._handleEvent({ type: "message_start" });
      expect(agent.messages.value.length).toBe(1);

      agent._handleEvent({
        type: "message_update",
        assistantMessageEvent: { type: "text_delta", delta: "Hello" },
      });
      expect(agent.messages.value[0].content).toBe("Hello");

      agent._handleEvent({ type: "message_end" });
      expect(agent.messages.value[0].isStreaming).toBe(false);

      agent._handleEvent({ type: "agent_end" });
      expect(agent.isRunning.value).toBe(false);
    });
  });
});

describe("useAgent — 状态操作", () => {
  let agent: ReturnType<typeof useAgent>;

  beforeEach(() => {
    agent = useAgent();
  });

  afterEach(() => {
    agent.abort();
  });

  it("初始状态应为空", () => {
    expect(agent.messages.value).toEqual([]);
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
    agent._handleEvent({ type: "message_start" });

    agent.abort();

    expect(agent.isRunning.value).toBe(false);
    expect(agent.messages.value[0].isStreaming).toBe(false);
  });
});
