import { useState } from "react";
import { AgentStep } from "../types";

interface Props {
  steps: AgentStep[];
  isStreaming?: boolean;
}

const TOOL_LABELS: Record<string, string> = {
  get_weather: "Weather Lookup",
  convert_currency: "Currency Conversion",
  search_wikipedia: "Wikipedia Search",
  calculate_budget: "Budget Calculator",
};

export function ReasoningPanel({ steps, isStreaming }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (steps.length === 0) return null;

  const toolCalls = steps.filter((s) => s.type === "tool_call");
  const errors = steps.filter((s) => s.type === "error");
  const thoughts = steps.filter((s) => s.type === "thought");

  return (
    <div className="text-xs">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors py-1"
      >
        <span
          className={`transition-transform text-[10px] ${isExpanded ? "rotate-90" : ""}`}
        >
          ▶
        </span>
        <span className="flex items-center gap-1.5">
          {isStreaming && (
            <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          )}
          {thoughts.length > 0 && `${thoughts.length} thought${thoughts.length !== 1 ? "s" : ""} · `}
          {toolCalls.length} tool call{toolCalls.length !== 1 ? "s" : ""}
          {errors.length > 0 &&
            ` · ${errors.length} error${errors.length !== 1 ? "s" : ""}`}
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-1.5 ml-1 border-l-2 border-gray-200 pl-3 mt-1 mb-2">
          {steps.map((step) => (
            <StepItem key={step.id} step={step} />
          ))}
        </div>
      )}
    </div>
  );
}

function StepItem({ step }: { step: AgentStep }) {
  const [showDetails, setShowDetails] = useState(false);

  const toolLabel = step.tool ? TOOL_LABELS[step.tool] || step.tool : "";

  const config = {
    thought: { icon: "💭", color: "text-gray-500" },
    tool_call: { icon: "🔧", color: "text-blue-600" },
    tool_result: {
      icon: step.result?.success ? "✅" : "❌",
      color: step.result?.success ? "text-green-600" : "text-red-600",
    },
    answer: { icon: "💬", color: "text-gray-700" },
    error: { icon: "⚠️", color: "text-red-600" },
  }[step.type];

  const isClickable = step.type === "tool_call" || step.type === "tool_result";

  return (
    <div>
      <div
        className={`flex items-start gap-1.5 py-0.5 ${
          isClickable
            ? "cursor-pointer hover:bg-gray-50 rounded px-1.5 -mx-1.5"
            : ""
        }`}
        onClick={() => isClickable && setShowDetails(!showDetails)}
      >
        <span className="flex-shrink-0">{config.icon}</span>
        <span className={config.color}>
          {step.type === "tool_call" && (
            <>
              <span className="font-medium">{toolLabel}</span>
              {" — "}
            </>
          )}
          {step.type === "tool_result" && toolLabel && (
            <>
              <span className="font-medium">{toolLabel}</span>
              {" — "}
            </>
          )}
          {step.content}
          {isClickable && (
            <span className="text-gray-400 ml-1">{showDetails ? "▾" : "▸"}</span>
          )}
        </span>
      </div>

      {showDetails && step.type === "tool_call" && step.args && (
        <pre className="ml-6 mt-1 p-2 bg-gray-50 rounded text-[10px] text-gray-500 overflow-x-auto border border-gray-100">
          {JSON.stringify(step.args, null, 2)}
        </pre>
      )}

      {showDetails && step.type === "tool_result" && step.result?.data && (
        <pre className="ml-6 mt-1 p-2 bg-gray-50 rounded text-[10px] text-gray-500 overflow-x-auto max-h-40 overflow-y-auto border border-gray-100">
          {JSON.stringify(step.result.data, null, 2)}
        </pre>
      )}
    </div>
  );
}
