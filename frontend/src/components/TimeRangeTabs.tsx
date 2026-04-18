import type { TimeRange } from "../types";

const TABS: { value: TimeRange; label: string }[] = [
  { value: "short_term", label: "4 Weeks" },
  { value: "medium_term", label: "6 Months" },
  { value: "long_term", label: "All Time" },
];

interface Props {
  value: TimeRange;
  onChange: (v: TimeRange) => void;
}

export default function TimeRangeTabs({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 bg-sp-card rounded-md p-1 w-fit">
      {TABS.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            value === t.value
              ? "bg-white text-black"
              : "text-sp-muted hover:text-white"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
