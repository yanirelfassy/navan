import { useState } from "react";
import { AgentStep } from "../types";

interface Props {
  steps: AgentStep[];
}

export function ReasoningPanel({ steps }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (steps.length === 0) return null;

  const toolCalls = steps.filter((s) => s.type === "tool_call");
  const errors = steps.filter((s) => s.type === "error");

  return (
    <div className="text-xs">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors mb-1"
      >
        <span className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}>
          ▶
        </span>
        <span>
          {toolCalls.length} tool call{toolCalls.length !== 1 ? "s" : ""}
          {errors.length > 0 && ` · ${errors.length} error${errors.length !== 1 ? "s" : ""}`}
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-2 ml-3 border-l-2 border-gray-100 pl-3">
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

  const icon = {
    thought: "💭",
    tool_call: "🔧",
    tool_result: step.result?.success ? "✅" : "❌",
    answer: "💬",
    error: "⚠️",
  }[step.type];

  return (
    <div>
      <div
        className={`flex items-start gap-1.5 ${
          step.type === "tool_call" || step.type === "tool_result"
            ? "cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1"
            : ""
        }`}
        onClick={() => {
          if (step.type === "tool_call" || step.type === "tool_result") {
            setShowDetails(!showDetails);
          }
        }}
      >
        <span>{icon}</span>
        <span className="text-gray-600">{step.content}</span>
      </div>

      {showDetails && step.type === "tool_call" && step.args && (
        <pre className="ml-5 mt-1 p-2 bg-gray-50 rounded text-[10px] text-gray-500 overflow-x-auto">
          {JSON.stringify(step.args, null, 2)}
        </pre>
      )}

      {showDetails && step.type === "tool_result" && step.result?.data && (
        <pre className="ml-5 mt-1 p-2 bg-gray-50 rounded text-[10px] text-gray-500 overflow-x-auto max-h-32 overflow-y-auto">
          {JSON.stringify(step.result.data, null, 2)}
        </pre>
      )}
    </div>
  );
}
