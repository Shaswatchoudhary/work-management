import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal.tsx";
import { CATEGORIES, TAGS } from "../../data/categories.ts";
import { PRIORITY } from "../../constants/ticketStatus.ts";
import { useTicketStore } from "../../store/ticketStore.ts";
import { useAuthStore } from "../../store/authStore.ts";
import { useNotificationStore } from "../../store/notificationStore.ts";
import { generateAndDownloadPdf } from "../pdf/generatePDF.tsx";
import { Ticket, Priority } from "../../types";
import "./TicketForm.scss";

interface FormData {
  title: string; category: string; priority: Priority;
  location: string; estimatedCost: string;
  description: string; tags: string[]; attachment: string;
}

const empty: FormData = {
  title: "", category: CATEGORIES[0], priority: "Medium",
  location: "", estimatedCost: "", description: "", tags: [], attachment: "",
};

interface TicketFormProps {
  open: boolean;
  onClose?: () => void;
  ticket?: Ticket | null;
}

export default function TicketForm({ open, onClose, ticket = null }: TicketFormProps) {
  const user = useAuthStore((s) => s.user);
  const addTicket = useTicketStore((s) => s.addTicket);
  const updateTicket = useTicketStore((s) => s.updateTicket);
  const setStatus = useTicketStore((s) => s.setStatus);
  const addPdf = useTicketStore((s) => s.addPdf);
  const notify = useNotificationStore((s) => s.addNotification);

  const isEdit = !!ticket;
  const [form, setForm] = useState<FormData>(empty);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ticket) {
      setForm({
        title: ticket.title || "", category: ticket.category || CATEGORIES[0],
        priority: ticket.priority || "Medium", location: ticket.location || "",
        estimatedCost: ticket.estimatedCost?.toString() || "",
        description: ticket.description || "", tags: ticket.tags || [],
        attachment: (ticket as any).attachment || "",
      });
    } else { setForm(empty); }
  }, [ticket, open]);

  const update = (k: keyof FormData, v: string | string[]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleTag = (t: string) =>
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t],
    }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.location.trim() || !form.description.trim())
      return alert("Title, location and description are required.");

    const payload = { ...form, estimatedCost: Number(form.estimatedCost) || 0 };
    setSubmitting(true);
    try {
      if (isEdit && ticket) {
        updateTicket(ticket.id, payload);
        const wasRejected = ticket.status === "rejected_hr" || ticket.status === "rejected_admin";
        if (wasRejected) {
          updateTicket(ticket.id, { signatures: {}, hrApprovedAt: undefined, adminApprovedAt: undefined });
          setStatus(ticket.id, "pending_hr", { comment: { userId: user!.id, role: user!.role, text: "Edited and resubmitted after feedback." } });
          notify({ title: `Ticket ${ticket.id} edited & resubmitted`, forRole: "hr" });
        }
      } else {
        const created = addTicket(payload, user!);
        const dataUrl = await generateAndDownloadPdf(created, user || undefined);
        addPdf(created.id, { name: `Requirement_${created.id}.pdf`, type: "requirement", dataUrl, at: new Date().toISOString() });
        notify({ title: `New ticket ${created.id} submitted for HR review`, forRole: "hr" });
      }
    } finally { setSubmitting(false); onClose?.(); }
  };

  const submitLabel = submitting
    ? "Generating PDF..."
    : isEdit
      ? (ticket?.status === "rejected_hr" || ticket?.status === "rejected_admin" ? "Save & Resubmit" : "Save Changes")
      : "Submit & Generate PDF";

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `Edit ${ticket?.id}` : "New Request"} size="lg">
      <form onSubmit={submit} className="ticket-request-form">

        {/* Title */}
        <div className="form-group">
          <label>Title</label>
          <input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Short summary of the request" />
        </div>

        {/* Grid: Category, Priority, Location, Cost */}
        <div className="form-grid-fields">
          <div className="form-group">
            <label>Category</label>
            <select value={form.category} onChange={(e) => update("category", e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={form.priority} onChange={(e) => update("priority", e.target.value as Priority)}>
              {PRIORITY.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Location / Floor</label>
            <input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Tower A, Floor 3..." />
          </div>
          <div className="form-group">
            <label>Estimated Cost (INR)</label>
            <input type="number" value={form.estimatedCost} onChange={(e) => update("estimatedCost", e.target.value)} placeholder="0" />
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Detailed problem statement..."
            rows={3}
          />
        </div>

        {/* Tags */}
        <div className="form-group">
          <label>Tags</label>
          <div className="tags-list-row">
            {TAGS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={`tag-select-btn ${form.tags.includes(t) ? "is-selected" : ""}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Attachment */}
        <div className="form-group">
          <label>File attachment (optional, link)</label>
          <input value={form.attachment} onChange={(e) => update("attachment", e.target.value)} placeholder="https://..." />
        </div>

        {/* Footer buttons */}
        <div className="form-actions-footer">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn-cancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-submit"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}