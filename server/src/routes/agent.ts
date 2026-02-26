import { Router, Request, Response } from "express";
import { Orchestrator } from "../agent/orchestrator";
import { ToolRegistry } from "../tools/registry";
import { weatherTool } from "../tools/weather";
import { currencyTool } from "../tools/currency";
import { wikipediaTool } from "../tools/wikipedia";
import { calculatorTool } from "../tools/calculator";
import { StreamEvent } from "../types";

const router = Router();

// In-memory session storage: sessionId → Orchestrator
const MAX_SESSIONS = 100;
const sessions: Map<string, Orchestrator> = new Map();

function getOrCreateSession(sessionId: string): Orchestrator {
  let orchestrator = sessions.get(sessionId);
  if (!orchestrator) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    // Evict oldest session if at capacity
    if (sessions.size >= MAX_SESSIONS) {
      const oldestKey = sessions.keys().next().value!;
      sessions.delete(oldestKey);
    }

    const registry = new ToolRegistry();
    registry.register(weatherTool);
    registry.register(currencyTool);
    registry.register(wikipediaTool);
    registry.register(calculatorTool);

    orchestrator = new Orchestrator(apiKey, registry);
    sessions.set(sessionId, orchestrator);
  }
  return orchestrator;
}

// POST /api/agent/chat — sends user message, streams back agent response via SSE
router.post("/chat", async (req: Request, res: Response) => {
  const { message, sessionId = "default" } = req.body;

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "Missing or invalid 'message' field" });
    return;
  }

  // Set up SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const emit = (event: StreamEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    const orchestrator = getOrCreateSession(sessionId);
    await orchestrator.run(message, emit);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    emit({ type: "error", message: errorMessage });
    emit({ type: "done" });
  }

  res.end();
});

// DELETE /api/agent/session/:id — clear a session
router.delete("/session/:id", (req: Request, res: Response) => {
  const id = req.params.id as string;
  const orchestrator = sessions.get(id);
  if (orchestrator) {
    orchestrator.clearHistory();
    sessions.delete(id);
  }
  res.json({ status: "ok" });
});

export default router;
