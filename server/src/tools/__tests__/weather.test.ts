import { describe, it, expect } from "vitest";
import { weatherTool } from "../weather";

describe("weatherTool", () => {
  it("has correct name and required parameters", () => {
    expect(weatherTool.name).toBe("get_weather");
    expect(weatherTool.parameters).toBeDefined();
  });

  it("returns error for missing parameters", async () => {
    const result = await weatherTool.execute({});
    expect(result.success).toBe(false);
    expect(result.error).toContain("Missing required parameters");
  });

  it("returns error for unknown location", async () => {
    const result = await weatherTool.execute({
      location: "xyznonexistentcity123",
      month: 4,
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Could not find location");
  });

  it("returns weather data for a valid location and month", async () => {
    const result = await weatherTool.execute({ location: "Tokyo", month: 4 });
    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data.location).toBeDefined();
    expect(data.avgHighC).toBeTypeOf("number");
    expect(data.avgLowC).toBeTypeOf("number");
    expect(data.rainyDays).toBeTypeOf("number");
    expect(data.summary).toContain("month 4");
  }, 10000);
});
