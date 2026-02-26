# Implementation Roadmap

## Working Methodology

### Git Strategy

**Branch model:** Feature branches off `main`

```
main (stable, deployable)
 ├── phase-1/project-setup
 ├── phase-2/agent-core
 ├── phase-3/tools
 ├── phase-4/api-streaming
 ├── phase-5/frontend
 ├── phase-6/polish
 └── phase-7/deliverables
```

**Flow:**
1. Each phase gets its own branch
2. Work in small, focused commits within the branch
3. Merge to `main` when the phase is stable and working
4. Tag each merge with a version (v0.1, v0.2, etc.)

### Commit Style

Conventional commits, short and clear:

```
feat: add gemini LLM adapter
feat: implement ReAct orchestrator loop
feat: add weather tool with Open-Meteo
fix: handle currency API timeout gracefully
refactor: extract tool registry from orchestrator
docs: add architecture section to README
```

### Testing Approach

Pragmatic testing — prove the agent works reliably, not chasing coverage.

**Test tooling:** Vitest (TypeScript native, fast, works with Vite)

**What we test:**

| Layer | Approach | Why |
|-------|----------|-----|
| Tools (weather, currency, wiki, calc) | Unit tests | Isolated functions, clear I/O. If a tool breaks, the agent breaks |
| Tool Registry | Unit tests | Dispatch logic, error handling, unknown tool names |
| Orchestrator | Integration test with mocked LLM | Verify loop runs, respects max iterations, handles errors |
| Gemini integration | Skip | Thin wrapper around Gemini SDK — not worth testing |
| API Routes | Manual (curl) | Fast to verify, low ROI to automate for a demo |
| Frontend | Manual | Visual verification is faster than UI test setup |

**What we skip:** No E2E tests, no LLM output assertions (non-deterministic), no snapshot tests, no Playwright/Cypress.

**Test structure:**
```
server/src/
  tools/__tests__/
    weather.test.ts
    currency.test.ts
    wikipedia.test.ts
    calculator.test.ts
  agent/__tests__/
    orchestrator.test.ts
    registry.test.ts
```

Tests are written during Phase 2 (orchestrator + registry) and Phase 3 (tools).

### Definition of Done (per phase)

- Code compiles with no TypeScript errors
- Core functionality of the phase works end-to-end
- Relevant tests pass
- No hardcoded secrets or keys
- Committed and merged to main

---

## Phases

### Phase 1: Project Setup
**Branch:** `phase-1/project-setup`

**Status: COMPLETE** — merged to `main`

**Tasks:**
- [x] Initialize git repo
- [x] Set up `server/` — Express + TypeScript (tsconfig, package.json, dev script)
- [x] Set up `client/` — React + Vite + TypeScript
- [x] Verify both run independently (`npm run dev` on each)
- [x] Add Tailwind CSS to client
- [x] Create shared types file (`server/src/types.ts`)
- [x] Set up `.gitignore`, `.env.example`

**Merge criteria:** Both client and server start with no errors. Basic "hello world" on each.

---

### Phase 2: Agent Core
**Branch:** `phase-2/agent-core`

This is the hardest and most important phase. Get this right and everything else plugs in.

**Tasks:**
- [ ] Define core types: `Message`, `Tool`, `ToolResult`
- [ ] Implement Gemini integration (chat + function calling via @google/generative-ai SDK)
- [ ] Implement Tool Registry (register tools, dispatch by name, handle errors)
- [ ] Implement the ReAct Orchestrator:
  - Accepts user message + conversation history
  - Runs Think → Act → Observe loop
  - Caps at max iterations (10)
  - Returns stream of events
- [ ] Write the system prompt
- [ ] Test with a dummy/mock tool to verify the loop works end-to-end

**Merge criteria:** Can send a message to the orchestrator, it calls the LLM, the LLM requests a (mock) tool, the tool runs, and the loop completes with a final response. All via terminal/logs — no frontend needed yet.

---

### Phase 3: Tools
**Branch:** `phase-3/tools`

