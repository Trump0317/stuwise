export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  subtype?: "normal" | "thinking" | "tool_call";
  toolName?: string;
  toolStatus?: "running" | "done" | "error";
}

export interface ToolCallStatus {
  id: string;
  name: string;
  label: string;
  state: "running" | "done" | "error";
  result?: string;
}

export interface AgentError {
  message: string;
  timestamp: number;
}

export interface SessionInfo {
  id: string;
  createdAt: string;
  cwd: string;
  messageCount: number;
  name?: string;
  pinned?: boolean;
}

export interface OutputItem {
  name: string;
  path: string;
  type: "image" | "file" | "link";
  time: string;
  size: number;
}

let _id = 0;
export function nextId(): string {
  return String(++_id);
}
