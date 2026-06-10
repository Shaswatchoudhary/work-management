import { Ticket } from "../../types";

const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
  Low:      { bg: "#F0FDF4", color: "#16A34A" },
  Medium:   { bg: "#FFFBEB", color: "#D97706" },
  High:     { bg: "#FEF2F2", color: "#DC2626" },
  Critical: { bg: "#FDF2F8", color: "#9333EA" },
  Urgent:   { bg: "#FEF2F2", color: "#DC2626" },
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending_hr:          { bg: "#FFFBEB", color: "#D97706" },
  pending_admin:       { bg: "#EFF6FF", color: "#2563EB" },
  rejected_hr:         { bg: "#FEF2F2", color: "#DC2626" },
  rejected_admin:      { bg: "#FEF2F2", color: "#DC2626" },
  work_in_progress:    { bg: "#EFF6FF", color: "#2563EB" },
  inspection_pending:  { bg: "#F5F3FF", color: "#7C3AED" },
  payment_pending:     { bg: "#ECFDF5", color: "#059669" },
  closed:              { bg: "#F0FDF4", color: "#16A34A" },
  draft:               { bg: "#F9FAFB", color: "#6B7280" },
};

interface TicketTableProps {
  tickets: Ticket[];
  onOpen: (id: string) => void;
  emptyText?: string;
}

export default function TicketTable({ tickets, onOpen, emptyText = "No tickets found." }: TicketTableProps) {
  if (tickets.length === 0) {
    return (
      <div style={{
        borderRadius: "10px",
        border: "0.5px solid #EDE9E0",
        background: "#fff",
        padding: "32px",
        textAlign: "center",
        fontSize: "13px",
        color: "#AAA",
      }}>
        {emptyText}
      </div>
    );
  }

  return (
    <div style={{ borderRadius: "10px", border: "0.5px solid #EDE9E0", background: "#fff", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ background: "#FAFAF7", borderBottom: "0.5px solid #EDE9E0" }}>
            {["ID", "Title", "Category", "Priority", "Status", "Updated"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: "11px", fontWeight: 600, color: "#AAA", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickets.map((t, i) => {
            const pColor = PRIORITY_COLORS[t.priority] ?? { bg: "#F9FAFB", color: "#555" };
            const sColor = STATUS_COLORS[t.status]   ?? { bg: "#F9FAFB", color: "#555" };
            return (
              <tr
                key={t.id}
                onClick={() => onOpen(t.id)}
                style={{
                  borderTop: i === 0 ? "none" : "0.5px solid #F5F3EE",
                  cursor: "pointer",
                  transition: "background 0.1s",
                  background: "transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAF7")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "11px 14px", fontWeight: 600, color: "#F59E0B" }}>{t.id}</td>
                <td style={{ padding: "11px 14px", color: "#222", fontWeight: 500 }}>{t.title}</td>
                <td style={{ padding: "11px 14px", color: "#777" }}>{t.category}</td>
                <td style={{ padding: "11px 14px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px", background: pColor.bg, color: pColor.color }}>
                    {t.priority}
                  </span>
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px", background: sColor.bg, color: sColor.color }}>
                    {t.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td style={{ padding: "11px 14px", color: "#AAA", fontSize: "12px" }}>
                  {new Date(t.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}