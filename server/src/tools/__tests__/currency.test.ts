import { describe, it, expect } from "vitest";
import { currencyTool } from "../currency";

describe("currencyTool", () => {
  it("has correct name and required parameters", () => {
    expect(currencyTool.name).toBe("convert_currency");
    expect(currencyTool.parameters).toBeDefined();
  });

  it("returns error for missing parameters", async () => {
    const result = await currencyTool.execute({});
    expect(result.success).toBe(false);
    expect(result.error).toContain("Missing required parameters");
  });

  it("converts USD to JPY", async () => {
    const result = await currencyTool.execute({
      amount: 1000,
      from: "USD",
      to: "JPY",
    });
    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data.from).toBe("USD");
    expect(data.to).toBe("JPY");
    expect(data.converted).toBeGreaterThan(0);
    expect(data.rate).toBeGreaterThan(0);
    expect(data.summary).toContain("USD");
  }, 10000);

  it("converts EUR to USD", async () => {
    const result = await currencyTool.execute({
      amount: 500,
      from: "EUR",
      to: "USD",
    });
    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data.converted).toBeGreaterThan(0);
  }, 10000);
});
