import { Tool, ToolResult } from "../types";

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  async execute(
    name: string,
    args: Record<string, unknown>
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        success: false,
        error: `Unknown tool: "${name}". Available tools: ${this.listNames().join(", ")}`,
      };
    }

    try {
      const result = await tool.execute(args);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `Tool "${name}" failed: ${message}`,
      };
    }
  }

  listNames(): string[] {
    return Array.from(this.tools.keys());
  }
}
