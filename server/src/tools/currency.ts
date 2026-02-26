import { Tool, ToolResult } from "../types";

export const currencyTool: Tool = {
  name: "convert_currency",
  description:
    "Convert an amount from one currency to another using live exchange rates. Use this to convert the user's budget to the destination's local currency for accurate cost planning.",
  parameters: {
    type: "object",
    properties: {
      amount: {
        type: "number",
        description: "The amount to convert",
      },
      from: {
        type: "string",
        description: 'Source currency code (e.g., "USD", "EUR")',
      },
      to: {
        type: "string",
        description: 'Target currency code (e.g., "JPY", "THB")',
      },
    },
    required: ["amount", "from", "to"],
  },

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const amount = args.amount as number;
    const from = (args.from as string)?.toUpperCase();
    const to = (args.to as string)?.toUpperCase();

    if (!amount || !from || !to) {
      return { success: false, error: "Missing required parameters: amount, from, to" };
    }

    const url = `https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`;

    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: `Currency API error (${res.status}): ${body}` };
    }

    const data = (await res.json()) as any;
    const converted = data.rates?.[to];

    if (converted === undefined) {
      return {
        success: false,
        error: `Could not convert ${from} to ${to}. Available currencies: ${Object.keys(data.rates || {}).join(", ")}`,
      };
    }

    const rate = converted / amount;

    return {
      success: true,
      data: {
        from,
        to,
        amount,
        converted: Math.round(converted * 100) / 100,
        rate: Math.round(rate * 10000) / 10000,
        summary: `${amount} ${from} = ${Math.round(converted * 100) / 100} ${to} (rate: ${Math.round(rate * 10000) / 10000})`,
      },
    };
  },
};
