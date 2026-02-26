# Architecture Document

## High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                 │
│  ┌───────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Chat View  │  │ Itinerary    │  │ Agent Reasoning  │  │
│  │            │  │ Day Cards    │  │ Steps Panel      │  │
│  └───────────┘  └──────────────┘  └──────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ SSE (Server-Sent Events)
                       │ + REST
┌──────────────────────▼──────────────────────────────────┐
│                   Express Backend                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Agent Orchestrator                   │    │
│  │         (ReAct Loop: Think → Act → Observe)      │    │
│  │                                                   │    │
│  │  ┌───────────┐  ┌────────────┐  ┌─────────────┐ │    │
│  │  │ Planner   │  │ Executor   │  │ Evaluator   │ │    │
│  │  │ (Think)   │  │ (Act)      │  │ (Observe)   │ │    │
│  │  └───────────┘  └────────────┘  └─────────────┘ │    │
│  └─────────────────────┬───────────────────────────┘    │
│                        │                                 │
│  ┌─────────────────────▼───────────────────────────┐    │
│  │              Gemini SDK                          │    │
│  │         (Google Generative AI)                   │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │                Tool Registry                      │    │
│  │  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌────────┐ │    │
│  │  │ Weather │ │ Currency │ │ Search │ │ Calc   │ │    │
│  │  └─────────┘ └──────────┘ └────────┘ └────────┘ │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │              Memory Store (optional)              │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

## Project Structure

```
navan/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.tsx              # Main chat interface
│   │   │   ├── MessageBubble.tsx     # User/agent messages
│   │   │   ├── ReasoningPanel.tsx    # Shows agent's thought process
│   │   │   ├── ItineraryView.tsx     # Day-by-day itinerary cards
│   │   │   └── BudgetBreakdown.tsx   # Cost visualization
│   │   ├── hooks/
│   │   │   └── useAgentStream.ts     # SSE hook for streaming agent updates
│   │   ├── types/
│   │   │   └── index.ts             # Shared types
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
├── server/                    # Express backend
│   ├── src/
│   │   ├── agent/
│   │   │   ├── orchestrator.ts       # Main ReAct loop
│   │   │   ├── prompts.ts            # System prompts & templates
│   │   │   └── types.ts             # Agent-specific types
│   │   │
│   │   ├── llm/
│   │   │   └── gemini.ts             # Gemini SDK integration
│   │   │
│   │   ├── tools/
│   │   │   ├── registry.ts           # Tool registry & dispatcher
│   │   │   ├── base.ts              # Base tool interface
│   │   │   ├── weather.ts            # Weather API tool
│   │   │   ├── currency.ts           # Currency conversion tool
│   │   │   ├── search.ts             # Web search tool
│   │   │   └── calculator.ts         # Budget calculator tool
│   │   │
│   │   ├── memory/                   # (nice-to-have)
│   │   │   ├── store.ts              # Memory persistence
│   │   │   └── types.ts
│   │   │
│   │   ├── routes/
│   │   │   └── agent.ts              # API routes
│   │   │
│   │   └── index.ts                  # Express app entry
│   │
│   └── package.json
│
├── planning/                  # Planning docs (this folder)
└── README.md
```

## Core Components

### 1. Agent Orchestrator (ReAct Loop)

The heart of the system. Runs a loop of **Think → Act → Observe** until the task is complete or max iterations are reached.

```
┌─────────────────────────────────────────┐
│            User sends request           │
└──────────────────┬──────────────────────┘
                   ▼
         ┌─────────────────┐
         │   THINK          │ LLM reasons about what to do next.
         │   (Plan step)    │ Outputs: thought + chosen action
         └────────┬────────┘
                  ▼
         ┌─────────────────┐
         │   ACT            │ Execute the chosen tool
         │   (Call tool)    │ or respond to user
         └────────┬────────┘
                  ▼
         ┌─────────────────┐
         │   OBSERVE        │ Read tool result.
         │   (Evaluate)     │ Decide: done? error? continue?
         └────────┬────────┘
                  │
            ┌─────▼─────┐
            │  Done?     │───Yes──→ Return final response
            └─────┬─────┘
                  │ No
                  ▼
            Back to THINK
```

**Key design decisions:**
- Max iterations cap (e.g., 10) to prevent infinite loops
- Each step is streamed to the frontend via SSE so the user sees reasoning in real-time
- The full conversation history (thoughts + observations) is passed to the LLM each iteration

### 2. Gemini Integration

Direct integration with Google's Gemini SDK. No abstraction layer — the orchestrator talks to Gemini directly via a thin wrapper module.

