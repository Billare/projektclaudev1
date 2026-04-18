interface Props {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  sub?: string;
}

export default function StatCard({ label, value, icon, sub }: Props) {
  return (
    <div className="bg-sp-card rounded-lg p-5 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-sp-muted uppercase tracking-wider">{label}</span>
        {icon && <span className="text-sp-muted">{icon}</span>}
      </div>
      <span className="text-3xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</span>
      {sub && <span className="text-xs text-sp-muted">{sub}</span>}
    </div>
  );
}
