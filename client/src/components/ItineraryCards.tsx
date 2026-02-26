import { ItineraryDay } from "../utils/parseItinerary";

interface Props {
  days: ItineraryDay[];
}

const TIME_CONFIG: Record<string, { icon: string; color: string }> = {
  morning: { icon: "🌅", color: "bg-amber-50 text-amber-700 border-amber-200" },
  afternoon: { icon: "☀️", color: "bg-sky-50 text-sky-700 border-sky-200" },
  evening: { icon: "🌆", color: "bg-purple-50 text-purple-700 border-purple-200" },
  night: { icon: "🌙", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  "late evening": { icon: "🌙", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
};

export function ItineraryCards({ days }: Props) {
  if (days.length === 0) return null;

  return (
    <div className="space-y-3 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <span>📋</span> Day-by-Day Itinerary
      </h3>
      {days.map((day) => (
        <DayCard key={day.dayNumber} day={day} />
      ))}
    </div>
  );
}

function DayCard({ day }: { day: ItineraryDay }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Day header */}
      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
        <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {day.dayNumber}
        </span>
        <span className="text-sm font-semibold text-gray-800">
          {day.title}
        </span>
      </div>

      {/* Activities */}
      {day.activities.length > 0 && (
        <div className="p-3 space-y-2">
          {day.activities.map((activity, idx) => {
            const timeKey = activity.time.toLowerCase();
            const config = TIME_CONFIG[timeKey] || {
              icon: "📍",
              color: "bg-gray-50 text-gray-700 border-gray-200",
            };

            return (
              <div key={idx} className="flex items-start gap-2.5">
                {activity.time && (
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded border flex-shrink-0 mt-0.5 ${config.color}`}
                  >
                    {config.icon} {activity.time}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  {activity.title && (
                    <p className="text-xs font-semibold text-gray-800 mb-0.5">
                      {activity.title}
                    </p>
                  )}
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {activity.description}
                  </p>
                  {activity.cost && (
                    <span className="text-[10px] text-green-600 font-medium">
                      {activity.cost}
                    </span>
                  )}
                  {activity.gettingThere && (
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      🚃 {activity.gettingThere}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
