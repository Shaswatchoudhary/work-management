import { useMemo, useState } from "react";
import AppShell from "../../components/layout/AppShell.tsx";
import StatCard from "../../components/ui/StatCard.tsx";
import TicketTable from "../tickets/TicketTable.tsx";
import TicketDetail from "../tickets/TicketDetail.tsx";
import Badge from "../../components/ui/CustomBadge.tsx";
import { MOCK_USERS } from "../../data/mockUsers.ts";
import { fmtMoney } from "../../utils/dateFormatter.ts";
import { ROLE_LABEL } from "../../constants/roles.ts";
import { useTickets } from "../tickets/hooks/useTickets.ts";
import "./styles/AdminScreen.scss";

export default function AdminScreen() {
  const { tickets } = useTickets();
  const [tab, setTab] = useState("queue");
  const [openId, setOpenId] = useState<string | null>(null);

  const queues = useMemo(() => {
    return {
      finalApproval: tickets.filter((t) => t.status === "pending_admin"),
      inspection: tickets.filter(
        (t) =>
          t.status === "inspection_pending" &&
          t.inspection?.passed &&
          !t.inspection?.signedByAdmin,
      ),
      payments: tickets.filter((t) => t.status === "payment_pending"),
    };
  }, [tickets]);

  const stats = {
    awaiting: queues.finalApproval.length,
    payments: queues.payments.length,
    pendingPayout: queues.payments.reduce((s, t) => s + (t.estimatedCost || 0), 0),
    closed: tickets.filter((t) => t.status === "closed").length,
  };

  const reports = useMemo(() => {
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthlySpend = tickets
      .filter(
        (t) => t.status === "closed" && t.payment && new Date(t.payment.releasedAt) >= thisMonth,
      )
      .reduce((s, t) => s + (t.payment?.amount || 0), 0);

    const byCategory: Record<string, number> = {};
    tickets.forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
    });

    const open = tickets.filter((t) => t.status !== "closed").length;
    const closed = tickets.filter((t) => t.status === "closed").length;

    return { monthlySpend, byCategory, open, closed };
  }, [tickets]);

  return (
    <AppShell
      role="admin"
      activeTab={tab}
      onTab={setTab}
      tabs={[
        { key: "queue", label: "Final Approval" },
        { key: "inspection", label: "Inspection Co-Sign" },
        { key: "payments", label: "Payments" },
        { key: "reports", label: "Reports" },
        { key: "users", label: "Users" },
      ]}
    >
      {tab === "queue" && (
        <div className="admin-section">
          <Header
            title="Final Approval Queue"
            subtitle="HR-approved tickets awaiting your decision"
          />
          <div className="admin-stat-grid">
            <StatCard label="Awaiting Approval" value={stats.awaiting} tone="warning" />
            <StatCard label="Payment Pending" value={stats.payments} tone="info" />
            <StatCard label="Pending Payout" value={fmtMoney(stats.pendingPayout)} tone="primary" />
            <StatCard label="Closed" value={stats.closed} tone="success" />
          </div>
          <TicketTable
            tickets={queues.finalApproval}
            onOpen={setOpenId}
            emptyText="No tickets awaiting final approval."
          />
        </div>
      )}

      {tab === "inspection" && (
        <div className="admin-section">
          <Header title="Inspection Co-Signature" subtitle="Co-sign with HR to release payment." />
          <TicketTable
            tickets={queues.inspection}
            onOpen={setOpenId}
            emptyText="No inspections awaiting your signature."
          />
        </div>
      )}

      {tab === "payments" && (
        <div className="admin-section">
          <Header title="Payment Release" subtitle="Authorize payment and close tickets." />
          <TicketTable
            tickets={queues.payments}
            onOpen={setOpenId}
            emptyText="No payments pending release."
          />
        </div>
      )}

      {tab === "reports" && (
        <div className="admin-section">
          <Header title="Reports" subtitle="Spend, distribution and ticket health." />
          <div className="admin-report-grid">
            <StatCard
              label="Spend (This Month)"
              value={fmtMoney(reports.monthlySpend)}
              tone="primary"
            />
            <StatCard label="Open Tickets" value={reports.open} tone="warning" />
            <StatCard label="Closed Tickets" value={reports.closed} tone="success" />
          </div>
          <div className="admin-section--sm">
            <h3 className="admin-category-title">Tickets by Category</h3>
            <div className="admin-category-card">
              {Object.entries(reports.byCategory).map(([cat, count]) => {
                const max = Math.max(...Object.values(reports.byCategory));
                const pct = Math.round((count / max) * 100);
                return (
                  <div key={cat} className="admin-category-row">
                    <div className="admin-category-label">{cat}</div>
                    <div className="admin-category-bar-track">
                      <div className="admin-category-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="admin-category-count">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="admin-section">
          <Header title="System Users" subtitle="Internal roles" />
          <div className="admin-users-card">
            <table className="admin-users-table">
              <thead className="admin-users-thead">
                <tr>
                  <th className="admin-users-name">Name</th>
                  <th className="admin-users-email">Email</th>
                  <th className="admin-users-role">Role</th>
                  <th className="admin-users-dept">Department</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_USERS.map((u) => (
                  <tr key={u.id} className="admin-users-row">
                    <td className="admin-users-name-cell">{u.name}</td>
                    <td className="admin-users-email-cell">{u.email}</td>
                    <td className="admin-users-role-cell">
                      <Badge tone="primary">{ROLE_LABEL[u.role]}</Badge>
                    </td>
                    <td className="admin-users-dept-cell">{u.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {openId && <TicketDetail ticketId={openId} onClose={() => setOpenId(null)} />}
    </AppShell>
  );
}

interface HeaderProps {
  title: string;
  subtitle?: string;
}

function Header({ title, subtitle }: HeaderProps) {
  return (
    <div>
      <h2 className="admin-section-title">{title}</h2>
      {subtitle && <p className="admin-section-subtitle">{subtitle}</p>}
    </div>
  );
}
