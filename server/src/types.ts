// ---- Tool Types ----

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute(args: Record<string, unknown>): Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ---- Message Types ----

export interface Message {
  role: "user" | "assistant" | "tool";
  content?: string;
  toolCall?: {
    name: string;
    arguments: Record<string, unknown>;
  };
  toolResult?: ToolResult;
}

// ---- Stream Event Types ----

export type StreamEvent =
  | { type: "thought"; content: string }
  | { type: "tool_call"; tool: string; args: Record<string, unknown> }
  | { type: "tool_result"; tool: string; result: ToolResult }
  | { type: "answer"; content: string }
  | { type: "error"; message: string }
  | { type: "done" };
