import { STATUS_TONE, STATUS_LABEL } from "../../constants/ticketStatus";
import { Status, Priority } from "../../types";

const tones = {
  muted: "bg-[#232323] text-muted-foreground border border-border",
  warning: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
  success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
  danger: "bg-red-500/10 text-red-400 border border-red-500/30",
  info: "bg-violet-500/10 text-violet-400 border border-violet-500/30",
  primary: "bg-[#4f6ef7]/10 text-[#7d94f9] border border-[#4f6ef7]/30",
};

interface BadgeProps {
  tone?: keyof typeof tones;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ tone = "muted", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${tones[tone] || tones.muted} ${className}`}
    >
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge tone={STATUS_TONE[status] as keyof typeof tones || "muted"}>{STATUS_LABEL[status] || status}</Badge>;
}

interface PriorityBadgeProps {
  priority: Priority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const tone: keyof typeof tones =
    priority === "Critical"
      ? "danger"
      : priority === "High"
        ? "warning"
        : priority === "Medium"
          ? "info"
          : "muted";
  return <Badge tone={tone}>{priority}</Badge>;
}
