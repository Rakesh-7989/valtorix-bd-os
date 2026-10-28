"use client";

type MetricsCardProps = {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
};

export function MetricsCard({
  label,
  value,
  change,
  changeType = "neutral",
}: MetricsCardProps) {
  const changeStyles = {
    positive: "text-emerald-600 bg-emerald-50",
    negative: "text-rose-600 bg-rose-50",
    neutral: "text-zinc-500 bg-zinc-50",
  };

  const changeIcon = {
    positive: "↑",
    negative: "↓",
    neutral: "•",
  }[changeType];

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5">
      <p className="text-sm text-zinc-500 mb-2">{label}</p>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-zinc-900">{value}</span>
        {change && (
          <span className={`text-sm font-medium ${changeStyles[changeType]}`}>
            {changeIcon} {change}
          </span>
        )}
      </div>
      <div className="h-px bg-zinc-100"></div>
    </div>
  );
}
