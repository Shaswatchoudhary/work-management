import { useMemo, useState } from "react";
import AppShell from "../../components/layout/AppShell.tsx";
import StatCard from "../../components/ui/StatCard.tsx";
import TicketTable from "../tickets/TicketTable.tsx";
import TicketDetail from "../tickets/TicketDetail.tsx";
import TicketForm from "../tickets/TicketForm.tsx";
import { useTicketStore } from "../../store/ticketStore.ts";
import { CATEGORIES } from "../../data/categories.ts";
import { STATUS } from "../../constants/ticketStatus.ts";

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
      {/* DASHBOARD */}
      {tab === "dashboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <PageHeader
            title="Help Desk Dashboard"
            subtitle="Overview of all internal requests"
            action={
              <button
                onClick={() => setShowForm(true)}
                style={{ height: "36px", padding: "0 16px", background: "#F59E0B", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
              >
                + New Request
              </button>
            }
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
            <StatCard label="Total" value={stats.total} tone="primary" />
            <StatCard label="Pending" value={stats.pending} tone="warning" />
            <StatCard label="In Progress" value={stats.inProgress} tone="info" />
            <StatCard label="Closed" value={stats.closed} tone="success" />
            <StatCard label="Rejected" value={stats.rejected} tone="danger" />
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#333", marginBottom: "10px" }}>Recently updated</div>
            {/* ✅ White card wrapper — green background AppShell se aa rha tha, ab card mein hai */}
            <div style={{ background: "#fff", borderRadius: "12px", border: "0.5px solid #EDE9E0", overflow: "hidden" }}>
              <TicketTable tickets={tickets.slice(0, 6)} onOpen={setOpenId} />
            </div>
          </div>
        </div>
      )}

      {/* MY TICKETS */}
      {tab === "tickets" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <PageHeader
            title="My Tickets"
            subtitle={`${filtered.length} of ${tickets.length}`} // filtered length of tickets from search 
            action={ // button to create new request
              <button onClick={() => setShowForm(true)} style={{ height: "36px", padding: "0 16px", background: "#F59E0B", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
                + New Request
              </button>
            }
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <input
              placeholder="Search by ID, title, location..."
              value={q} // search query
              onChange={(e) => setQ(e.target.value)} // update search query
              style={{ height: "36px", padding: "0 12px", border: "0.5px solid #EDE9E0", borderRadius: "8px", fontSize: "13px", background: "#fff", color: "#333", outline: "none", minWidth: "220px" }}
            />
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ height: "36px", padding: "0 10px", border: "0.5px solid #EDE9E0", borderRadius: "8px", fontSize: "13px", background: "#fff", color: "#555", outline: "none" }}>
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ height: "36px", padding: "0 10px", border: "0.5px solid #EDE9E0", borderRadius: "8px", fontSize: "13px", background: "#fff", color: "#555", outline: "none" }}>
              <option value="">All statuses</option>
              {Object.values(STATUS).map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <TicketTable tickets={filtered} onOpen={setOpenId} />
        </div>
      )}

      {/* NEW REQUEST */}
      {tab === "new" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <PageHeader title="Submit New Request" subtitle="A PDF requirement document is generated on submission." />
          <button onClick={() => setShowForm(true)} style={{ alignSelf: "flex-start", height: "36px", padding: "0 16px", background: "#F59E0B", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
            Open Request Form
          </button>
        </div>
      )}

      {/* INSPECTION */}
      {tab === "inspection" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <PageHeader title="Inspection Queue" subtitle="Verify completed work and mark pass / fail." />
          <TicketTable tickets={inspectionQueue} onOpen={setOpenId} emptyText="No tickets currently awaiting inspection." />
        </div>
      )}

      {openId && <TicketDetail ticketId={openId} onClose={() => setOpenId(null)} />}
      <TicketForm open={showForm} onClose={() => setShowForm(false)} />
    </AppShell>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1A1A1A", margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: "13px", color: "#AAA", margin: "2px 0 0" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}