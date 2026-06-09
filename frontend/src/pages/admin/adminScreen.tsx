import { useMemo, useState } from "react";
import AppShell from "../../components/layout/AppShell.tsx";
import StatCard from "../../components/ui/StatCard.tsx";
import TicketTable from "../../components/ticket/TicketTable.tsx";
import TicketDetail from "../../components/ticket/TicketDetail.tsx";
import Badge from "../../components/ui/CustomBadge.tsx";
import { useTicketStore } from "../../store/ticketStore.ts";
import { MOCK_USERS } from "../../data/mockUsers.ts";
import { fmtMoney } from "../../utils/dateFormatter.ts";
import { ROLE_LABEL } from "../../constants/roles.ts";

export default function AdminScreen() {
  const tickets = useTicketStore((s) => s.tickets);
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
        <div className="space-y-6">
          <Header
            title="Final Approval Queue"
            subtitle="HR-approved tickets awaiting your decision"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
        <div className="space-y-4">
          <Header title="Inspection Co-Signature" subtitle="Co-sign with HR to release payment." />
          <TicketTable
            tickets={queues.inspection}
            onOpen={setOpenId}
            emptyText="No inspections awaiting your signature."
          />
        </div>
      )}

      {tab === "payments" && (
        <div className="space-y-4">
          <Header title="Payment Release" subtitle="Authorize payment and close tickets." />
          <TicketTable
            tickets={queues.payments}
            onOpen={setOpenId}
            emptyText="No payments pending release."
          />
        </div>
      )}

      {tab === "reports" && (
        <div className="space-y-6">
          <Header title="Reports" subtitle="Spend, distribution and ticket health." />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard
              label="Spend (This Month)"
              value={fmtMoney(reports.monthlySpend)}
              tone="primary"
            />
            <StatCard label="Open Tickets" value={reports.open} tone="warning" />
            <StatCard label="Closed Tickets" value={reports.closed} tone="success" />
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2">Tickets by Category</h3>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-md divide-y divide-white/5 shadow-md">
              {Object.entries(reports.byCategory).map(([cat, count]) => {
                const max = Math.max(...Object.values(reports.byCategory));
                const pct = Math.round((count / max) * 100);
                return (
                  <div key={cat} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-40 text-sm text-white/90">{cat}</div>
                    <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-[#0066ff]" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-10 text-right text-sm font-semibold text-white">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="space-y-4">
          <Header title="System Users" subtitle="Internal roles" />
          <div className="rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-md overflow-hidden shadow-lg">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.06] text-xs uppercase tracking-wider text-white/60 border-b border-white/10">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-white/70">Name</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-white/70">Email</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-white/70">Role</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-white/70">Department</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_USERS.map((u) => (
                  <tr key={u.id} className="border-t border-white/5 hover:bg-white/[0.05] transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">{u.name}</td>
                    <td className="px-4 py-3 text-white/60">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge tone="primary">{ROLE_LABEL[u.role]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-white/60">{u.department}</td>
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
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}
