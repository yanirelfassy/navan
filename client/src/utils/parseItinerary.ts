import { AgentStep } from "../types";

export interface TripHeader {
  destination: string;
  weather?: {
    avgHighC: number;
    avgLowC: number;
    rainyDays: number;
    totalDaysMeasured: number;
    summary: string;
  };
  currency?: {
    from: string;
    to: string;
    amount: number;
    converted: number;
    rate: number;
  };
}

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  activities: {
    time: string;
    title?: string;
    description: string;
    cost?: string;
    gettingThere?: string;
    notes?: string;
  }[];
}

export interface TravelTip {
  category: string;
  tips: string[];
}

export interface StructuredResponse {
  itinerary: ItineraryDay[];
  travelTips: TravelTip[];
}

export interface BudgetCategory {
  name: string;
  amount: number;
  percentage: number;
}

export interface ParsedBudget {
  categories: BudgetCategory[];
  total: number;
  remaining: number;
  currency: string;
}

/**
 * Extract trip header info from agent tool results
 */
export function extractTripHeader(steps: AgentStep[]): TripHeader | null {
  const weatherResult = steps.find(
    (s) => s.type === "tool_result" && s.tool === "get_weather" && s.result?.success
  );
  const currencyResult = steps.find(
    (s) => s.type === "tool_result" && s.tool === "convert_currency" && s.result?.success
  );

  if (!weatherResult && !currencyResult) return null;

  const weather = weatherResult?.result?.data as TripHeader["weather"];
  const currency = currencyResult?.result?.data as TripHeader["currency"];

  // Extract destination from tool call args or results
  const weatherCall = steps.find(
    (s) => s.type === "tool_call" && s.tool === "get_weather"
  );
  const wikiCall = steps.find(
    (s) => s.type === "tool_call" && s.tool === "search_wikipedia"
  );

  const destination =
    (weatherResult?.result?.data as any)?.location ||
    (weatherCall?.args as any)?.location ||
    (wikiCall?.args as any)?.query ||
    "Your destination";

  return { destination, weather, currency };
}

/**
 * Parse structured JSON response from the LLM.
 * Returns null if the content is not valid JSON (triggers markdown fallback).
 */
export function parseStructuredResponse(content: string): StructuredResponse | null {
  let text = content.trim();

  // Try JSON.parse directly first
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed?.itinerary)) {
      return {
        itinerary: parsed.itinerary,
        travelTips: Array.isArray(parsed.travelTips) ? parsed.travelTips : [],
      };
    }
  } catch {
    // Not raw JSON — try stripping markdown fences / surrounding text
  }

  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  } else {
    // Try to find JSON object boundaries in surrounding text
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      text = text.substring(firstBrace, lastBrace + 1);
    }
  }

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed?.itinerary)) {
      return {
        itinerary: parsed.itinerary,
        travelTips: Array.isArray(parsed.travelTips) ? parsed.travelTips : [],
      };
    }
  } catch {
    // Not valid JSON — fall through to null
  }

  return null;
}

/**
 * Convert a StructuredResponse to readable plain text for the collapsible section.
 */
export function structuredResponseToText(data: StructuredResponse): string {
  const lines: string[] = [];

  for (const day of data.itinerary) {
    lines.push(`Day ${day.dayNumber}: ${day.title}`);
    for (const a of day.activities) {
      const heading = a.title ? `${a.time}: ${a.title}` : a.time;
      lines.push(`  ${heading}`);
      if (a.description) lines.push(`    ${a.description}`);
      if (a.cost) lines.push(`    Cost: ${a.cost}`);
      if (a.gettingThere) lines.push(`    Getting there: ${a.gettingThere}`);
    }
    lines.push("");
  }

  if (data.travelTips.length > 0) {
    lines.push("Travel Tips");
    for (const tip of data.travelTips) {
      lines.push(`  ${tip.category}:`);
      for (const t of tip.tips) {
        lines.push(`    - ${t}`);
      }
    }
  }

  return lines.join("\n");
}

/**
 * Parse day-by-day itinerary from markdown content
 */
export function parseItineraryDays(content: string): ItineraryDay[] {
  const days: ItineraryDay[] = [];

  // Match "Day N:" or "**Day N:" patterns
  const dayPattern = /\*{0,2}Day\s+(\d+)[:\s]*([^\n*]*)\*{0,2}/gi;
  const matches = [...content.matchAll(dayPattern)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const dayNumber = parseInt(match[1]);
    const title = match[2]?.trim() || `Day ${dayNumber}`;

    // Get content between this day header and the next day (or next major section)
    const startIdx = match.index! + match[0].length;
    let endIdx: number;
    if (i < matches.length - 1) {
      endIdx = matches[i + 1].index!;
    } else {
      // For the last day, stop at the next major section heading
      const rest = content.substring(startIdx);
      const sectionBreak = rest.search(
        /\n\s*\*{0,2}(budget\s+summary|travel\s+tips|packing|cultural\s+notes|important|warnings|accommodation|total\s+(estimated\s+)?cost|remaining\s+budget)/i
      );
      endIdx = sectionBreak !== -1 ? startIdx + sectionBreak : content.length;
    }
    const dayContent = content.substring(startIdx, endIdx);

    const activities = parseActivities(dayContent);

    if (activities.length > 0 || title) {
      days.push({ dayNumber, title, activities });
    }
  }

  return days;
}

