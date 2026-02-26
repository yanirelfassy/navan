import ReactMarkdown from "react-markdown";
import { ChatMessage } from "../types";
import { ReasoningPanel } from "./ReasoningPanel";

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`rounded-2xl px-5 py-3 ${
          isUser
            ? "bg-blue-600 text-white max-w-xl"
            : "bg-white border border-gray-200 text-gray-800 max-w-3xl w-full"
        }`}
      >
        {/* Agent reasoning steps */}
        {!isUser && message.steps && message.steps.length > 0 && (
          <ReasoningPanel
            steps={message.steps}
            isStreaming={message.isStreaming}
          />
        )}

        {/* Message content */}
        {message.content && (
          <div
            className={`text-sm ${
              !isUser && message.steps?.length
                ? "mt-3 pt-3 border-t border-gray-100"
                : ""
            }`}
          >
            {isUser ? (
              message.content
            ) : (
              <div className="prose prose-sm prose-gray max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
