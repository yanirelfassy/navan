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
    description: string;
    cost?: string;
    notes?: string;
  }[];
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

    // Get content between this day header and the next (or end)
    const startIdx = match.index! + match[0].length;
    const endIdx = i < matches.length - 1 ? matches[i + 1].index! : content.length;
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
  const lines = dayContent.split("\n").filter((l) => l.trim());

  let currentTime = "";

  for (const line of lines) {
    const trimmed = line.trim().replace(/^\*+\s*/, "").replace(/\*+$/, "");

    // Detect time of day
    const timeMatch = trimmed.match(/^(morning|afternoon|evening|late\s+evening|night)/i);
    if (timeMatch) {
      currentTime = timeMatch[1];
    }

    // Activity lines usually start with bullet points and contain descriptions
    if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
      const text = trimmed.replace(/^[-*]\s*/, "");

      // Extract cost if present
      const costMatch = text.match(/(?:estimated\s+)?cost[:\s]*([^,\n]+)/i);
      const notesMatch = text.match(/notes?[:\s]*([^,\n]+)/i);

      if (!costMatch && text.length > 10) {
        activities.push({
          time: currentTime || "",
          description: text.replace(/\*+/g, "").trim(),
          cost: costMatch?.[1]?.trim(),
          notes: notesMatch?.[1]?.trim(),
        });
      }
    }
  }

  return activities;
}

/**
 * Parse budget summary from markdown content
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
