import { ParsedBudget } from "../utils/parseItinerary";

interface Props {
  budget: ParsedBudget;
}

const COLORS = [
  "#3B82F6", // blue
  "#F97316", // orange
  "#10B981", // emerald
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#6B7280", // gray
];

const CATEGORY_ICONS: Record<string, string> = {
  accommodation: "🏨",
  food: "🍜",
  activities: "🎭",
  transport: "🚃",
  other: "📦",
};

function getIcon(name: string): string {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(k)) return v;
  }
  return "📦";
}

export function BudgetChart({ budget }: Props) {
  const isWithinBudget = budget.remaining >= 0;

  // Build pie chart segments
  const segments = budget.categories.map((cat, i) => ({
    ...cat,
    color: COLORS[i % COLORS.length],
    icon: getIcon(cat.name),
  }));

  // Calculate SVG arcs
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 52;
  const innerRadius = 34;

  let cumulativePercent = 0;
  const arcs = segments.map((seg) => {
    const startAngle = cumulativePercent * 3.6; // 360 / 100
    cumulativePercent += seg.percentage;
    const endAngle = cumulativePercent * 3.6;
    return { ...seg, startAngle, endAngle };
  });

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
        <span>💰</span> Budget Breakdown
      </h3>

      <div className="flex items-center gap-6">
        {/* Pie chart */}
        <div className="flex-shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {arcs.map((arc, i) => (
              <DonutSegment
                key={i}
                cx={cx}
                cy={cy}
                radius={radius}
                innerRadius={innerRadius}
                startAngle={arc.startAngle}
                endAngle={arc.endAngle}
                color={arc.color}
              />
            ))}
            {/* Center text */}
            <text
              x={cx}
              y={cy - 6}
              textAnchor="middle"
              className="text-[11px] font-bold fill-gray-800"
            >
              {formatNumber(budget.total)}
            </text>
            <text
              x={cx}
              y={cy + 8}
              textAnchor="middle"
              className="text-[9px] fill-gray-400"
            >
              {budget.currency}
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {segments.map((seg) => (
            <div key={seg.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-xs text-gray-600">
                  {seg.icon} {seg.name}
                </span>
              </div>
              <span className="text-xs text-gray-500 font-medium tabular-nums">
                {formatNumber(seg.amount)}{" "}
                <span className="text-gray-400">({seg.percentage}%)</span>
              </span>
            </div>
          ))}

          {/* Remaining */}
          <div className="pt-1.5 mt-1.5 border-t border-gray-100 flex items-center justify-between">
            <span
              className={`text-xs font-medium ${
                isWithinBudget ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {isWithinBudget ? "Remaining" : "Over budget"}
            </span>
            <span
              className={`text-xs font-semibold tabular-nums ${
                isWithinBudget ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {isWithinBudget ? "" : "+"}
              {formatNumber(Math.abs(budget.remaining))} {budget.currency}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** SVG donut segment using arc paths */
function DonutSegment({
  cx,
  cy,
  radius,
  innerRadius,
  startAngle,
  endAngle,
  color,
}: {
  cx: number;
  cy: number;
  radius: number;
  innerRadius: number;
  startAngle: number;
  endAngle: number;
  color: string;
}) {
  // Handle full circle edge case
  if (endAngle - startAngle >= 359.99) {
    return (
      <>
        <circle cx={cx} cy={cy} r={radius} fill={color} />
        <circle cx={cx} cy={cy} r={innerRadius} fill="white" />
      </>
    );
  }

  const startRad = ((startAngle - 90) * Math.PI) / 180;
  const endRad = ((endAngle - 90) * Math.PI) / 180;

  const x1Outer = cx + radius * Math.cos(startRad);
  const y1Outer = cy + radius * Math.sin(startRad);
  const x2Outer = cx + radius * Math.cos(endRad);
  const y2Outer = cy + radius * Math.sin(endRad);

  const x1Inner = cx + innerRadius * Math.cos(endRad);
  const y1Inner = cy + innerRadius * Math.sin(endRad);
  const x2Inner = cx + innerRadius * Math.cos(startRad);
  const y2Inner = cy + innerRadius * Math.sin(startRad);

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  const d = [
    `M ${x1Outer} ${y1Outer}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}`,
    `L ${x1Inner} ${y1Inner}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}`,
    "Z",
  ].join(" ");

  return <path d={d} fill={color} />;
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
