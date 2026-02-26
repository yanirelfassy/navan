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
        className={`max-w-2xl rounded-lg px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-white border border-gray-200 text-gray-800"
        }`}
      >
        {/* Agent reasoning steps */}
        {!isUser && message.steps && message.steps.length > 0 && (
          <ReasoningPanel steps={message.steps} />
        )}

        {/* Message content */}
        {message.content && (
          <div className={`text-sm whitespace-pre-wrap ${!isUser && message.steps?.length ? "mt-3 pt-3 border-t border-gray-100" : ""}`}>
            {message.content}
          </div>
        )}
      </div>
    </div>
  );
}
