import { Ticket } from "../../types";
import "./TicketTable.scss";

const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
  Low: { bg: "#F0FDF4", color: "#16A34A" },
  Medium: { bg: "#FFFBEB", color: "#D97706" },
  High: { bg: "#FEF2F2", color: "#DC2626" },
  Critical: { bg: "#FDF2F8", color: "#9333EA" },
  Urgent: { bg: "#FEF2F2", color: "#DC2626" },
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending_hr: { bg: "#FFFBEB", color: "#D97706" },
  pending_admin: { bg: "#EFF6FF", color: "#2563EB" },
  rejected_hr: { bg: "#FEF2F2", color: "#DC2626" },
  rejected_admin: { bg: "#FEF2F2", color: "#DC2626" },
  work_in_progress: { bg: "#EFF6FF", color: "#2563EB" },
  inspection_pending: { bg: "#F5F3FF", color: "#7C3AED" },
  payment_pending: { bg: "#ECFDF5", color: "#059669" },
  closed: { bg: "#F0FDF4", color: "#16A34A" },
  draft: { bg: "#F9FAFB", color: "#6B7280" },
};

interface TicketTableProps {
  tickets: Ticket[];
  onOpen: (id: string) => void;
  emptyText?: string;
}

export default function TicketTable({ tickets, onOpen, emptyText = "No tickets found." }: TicketTableProps) {
  if (tickets.length === 0) {
    return (
      <div className="ticket-empty-state">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="ticket-table-wrapper">
      <table className="ticket-list-table">
        <thead>
          <tr>
            {["ID", "Title", "Category", "Priority", "Status", "Updated"].map((h) => (
              <th key={h}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => {
            const pColor = PRIORITY_COLORS[t.priority] ?? { bg: "#F9FAFB", color: "#555" };
            const sColor = STATUS_COLORS[t.status] ?? { bg: "#F9FAFB", color: "#555" };
            return (
              <tr
                key={t.id}
                onClick={() => onOpen(t.id)}
              >
                <td className="ticket-id">{t.id}</td>
                <td className="ticket-title">{t.title}</td>
                <td className="ticket-category">{t.category}</td>
                <td>
                  <span
                    className="badge"
                    style={{ background: pColor.bg, color: pColor.color }}
                  >
                    {t.priority}
                  </span>
                </td>
                <td>
                  <span
                    className="badge"
                    style={{ background: sColor.bg, color: sColor.color }}
                  >
                    {t.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="ticket-updated">
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