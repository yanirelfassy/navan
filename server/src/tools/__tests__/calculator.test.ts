import { describe, it, expect } from "vitest";
import { calculatorTool } from "../calculator";

describe("calculatorTool", () => {
  it("has correct name and required parameters", () => {
    expect(calculatorTool.name).toBe("calculate_budget");
    expect(calculatorTool.parameters).toBeDefined();
  });

  it("returns error for missing parameters", async () => {
    const result = await calculatorTool.execute({});
    expect(result.success).toBe(false);
    expect(result.error).toContain("Missing required parameters");
  });

  it("calculates within budget correctly", async () => {
    const result = await calculatorTool.execute({
      items: [
        { description: "Hotel", category: "accommodation", amount: 500 },
        { description: "Food", category: "food", amount: 200 },
        { description: "Museum", category: "activities", amount: 50 },
      ],
      budget: 1000,
      currency: "USD",
    });

    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data.total).toBe(750);
    expect(data.remaining).toBe(250);
    expect(data.isWithinBudget).toBe(true);
    expect(data.categories).toHaveLength(3);
  });

  it("detects over-budget", async () => {
    const result = await calculatorTool.execute({
      items: [
        { description: "Hotel", category: "accommodation", amount: 800 },
        { description: "Food", category: "food", amount: 300 },
      ],
      budget: 1000,
      currency: "USD",
    });

    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data.total).toBe(1100);
    expect(data.isWithinBudget).toBe(false);
    expect(data.summary).toContain("OVER BUDGET");
  });

  it("groups items by category", async () => {
    const result = await calculatorTool.execute({
      items: [
        { description: "Lunch", category: "food", amount: 20 },
        { description: "Dinner", category: "food", amount: 40 },
        { description: "Taxi", category: "transport", amount: 30 },
      ],
      budget: 500,
      currency: "EUR",
    });

    const data = result.data as any;
    const foodCategory = data.categories.find((c: any) => c.name === "food");
    expect(foodCategory.amount).toBe(60);
  });
});