function parseActivities(dayContent: string): ItineraryDay["activities"] {
  const activities: ItineraryDay["activities"] = [];
  const lines = dayContent.split("\n");

  let currentActivity: ItineraryDay["activities"][0] | null = null;

  for (const line of lines) {
    const raw = line.trimEnd();
    if (!raw.trim()) continue;

    // Determine indent level: top-level bullets vs sub-bullets
    const indent = raw.search(/\S/);
    const stripped = raw.trim();

    // Remove leading bullet markers (* or -)
    const noBullet = stripped.replace(/^[-*]+\s*/, "");
    // Remove all bold markers for pattern matching
    const clean = noBullet.replace(/\*+/g, "").trim();

    // Check for time-of-day header: "Morning: Activity Title" or just "Morning"
    const timeHeader = clean.match(
      /^(morning|afternoon|evening|late\s+evening|night)\s*[:\-–—]\s*(.*)/i
    );
    const timeOnly = !timeHeader && clean.match(
      /^(morning|afternoon|evening|late\s+evening|night)$/i
    );

    if (timeHeader) {
      // Save previous activity
      if (currentActivity) activities.push(currentActivity);

      currentActivity = {
        time: timeHeader[1],
        description: timeHeader[2] || "",
        cost: undefined,
        notes: undefined,
      };
      continue;
    }

    if (timeOnly) {
      if (currentActivity) activities.push(currentActivity);
      currentActivity = {
        time: timeOnly[1],
        description: "",
        cost: undefined,
        notes: undefined,
      };
      continue;
    }

    // Sub-bullet lines: extract cost or attach as description detail
    if (currentActivity && indent >= 2) {
      const costMatch = clean.match(/(?:estimated\s+)?cost\s*[:\-–—]\s*(.*)/i);
      if (costMatch) {
        currentActivity.cost = costMatch[1].trim();
      }
      const gettingThere = clean.match(/getting\s+there\s*[:\-–—]\s*(.*)/i);
      if (gettingThere) {
        currentActivity.notes = gettingThere[1].trim();
      }
      continue;
    }

    // Top-level bullet that isn't a time header — treat as standalone activity
    if (stripped.startsWith("-") || stripped.startsWith("*")) {
      if (clean.length > 10) {
        if (currentActivity) activities.push(currentActivity);
        currentActivity = {
          time: "",
          description: clean,
          cost: undefined,
          notes: undefined,
        };
      }
    }
  }

  // Push the last activity
  if (currentActivity) activities.push(currentActivity);

  return activities;
}

/**
 * Extract budget data directly from calculate_budget tool result (preferred — structured data)
 */
export function extractBudgetFromSteps(steps: AgentStep[]): ParsedBudget | null {
  const budgetResult = steps.find(
    (s) => s.type === "tool_result" && s.tool === "calculate_budget" && s.result?.success
  );
  if (!budgetResult?.result?.data) return null;

  const data = budgetResult.result.data as {
    total: number;
    budget: number;
    remaining: number;
    currency: string;
    categories: { name: string; amount: number; percentage: number }[];
  };

  if (!data.categories?.length) return null;

  return {
    categories: data.categories.map((c) => ({
      name: c.name.charAt(0).toUpperCase() + c.name.slice(1),
      amount: c.amount,
      percentage: c.percentage,
    })),
    total: data.total,
    remaining: data.remaining,
    currency: data.currency,
  };
}

/**
 * Parse budget summary from markdown content (fallback)
 */
export function parseBudget(content: string): ParsedBudget | null {
  const categories: BudgetCategory[] = [];

  // Find budget summary section
  const budgetSection = content.match(/budget\s+summary[\s\S]*?(?=\n##|\n\*\*[A-Z]|\n---|\Z)/i);
  if (!budgetSection) return null;

  const section = budgetSection[0];

  // Parse category lines — match any line with a label, amount, and currency code
  // Examples: "**Accommodation:** 120,000 JPY (71%)", "* Food: 440 EUR", "- Other (Contingency): 100 EUR"
  const lines = section.split("\n");
  for (const line of lines) {
    const catMatch = line.match(
      /[-*]*\s*\*{0,2}([^:*\d][^:*]*?)\*{0,2}\s*[:\s]+([0-9,]+(?:\.\d+)?)\s*([A-Z]{3})/i
    );
    if (catMatch) {
      const name = catMatch[1].trim().replace(/^\(|\)$/g, "");
      // Skip lines that are "Total" or "Remaining"
      if (/^(total|remaining)/i.test(name)) continue;
      categories.push({
        name,
        amount: parseFloat(catMatch[2].replace(/,/g, "")),
        percentage: 0,
      });
    }
  }

  if (categories.length === 0) return null;

  // Parse total and remaining
  const totalMatch = section.match(/total[^:]*[:\s]*([0-9,]+(?:\.\d+)?)\s*([A-Z]{3})/i);
  const remainingMatch = section.match(/remaining[^:]*[:\s]*([0-9,]+(?:\.\d+)?)\s*([A-Z]{3})/i);

  const total = totalMatch
    ? parseFloat(totalMatch[1].replace(/,/g, ""))
    : categories.reduce((sum, c) => sum + c.amount, 0);
  const remaining = remainingMatch
    ? parseFloat(remainingMatch[1].replace(/,/g, ""))
    : 0;

  // Always recalculate percentages from actual amounts
  if (total > 0) {
    for (const cat of categories) {
      cat.percentage = Math.round((cat.amount / total) * 100);
    }
  }

  return { categories, total, remaining, currency: totalMatch?.[2] || "USD" };
}
