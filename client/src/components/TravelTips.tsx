import { TravelTip } from "../utils/parseItinerary";

interface Props {
  tips: TravelTip[];
}

const CATEGORY_ICONS: Record<string, string> = {
  packing: "🧳",
  cultural: "🎌",
  practical: "💡",
};

export function TravelTips({ tips }: Props) {
  if (tips.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <span>📝</span> Travel Tips
      </h3>
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white divide-y divide-gray-100">
        {tips.map((tip, idx) => {
          const icon =
            CATEGORY_ICONS[tip.category.toLowerCase()] || "📌";
          return (
            <div key={idx} className="px-4 py-3">
              <div className="text-xs font-semibold text-gray-700 mb-1.5">
                {icon} {tip.category}
              </div>
              <ul className="space-y-1">
                {tip.tips.map((t, i) => (
                  <li
                    key={i}
                    className="text-xs text-gray-600 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-gray-400"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
