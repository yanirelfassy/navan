import { createGeminiClient, GeminiResponse } from "../llm/gemini";
import { ToolRegistry } from "../tools/registry";
import { SYSTEM_PROMPT } from "./prompts";
import { Message, StreamEvent } from "../types";

const MAX_ITERATIONS = 10;
const MAX_TOOL_RETRIES = 3;

export type EventEmitter = (event: StreamEvent) => void;

export class Orchestrator {
  private gemini: ReturnType<typeof createGeminiClient>;
  private registry: ToolRegistry;
  private conversationHistory: Message[] = [];
  private toolFailureCounts: Map<string, number> = new Map();

  constructor(apiKey: string, registry: ToolRegistry) {
    this.gemini = createGeminiClient(apiKey);
    this.registry = registry;
  }

  async run(userMessage: string, emit: EventEmitter): Promise<void> {
    this.conversationHistory.push({
      role: "user",
      content: userMessage,
    });

    this.toolFailureCounts.clear();

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      let response: GeminiResponse;

      try {
        response = await this.gemini.chat(
          SYSTEM_PROMPT,
          this.conversationHistory,
          this.registry.getAll()
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        emit({ type: "error", message: `LLM error: ${message}` });
        emit({ type: "done" });
        return;
      }

      if (response.type === "tool_call" && response.toolCall) {
        // Emit thought if the model included reasoning text
        if (response.content) {
          emit({ type: "thought", content: response.content });
        }

        const { name, arguments: args } = response.toolCall;
        emit({ type: "tool_call", tool: name, args });

        // Track retries per tool
        const failCount = this.toolFailureCounts.get(name) ?? 0;
        if (failCount >= MAX_TOOL_RETRIES) {
          const skipMessage = `Tool "${name}" has failed ${MAX_TOOL_RETRIES} times. Skipping — please continue without this data.`;
          emit({ type: "tool_result", tool: name, result: { success: false, error: skipMessage } });

          this.conversationHistory.push({
            role: "assistant",
            content: response.content,
            toolCall: { name, arguments: args },
          });
          this.conversationHistory.push({
            role: "tool",
            toolCall: { name, arguments: args },
            toolResult: { success: false, error: skipMessage },
          });
          continue;
        }

        // Execute the tool
        const result = await this.registry.execute(name, args);
        emit({ type: "tool_result", tool: name, result });

        if (!result.success) {
          this.toolFailureCounts.set(name, failCount + 1);
        }

        // Add assistant message (tool call) and tool result to history
        this.conversationHistory.push({
          role: "assistant",
          content: response.content,
          toolCall: { name, arguments: args },
        });
        this.conversationHistory.push({
          role: "tool",
          toolCall: { name, arguments: args },
          toolResult: result,
        });
      } else {
        // Text response — agent is done
        const answer = response.content ?? "";
        emit({ type: "answer", content: answer });

        this.conversationHistory.push({
          role: "assistant",
          content: answer,
        });

        emit({ type: "done" });
        return;
      }
    }

    // Max iterations reached
    emit({
      type: "error",
      message: "Max iterations reached. The agent could not complete the task.",
    });
    emit({ type: "done" });
  }

  getHistory(): Message[] {
    return [...this.conversationHistory];
  }

  clearHistory(): void {
    this.conversationHistory = [];
    this.toolFailureCounts.clear();
  }
}
