import { ParsedBudget } from "../utils/parseItinerary";

interface Props {
  budget: ParsedBudget;
}

const CATEGORY_COLORS: Record<string, { bg: string; bar: string }> = {
  accommodation: { bg: "bg-blue-100", bar: "bg-blue-500" },
  food: { bg: "bg-orange-100", bar: "bg-orange-500" },
  activities: { bg: "bg-emerald-100", bar: "bg-emerald-500" },
  transport: { bg: "bg-violet-100", bar: "bg-violet-500" },
  other: { bg: "bg-gray-100", bar: "bg-gray-400" },
};

const CATEGORY_ICONS: Record<string, string> = {
  accommodation: "🏨",
  food: "🍜",
  activities: "🎭",
  transport: "🚃",
  other: "📦",
};

export function BudgetChart({ budget }: Props) {
  const maxAmount = Math.max(...budget.categories.map((c) => c.amount));
  const isWithinBudget = budget.remaining >= 0;

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
        <span>💰</span> Budget Breakdown
      </h3>

      {/* Summary bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-gray-500">
            Total: {formatNumber(budget.total)} {budget.currency}
          </span>
          <span
            className={`font-medium ${
              isWithinBudget ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {isWithinBudget
              ? `${formatNumber(budget.remaining)} ${budget.currency} remaining`
              : `${formatNumber(Math.abs(budget.remaining))} ${budget.currency} over budget`}
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isWithinBudget ? "bg-emerald-500" : "bg-red-500"
            }`}
            style={{
              width: `${Math.min(100, (budget.total / (budget.total + budget.remaining)) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Category bars */}
      <div className="space-y-2.5">
        {budget.categories.map((cat) => {
          const key = cat.name.toLowerCase();
          const colors = CATEGORY_COLORS[key] || CATEGORY_COLORS.other;
          const icon = CATEGORY_ICONS[key] || CATEGORY_ICONS.other;
          const barWidth = maxAmount > 0 ? (cat.amount / maxAmount) * 100 : 0;

          return (
            <div key={cat.name}>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-gray-600 flex items-center gap-1.5">
                  <span>{icon}</span>
                  <span className="capitalize">{cat.name}</span>
                </span>
                <span className="text-gray-500 font-medium">
                  {formatNumber(cat.amount)} {budget.currency}
                  {cat.percentage > 0 && (
                    <span className="text-gray-400 ml-1">
                      ({cat.percentage}%)
                    </span>
                  )}
                </span>
              </div>
              <div className={`h-2 ${colors.bg} rounded-full overflow-hidden`}>
                <div
                  className={`h-full ${colors.bar} rounded-full transition-all`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