```typescript
// gemini.ts — thin wrapper around the SDK
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initializes the model with our system prompt and tool definitions
// Exposes a simple chat() function the orchestrator calls each iteration
```

The wrapper handles:
- Initializing the model with system prompt + tool declarations
- Sending messages and parsing responses (text or function calls)
- Converting Gemini's response format into something the orchestrator can work with

### 3. Tool System

Tools are self-describing — each tool declares its name, description, and parameters schema. This info is passed to the LLM so it knows what's available.

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: JSONSchema;          // describes expected input
  execute(args: unknown): Promise<ToolResult>;
}

interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}
```

**Tool Registry** collects all tools and handles dispatch:
- Receives a tool name + args from the LLM
- Finds the matching tool
- Executes it
- Returns the result (or error) back to the orchestrator

**Planned tools:**

| Tool | API | Free Tier |
|------|-----|-----------|
| Weather | wttr.in or Open-Meteo | Yes, no key needed |
| Currency | exchangerate-api or frankfurter.app | Yes, no key needed |
| Web Search | SerpAPI free tier or Tavily | Free tier available |
| Calculator | Built-in (no API) | N/A |

### 4. Self-Correction Mechanism

Built into the orchestrator, not a separate module. The logic:

1. **Tool error** → The observation includes the error. The LLM's next THINK step sees it and should choose an alternative (retry with different params, use a different tool, or skip gracefully).

2. **Budget overflow** → After building the itinerary, the agent runs the calculator tool to sum costs. If over budget, the observation says so, and the agent re-plans with cheaper options.

3. **Max retries** → If the same tool fails 3 times, the orchestrator injects a system message telling the agent to move on without that data.

4. **Hallucination guard** → When the agent produces the final itinerary, we can do a validation pass: are all prices numbers? Do dates make sense? If not, send it back for correction.

### 5. Streaming & Communication

**Backend → Frontend:** Server-Sent Events (SSE)

Each event has a type so the frontend knows what to render:

```typescript
type StreamEvent =
  | { type: "thought"; content: string }      // agent's reasoning
  | { type: "tool_call"; tool: string; args: unknown }
  | { type: "tool_result"; tool: string; result: ToolResult }
  | { type: "answer"; content: string }        // final response
  | { type: "itinerary"; data: Itinerary }     // structured itinerary
  | { type: "error"; message: string }
  | { type: "done" }
```

**Why SSE over WebSockets?**
- Simpler (unidirectional is all we need — user sends via POST, agent streams back via SSE)
- Native browser support via `EventSource`
- No extra libraries needed

### 6. Frontend Components

| Component | Purpose |
|-----------|---------|
| **Chat** | Main input + message list |
| **MessageBubble** | Renders user and agent messages |
| **ReasoningPanel** | Collapsible panel showing Thought → Action → Observation steps |
| **ItineraryView** | Day-by-day cards with activities, times, costs |
| **BudgetBreakdown** | Simple bar/breakdown showing spend per category |

## Data Flow (Full Request Lifecycle)

```
1. User types: "Plan 5-day Tokyo trip, $2000, love temples"
2. Frontend POSTs to /api/agent/chat
3. Backend opens SSE stream
4. Orchestrator starts ReAct loop:
   a. THINK → "I need to check Tokyo weather for the travel dates"
      → streams { type: "thought", content: "..." }
   b. ACT → calls weather tool
      → streams { type: "tool_call", tool: "weather", args: {...} }
   c. OBSERVE → weather data received
      → streams { type: "tool_result", ... }
   d. THINK → "Now let me convert $2000 to JPY"
      → streams { type: "thought", content: "..." }
   e. ACT → calls currency tool
      ... continues ...
   f. THINK → "I have all the info, let me build the itinerary"
   g. ACT → produces final itinerary
      → streams { type: "itinerary", data: {...} }
      → streams { type: "answer", content: "Here's your plan!" }
5. Stream closes with { type: "done" }
```

## Tech Stack Summary

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React + Vite + TypeScript | Fast dev, user knows React |
| Styling | Tailwind CSS | Rapid UI, polished look |
| Backend | Express + TypeScript | Simple, familiar, flexible |
| LLM | Gemini (Google AI SDK) | Free tier, native function calling |
| Streaming | SSE | Simple, native browser support |
| APIs | Open-Meteo, Frankfurter, SerpAPI | All have free tiers |
| Memory | JSON file / SQLite (optional) | Simple persistence, no infra |

## Open Questions

- [ ] Exact Gemini model to use (gemini-2.0-flash for speed vs gemini-2.5-pro for quality)?
- [ ] How much UI polish is worth the time investment?
