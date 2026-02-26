# API Choices

All APIs are free with **zero API keys required**.

## Tools

| Tool | API | URL | Purpose |
|------|-----|-----|---------|
| Weather | Open-Meteo | https://api.open-meteo.com | Forecast & historical climate data for any location |
| Currency | Frankfurter | https://frankfurter.dev | Currency conversion using ECB rates |
| Wikipedia | Wikipedia API | https://en.wikipedia.org/api/rest_v1 | Destination info, landmarks, attractions |
| Calculator | Built-in (no API) | — | Budget math, cost summation, validation |

## Why These

- **Zero friction:** Anyone can clone the repo and run it immediately
- **Reliable:** All are stable, well-maintained public APIs
- **Sufficient for travel:** Weather + currency provide live data the LLM can't know. Wikipedia provides factual destination info. Calculator validates budget constraints.
- **Agentic RAG angle:** The agent decides when to query Wikipedia vs. rely on its own training knowledge about travel destinations.

## API Details

### Open-Meteo
- No key, no signup, no rate limit for reasonable usage
- Supports forecast (16 days) and historical weather
- Returns temperature, precipitation, wind, etc.
- Example: `GET https://api.open-meteo.com/v1/forecast?latitude=35.68&longitude=139.69&daily=temperature_2m_max`

### Frankfurter
- No key, no signup
- ECB reference rates, ~30 major currencies
- Example: `GET https://api.frankfurter.dev/latest?from=USD&to=JPY&amount=2000`

### Wikipedia REST API
- No key, no signup
- Get page summaries, extracts, related pages
- Example: `GET https://en.wikipedia.org/api/rest_v1/page/summary/Tokyo`

### Calculator
- Pure TypeScript function, no external dependency
- Sums itinerary costs, checks against budget, computes per-day spend
