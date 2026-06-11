import { useState } from "react";
import Modal from "../../components/ui/Modal.tsx";
import Button from "../../components/ui/CustomButton.tsx";
import Badge, { StatusBadge, PriorityBadge } from "../../components/ui/CustomBadge.tsx";
import { Input, Label, Textarea } from "../../components/ui/Field.tsx";
import StatusTimeline from "./StatusTimeline.tsx";
import CommentThread from "../thread/CommentThread.tsx";
import PinThenDrawSignature from "../signature/PinThenDrawSignature.tsx";
import RequirementDoc from "./RequirementDoc.tsx";
import TicketForm from "./TicketForm.tsx";
import "./TicketDetail.scss"
import { useTicketStore } from "../../store/ticketStore.ts";
import { useAuthStore } from "../../store/authStore.ts";
import { useNotificationStore } from "../../store/notificationStore.ts";
import { fmtDate, fmtMoney } from "../../utils/dateFormatter.ts";
import { generateAndDownloadPdf } from "../pdf/generatePDF.ts";
import { SignatureBlock } from "../../types";

interface TicketDetailProps {
  ticketId: string;
  onClose?: () => void;
}

export default function TicketDetail({ ticketId, onClose }: TicketDetailProps) {
  const ticket = useTicketStore((s) => s.tickets.find((t) => t.id === ticketId));
  const user = useAuthStore((s) => s.user);
  const setStatus = useTicketStore((s) => s.setStatus);
  const updateTicket = useTicketStore((s) => s.updateTicket);
  const addPdf = useTicketStore((s) => s.addPdf);
  const notify = useNotificationStore((s) => s.addNotification);

  const [pdfLoading, setPdfLoading] = useState(false);
  const [rejectText, setRejectText] = useState("");
  const [assignName, setAssignName] = useState("");
  const [assignDept, setAssignDept] = useState("");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [docView, setDocView] = useState(user?.role === "hr" || user?.role === "admin");
  const [editOpen, setEditOpen] = useState(false);

  if (!ticket) return null;
  const role = user?.role;

  const openReq = async () => {
    if (!ticket) return;
    setPdfLoading(true);
    try {
      const dataUrl = await generateAndDownloadPdf(ticket, user || undefined);
      const win = window.open("", "_blank");
      if (win) win.document.write(`<iframe src="${dataUrl}" style="width:100%;height:100vh;border:none;"></iframe>`);
    } finally { setPdfLoading(false); }
  };

  const downloadReq = async () => {
    if (!ticket) return;
    setPdfLoading(true);
    try { await generateAndDownloadPdf(ticket, user || undefined); }
    finally { setPdfLoading(false); }
  };

  const hrReject = () => {
    if (!rejectText.trim()) return alert("Please add a rejection comment.");
    setStatus(ticket.id, "rejected_hr", { comment: { userId: user!.id, role: "hr", text: `Rejected: ${rejectText.trim()}` } });
    notify({ title: `Ticket ${ticket.id} rejected by HR`, forRole: "helpdesk" });
    setRejectText("");
  };

  const adminReject = () => {
    if (!rejectText.trim()) return alert("Please add a rejection comment.");
    setStatus(ticket.id, "rejected_admin", { comment: { userId: user!.id, role: "admin", text: `Rejected: ${rejectText.trim()}` } });
    notify({ title: `Ticket ${ticket.id} rejected by Admin`, forRole: "helpdesk" });
    setRejectText("");
  };

  const resubmit = () => {
    setStatus(ticket.id, "pending_hr", { comment: { userId: user!.id, role: "helpdesk", text: "Resubmitted after addressing feedback." } });
    notify({ title: `Ticket ${ticket.id} resubmitted`, forRole: "hr" });
  };

  const assign = () => {
    if (!assignName.trim() || !assignDept.trim()) return alert("Please enter assignee name and department.");
    updateTicket(ticket.id, { assignee: { name: assignName.trim(), department: assignDept.trim() } });
    setAssignName(""); setAssignDept("");
  };

  const markDone = () => {
    if (!ticket.assignee) return alert("Assign a team member first.");
    setStatus(ticket.id, "inspection_pending", { comment: { userId: user!.id, role: "helpdesk", text: "Work marked complete. Ready for inspection." } });
    notify({ title: `Ticket ${ticket.id} ready for inspection`, forRole: "hr" });
  };

  const inspectionPass = () => {
    updateTicket(ticket.id, { inspection: { passed: true, notes: inspectionNotes || "Verified.", signedByHr: false, signedByAdmin: false } });
    setInspectionNotes("");
  };

  const inspectionFail = () => {
    setStatus(ticket.id, "work_in_progress", {
      comment: { userId: user!.id, role: "helpdesk", text: `Inspection failed: ${inspectionNotes || "rework needed"}` },
      patch: { inspection: { passed: false, notes: inspectionNotes || "Rework needed.", signedByHr: false, signedByAdmin: false } },
    });
    setInspectionNotes("");
    notify({ title: `Ticket ${ticket.id} inspection failed — rework`, forRole: "helpdesk" });
  };

  // ── styles ──
  // Style helpers are now migrated to TicketDetail.scss
  const renderActions = () => {
    if (role === "hr" && ticket.status === "pending_hr") {
      return (
        <div className="action-inner-wrapper">
          <PinThenDrawSignature
            userId={user!.id} userName={user!.name}
            ticketId={ticket.id} purpose="hr_approval"
            label="Sign to approve this ticket"
            existingSignature={ticket.signatures?.hrApproval}
            onSigned={async (block) => {
              const updatedTicket = { ...ticket, signatures: { ...ticket.signatures, hrApproval: block } };
              setStatus(ticket.id, "pending_admin", { comment: { userId: user!.id, role: "hr", text: "Approved by HR." }, patch: { signatures: { hrApproval: block } } });
              const dataUrl = await generateAndDownloadPdf(updatedTicket, user || undefined);
              addPdf(ticket.id, { name: `Requirement_${ticket.id}.pdf`, type: "requirement", dataUrl, at: new Date().toISOString() });
              notify({ title: `Ticket ${ticket.id} approved by HR`, forRole: "admin" });
            }}
          />
          <div className="action-divider">
            <Label>Rejection comment (required to reject)</Label>
            <Textarea value={rejectText} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectText(e.target.value)} placeholder="Reason for rejection..." />
            <Button variant="danger" onClick={hrReject}>Reject</Button>
          </div>
        </div>
      );
    }

    if (role === "admin" && ticket.status === "pending_admin") {
      return (
        <div className="action-inner-wrapper">
          <PinThenDrawSignature
            userId={user!.id} userName={user!.name}
            ticketId={ticket.id} purpose="admin_approval"
            label="Sign for final approval"
            existingSignature={ticket.signatures?.adminApproval}
            onSigned={async (block) => {
              const updatedTicket = { ...ticket, signatures: { ...ticket.signatures, adminApproval: block } };
              setStatus(ticket.id, "work_in_progress", { comment: { userId: user!.id, role: "admin", text: "Approved by Admin." }, patch: { signatures: { adminApproval: block } } });
              const dataUrl = await generateAndDownloadPdf(updatedTicket, user || undefined);
              addPdf(ticket.id, { name: `Requirement_${ticket.id}.pdf`, type: "requirement", dataUrl, at: new Date().toISOString() });
              notify({ title: `Ticket ${ticket.id} approved by Admin`, forRole: "helpdesk" });
            }}
          />
          <div className="action-divider">
            <Label>Rejection comment (required to reject)</Label>
            <Textarea value={rejectText} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectText(e.target.value)} placeholder="Reason for rejection..." />
            <Button variant="danger" onClick={adminReject}>Reject</Button>
          </div>
        </div>
      );
    }

    if (role === "helpdesk" && (ticket.status === "rejected_hr" || ticket.status === "rejected_admin")) {
      return (
        <div className="action-inner-wrapper">
          <div className="action-alert alert-danger">
            Rejected by {ticket.status === "rejected_hr" ? "HR" : "Admin"}. Edit and resubmit.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <Button onClick={() => setEditOpen(true)}>Edit Ticket</Button>
            <Button variant="secondary" onClick={resubmit}>Resubmit As-Is</Button>
          </div>
        </div>
      );
    }

    if (role === "helpdesk" && ticket.status === "work_in_progress") {
      return (
        <div className="action-inner-wrapper">
          {!ticket.assignee ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div><Label>Assignee name</Label><Input value={assignName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssignName(e.target.value)} /></div>
              <div><Label>Department</Label><Input value={assignDept} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssignDept(e.target.value)} /></div>
              <div style={{ gridColumn: "span 2" }}><Button onClick={assign}>Assign Internal Team</Button></div>
            </div>
          ) : (
            <div className="ticket-info-box">
              <div className="info-value">Assigned to <b>{ticket.assignee.name}</b> <span style={{ color: "#AAA" }}>({ticket.assignee.department})</span></div>
            </div>
          )}
          <Button variant="success" onClick={markDone} disabled={!ticket.assignee}>Mark Work Done</Button>
        </div>
      );
    }

    if (role === "helpdesk" && ticket.status === "inspection_pending") {
      return (
        <div className="action-inner-wrapper">
          <Label>Inspection notes</Label>
          <Textarea value={inspectionNotes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInspectionNotes(e.target.value)} placeholder="Findings..." />
          <div style={{ display: "flex", gap: "8px" }}>
            <Button variant="success" onClick={inspectionPass}>Inspection Pass</Button>
            <Button variant="danger" onClick={inspectionFail}>Inspection Fail (Rework)</Button>
          </div>
          {ticket.inspection?.passed && (
            <div style={{ fontSize: "12px", color: "#16A34A" }}>Marked passed. Awaiting HR &amp; Admin co-signatures.</div>
          )}
        </div>
      );
    }

    if (role === "hr" && ticket.status === "inspection_pending" && ticket.inspection?.passed && !ticket.signatures?.hrInspection) {
      return (
        <div className="action-inner-wrapper">
          <div className="action-alert alert-warning">
            Inspection passed. Co-sign to confirm. Admin will also sign before payment.
          </div>
          <PinThenDrawSignature
            userId={user!.id} userName={user!.name}
            ticketId={ticket.id} purpose="hr_inspection"
            label="Co-sign inspection report"
            existingSignature={ticket.signatures?.hrInspection}
            onSigned={(block) => {
              updateTicket(ticket.id, {
                inspection: { ...(ticket.inspection || { passed: true, notes: "", signedByHr: false, signedByAdmin: false }), signedByHr: true },
                signatures: { hrInspection: block },
              });
              notify({ title: `Ticket ${ticket.id} — HR inspection signed`, forRole: "admin" });
            }}
          />
        </div>
      );
    }

    if (role === "hr" && ticket.status === "inspection_pending" && ticket.inspection?.passed && ticket.signatures?.hrInspection && !ticket.inspection?.signedByAdmin) {
      return (
        <div className="action-alert alert-success">
          You have co-signed the inspection. Waiting for Admin to co-sign.
        </div>
      );
    }

    if (role === "admin" && ticket.status === "inspection_pending" && ticket.inspection?.passed && !ticket.signatures?.adminPayment) {
      return (
        <div className="action-inner-wrapper">
          {!ticket.signatures?.hrInspection ? (
            <div className="action-alert alert-warning">
              Waiting for HR to co-sign inspection first.
            </div>
          ) : (
            <>
              <div className="action-alert alert-info">
                HR has co-signed. Your signature will move ticket to Payment Pending.
              </div>
              <PinThenDrawSignature
                userId={user!.id} userName={user!.name}
                ticketId={ticket.id} purpose="admin_inspection_payment"
                label="Co-sign inspection to release for payment"
                existingSignature={ticket.signatures?.adminPayment}
                onSigned={async (block) => {
                  const updatedInspection = { ...(ticket.inspection || { passed: true, notes: "", signedByHr: false, signedByAdmin: false }), signedByAdmin: true };
                  const updatedTicket = { ...ticket, inspection: updatedInspection, signatures: { ...ticket.signatures, adminPayment: block } };
                  setStatus(ticket.id, "payment_pending", { comment: { userId: user!.id, role: "admin", text: "Inspection co-signed by Admin. Ready for payment." }, patch: { inspection: updatedInspection, signatures: { adminPayment: block } } });
                  const dataUrl = await generateAndDownloadPdf(updatedTicket, user || undefined);
                  addPdf(ticket.id, { name: `Inspection_${ticket.id}.pdf`, type: "inspection", dataUrl, at: new Date().toISOString() });
                  notify({ title: `Ticket ${ticket.id} ready for payment`, forRole: "admin" });
                }}
              />
            </>
          )}
        </div>
      );
    }

    if (role === "admin" && ticket.status === "payment_pending") {
      const hasSigned = !!ticket.signatures?.adminPayment;
      return (
        <div className="action-inner-wrapper">
          <div className="ticket-info-box">
            <div className="info-value">Amount to release: <b style={{ color: "#16A34A" }}>{fmtMoney(ticket.estimatedCost)}</b></div>
          </div>
          {!hasSigned ? (
            <PinThenDrawSignature
              userId={user!.id} userName={user!.name}
              ticketId={ticket.id} purpose="admin_inspection_payment"
              label="Sign to authorize payment release"
              existingSignature={ticket.signatures?.adminPayment}
              onSigned={(block) => { updateTicket(ticket.id, { signatures: { adminPayment: block } }); }}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="action-alert alert-success">
                Payment authorized. Click below to release and close ticket.
              </div>
              <Button
                variant="success"
                onClick={async () => {
                  const releasedAt = new Date().toISOString();
                  const payment = { amount: ticket.estimatedCost, releasedAt };
                  const updatedTicket = { ...ticket, payment, status: "closed" as const };
                  setStatus(ticket.id, "closed", { comment: { userId: user!.id, role: "admin", text: `Payment of ${fmtMoney(payment.amount)} released. Ticket closed.` }, patch: { payment } });
                  const dataUrl = await generateAndDownloadPdf(updatedTicket, user || undefined);
                  addPdf(ticket.id, { name: `Payment_${ticket.id}.pdf`, type: "payment", dataUrl, at: releasedAt });
                  notify({ title: `Payment released for ${ticket.id}`, forRole: "all" });
                }}
              >
                Release Payment &amp; Close Ticket
              </Button>
            </div>
          )}
        </div>
      );
    }

    return <div style={{ fontSize: "12px", color: "#AAA" }}>No actions available for your role at this status.</div>;
  };

  return (
    <>
      <Modal open={!!ticket} onClose={onClose} title={`${ticket.id} — ${ticket.title}`} size="xl">

        {/* Top action buttons */}
        <div className="ticket-detail-actions-bar">
          <Button size="sm" variant={docView ? "primary" : "secondary"} onClick={() => setDocView((v) => !v)}>
            {docView ? "Show Ticket UI" : "Open Requirement Document"}
          </Button>
          <Button size="sm" variant="secondary" onClick={openReq} disabled={pdfLoading}>
            {pdfLoading ? "Generating..." : "Open PDF in New Tab"}
          </Button>
          <Button size="sm" variant="secondary" onClick={downloadReq} disabled={pdfLoading}>
            {pdfLoading ? "Generating..." : "Download PDF"}
          </Button>
        </div>

        <div className="ticket-detail-grid">

          {/* Left: main content — 2 cols */}
          <div className="ticket-detail-main">
            {docView ? (
              <RequirementDoc ticket={ticket} />
            ) : (
              <>
                {/* Badges */}
                <div className="ticket-detail-badges">
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                  <Badge>{ticket.category}</Badge>
                  {ticket.tags?.map((t) => <Badge key={t} tone="primary">{t}</Badge>)}
                </div>

                <StatusTimeline status={ticket.status} />

                {/* Info grid */}
                <div className="ticket-info-grid">
                  {[
                    { label: "Location", value: ticket.location },
                    { label: "Estimated Cost", value: fmtMoney(ticket.estimatedCost) },
                    { label: "Created", value: fmtDate(ticket.createdAt) },
                    { label: "Last Updated", value: fmtDate(ticket.updatedAt) },
                    { label: "Assignee", value: ticket.assignee ? `${ticket.assignee.name} (${ticket.assignee.department})` : "—" },
                    { label: "Inspection", value: ticket.inspection ? (ticket.inspection.passed ? "Passed" : "Failed") : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="ticket-info-box">
                      <div className="info-label">{label}</div>
                      <div className="info-value">{value}</div>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <div>
                  <div className="ticket-section-label">Description</div>
                  <div className="ticket-desc-box">
                    {ticket.description}
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <div className="ticket-section-label">Documents</div>
                  <div className="ticket-pdfs-list">
                    {ticket.pdfs.length === 0 && <span style={{ fontSize: "12px", color: "#AAA" }}>No PDFs generated yet.</span>}
                    {ticket.pdfs.map((p, i) => (
                      <a key={i} href={p.dataUrl} download={p.name} className="pdf-link">
                        {p.name}
                      </a>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <div className="ticket-section-label">Activity &amp; Comments</div>
                  <CommentThread ticketId={ticket.id} />
                </div>
              </>
            )}
          </div>

          {/* Right: actions + signatures */}
          <div className="ticket-detail-sidebar">
            <div className="ticket-action-box">
              <div className="ticket-section-label">Available Actions</div>
              {renderActions()}
            </div>

            {ticket.signatures && Object.keys(ticket.signatures).length > 0 && (
              <div className="ticket-action-box">
                <div className="ticket-section-label">Signatures on file</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {ticket.signatures.hrApproval && <SignatureCard number={1} label="HR Approval" accent="#16A34A" block={ticket.signatures.hrApproval} />}
                  {ticket.signatures.adminApproval && <SignatureCard number={2} label="Admin Approval" accent="#2563EB" block={ticket.signatures.adminApproval} />}
                  {ticket.signatures.hrInspection && <SignatureCard number={3} label="HR Inspection" accent="#7C3AED" block={ticket.signatures.hrInspection} />}
                  {ticket.signatures.adminPayment && <SignatureCard number={4} label="Admin Payment Auth" accent="#D97706" block={ticket.signatures.adminPayment} />}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {editOpen && <TicketForm open={editOpen} onClose={() => setEditOpen(false)} ticket={ticket} />}
    </>
  );
}

interface SignatureCardProps { number: number; label: string; accent: string; block: SignatureBlock; }
function SignatureCard({ number, label, accent, block }: SignatureCardProps) {
  return (
    <div className="sidebar-signature-card">
      <div className="sig-card-header">
        <span className="num" style={{ color: accent }}>{number}.</span>
        <span className="lbl" style={{ color: accent }}>{label}</span>
      </div>
      <div className="sig-card-img-wrapper">
        <img src={block.signatureImage} alt={label} />
      </div>
      <div className="sig-card-details">
        <div className="signer">{block.signedBy}</div>
        <div className="time">
          {new Date(block.signedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </div>
        <div className="hash">Hash: {block.hash}</div>
        <div className="verified-badge">
          <div className="green-dot" />
          <span className="lbl-text">PIN Verified · Digitally Signed</span>
        </div>
      </div>
    </div>
  );
}