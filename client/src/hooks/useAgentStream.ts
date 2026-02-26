import { useState, useCallback, useRef } from "react";
import { ChatMessage, AgentStep, StreamEvent } from "../types";

export function useAgentStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const stepCounterRef = useRef(0);

  const sendMessage = useCallback(async (userMessage: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userMessage,
    };

    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      steps: [],
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);
    stepCounterRef.current = 0;

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event: StreamEvent = JSON.parse(jsonStr);
            handleEvent(event, assistantId);
          } catch {
            // Skip malformed events
          }
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: `Error: ${errorMsg}`, isStreaming: false }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId ? { ...msg, isStreaming: false } : msg
        )
      );
    }
  }, []);

  const handleEvent = useCallback(
    (event: StreamEvent, assistantId: string) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== assistantId) return msg;

          const steps = [...(msg.steps || [])];
          const stepId = stepCounterRef.current++;

          switch (event.type) {
            case "thought":
              steps.push({
                id: stepId,
                type: "thought",
                content: event.content,
                timestamp: Date.now(),
              });
              return { ...msg, steps };

            case "tool_call":
              steps.push({
                id: stepId,
                type: "tool_call",
                content: `Calling ${event.tool}`,
                tool: event.tool,
                args: event.args,
                timestamp: Date.now(),
              });
              return { ...msg, steps };

            case "tool_result":
              steps.push({
                id: stepId,
                type: "tool_result",
                content: event.result.success
                  ? "Tool returned successfully"
                  : `Tool error: ${event.result.error}`,
                tool: event.tool,
                result: event.result,
                timestamp: Date.now(),
              });
              return { ...msg, steps };

            case "answer":
              return { ...msg, content: event.content };

            case "error":
              steps.push({
                id: stepId,
                type: "error",
                content: event.message,
                timestamp: Date.now(),
              });
              return { ...msg, steps };

            case "done":
              return { ...msg, isStreaming: false };

            default:
              return msg;
          }
        })
      );
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clearMessages };
}
