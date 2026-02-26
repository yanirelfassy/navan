import ReactMarkdown from "react-markdown";
import { ChatMessage } from "../types";
import { ReasoningPanel } from "./ReasoningPanel";
import { TripHeader } from "./TripHeader";
import { ItineraryCards } from "./ItineraryCards";
import { BudgetChart } from "./BudgetChart";
import {
  extractTripHeader,
  parseItineraryDays,
  parseBudget,
} from "../utils/parseItinerary";
import { useMemo } from "react";

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  // Parse structured data from the agent's response
  const tripHeader = useMemo(
    () => (!isUser && message.steps ? extractTripHeader(message.steps) : null),
    [isUser, message.steps]
  );

  const itineraryDays = useMemo(
    () => (!isUser && message.content ? parseItineraryDays(message.content) : []),
    [isUser, message.content]
  );

  const budget = useMemo(
    () => (!isUser && message.content ? parseBudget(message.content) : null),
    [isUser, message.content]
  );

  const hasStructuredContent =
    tripHeader || itineraryDays.length > 0 || budget;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`rounded-2xl ${
          isUser
            ? "bg-blue-600 text-white max-w-xl px-5 py-3"
            : "bg-white border border-gray-200 text-gray-800 max-w-3xl w-full px-5 py-4"
        }`}
      >
        {/* Agent reasoning steps */}
        {!isUser && message.steps && message.steps.length > 0 && (
          <ReasoningPanel
            steps={message.steps}
            isStreaming={message.isStreaming}
          />
        )}

        {/* Structured content for agent responses */}
        {!isUser && hasStructuredContent && message.content && (
          <div className={message.steps?.length ? "mt-3 pt-3 border-t border-gray-100" : ""}>
            {/* Trip header card */}
            {tripHeader && <TripHeader data={tripHeader} />}

            {/* Budget chart */}
            {budget && <BudgetChart budget={budget} />}

            {/* Day-by-day itinerary cards */}
            {itineraryDays.length > 0 && (
              <ItineraryCards days={itineraryDays} />
            )}

            {/* Full markdown response in a collapsible section */}
            <details className="mt-3 group">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors list-none flex items-center gap-1.5">
                <span className="group-open:rotate-90 transition-transform text-[10px]">▶</span>
                View full response
              </summary>
              <div className="mt-2 text-sm prose prose-sm prose-gray max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            </details>
          </div>
        )}

        {/* Plain message content (no structured data, or user messages) */}
        {(!hasStructuredContent || isUser) && message.content && (
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
