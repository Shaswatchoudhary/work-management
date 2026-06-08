import { useState } from "react";
import Modal from "../ui/Modal.tsx";
import Button from "../ui/CustomButton.tsx";
import Badge, { StatusBadge, PriorityBadge } from "../ui/CustomBadge.tsx";
import { Input, Label, Textarea } from "../ui/Field.tsx";
import StatusTimeline from "./StatusTimeline.tsx";
import CommentThread from "../thread/CommentThread.tsx";
import PinThenDrawSignature from "../signature/PinThenDrawSignature.tsx";
import RequirementDoc from "./RequirementDoc.tsx";
import TicketForm from "./TicketForm.tsx";

import { useTicketStore } from "../../store/ticketStore.ts";
import { useAuthStore } from "../../store/authStore.ts";
import { useNotificationStore } from "../../store/notificationStore.ts";
import { fmtDate, fmtMoney } from "../../utils/dateFormatter.ts";
import {
  generateRequirementPdf,
  generateInspectionPdf,
  generatePaymentPdf,
  downloadPdf,
} from "../../utils/pdfGenerator.ts";
import { SignatureBlock } from "../../types";

interface TicketDetailProps {
  ticketId: string;
  onClose?: () => void;
}

export default function TicketDetail({ ticketId, onClose }: TicketDetailProps) {
  // Live reactive — jab bhi store update hoga yeh automatically re-render hoga
  const ticket      = useTicketStore((s) => s.tickets.find((t) => t.id === ticketId));
  const user        = useAuthStore((s) => s.user);
  const setStatus   = useTicketStore((s) => s.setStatus);
  const updateTicket = useTicketStore((s) => s.updateTicket);
  const addPdf      = useTicketStore((s) => s.addPdf);
  const notify      = useNotificationStore((s) => s.addNotification);

  const [rejectText,      setRejectText]      = useState("");
  const [assignName,      setAssignName]      = useState("");
  const [assignDept,      setAssignDept]      = useState("");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [docView,         setDocView]         = useState(
    user?.role === "hr" || user?.role === "admin",
  );
  const [editOpen, setEditOpen] = useState(false);

  if (!ticket) return null;
  const role = user?.role;

  // ── Reject handlers ────────────────────────────────────────────────────
  const hrReject = () => {
    if (!rejectText.trim()) return alert("Please add a rejection comment.");
    setStatus(ticket.id, "rejected_hr", {
      comment: { userId: user!.id, role: "hr", text: `Rejected: ${rejectText.trim()}` },
    });
    notify({ title: `Ticket ${ticket.id} rejected by HR`, forRole: "helpdesk" });
    setRejectText("");
  };

  const adminReject = () => {
    if (!rejectText.trim()) return alert("Please add a rejection comment.");
    setStatus(ticket.id, "rejected_admin", {
      comment: { userId: user!.id, role: "admin", text: `Rejected: ${rejectText.trim()}` },
    });
    notify({ title: `Ticket ${ticket.id} rejected by Admin`, forRole: "helpdesk" });
    setRejectText("");
  };

  const resubmit = () => {
    setStatus(ticket.id, "pending_hr", {
      comment: {
        userId: user!.id,
        role: "helpdesk",
        text: "Resubmitted after addressing feedback.",
      },
    });
    notify({ title: `Ticket ${ticket.id} resubmitted`, forRole: "hr" });
  };

  const assign = () => {
    if (!assignName.trim() || !assignDept.trim())
      return alert("Please enter assignee name and department.");
    updateTicket(ticket.id, {
      assignee: { name: assignName.trim(), department: assignDept.trim() },
    });
    setAssignName("");
    setAssignDept("");
  };

  const markDone = () => {
    if (!ticket.assignee) return alert("Assign a team member first.");
    setStatus(ticket.id, "inspection_pending", {
      comment: {
        userId: user!.id,
        role: "helpdesk",
        text: "Work marked complete. Ready for inspection.",
      },
    });
    notify({ title: `Ticket ${ticket.id} ready for inspection`, forRole: "hr" });
  };

  const inspectionPass = () => {
    updateTicket(ticket.id, {
      inspection: {
        passed: true,
        notes: inspectionNotes || "Verified.",
        signedByHr: false,
        signedByAdmin: false,
      },
    });
    setInspectionNotes("");
  };

  const inspectionFail = () => {
    setStatus(ticket.id, "work_in_progress", {
      comment: {
        userId: user!.id,
        role: "helpdesk",
        text: `Inspection failed: ${inspectionNotes || "rework needed"}`,
      },
      patch: {
        inspection: {
          passed: false,
          notes: inspectionNotes || "Rework needed.",
          signedByHr: false,
          signedByAdmin: false,
        },
      },
    });
    setInspectionNotes("");
    notify({ title: `Ticket ${ticket.id} inspection failed — rework`, forRole: "helpdesk" });
  };

  const openReq = () => {
    const pdf = generateRequirementPdf(ticket, user || undefined);
    const url = URL.createObjectURL(pdf.blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const downloadReq = () =>
    downloadPdf(generateRequirementPdf(ticket, user || undefined));

  // ── Actions panel ──────────────────────────────────────────────────────
  const renderActions = () => {

    // ── 1. HR approves ticket ──────────────────────────────────────────
    if (role === "hr" && ticket.status === "pending_hr") {
      return (
        <div className="space-y-4">
          <PinThenDrawSignature
            userId={user!.id}
            userName={user!.name}
            ticketId={ticket.id}
            purpose="hr_approval"
            label="Sign to approve this ticket"
            existingSignature={ticket.signatures?.hrApproval}
            onSigned={(block) => {
              setStatus(ticket.id, "pending_admin", {
                comment: { userId: user!.id, role: "hr", text: "Approved by HR." },
                patch: {
                  signatures: { hrApproval: block },
                },
              });
              notify({ title: `Ticket ${ticket.id} approved by HR`, forRole: "admin" });
            }}
          />
          <div className="border-t border-border pt-3 space-y-2">
            <Label>Rejection comment (required to reject)</Label>
            <Textarea
              value={rejectText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setRejectText(e.target.value)
              }
              placeholder="Reason for rejection..."
            />
            <Button variant="danger" onClick={hrReject}>
              Reject
            </Button>
          </div>
        </div>
      );
    }

    // ── 2. Admin gives final approval ──────────────────────────────────
    if (role === "admin" && ticket.status === "pending_admin") {
      return (
        <div className="space-y-4">
          <PinThenDrawSignature
            userId={user!.id}
            userName={user!.name}
            ticketId={ticket.id}
            purpose="admin_approval"
            label="Sign for final approval"
            existingSignature={ticket.signatures?.adminApproval}
            onSigned={(block) => {
              setStatus(ticket.id, "work_in_progress", {
                comment: { userId: user!.id, role: "admin", text: "Approved by Admin." },
                patch: {
                  signatures: { adminApproval: block },
                },
              });
              notify({
                title: `Ticket ${ticket.id} approved by Admin`,
                forRole: "helpdesk",
              });
            }}
          />
          <div className="border-t border-border pt-3 space-y-2">
            <Label>Rejection comment (required to reject)</Label>
            <Textarea
              value={rejectText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setRejectText(e.target.value)
              }
              placeholder="Reason for rejection..."
            />
            <Button variant="danger" onClick={adminReject}>
              Reject
            </Button>
          </div>
        </div>
      );
    }

    // ── 3. Helpdesk — resubmit after rejection ─────────────────────────
    if (
      role === "helpdesk" &&
      (ticket.status === "rejected_hr" || ticket.status === "rejected_admin")
    ) {
      return (
        <div className="space-y-2">
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            Rejected by {ticket.status === "rejected_hr" ? "HR" : "Admin"}. Edit and resubmit.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setEditOpen(true)}>Edit Ticket</Button>
            <Button variant="secondary" onClick={resubmit}>
              Resubmit As-Is
            </Button>
          </div>
        </div>
      );
    }

    // ── 4. Helpdesk — assign + mark done ──────────────────────────────
    if (role === "helpdesk" && ticket.status === "work_in_progress") {
      return (
        <div className="space-y-3">
          {!ticket.assignee ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Assignee name</Label>
                <Input
                  value={assignName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAssignName(e.target.value)
                  }
                />
              </div>
              <div>
                <Label>Department</Label>
                <Input
                  value={assignDept}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAssignDept(e.target.value)
                  }
                />
              </div>
              <div className="col-span-2">
                <Button onClick={assign}>Assign Internal Team</Button>
              </div>
            </div>
          ) : (
           <div className="rounded-md bg-white/[0.06] border border-white/10 p-3 text-sm text-white/90">
  Assigned to <b className="text-white">{ticket.assignee.name}</b>{" "}
  <span className="text-white/60">({ticket.assignee.department})</span>
</div>
          )}
          <Button variant="success" onClick={markDone} disabled={!ticket.assignee}>
            Mark Work Done
          </Button>
        </div>
      );
    }

    // ── 5. Helpdesk — inspection pass/fail ────────────────────────────
    if (role === "helpdesk" && ticket.status === "inspection_pending") {
      return (
        <div className="space-y-3">
          <Label>Inspection notes</Label>
          <Textarea
            value={inspectionNotes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setInspectionNotes(e.target.value)
            }
            placeholder="Findings..."
          />
          <div className="flex gap-2">
            <Button variant="success" onClick={inspectionPass}>
              Inspection Pass
            </Button>
            <Button variant="danger" onClick={inspectionFail}>
              Inspection Fail (Rework)
            </Button>
          </div>
          {ticket.inspection?.passed && (
            <div className="text-xs text-emerald-400">
              Marked passed. Awaiting HR &amp; Admin co-signatures.
            </div>
          )}
        </div>
      );
    }

    // ── 6. HR — inspection co-sign ─────────────────────────────────────
    if (
      role === "hr" &&
      ticket.status === "inspection_pending" &&
      ticket.inspection?.passed &&
      !ticket.signatures?.hrInspection
    ) {
      return (
        <div className="space-y-4">
          <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300">
            Inspection passed. Co-sign to confirm. Admin will also sign before payment.
          </div>
          <PinThenDrawSignature
            userId={user!.id}
            userName={user!.name}
            ticketId={ticket.id}
            purpose="hr_inspection"
            label="Co-sign inspection report"
            existingSignature={ticket.signatures?.hrInspection}
            onSigned={(block) => {
              updateTicket(ticket.id, {
                inspection: {
                  ...(ticket.inspection || {
                    passed: true,
                    notes: "",
                    signedByHr: false,
                    signedByAdmin: false,
                  }),
                  signedByHr: true,
                },
                signatures: { hrInspection: block },
              });
              notify({
                title: `Ticket ${ticket.id} — HR inspection signed`,
                forRole: "admin",
              });
            }}
          />
        </div>
      );
    }

    // ── HR — already signed, waiting for admin ─────────────────────────
    if (
      role === "hr" &&
      ticket.status === "inspection_pending" &&
      ticket.inspection?.passed &&
      ticket.signatures?.hrInspection &&
      !ticket.inspection?.signedByAdmin
    ) {
      return (
        <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300">
          You have co-signed the inspection. Waiting for Admin to co-sign.
        </div>
      );
    }

    // ── 7. Admin — inspection co-sign + move to payment_pending ───────
    if (
      role === "admin" &&
      ticket.status === "inspection_pending" &&
      ticket.inspection?.passed &&
      !ticket.signatures?.adminPayment
    ) {
      return (
        <div className="space-y-4">
          {!ticket.signatures?.hrInspection ? (
            <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300">
              Waiting for HR to co-sign inspection first.
            </div>
          ) : (
            <>
              <div className="rounded-md bg-blue-500/10 border border-blue-500/30 p-3 text-xs text-blue-300">
                HR has co-signed. Your signature will move ticket to Payment Pending.
              </div>
              <PinThenDrawSignature
                userId={user!.id}
                userName={user!.name}
                ticketId={ticket.id}
                purpose="admin_inspection_payment"
                label="Co-sign inspection to release for payment"
                existingSignature={ticket.signatures?.adminPayment}
                onSigned={(block) => {
                  const updatedInspection = {
                    ...(ticket.inspection || {
                      passed: true,
                      notes: "",
                      signedByHr: false,
                      signedByAdmin: false,
                    }),
                    signedByAdmin: true,
                  };
                  setStatus(ticket.id, "payment_pending", {
                    comment: {
                      userId: user!.id,
                      role: "admin",
                      text: "Inspection co-signed by Admin. Ready for payment.",
                    },
                    patch: {
                      inspection: updatedInspection,
                      signatures: { adminPayment: block },
                    },
                  });
                  // Inspection PDF generate karo with all available sigs
                  const updatedTicket = {
                    ...ticket,
                    inspection: updatedInspection,
                    signatures: {
                      ...ticket.signatures,
                      adminPayment: block,
                    },
                  };
                  const pdf = generateInspectionPdf(
                    updatedTicket,
                    undefined,
                    undefined,
                  );
                  addPdf(ticket.id, {
                    name: pdf.name,
                    type: "inspection",
                    dataUrl: pdf.dataUrl,
                    at: new Date().toISOString(),
                  });
                  notify({
                    title: `Ticket ${ticket.id} ready for payment`,
                    forRole: "admin",
                  });
                }}
              />
            </>
          )}
        </div>
      );
    }

    // ── 8. Admin — release payment + close ────────────────────────────
    if (role === "admin" && ticket.status === "payment_pending") {
      const hasSigned = !!ticket.signatures?.adminPayment;
      return (
        <div className="space-y-4">
          <div className="rounded-md bg-white/[0.06] border border-white/10 p-3 text-sm text-white/80">
  Amount to release:{" "}
  <b className="text-emerald-400">{fmtMoney(ticket.estimatedCost)}</b>
</div>

          {!hasSigned ? (
            <PinThenDrawSignature
              userId={user!.id}
              userName={user!.name}
              ticketId={ticket.id}
              purpose="admin_inspection_payment"
              label="Sign to authorize payment release"
              existingSignature={ticket.signatures?.adminPayment}
              onSigned={(block) => {
                updateTicket(ticket.id, {
                  signatures: { adminPayment: block },
                });
              }}
            />
          ) : (
            <div className="space-y-3">
              <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300">
                Payment authorized. Click below to release and close ticket.
              </div>
              <Button
                variant="success"
                onClick={() => {
                  const releasedAt = new Date().toISOString();
                  const payment = { amount: ticket.estimatedCost, releasedAt };
                  setStatus(ticket.id, "closed", {
                    comment: {
                      userId: user!.id,
                      role: "admin",
                      text: `Payment of ${fmtMoney(payment.amount)} released. Ticket closed.`,
                    },
                    patch: { payment },
                  });
                  const pdf = generatePaymentPdf(
                    { ...ticket, payment },
                    "",
                  );
                  addPdf(ticket.id, {
                    name: pdf.name,
                    type: "payment",
                    dataUrl: pdf.dataUrl,
                    at: releasedAt,
                  });
                  notify({
                    title: `Payment released for ${ticket.id}`,
                    forRole: "all",
                  });
                }}
                className="w-full"
              >
                Release Payment &amp; Close Ticket
              </Button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-xs text-muted-foreground">
        No actions available for your role at this status.
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      <Modal
        open={!!ticket}
        onClose={onClose}
        title={`${ticket.id} — ${ticket.title}`}
        size="xl"
      >
        {/* Top action buttons */}
        <div className="mb-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={docView ? "primary" : "secondary"}
            onClick={() => setDocView((v) => !v)}
          >
            {docView ? "Show Ticket UI" : "Open Requirement Document"}
          </Button>
          <Button size="sm" variant="secondary" onClick={openReq}>
            Open PDF in New Tab
          </Button>
          <Button size="sm" variant="secondary" onClick={downloadReq}>
            Download PDF
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left — main content */}
          <div className="lg:col-span-2 space-y-4">
            {docView ? (
              // RequirementDoc ticket prop directly store se aata hai — always fresh
              <RequirementDoc ticket={ticket} />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                  <Badge>{ticket.category}</Badge>
                  {ticket.tags?.map((t) => (
                    <Badge key={t} tone="primary">
                      {t}
                    </Badge>
                  ))}
                </div>

                <StatusTimeline status={ticket.status} />

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="Location"       value={ticket.location} />
                  <Info label="Estimated Cost" value={fmtMoney(ticket.estimatedCost)} />
                  <Info label="Created"        value={fmtDate(ticket.createdAt)} />
                  <Info label="Last Updated"   value={fmtDate(ticket.updatedAt)} />
                  <Info
                    label="Assignee"
                    value={
                      ticket.assignee
                        ? `${ticket.assignee.name} (${ticket.assignee.department})`
                        : "—"
                    }
                  />
                  <Info
                    label="Inspection"
                    value={
                      ticket.inspection
                        ? ticket.inspection.passed
                          ? "Passed"
                          : "Failed"
                        : "—"
                    }
                  />
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Description
                  </div>
                 <div className="rounded-md border border-white/10 bg-white/[0.05] p-3 text-sm whitespace-pre-wrap text-white/85">
  {ticket.description}
</div>
                </div>
{/* Documents */}
<div>
  <div className="text-xs uppercase tracking-wider text-white/40 mb-2">
    Documents
  </div>
  <div className="flex flex-wrap gap-2">
    {ticket.pdfs.length === 0 && (
      <span className="text-xs text-white/40 self-center">
        No PDFs generated yet.
      </span>
    )}
    {ticket.pdfs.map((p, i) => (
      <a
        key={i}
        href={p.dataUrl}
        download={p.name}
        className="text-xs rounded-md border border-white/15 bg-white/[0.06] px-2 py-1 hover:bg-white/[0.12] text-white/80 hover:text-white transition-colors"
      >
        {p.name}
      </a>
    ))}
  </div>
</div>

                {/* Comments */}
                <div>
                 <div className="text-xs uppercase tracking-wider text-white/40 mb-2">
  Activity &amp; Comments
</div>
                  <CommentThread ticketId={ticket.id} />
                </div>
              </>
            )}
          </div>

          {/* Right — actions + signatures */}
          <div className="space-y-3">
            {/* Actions panel */}
         <div className="rounded-lg border border-white/10 bg-white/[0.06] backdrop-blur-sm p-3">
  <div className="text-xs uppercase tracking-wider text-white/50 mb-2">
    Available Actions
  </div>
  {renderActions()}
</div>

{/* Signatures on file */}
{ticket.signatures && Object.keys(ticket.signatures).length > 0 && (
  <div className="rounded-lg border border-white/10 bg-white/[0.06] backdrop-blur-sm p-3">
    <div className="text-xs uppercase tracking-wider text-white/50 mb-3">
      Signatures on file
    </div>
                <div className="space-y-3">
                  {ticket.signatures.hrApproval && (
                    <SignatureCard
                      number={1}
                      label="HR Approval"
                      accent="text-emerald-400"
                      block={ticket.signatures.hrApproval}
                    />
                  )}
                  {ticket.signatures.adminApproval && (
                    <SignatureCard
                      number={2}
                      label="Admin Approval"
                      accent="text-blue-400"
                      block={ticket.signatures.adminApproval}
                    />
                  )}
                  {ticket.signatures.hrInspection && (
                    <SignatureCard
                      number={3}
                      label="HR Inspection"
                      accent="text-violet-400"
                      block={ticket.signatures.hrInspection}
                    />
                  )}
                  {ticket.signatures.adminPayment && (
                    <SignatureCard
                      number={4}
                      label="Admin Payment Auth"
                      accent="text-amber-400"
                      block={ticket.signatures.adminPayment}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {editOpen && (
        <TicketForm
          open={editOpen}
          onClose={() => setEditOpen(false)}
          ticket={ticket}
        />
      )}
    </>
  );
}

// ── Info cell ──────────────────────────────────────────────────────────────
interface InfoProps {
  label: string;
  value: string | number;
}
function Info({ label, value }: InfoProps) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.05] p-2">
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="text-sm mt-0.5 text-white/90">{value}</div>
    </div>
  );
}

// ── SignatureCard — sidebar mein live signature display ────────────────────
interface SignatureCardProps {
  number: number;
  label: string;
  accent: string;
  block: SignatureBlock;
}
function SignatureCard({ number, label, accent, block }: SignatureCardProps) {
  return (
    <div className="rounded-md border border-border overflow-hidden">
      {/* Label row */}
      <div className="flex items-center gap-2 px-2 py-1.5 bg-white/[0.03] border-b border-border">
        <span className={`text-[10px] font-bold ${accent}`}>{number}.</span>
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${accent}`}>
          {label}
        </span>
      </div>

      {/* Signature image — white background so canvas strokes visible */}
      <div className="bg-white h-12 flex items-center justify-center px-2">
        <img
          src={block.signatureImage}
          alt={label}
          className="max-h-10 max-w-full object-contain"
        />
      </div>

      {/* Meta info */}
      <div className="px-2 py-1.5 space-y-0.5">
        <div className="text-[10px] font-medium text-white/80">{block.signedBy}</div>
        <div className="text-[9px] text-white/50">
          {new Date(block.signedAt).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
        <div className="text-[9px] font-mono text-white/30">
          Hash: {block.hash}
        </div>
        <div className="flex items-center gap-1 pt-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[9px] text-emerald-500 font-semibold">
            PIN Verified · Digitally Signed
          </span>
        </div>
      </div>
    </div>
  );
}