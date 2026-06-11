import { fmtDate, fmtMoney } from "../../utils/dateFormatter.ts";
import { STATUS_LABEL } from "../../constants/ticketStatus.ts";
import { Ticket, SignatureBlock } from "../../types";
import "./RequirementDoc.scss";

interface RequirementDocProps {
  ticket: Ticket;
}

export default function RequirementDoc({ ticket }: RequirementDocProps) {
  return (
    <div className="requirement-doc">
      {/* Header */}
      <div className="header">
        <div>
          <div className="label">Work Management</div>
          <div className="title">Requirement Document</div>
        </div>
        <div className="meta">
          <div>Ref: <b className="ref-id">{ticket.id}</b></div>
          <div>Date: {fmtDate(ticket.createdAt)}</div>
          <div>Status: {STATUS_LABEL[ticket.status] || ticket.status}</div>
        </div>
      </div>

      <h2 className="doc-title">{ticket.title}</h2>

      {/* Details table */}
      <table className="details-table">
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
      <div>
        <div className="section-title">Description</div>
        <div className="description-box">
          {ticket.description || "—"}
        </div>
      </div>

      {/* ── 4 Signature blocks ── */}
      <div className="signatures-section">
        <div className="section-label">
          Authorized Signatures
        </div>

        {/* Row 1 — Approval signatures */}
        <div className="sig-row">
          <SigBlock
            number={1}
            label="HR Approval"
            color="hr-approval"
            block={ticket.signatures?.hrApproval}
          />
          <SigBlock
            number={2}
            label="Admin Approval"
            color="admin-approval"
            block={ticket.signatures?.adminApproval}
          />
        </div>

        {/* Row 2 — Inspection signatures */}
        <div className="sig-row">
          <SigBlock
            number={3}
            label="HR Inspection"
            color="hr-inspection"
            block={ticket.signatures?.hrInspection}
          />
          <SigBlock
            number={4}
            label="Admin — Inspection & Payment"
            color="admin-payment"
            block={ticket.signatures?.adminPayment}
          />
        </div>
      </div>
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
    <tr>
      <td className="label">{k}</td>
      <td>{v ?? "—"}</td>
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
    <div className="sig-block">
      {/* Header bar */}
      <div className="sig-header">
        <span className="sig-num">
          {number}
        </span>
        <span className={`sig-label ${color}`}>
          {label}
        </span>
      </div>

      {/* Signature image area */}
      <div className="sig-image-area">
        {block?.signatureImage ? (
          <img
            src={block.signatureImage}
            alt={`${label} signature`}
          />
        ) : (
          <span className="pending-text">Pending signature</span>
        )}
      </div>

      {/* Details */}
      {block ? (
        <div className="sig-details">
          <div className="sig-name">
            {block.signedBy}
          </div>

          <div
            className="sig-role"
            title={block.role}
          >
            {block.role}
          </div>

          <div className="sig-date">
            {new Date(block.signedAt).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>

          <div className="sig-hash">
            Hash: {block.hash}
          </div>

          <div className="sig-verified">
            <div className="dot" />
            <span className="verified-text">
              PIN Verified · Digitally Signed
            </span>
          </div>
        </div>
      ) : (
        <div className="sig-details">
          <div className="unsigned-text">Not yet signed</div>
        </div>
      )}
    </div>
  );
}