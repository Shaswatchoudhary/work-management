interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "primary" | "warning" | "success" | "danger" | "info";
}

export default function StatCard({ label, value, hint, tone = "default" }: StatCardProps) {
  const tones = {
    default: "border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]",
    primary: "border-blue-400/25 shadow-[0_4px_30px_rgba(0,82,204,0.1)]",
    warning: "border-amber-500/25 shadow-[0_4px_30px_rgba(245,158,11,0.1)]",
    success: "border-emerald-500/25 shadow-[0_4px_30px_rgba(34,197,94,0.1)]",
    danger: "border-red-500/25 shadow-[0_4px_30px_rgba(239,68,68,0.1)]",
    info: "border-violet-500/25 shadow-[0_4px_30px_rgba(139,92,246,0.1)]",
  };
  return (
    <div className={`rounded-xl bg-white/[0.04] border ${tones[tone]} backdrop-blur-md p-4 transition-all duration-300 hover:bg-white/[0.07] hover:border-white/15`}>
      <div className="text-xs text-white/60 uppercase tracking-wider font-semibold">{label}</div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</div>
      {hint && <div className="mt-1 text-xs text-white/40">{hint}</div>}
    </div>
  );
}
