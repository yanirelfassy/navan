import { describe, it, expect } from "vitest";
import { wikipediaTool } from "../wikipedia";

describe("wikipediaTool", () => {
  it("has correct name and required parameters", () => {
    expect(wikipediaTool.name).toBe("search_wikipedia");
    expect(wikipediaTool.parameters).toBeDefined();
  });

  it("returns error for missing query", async () => {
    const result = await wikipediaTool.execute({});
    expect(result.success).toBe(false);
    expect(result.error).toContain("Missing required parameter");
  });

  it("returns info for a known destination", async () => {
    const result = await wikipediaTool.execute({ query: "Tokyo" });
    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data.title).toBeDefined();
    expect(data.extract).toBeDefined();
    expect(data.extract.length).toBeGreaterThan(0);
  }, 10000);

  it("falls back to search for partial names", async () => {
    const result = await wikipediaTool.execute({ query: "Senso-ji Temple" });
    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data.title).toBeDefined();
  }, 10000);
});
