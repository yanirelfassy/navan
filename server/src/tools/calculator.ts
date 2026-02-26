import { Tool, ToolResult } from "../types";

interface BudgetItem {
  description: string;
  category: string;
  amount: number;
}

export const calculatorTool: Tool = {
  name: "calculate_budget",
  description:
    "Calculate and validate trip costs against the user's budget. Use this after planning the itinerary to verify the total cost fits within budget. Pass all planned expenses as items.",
  parameters: {
    type: "object",
    properties: {
      items: {
        type: "array",
        description: "List of expense items",
        items: {
          type: "object",
          properties: {
            description: { type: "string", description: "What the expense is for" },
            category: {
              type: "string",
              description: "Category: accommodation, food, activities, transport, or other",
            },
            amount: { type: "number", description: "Cost amount" },
          },
          required: ["description", "category", "amount"],
        },
      },
      budget: {
        type: "number",
        description: "The user's total budget",
      },
      currency: {
        type: "string",
        description: "The currency code for the amounts",
      },
    },
    required: ["items", "budget", "currency"],
  },

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const items = args.items as BudgetItem[];
    const budget = args.budget as number;
    const currency = args.currency as string;

    if (!items || !budget || !currency) {
      return { success: false, error: "Missing required parameters: items, budget, currency" };
    }

    // Sum by category
    const categoryTotals: Record<string, number> = {};
    let total = 0;

    for (const item of items) {
      const cat = item.category || "other";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + item.amount;
      total += item.amount;
    }

    total = Math.round(total * 100) / 100;
    const remaining = Math.round((budget - total) * 100) / 100;
    const isWithinBudget = total <= budget;

    const categories = Object.entries(categoryTotals).map(([name, amount]) => ({
      name,
      amount: Math.round(amount * 100) / 100,
      percentage: Math.round((amount / total) * 100),
    }));

    return {
      success: true,
      data: {
        total,
        budget,
        remaining,
        currency,
        isWithinBudget,
        categories,
        summary: isWithinBudget
          ? `Total: ${total} ${currency} of ${budget} ${currency} budget. ${remaining} ${currency} remaining.`
          : `OVER BUDGET: Total ${total} ${currency} exceeds budget of ${budget} ${currency} by ${Math.abs(remaining)} ${currency}.`,
      },
    };
  },
};
