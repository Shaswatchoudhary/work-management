import { useMemo, useState } from "react";
import AppShell from "../../components/layout/AppShell.tsx";
import StatCard from "../../components/ui/StatCard.tsx";
import TicketTable from "../tickets/TicketTable.tsx";
import TicketDetail from "../tickets/TicketDetail.tsx";
import TicketForm from "../tickets/TicketForm.tsx";
import { useTicketStore } from "../../store/ticketStore.ts";
import { CATEGORIES } from "../../data/categories.ts";
import { STATUS } from "../../constants/ticketStatus.ts";
import "./styles/HelpdeskScreen.scss";

export default function HelpdeskScreen() {
  const tickets = useTicketStore((s) => s.tickets);
  const [tab, setTab] = useState("dashboard");
  const [openId, setOpenId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [q, setQ] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const stats = useMemo(() => {
    const total = tickets.length;
    const pending = tickets.filter((t) => ["pending_hr", "pending_admin", "inspection_pending", "payment_pending"].includes(t.status)).length;
    const inProgress = tickets.filter((t) => t.status === "work_in_progress").length;
    const closed = tickets.filter((t) => t.status === "closed").length;
    const rejected = tickets.filter((t) => t.status === "rejected_hr" || t.status === "rejected_admin").length;
    return { total, pending, inProgress, closed, rejected };
  }, [tickets]);

  const filtered = useMemo(() => tickets
    .filter((t) => filterCat ? t.category === filterCat : true)
    .filter((t) => filterStatus ? t.status === filterStatus : true)
    .filter((t) => q ? (t.title + t.id + t.location).toLowerCase().includes(q.toLowerCase()) : true),
    [tickets, q, filterCat, filterStatus]);

  const inspectionQueue = tickets.filter((t) => t.status === "inspection_pending");

  return (
    <AppShell
      role="helpdesk"
      activeTab={tab}
      onTab={setTab}
      tabs={[
        { key: "dashboard", label: "Dashboard" },
        { key: "tickets", label: "My Tickets" },
        { key: "new", label: "New Request" },
        { key: "inspection", label: "Inspection Queue" },
      ]}
    >
      {/* ── DASHBOARD ── */}
      {tab === "dashboard" && (
        <div className="page">
          <PageHeader
            title="Help Desk Dashboard"
            subtitle="Overview of all internal requests"
            action={
              <button className="btnPrimary" onClick={() => setShowForm(true)}>
                + New Request
              </button>
            }
          />
          <div className="stats">
            <StatCard label="Total" value={stats.total} tone="primary" />
            <StatCard label="Pending" value={stats.pending} tone="warning" />
            <StatCard label="In Progress" value={stats.inProgress} tone="info" />
            <StatCard label="Closed" value={stats.closed} tone="success" />
            <StatCard label="Rejected" value={stats.rejected} tone="danger" />
          </div>
          <div className="section">
            <div className="section__label">Recently updated</div>
            <div className="tableCard">
              <TicketTable tickets={tickets.slice(0, 6)} onOpen={setOpenId} />
            </div>
          </div>
        </div>
      )}

      {/* ── MY TICKETS ── */}
      {tab === "tickets" && (
        <div className="page">
          <PageHeader
            title="My Tickets"
            subtitle={`${filtered.length} of ${tickets.length}`}
            action={
              <button className="btnPrimary" onClick={() => setShowForm(true)}>
                + New Request
              </button>
            }
          />
          <div className="filters">
            <input
              className="filterInput"
              placeholder="Search by ID, title, location..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select className="filterSelect" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select className="filterSelect" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All statuses</option>
              {Object.values(STATUS).map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <TicketTable tickets={filtered} onOpen={setOpenId} />
        </div>
      )}

      {/* ── NEW REQUEST ── */}
      {tab === "new" && (
        <div className="page">
          <PageHeader
            title="Submit New Request"
            subtitle="A PDF requirement document is generated on submission."
          />
          <button className="btnPrimary" onClick={() => setShowForm(true)}>
            Open Request Form
          </button>
        </div>
      )}

      {/* ── INSPECTION ── */}
      {tab === "inspection" && (
        <div className="page">
          <PageHeader title="Inspection Queue" subtitle="Verify completed work and mark pass / fail." />
          <TicketTable
            tickets={inspectionQueue}
            onOpen={setOpenId}
            emptyText="No tickets currently awaiting inspection."
          />
        </div>
      )}

      {openId && <TicketDetail ticketId={openId} onClose={() => setOpenId(null)} />}
      <TicketForm open={showForm} onClose={() => setShowForm(false)} />
    </AppShell>
  );
}

// ── PageHeader ──────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="header">
      <div>
        <h2 className="header__title">{title}</h2>
        {subtitle && <p className="header__subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}