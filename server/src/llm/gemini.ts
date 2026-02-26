import {
  GoogleGenerativeAI,
  Content,
  Part,
  FunctionDeclaration,
  Tool as GeminiTool,
} from "@google/generative-ai";
import { Tool, Message } from "../types";

export interface GeminiResponse {
  type: "text" | "tool_call";
  content?: string;
  toolCall?: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

export function createGeminiClient(apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey);

  async function chat(
    systemPrompt: string,
    messages: Message[],
    tools: Tool[]
  ): Promise<GeminiResponse> {
    const geminiTools = convertToolsToGeminiFormat(tools);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
      tools: geminiTools.length > 0 ? geminiTools : undefined,
    });

    const contents = convertMessagesToGeminiFormat(messages);

    const result = await model.generateContent({ contents });
    const response = result.response;
    const candidate = response.candidates?.[0];

    if (!candidate) {
      return { type: "text", content: "No response generated." };
    }

    const parts = candidate.content.parts;

    // Check for function call
    const functionCallPart = parts.find((p: Part) => p.functionCall);
    if (functionCallPart?.functionCall) {
      return {
        type: "tool_call",
        content: extractTextFromParts(parts),
        toolCall: {
          name: functionCallPart.functionCall.name,
          arguments: (functionCallPart.functionCall.args as Record<string, unknown>) ?? {},
        },
      };
    }

    // Text-only response
    return {
      type: "text",
      content: extractTextFromParts(parts),
    };
  }

  return { chat };
}

function extractTextFromParts(parts: Part[]): string {
  return parts
    .filter((p) => p.text)
    .map((p) => p.text)
    .join("");
}

function convertMessagesToGeminiFormat(messages: Message[]): Content[] {
  const contents: Content[] = [];

  for (const msg of messages) {
    if (msg.role === "user") {
      contents.push({
        role: "user",
        parts: [{ text: msg.content ?? "" }],
      });
    } else if (msg.role === "assistant") {
      if (msg.toolCall) {
        contents.push({
          role: "model",
          parts: [
            ...(msg.content ? [{ text: msg.content }] : []),
            {
              functionCall: {
                name: msg.toolCall.name,
                args: msg.toolCall.arguments,
              },
            },
          ],
        });
      } else {
        contents.push({
          role: "model",
          parts: [{ text: msg.content ?? "" }],
        });
      }
    } else if (msg.role === "tool") {
      contents.push({
        role: "function" as any,
        parts: [
          {
            functionResponse: {
              name: msg.toolCall?.name ?? "unknown",
              response: {
                result: msg.toolResult?.success
                  ? msg.toolResult.data
                  : { error: msg.toolResult?.error },
              },
            },
          },
        ],
      });
    }
  }

  return contents;
}

function convertToolsToGeminiFormat(tools: Tool[]): GeminiTool[] {
  if (tools.length === 0) return [];

  const functionDeclarations: FunctionDeclaration[] = tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters as any,
  }));

  return [{ functionDeclarations }];
}
