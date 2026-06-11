import { fmtDate, fmtMoney } from "../../utils/dateFormatter.ts";
import { STATUS_LABEL } from "../../constants/ticketStatus.ts";
import { Ticket, SignatureBlock } from "../../types";

interface RequirementDocProps {
  ticket: Ticket;
}

export default function RequirementDoc({ ticket }: RequirementDocProps) {
  return (
    <div className="bg-white text-black rounded-md shadow-inner p-8 font-serif text-sm leading-relaxed">
      {/* Header */}
      <div className="border-b-2 border-black pb-3 mb-5 flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-gray-600">Work Management</div>
          <div className="text-xl font-bold mt-1">Requirement Document</div>
        </div>
        <div className="text-right text-xs text-gray-600">
          <div>Ref: <b className="text-black">{ticket.id}</b></div>
          <div>Date: {fmtDate(ticket.createdAt)}</div>
          <div>Status: {STATUS_LABEL[ticket.status] || ticket.status}</div>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-3">{ticket.title}</h2>

      {/* Details table */}
      <table className="w-full text-xs mb-5 border border-gray-300">
        <tbody>
          <Row k="Category" v={ticket.category} />
          <Row k="Priority" v={ticket.priority} />
          <Row k="Location" v={ticket.location} />
          <Row k="Estimated Cost" v={fmtMoney(ticket.estimatedCost)} />
          <Row k="Tags" v={(ticket.tags || []).join(", ") || "—"} />
          <Row
            k="Assignee"
            v={ticket.assignee
              ? `${ticket.assignee.name} (${ticket.assignee.department})`
              : "—"}
          />
        </tbody>
      </table>

      {/* Description */}
      <div className="mb-8">
        <div className="text-xs uppercase tracking-wider text-gray-600 mb-1">Description</div>
        <div className="whitespace-pre-wrap border border-gray-300 p-3 bg-gray-50 min-h-[80px]">
          {ticket.description || "—"}
        </div>
      </div>

      {/* ── 4 Signature blocks ── */}
      <div className="border-t-2 border-black pt-4 mb-2">
        <div className="text-xs uppercase tracking-[0.15em] text-gray-500 mb-4">
          Authorized Signatures
        </div>

        {/* Row 1 — Approval signatures */}
        <div className="grid grid-cols-2 gap-4 mb-4 items-stretch">
          <SigBlock
            number={1}
            label="HR Approval"
            color="text-emerald-700"
            block={ticket.signatures?.hrApproval}
          />
          <SigBlock
            number={2}
            label="Admin Approval"
            color="text-blue-700"
            block={ticket.signatures?.adminApproval}
          />
        </div>

        {/* Row 2 — Inspection signatures */}
        <div className="grid grid-cols-2 gap-4 items-stretch">
          <SigBlock
            number={3}
            label="HR Inspection"
            color="text-violet-700"
            block={ticket.signatures?.hrInspection}
          />
          <SigBlock
            number={4}
            label="Admin — Inspection & Payment"
            color="text-amber-700"
            block={ticket.signatures?.adminPayment}
          />
        </div>
      </div>

      {/* Footer */}
      {/* <div className="mt-6 text-[10px] text-gray-400 border-t border-gray-200 pt-2 text-center">
        This is a system-generated document. Each signature is PIN-verified and tamper-evident.
        Hash values can be independently verified.
      </div> */}
    </div>
  );
}

// ── Row component ──────────────────────────────────────────────────────────
interface RowProps {
  k: string;
  v: string | number | undefined;
}
function Row({ k, v }: RowProps) {
  return (
    <tr className="border-b border-gray-300">
      <td className="px-3 py-2 bg-gray-100 font-semibold w-1/3">{k}</td>
      <td className="px-3 py-2">{v ?? "—"}</td>
    </tr>
  );
}

// ── SigBlock component ─────────────────────────────────────────────────────
interface SigBlockProps {
  number: number;
  label: string;
  color: string;
  block?: SignatureBlock;
}
function SigBlock({ number, label, color, block }: SigBlockProps) {
  return (
    <div className="border border-gray-300 rounded-sm overflow-hidden h-full flex flex-col">
      {/* Header bar */}
      <div className="bg-gray-100 border-b border-gray-300 px-3 py-1.5 flex items-center gap-2">
        <span className="text-[10px] font-bold text-gray-500 bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center">
          {number}
        </span>
        <span className={`text-[11px] font-semibold uppercase tracking-wider ${color}`}>
          {label}
        </span>
      </div>

      {/* Signature image area */}
      <div className="h-24 bg-white flex items-center justify-center border-b border-gray-200">
        {block?.signatureImage ? (
          <img
            src={block.signatureImage}
            alt={`${label} signature`}
            className="max-h-20 max-w-[90%] object-contain" />
        ) : (
          <span className="text-xs text-gray-400 italic">Pending signature</span>
        )}
      </div>

      {/* Details */}
      {block ? (
        <div className="px-3 py-2 bg-gray-50 flex-1">
          <div className="text-[10px] font-semibold text-gray-800 h-4">
            {block.signedBy}
          </div>

          <div
            className="text-[10px] text-gray-500 h-8 overflow-hidden"
            title={block.role}
          >
            {block.role}
          </div>

          <div className="text-[10px] text-gray-500 h-8">
            {new Date(block.signedAt).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>

          <div className="text-[9px] text-gray-400 font-mono">
            Hash: {block.hash}
          </div>

          <div className="flex items-center gap-1 mt-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[9px] text-emerald-600 font-semibold uppercase tracking-wider">
              PIN Verified · Digitally Signed
            </span>
          </div>
        </div>
      ) : (
        <div className="px-3 py-2 bg-gray-50">
          <div className="text-[10px] text-gray-400 italic">Not yet signed</div>
        </div>
      )}
    </div>
  );
}