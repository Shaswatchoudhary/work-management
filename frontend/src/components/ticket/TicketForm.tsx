import { useEffect, useState } from "react";
import Modal from "../ui/Modal.tsx";
import { CATEGORIES, TAGS } from "../../data/categories.ts";
import { PRIORITY } from "../../constants/ticketStatus.ts";
import { useTicketStore } from "../../store/ticketStore.ts";
import { useAuthStore } from "../../store/authStore.ts";
import { useNotificationStore } from "../../store/notificationStore.ts";
import { generateAndDownloadPdf } from "../../utils/generatePDF.ts";
import { Ticket, Priority } from "../../types";

interface FormData {
  title: string; category: string; priority: Priority;
  location: string; estimatedCost: string;
  description: string; tags: string[]; attachment: string;
}

const empty: FormData = {
  title: "", category: CATEGORIES[0], priority: "Medium",
  location: "", estimatedCost: "", description: "", tags: [], attachment: "",
};

const iStyle: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 10px",
  border: "0.5px solid #EDE9E0", borderRadius: "8px",
  fontSize: "13px", color: "#333", background: "#fff",
  outline: "none", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: "11px", fontWeight: 600, color: "#777",
  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px", display: "block",
};

interface TicketFormProps {
  open: boolean;
  onClose?: () => void;
  ticket?: Ticket | null;
}

export default function TicketForm({ open, onClose, ticket = null }: TicketFormProps) {
  const user        = useAuthStore((s) => s.user);
  const addTicket   = useTicketStore((s) => s.addTicket);
  const updateTicket = useTicketStore((s) => s.updateTicket);
  const setStatus   = useTicketStore((s) => s.setStatus);
  const addPdf      = useTicketStore((s) => s.addPdf);
  const notify      = useNotificationStore((s) => s.addNotification);

  const isEdit = !!ticket;
  const [form, setForm]       = useState<FormData>(empty);
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
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

        {/* Title */}
        <div>
          <label style={labelStyle}>Title</label>
          <input style={iStyle} value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Short summary of the request" />
        </div>

        {/* Grid: Category, Priority, Location, Cost */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={labelStyle}>Category</label>
            <select style={iStyle} value={form.category} onChange={(e) => update("category", e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Priority</label>
            <select style={iStyle} value={form.priority} onChange={(e) => update("priority", e.target.value as Priority)}>
              {PRIORITY.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Location / Floor</label>
            <input style={iStyle} value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Tower A, Floor 3..." />
          </div>
          <div>
            <label style={labelStyle}>Estimated Cost (INR)</label>
            <input style={iStyle} type="number" value={form.estimatedCost} onChange={(e) => update("estimatedCost", e.target.value)} placeholder="0" />
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Detailed problem statement..."
            rows={3}
            style={{ ...iStyle, height: "auto", padding: "8px 10px", resize: "vertical", fontFamily: "inherit" }}
          />
        </div>

        {/* Tags */}
        <div>
          <label style={labelStyle}>Tags</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {TAGS.map((t) => (
              <button
                key={t} type="button" onClick={() => toggleTag(t)}
                style={{
                  fontSize: "12px", padding: "4px 10px", borderRadius: "7px", cursor: "pointer",
                  border: form.tags.includes(t) ? "none" : "0.5px solid #EDE9E0",
                  background: form.tags.includes(t) ? "#F59E0B" : "#FAFAF7",
                  color: form.tags.includes(t) ? "#fff" : "#555",
                  fontWeight: form.tags.includes(t) ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Attachment */}
        <div>
          <label style={labelStyle}>File attachment (optional, link)</label>
          <input style={iStyle} value={form.attachment} onChange={(e) => update("attachment", e.target.value)} placeholder="https://..." />
        </div>

        {/* Footer buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", paddingTop: "8px", borderTop: "0.5px solid #EDE9E0" }}>
          <button
            type="button" onClick={onClose} disabled={submitting}
            style={{ height: "36px", padding: "0 14px", background: "#FAFAF7", border: "0.5px solid #EDE9E0", borderRadius: "8px", fontSize: "13px", color: "#777", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            type="submit" disabled={submitting}
            style={{ height: "36px", padding: "0 16px", background: submitting ? "#FCD97A" : "#F59E0B", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 500, color: "#fff", cursor: submitting ? "not-allowed" : "pointer" }}
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}