**Tasks:**
- [ ] Implement `get_weather` tool (Open-Meteo API)
- [ ] Implement `convert_currency` tool (Frankfurter API)
- [ ] Implement `search_wikipedia` tool (Wikipedia REST API)
- [ ] Implement `calculate_budget` tool (pure logic)
- [ ] Add error handling to each tool (timeouts, bad responses, fallbacks)
- [ ] Register all tools in the registry
- [ ] Test each tool independently (unit-level)
- [ ] Test full agent loop with real tools — send a travel query, watch it call tools and produce an itinerary

**Merge criteria:** Agent can handle "Plan a 5-day trip to Tokyo, $2000 budget" end-to-end using real APIs. Self-correction works (e.g., simulate a tool failure and verify the agent adapts).

---

### Phase 4: API Routes + SSE Streaming
**Branch:** `phase-4/api-streaming`

**Tasks:**
- [ ] Create `/api/agent/chat` POST endpoint
- [ ] Implement SSE streaming from orchestrator to client
- [ ] Define stream event types (thought, tool_call, tool_result, answer, itinerary, error, done)
- [ ] Handle request validation (reject if missing destination/dates/budget or let agent ask)
- [ ] Add conversation session management (in-memory for now)
- [ ] Test with curl or Postman — verify events stream correctly

**Merge criteria:** Can POST a travel query and receive a stream of typed events that show the full agent reasoning + final itinerary.

---

### Phase 5: Frontend
**Branch:** `phase-5/frontend`

**Tasks:**
- [ ] Build `useAgentStream` hook (connects to SSE, parses events)
- [ ] Build Chat component (input + message list)
- [ ] Build MessageBubble component (user vs agent styling)
- [ ] Build ReasoningPanel (collapsible, shows Thought → Tool Call → Result steps)
- [ ] Build ItineraryView (day-by-day cards)
- [ ] Build BudgetBreakdown (simple category breakdown)
- [ ] Connect everything — full flow from user input to rendered itinerary
- [ ] Responsive layout

**Merge criteria:** Full working app. User types a query, sees the agent thinking in real-time, gets an itinerary displayed as cards with a budget summary.

---

### Phase 6: Polish + Nice-to-Haves
**Branch:** `phase-6/polish`

Pick from these based on remaining time (ordered by impact):

- [ ] **UI polish** — animations, loading states, better typography, dark mode
- [ ] **Long-term memory** — save user preferences to JSON/localStorage, load on next session
- [ ] **Agentic RAG** — agent decides when to use Wikipedia vs. its own knowledge (may already work naturally from the prompt)
- [ ] **Error states** — graceful handling of network errors, empty responses
- [ ] **Conversation history** — allow follow-up questions ("change day 3 to beach instead")
- [ ] **README** — architecture explanation, setup instructions, screenshots

**Merge criteria:** App looks professional, handles edge cases, README is complete.

---

### Phase 7: Demo + Deliverables
**Branch:** `phase-7/deliverables`

- [ ] Record demo video showing a complex multi-step query
- [ ] Verify repo is clean (no secrets, no dead code, .env.example present)
- [ ] Final README review
- [ ] Push to GitHub

---

## Phase Order & Dependencies

```
Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5 ──→ Phase 6 ──→ Phase 7
Setup       Agent Core   Tools       API+SSE     Frontend    Polish      Ship
                                        │
                                        └── can test backend independently here
```

Phases are sequential — each builds on the previous. The critical path is Phases 1-5 (working app). Phases 6-7 are enhancement and delivery.

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Gemini function calling quirks | Test early in Phase 2. If problematic, fall back to text-based ReAct parsing |
| Free API downtime during demo | Add mock/fallback data for demo safety |
| UI takes too long | Keep it simple — Tailwind defaults look good. Polish only in Phase 6 |
| Agent loops infinitely | Max iteration cap (10). Tested in Phase 2 |
| Scope creep on nice-to-haves | Phase 6 is explicitly "pick what fits". Core is done after Phase 5 |
