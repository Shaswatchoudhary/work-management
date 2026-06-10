interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "primary" | "warning" | "success" | "danger" | "info";
}

const TONES = {
  default: { bg: "#F9FAFB", border: "#E5E7EB", label: "#6B7280", value: "#1A1A1A", sub: "#9CA3AF" },
  primary: { bg: "#FFFBEB", border: "#FDE68A", label: "#92400E", value: "#1A1A1A", sub: "#D97706" },
  warning: { bg: "#FFFBEB", border: "#FCD34D", label: "#92400E", value: "#D97706", sub: "#D97706" },
  info:    { bg: "#EFF6FF", border: "#BFDBFE", label: "#1E40AF", value: "#2563EB", sub: "#2563EB" },
  success: { bg: "#F0FDF4", border: "#BBF7D0", label: "#065F46", value: "#16A34A", sub: "#16A34A" },
  danger:  { bg: "#FEF2F2", border: "#FECACA", label: "#991B1B", value: "#DC2626", sub: "#DC2626" },
};

const SUB_LABELS: Record<string, string> = {
  default: "",
  primary: "all time",
  warning: "awaiting",
  info:    "active",
  success: "resolved",
  danger:  "returned",
};

export default function StatCard({ label, value, hint, tone = "primary" }: StatCardProps) {
  const c = TONES[tone];
  return (
    <div style={{
      background: c.bg,
      border: `0.5px solid ${c.border}`,
      borderRadius: "12px",
      padding: "16px 18px",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    }}>
      <div style={{ fontSize: "12px", color: c.label, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: "28px", fontWeight: 700, color: c.value, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: "11px", color: c.sub }}>{hint ?? SUB_LABELS[tone] ?? ""}</div>
    </div>
  );
}