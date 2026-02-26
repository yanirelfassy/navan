import { describe, it, expect } from "vitest";
import { ToolRegistry } from "../registry";
import { Tool } from "../../types";

function createMockTool(name: string, response: unknown): Tool {
  return {
    name,
    description: `Mock tool: ${name}`,
    parameters: { type: "object", properties: {} },
    execute: async () => ({ success: true, data: response }),
  };
}

function createFailingTool(name: string, error: string): Tool {
  return {
    name,
    description: `Failing tool: ${name}`,
    parameters: { type: "object", properties: {} },
    execute: async () => {
      throw new Error(error);
    },
  };
}

describe("ToolRegistry", () => {
  it("registers and retrieves a tool", () => {
    const registry = new ToolRegistry();
    const tool = createMockTool("test_tool", "hello");

    registry.register(tool);

    expect(registry.get("test_tool")).toBe(tool);
    expect(registry.listNames()).toEqual(["test_tool"]);
  });

  it("returns undefined for unknown tool", () => {
    const registry = new ToolRegistry();
    expect(registry.get("nonexistent")).toBeUndefined();
  });

  it("executes a tool successfully", async () => {
    const registry = new ToolRegistry();
    registry.register(createMockTool("greet", { message: "hi" }));

    const result = await registry.execute("greet", {});

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ message: "hi" });
  });

  it("returns error for unknown tool execution", async () => {
    const registry = new ToolRegistry();

    const result = await registry.execute("nonexistent", {});

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unknown tool");
  });

  it("catches tool execution errors", async () => {
    const registry = new ToolRegistry();
    registry.register(createFailingTool("bad_tool", "something broke"));

    const result = await registry.execute("bad_tool", {});

    expect(result.success).toBe(false);
    expect(result.error).toContain("something broke");
  });

  it("lists all registered tools", () => {
    const registry = new ToolRegistry();
    registry.register(createMockTool("a", null));
    registry.register(createMockTool("b", null));
    registry.register(createMockTool("c", null));

    expect(registry.listNames()).toEqual(["a", "b", "c"]);
    expect(registry.getAll()).toHaveLength(3);
  });
});
