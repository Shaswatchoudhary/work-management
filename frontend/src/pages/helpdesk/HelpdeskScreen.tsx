import { useMemo, useState } from "react";
import AppShell from "../../components/layout/AppShell.tsx";
import StatCard from "../../components/ui/StatCard.tsx";
import TicketTable from "../../components/ticket/TicketTable.tsx";
import TicketDetail from "../../components/ticket/TicketDetail.tsx";
import TicketForm from "../../components/ticket/TicketForm.tsx";
import Button from "../../components/ui/CustomButton.tsx";
import { Input, Select } from "../../components/ui/Field.tsx";
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
    const pending = tickets.filter((t) =>
      ["pending_hr", "pending_admin", "inspection_pending", "payment_pending"].includes(t.status),
    ).length;
    const inProgress = tickets.filter((t) => t.status === "work_in_progress").length;
    const closed = tickets.filter((t) => t.status === "closed").length;
    const rejected = tickets.filter(
      (t) => t.status === "rejected_hr" || t.status === "rejected_admin",
    ).length;
    return { total, pending, inProgress, closed, rejected };
  }, [tickets]);

  const filtered = useMemo(() => {
    return tickets
      .filter((t) => (filterCat ? t.category === filterCat : true))
      .filter((t) => (filterStatus ? t.status === filterStatus : true))
      .filter((t) =>
        q ? (t.title + t.id + t.location).toLowerCase().includes(q.toLowerCase()) : true,
      );
  }, [tickets, q, filterCat, filterStatus]);

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
      {tab === "dashboard" && (
        <div className="space-y-6">
          <PageHeader
            title="Help Desk Dashboard"
            subtitle="Overview of all internal requests"
            action={<Button onClick={() => setShowForm(true)}>+ New Request</Button>}
          />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label="Total" value={stats.total} tone="primary" />
            <StatCard label="Pending" value={stats.pending} tone="warning" />
            <StatCard label="In Progress" value={stats.inProgress} tone="info" />
            <StatCard label="Closed" value={stats.closed} tone="success" />
            <StatCard label="Rejected" value={stats.rejected} tone="danger" />
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2">Recently updated</h3>
            <TicketTable tickets={tickets.slice(0, 6)} onOpen={setOpenId} />
          </div>
        </div>
      )}

      {tab === "tickets" && (
        <div className="space-y-4">
          <PageHeader
            title="My Tickets"
            subtitle={`${filtered.length} of ${tickets.length}`}
            action={<Button onClick={() => setShowForm(true)}>+ New Request</Button>}
          />
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search by ID, title, location..."
              value={q}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
              className="max-w-xs"
            />
            <Select
              value={filterCat}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterCat(e.target.value)}
              className="max-w-[180px]"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
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
          <TicketTable tickets={filtered} onOpen={setOpenId} />
        </div>
      )}

      {tab === "new" && (
        <div className="space-y-4">
          <PageHeader
            title="Submit New Request"
            subtitle="A PDF requirement document is generated on submission."
          />
          <Button onClick={() => setShowForm(true)}>Open Request Form</Button>
        </div>
      )}

      {tab === "inspection" && (
        <div className="space-y-4">
          <PageHeader
            title="Inspection Queue"
            subtitle="Verify completed work and mark pass / fail."
          />
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

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
