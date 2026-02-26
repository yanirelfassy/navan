import { TripHeader as TripHeaderData } from "../utils/parseItinerary";

interface Props {
  data: TripHeaderData;
}

export function TripHeader({ data }: Props) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white mb-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-blue-200 text-xs font-medium uppercase tracking-wide mb-1">
            Your Trip To
          </p>
          <h2 className="text-2xl font-bold">{data.destination}</h2>
        </div>
        <span className="text-3xl">✈️</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        {/* Weather card */}
        {data.weather && (
          <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span>🌤️</span>
              <span className="text-xs font-medium text-blue-100">Weather</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold">
                {data.weather.avgHighC}°
              </span>
              <span className="text-blue-200 text-sm">
                / {data.weather.avgLowC}°C
              </span>
            </div>
            <p className="text-blue-200 text-xs mt-1">
              {data.weather.rainyDays} rainy days of{" "}
              {data.weather.totalDaysMeasured}
            </p>
          </div>
        )}

        {/* Currency card */}
        {data.currency && (
          <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span>💱</span>
              <span className="text-xs font-medium text-blue-100">
                Exchange Rate
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold">
                {formatNumber(data.currency.converted)}
              </span>
              <span className="text-blue-200 text-sm">
                {data.currency.to}
              </span>
            </div>
            <p className="text-blue-200 text-xs mt-1">
              {data.currency.amount} {data.currency.from} · Rate:{" "}
              {data.currency.rate}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
