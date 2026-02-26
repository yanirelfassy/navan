# Travel Agent — AI-Powered Trip Planner

An agentic AI system that plans trips by reasoning through multi-step tasks, calling real external tools, and self-correcting when things go wrong. Built from scratch — no LangChain, no frameworks.

## Architecture

<img width="820" height="953" alt="image" src="https://github.com/user-attachments/assets/e641335e-3683-4615-9bf7-adaba764d794" />


```
React (Vite)  ←—SSE—→  Express  ←→  ReAct Orchestrator  ←→  Gemini 2.5 Flash
                                          ↕
                                    Tool Registry
                                    ├── Weather (Open-Meteo)
                                    ├── Currency (Frankfurter)
                                    ├── Wikipedia
                                    └── Calculator
```

### How the Agent Works

The agent follows a **ReAct (Reasoning + Acting)** loop, built from scratch:

1. **Think** — The LLM reasons about what data it needs next
2. **Act** — It calls a tool (weather, currency, Wikipedia, or calculator)
3. **Observe** — The tool result is fed back into the conversation
4. **Repeat** until the task is complete (max 10 iterations)

The entire reasoning process is streamed to the frontend in real-time via **Server-Sent Events (SSE)**, so users can see the agent thinking step-by-step.

### Self-Correction

- **Tool errors** → The agent sees the error in its observation and adapts (retries with different params, skips gracefully)
- **Budget overflow** → After planning, the calculator validates costs. If over budget, the agent re-plans with cheaper alternatives
- **Max retries** → If a tool fails 3 times, the orchestrator tells the agent to continue without that data
- **Missing info** → The agent asks clarifying questions instead of guessing

### Tools

| Tool | API | Purpose |
|------|-----|---------|
| Weather | [Open-Meteo](https://open-meteo.com/) | Historical climate data for any location/month |
| Currency | [Frankfurter](https://www.frankfurter.app/) | Live exchange rates (ECB data) |
| Wikipedia | [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/) | Destination facts, landmarks, attractions |
| Calculator | Built-in | Budget validation with category breakdown |

All APIs are **free with zero API keys** (except Gemini for the LLM).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend | Express + TypeScript |
| LLM | Google Gemini 2.5 Flash |
| Streaming | Server-Sent Events (SSE) |
| Testing | Vitest |

## Project Structure

```
├── client/                     # React frontend
│   └── src/
│       ├── components/         # Chat, MessageBubble, ReasoningPanel
│       ├── hooks/              # useAgentStream (SSE client)
│       └── types/
├── server/                     # Express backend
│   └── src/
│       ├── agent/              # Orchestrator (ReAct loop), prompts
│       ├── llm/                # Gemini SDK integration
│       ├── tools/              # Weather, Currency, Wikipedia, Calculator
│       │   └── __tests__/      # Unit tests for all tools
│       └── routes/             # API endpoints
└── planning/                   # Architecture & design docs
```

## Getting Started

### Prerequisites

- Node.js 20+
- A free [Google AI Studio](https://aistudio.google.com/apikey) API key

### Setup

```bash
# Clone the repo
git clone <repo-url>
cd navan

# Install dependencies
cd server && npm install
cd ../client && npm install

# Configure environment
cp .env.example server/.env
# Edit server/.env and add your GEMINI_API_KEY
```

### Run

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Open **http://localhost:5173** in your browser.

### Test

```bash
cd server && npm test
```

## Key Design Decisions

1. **No framework** — The ReAct loop, tool registry, and LLM integration are built from scratch. Every line is intentional and explainable.

2. **Native function calling** — Uses Gemini's structured function calling (not text-based parsing). The LLM returns typed tool calls, our code executes them and feeds results back.

3. **SSE over WebSockets** — The communication is unidirectional (server → client). SSE is simpler, has native browser support, and requires no extra libraries.

4. **Zero-key external APIs** — Weather, currency, and Wikipedia APIs require no signup. Anyone can clone and run the project immediately.

5. **Self-correction by design** — Errors flow back as observations in the conversation. The LLM naturally adapts because it sees the failure in context. Max retry caps prevent infinite loops.
