import { Tool, ToolResult } from "../types";

// Geocoding via Open-Meteo to convert city name → lat/lon
async function geocode(
  city: string
): Promise<{ lat: number; lon: number; name: string } | null> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
  );
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  if (!data.results?.length) return null;
  return {
    lat: data.results[0].latitude,
    lon: data.results[0].longitude,
    name: data.results[0].name,
  };
}

export const weatherTool: Tool = {
  name: "get_weather",
  description:
    "Get weather forecast or typical climate data for a location during a specific month. Use this to check conditions at the travel destination so you can plan appropriate activities and give packing advice.",
  parameters: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: 'City name (e.g., "Tokyo", "Barcelona")',
      },
      month: {
        type: "number",
        description: "Month of travel (1-12), used for seasonal climate data",
      },
    },
    required: ["location", "month"],
  },

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const location = args.location as string;
    const month = args.month as number;

    if (!location || !month) {
      return { success: false, error: "Missing required parameters: location and month" };
    }

    const geo = await geocode(location);
    if (!geo) {
      return { success: false, error: `Could not find location: "${location}"` };
    }

    // Use historical weather data for the given month (previous year)
    const year = new Date().getFullYear() - 1;
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-28`;

    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${geo.lat}&longitude=${geo.lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

    const res = await fetch(url);
    if (!res.ok) {
      return { success: false, error: `Weather API returned status ${res.status}` };
    }

    const data = (await res.json()) as any;
    const daily = data.daily;

    if (!daily?.temperature_2m_max?.length) {
      return { success: false, error: "No weather data available for this period" };
    }

    // Calculate averages
    const avgHigh =
      daily.temperature_2m_max.reduce((a: number, b: number) => a + b, 0) /
      daily.temperature_2m_max.length;
    const avgLow =
      daily.temperature_2m_min.reduce((a: number, b: number) => a + b, 0) /
      daily.temperature_2m_min.length;
    const totalRain = daily.precipitation_sum.reduce(
      (a: number, b: number) => a + b,
      0
    );
    const rainyDays = daily.precipitation_sum.filter(
      (p: number) => p > 1
    ).length;

    return {
      success: true,
      data: {
        location: geo.name,
        month,
        avgHighC: Math.round(avgHigh * 10) / 10,
        avgLowC: Math.round(avgLow * 10) / 10,
        totalRainfallMm: Math.round(totalRain),
        rainyDays,
        totalDaysMeasured: daily.temperature_2m_max.length,
        summary: `${geo.name} in month ${month}: avg high ${Math.round(avgHigh)}°C, avg low ${Math.round(avgLow)}°C, ${rainyDays} rainy days out of ${daily.temperature_2m_max.length}.`,
      },
    };
  },
};
