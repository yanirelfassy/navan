export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export type StreamEvent =
  | { type: "thought"; content: string }
  | { type: "tool_call"; tool: string; args: Record<string, unknown> }
  | { type: "tool_result"; tool: string; result: ToolResult }
  | { type: "answer"; content: string }
  | { type: "error"; message: string }
  | { type: "done" };

export interface AgentStep {
  id: number;
  type: "thought" | "tool_call" | "tool_result" | "answer" | "error";
  content: string;
  tool?: string;
  args?: Record<string, unknown>;
  result?: ToolResult;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: AgentStep[];
  isStreaming?: boolean;
}
