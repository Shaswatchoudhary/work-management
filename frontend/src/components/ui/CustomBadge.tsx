import { STATUS_TONE, STATUS_LABEL } from "../../constants/ticketStatus";
import { Status, Priority } from "../../types";

export type BadgeTone = "muted" | "warning" | "success" | "danger" | "info" | "primary";

const tonesStyle: Record<BadgeTone, React.CSSProperties> = {
  muted: { backgroundColor: "#232323", color: "var(--muted-foreground)", border: "0.5px solid var(--border)" },
  warning: { backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", border: "0.5px solid rgba(245, 158, 11, 0.3)" },
  success: { backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "0.5px solid rgba(16, 185, 129, 0.3)" },
  danger: { backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "0.5px solid rgba(239, 68, 68, 0.3)" },
  info: { backgroundColor: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", border: "0.5px solid rgba(139, 92, 246, 0.3)" },
  primary: { backgroundColor: "rgba(79, 110, 247, 0.1)", color: "#7d94f9", border: "0.5px solid rgba(79, 110, 247, 0.3)" },
};

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function Badge({ tone = "muted", children, className = "", style }: BadgeProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        borderRadius: "6px",
        padding: "2px 8px",
        fontSize: "12px",
        fontWeight: 500,
        ...tonesStyle[tone],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge tone={STATUS_TONE[status] as BadgeTone || "muted"}>{STATUS_LABEL[status] || status}</Badge>;
}

interface PriorityBadgeProps {
  priority: Priority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const tone: BadgeTone =
    priority === "Critical"
      ? "danger"
      : priority === "High"
        ? "warning"
        : priority === "Medium"
          ? "info"
          : "muted";
  return <Badge tone={tone}>{priority}</Badge>;
}
