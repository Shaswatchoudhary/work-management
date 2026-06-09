import { Ticket } from "../../types";

interface TicketTableProps {
  tickets: Ticket[];
  onOpen: (id: string) => void;
  emptyText?: string;
}

export default function TicketTable({ tickets, onOpen, emptyText = "No tickets found." }: TicketTableProps) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-md p-8 text-center text-sm text-white/55">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-md overflow-hidden shadow-lg">
      <table className="w-full text-sm">
        <thead className="bg-white/[0.06] text-xs uppercase tracking-wider text-white/60 border-b border-white/10">
          <tr>
            <th className="text-left px-4 py-2.5 font-semibold text-white/70">ID</th>
            <th className="text-left px-4 py-2.5 font-semibold text-white/70">Title</th>
            <th className="text-left px-4 py-2.5 font-semibold text-white/70">Category</th>
            <th className="text-left px-4 py-2.5 font-semibold text-white/70">Priority</th>
            <th className="text-left px-4 py-2.5 font-semibold text-white/70">Status</th>
            <th className="text-left px-4 py-2.5 font-semibold text-white/70">Updated</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr
              key={t.id}
              className="border-t border-white/5 hover:bg-white/[0.08] cursor-pointer transition-colors text-white"
              onClick={() => onOpen(t.id)}
            >
              <td className="px-4 py-3 font-semibold text-white">{t.id}</td>
              <td className="px-4 py-3 font-medium">{t.title}</td>
              <td className="px-4 py-3 text-white/60">{t.category}</td>
              <td className="px-4 py-3 text-white/85">{t.priority}</td>
              <td className="px-4 py-3">
                <span className="text-xs rounded-md px-2 py-0.5 bg-white/[0.08] border border-white/10 text-white/90">
                  {t.status.replace(/_/g, " ")}
                </span>
              </td>
              <td className="px-4 py-3 text-white/50 text-xs">
                {new Date(t.updatedAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
