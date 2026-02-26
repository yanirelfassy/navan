import { useState, useRef, useEffect } from "react";
import { useAgentStream } from "../hooks/useAgentStream";
import { MessageBubble } from "./MessageBubble";

const SUGGESTIONS = [
  {
    label: "Tokyo temples & street food",
    text: "Plan a 5-day trip to Tokyo, $2000 budget. I love temples and street food.",
  },
  {
    label: "Barcelona culture & beach",
    text: "4 days in Barcelona for two, $3000 total. Mix of culture and beach. One of us is vegetarian.",
  },
  {
    label: "Paris weekend getaway",
    text: "Weekend trip to Paris, $800 budget. Must-see landmarks and great bakeries.",
  },
];

export function Chat() {
  const [input, setInput] = useState("");
  const { messages, isLoading, sendMessage, clearMessages } = useAgentStream();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage(trimmed);
  };

  const handleSuggestion = (text: string) => {
    if (isLoading) return;
    sendMessage(text);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🗺️</span>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Travel Agent
            </h1>
            <p className="text-xs text-gray-500">
              AI-powered trip planning with real-time data
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 rounded-md hover:bg-gray-100"
          >
            New chat
          </button>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="text-5xl mb-5">✈️</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Where to next?
              </h2>
              <p className="text-sm text-gray-500 max-w-md mb-8">
                Tell me your destination, budget, and what you enjoy. I'll check
                the weather, convert currencies, research attractions, and build
                a day-by-day itinerary.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => handleSuggestion(s.text)}
                    className="text-sm text-gray-600 bg-white border border-gray-200 rounded-full px-4 py-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isLoading && messages[messages.length - 1]?.role === "assistant" && !messages[messages.length - 1]?.content && (
            <div className="flex items-center gap-2 text-sm text-gray-400 px-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
              Planning your trip...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your dream trip..."
              disabled={isLoading}
              className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
