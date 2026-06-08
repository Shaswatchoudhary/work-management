import { useMemo, useState } from "react";
import AppShell from "../../components/layout/AppShell.tsx";
import StatCard from "../../components/ui/StatCard.tsx";
import TicketTable from "../../components/ticket/TicketTable.tsx";
import TicketDetail from "../../components/ticket/TicketDetail.tsx";
import { Input, Select } from "../../components/ui/Field.tsx";
import { useTicketStore } from "../../store/ticketStore.ts";
import { STATUS } from "../../constants/ticketStatus.ts";

export default function HrScreen() {
  const tickets = useTicketStore((s) => s.tickets);
  const [tab, setTab] = useState("queue");
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const pending = tickets.filter((t) => t.status === "pending_hr");
  const inspection = tickets.filter(
    (t) => t.status === "inspection_pending" && t.inspection?.passed && !t.inspection?.signedByHr,
  );
  const all = useMemo(
    () =>
      tickets
        .filter((t) => (filterStatus ? t.status === filterStatus : true))
        .filter((t) => (q ? (t.title + t.id).toLowerCase().includes(q.toLowerCase()) : true)),
    [tickets, q, filterStatus],
  );

  const stats = {
    awaitingReview: pending.length,
    coSign: inspection.length,
    approvedToday: tickets.filter(
      (t) =>
        t.hrApprovedAt && new Date(t.hrApprovedAt).toDateString() === new Date().toDateString(),
    ).length,
    rejected: tickets.filter((t) => t.status === "rejected_hr").length,
  };

  return (
    <AppShell
      role="hr"
      activeTab={tab}
      onTab={setTab}
      tabs={[
        { key: "queue", label: "Pending Review" },
        { key: "inspection", label: "Inspection Co-Sign" },
        { key: "all", label: "All Tickets" },
      ]}
    >
      {tab === "queue" && (
        <div className="space-y-6">
          <Header title="HR Review Queue" subtitle="First-level approval / rejection" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Awaiting Review" value={stats.awaitingReview} tone="warning" />
            <StatCard label="Inspection Co-Sign" value={stats.coSign} tone="info" />
            <StatCard label="Approved Today" value={stats.approvedToday} tone="success" />
            <StatCard label="Rejected (Total)" value={stats.rejected} tone="danger" />
          </div>
          <TicketTable
            tickets={pending}
            onOpen={setOpenId}
            emptyText="No tickets awaiting HR review."
          />
        </div>
      )}

      {tab === "inspection" && (
        <div className="space-y-4">
          <Header title="Inspection Co-Signature" subtitle="Sign off on completed work." />
          <TicketTable
            tickets={inspection}
            onOpen={setOpenId}
            emptyText="No inspections awaiting your signature."
          />
        </div>
      )}

      {tab === "all" && (
        <div className="space-y-4">
          <Header title="All Tickets" />
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search..."
              value={q}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
              className="max-w-xs"
            />
            <Select
              value={filterStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
              className="max-w-[200px]"
            >
              <option value="">All statuses</option>
              {Object.values(STATUS).map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </div>
          <TicketTable tickets={all} onOpen={setOpenId} />
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
