export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface AgentError {
  message: string;
  timestamp: number;
}

let _id = 0;
export function nextId(): string {
  return String(++_id);
}
