import { Tool, ToolResult } from "../types";

export const wikipediaTool: Tool = {
  name: "search_wikipedia",
  description:
    "Search Wikipedia for information about a destination, landmark, attraction, neighborhood, or cultural topic. Call this MULTIPLE times per trip — first for the destination overview, then for 2-3 specific places you want to include (e.g., a famous temple, a historic neighborhood, a landmark). The details you get back will make your itinerary specific and travel-guide quality.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          'The search term (e.g., "Senso-ji Temple", "Barcelona Gothic Quarter")',
      },
    },
    required: ["query"],
  },

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const query = args.query as string;

    if (!query) {
      return { success: false, error: "Missing required parameter: query" };
    }

    // First search for the page
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;

    let res = await fetch(searchUrl);

    // If direct lookup fails, try search API
    if (!res.ok) {
      const searchApiUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json`;
      const searchRes = await fetch(searchApiUrl);

      if (!searchRes.ok) {
        return { success: false, error: `Wikipedia search failed (${searchRes.status})` };
      }

      const searchData = (await searchRes.json()) as any;
      const firstResult = searchData[1]?.[0];

      if (!firstResult) {
        return { success: false, error: `No Wikipedia article found for "${query}"` };
      }

      // Try the summary endpoint with the found title
      res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstResult)}`
      );

      if (!res.ok) {
        return { success: false, error: `Wikipedia article not found for "${firstResult}"` };
      }
    }

    const data = (await res.json()) as any;

    return {
      success: true,
      data: {
        title: data.title,
        extract: data.extract,
        description: data.description || null,
        url: data.content_urls?.desktop?.page || null,
        summary: `${data.title}: ${data.extract?.substring(0, 500)}${(data.extract?.length || 0) > 500 ? "..." : ""}`,
      },
    };
  },
};
