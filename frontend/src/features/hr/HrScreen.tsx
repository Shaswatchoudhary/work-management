import { useMemo, useState } from "react";
import AppShell from "../../components/layout/AppShell.tsx";
import StatCard from "../../components/ui/StatCard.tsx";
import TicketTable from "../tickets/TicketTable.tsx";
import TicketDetail from "../tickets/TicketDetail.tsx";
import { useTicketStore } from "../../store/ticketStore.ts";
import { STATUS } from "../../constants/ticketStatus.ts";
import "./HrScreen.scss";

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
      (t) => t.hrApprovedAt && new Date(t.hrApprovedAt).toDateString() === new Date().toDateString(),
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
      {/* ── PENDING REVIEW ── */}
      {tab === "queue" && (
        <div className="hr-page">
          <Header title="HR Review Queue" subtitle="First-level approval / rejection" />
          <div className="stats">
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

      {/* ── INSPECTION CO-SIGN ── */}
      {tab === "inspection" && (
        <div className="hr-page">
          <Header title="Inspection Co-Signature" subtitle="Sign off on completed work." />
          <TicketTable
            tickets={inspection}
            onOpen={setOpenId}
            emptyText="No inspections awaiting your signature."
          />
        </div>
      )}

      {/* ── ALL TICKETS ── */}
      {tab === "all" && (
        <div className="hr-page">
          <Header title="All Tickets" />
          <div className="filters">
            <input
              className="filterInput"
              placeholder="Search..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="filterSelect"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              {Object.values(STATUS).map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
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
    <div className="hr-header">
      <h2 className="hr-header__title">{title}</h2>
      {subtitle && <span className="hr-header__subtitle">{subtitle}</span>}
    </div>
  );
}