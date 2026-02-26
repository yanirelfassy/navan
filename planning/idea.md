# Travel Planning Agent — Project Idea

## Concept

An AI-powered travel planning agent that takes a user's trip request (destination, dates, budget, preferences) and builds a complete, personalized itinerary through multi-step reasoning.

Unlike a simple chatbot that generates a wall of text, this agent **plans its approach**, **calls real tools** to gather live data, and **self-corrects** when things go wrong (API errors, budget overflows, unavailable options).

## Example Interaction

**User:** "Plan me a 5-day trip to Tokyo in April. Budget is $2,000. I love street food and temples."

**Agent thinks:**
1. First, let me check the weather in Tokyo for April
2. I'll convert the budget to JPY to reason about local costs
3. Let me search for top temple and street food spots
4. I'll build a day-by-day itinerary respecting the budget
5. Let me estimate costs and verify we're within budget

**Agent acts:** Calls weather API, currency API, web search — assembles itinerary.

**Self-correction:** If a search fails or budget overflows, the agent detects it and re-plans (e.g., swaps a paid attraction for a free one, retries with a different query).

## Core Requirements Coverage

### Agentic Logic (ReAct)
- The agent follows a Thought → Action → Observation loop
- It articulates its reasoning at each step before acting
- It builds a plan, executes step-by-step, and adapts

### Tool Use (minimum 2)
| Tool | Purpose |
|------|---------|
| **Weather API** | Get forecast/climate data for the destination & dates |
| **Currency Conversion API** | Convert budget to local currency for cost reasoning |
| **Wikipedia API** | Factual info on destinations, landmarks, attractions |
| **Calculator** | Sum up costs, validate budget constraints |

### Self-Correction
- API returns an error → retry with fallback or skip gracefully
- Budget exceeded after planning → re-plan with cheaper alternatives
- Search returns irrelevant results → rephrase query and retry
- Detect when the agent is unsure and surface that to the user

## Nice-to-Haves Coverage

### Long-Term Memory
- Remember user preferences: dietary restrictions, travel style (adventure vs. relaxation), budget habits
- Recall past trips to avoid recommending the same things
- Store preferred airlines, hotel tiers, etc.

### Agentic RAG
- Load curated travel guides, tip sheets, or user-uploaded documents
- Agent decides: "Do I need to look this up in my knowledge base, or do I already know enough?"
- Example: General knowledge about Tokyo → use training data. Specific visa requirements → query knowledge base.

### Polished UI
- Modern web UI showing the agent's reasoning steps in real-time
- Interactive itinerary view (day-by-day cards)
- Budget breakdown visualization
- Visible thought process (collapsible reasoning panels)

## Demo Scenario

For the demo video, we'll show the agent handling a complex, multi-step request:

> "Plan a 4-day trip to Barcelona for two people. Budget $3,000 total. One of us is vegetarian. We want a mix of culture and beach. Arriving on a Friday."

This showcases:
- Multi-step planning (weather check → budget split → find veggie-friendly spots → culture + beach balance → day-by-day plan)
- Tool usage across all integrated APIs
- Self-correction (e.g., a restaurant doesn't have vegetarian options → find alternative)
- Budget tracking across the full itinerary
