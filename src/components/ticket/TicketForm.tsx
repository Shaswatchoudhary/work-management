import { useEffect, useState } from "react";
import Modal from "../ui/Modal.tsx";
import Button from "../ui/CustomButton.tsx";
import { Input, Label, Select, Textarea } from "../ui/Field.tsx";
import { CATEGORIES, TAGS } from "../../data/categories.ts";
import { PRIORITY } from "../../constants/ticketStatus.ts";
import { useTicketStore } from "../../store/ticketStore.ts";
import { useAuthStore } from "../../store/authStore.ts";
import { useNotificationStore } from "../../store/notificationStore.ts";
import { generateAndDownloadPdf } from "../../utils/generatePDF.ts";
import { Ticket, Priority } from "../../types";

interface FormData {
  title: string;
  category: string;
  priority: Priority;
  location: string;
  estimatedCost: string;
  description: string;
  tags: string[];
  attachment: string;
}

const empty: FormData = {
  title: "",
  category: CATEGORIES[0],
  priority: "Medium",
  location: "",
  estimatedCost: "",
  description: "",
  tags: [],
  attachment: "",
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
        title: ticket.title || "",
        category: ticket.category || CATEGORIES[0],
        priority: ticket.priority || "Medium",
        location: ticket.location || "",
        estimatedCost: ticket.estimatedCost?.toString() || "",
        description: ticket.description || "",
        tags: ticket.tags || [],
        attachment: (ticket as any).attachment || "",
      });
    } else {
      setForm(empty);
    }
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
        const wasRejected =
          ticket.status === "rejected_hr" || ticket.status === "rejected_admin";
        if (wasRejected) {
          updateTicket(ticket.id, {
            signatures: {},
            hrApprovedAt: undefined,
            adminApprovedAt: undefined,
          });
          setStatus(ticket.id, "pending_hr", {
            comment: {
              userId: user!.id,
              role: user!.role,
              text: "Edited and resubmitted after feedback.",
            },
          });
          notify({ title: `Ticket ${ticket.id} edited & resubmitted`, forRole: "hr" });
        }
      } else {
        const created = addTicket(payload, user!);
        const dataUrl = await generateAndDownloadPdf(created, user || undefined);
        addPdf(created.id, {
          name: `Requirement_${created.id}.pdf`,
          type: "requirement",
          dataUrl,
          at: new Date().toISOString(),
        });
        notify({ title: `New ticket ${created.id} submitted for HR review`, forRole: "hr" });
      }
    } finally {
      setSubmitting(false);
      onClose?.();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit ${ticket?.id}` : "New Request"}
      size="lg"
    >
      <form onSubmit={submit} className="space-y-3">
        <div>
          <Label className="text-[#e2e8f0] font-medium text-[13px]">Title</Label>
          <Input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Short summary of the request"
            className="bg-[#0a0a0a] border-white/20 text-white placeholder:text-white/35 focus:border-white/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[#e2e8f0] font-medium text-[13px]">Category</Label>
            <Select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className="bg-[#0a0a0a] border-white/20 text-white focus:border-white/50"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </div>
          <div>
            <Label className="text-[#e2e8f0] font-medium text-[13px]">Priority</Label>
            <Select
              value={form.priority}
              onChange={(e) => update("priority", e.target.value as Priority)}
              className="bg-[#0a0a0a] border-white/20 text-white focus:border-white/50"
            >
              {PRIORITY.map((p) => <option key={p}>{p}</option>)}
            </Select>
          </div>
          <div>
            <Label className="text-[#e2e8f0] font-medium text-[13px]">Location / Floor</Label>
            <Input
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="Tower A, Floor 3..."
              className="bg-[#0a0a0a] border-white/20 text-white placeholder:text-white/35 focus:border-white/50"
            />
          </div>
          <div>
            <Label className="text-[#e2e8f0] font-medium text-[13px]">Estimated Cost (INR)</Label>
            <Input
              type="number"
              value={form.estimatedCost}
              onChange={(e) => update("estimatedCost", e.target.value)}
              className="bg-[#0a0a0a] border-white/20 text-white placeholder:text-white/35 focus:border-white/50"
            />
          </div>
        </div>

        <div>
          <Label className="text-[#e2e8f0] font-medium text-[13px]">Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Detailed problem statement..."
            className="bg-[#0a0a0a] border-white/20 text-white placeholder:text-white/35 focus:border-white/50"
          />
        </div>

        <div>
          <Label className="text-[#e2e8f0] font-medium text-[13px]">Tags</Label>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={`text-xs rounded-md px-2 py-1 border transition-colors ${form.tags.includes(t)
                    ? "bg-[#4f6ef7] border-[#4f6ef7] text-white"
                    : "bg-[#0a0a0a] border-white/30 text-white/80 hover:text-white"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-[#e2e8f0] font-medium text-[13px]">
            File attachment (optional, link)
          </Label>
          <Input
            value={form.attachment}
            onChange={(e) => update("attachment", e.target.value)}
            placeholder="https://..."
            className="bg-[#0a0a0a] border-white/20 text-white placeholder:text-white/35 focus:border-white/50"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="border-white/20 text-white/70"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" className="text-white" disabled={submitting}>
            {submitting
              ? "Generating PDF..."
              : isEdit
                ? ticket?.status === "rejected_hr" || ticket?.status === "rejected_admin"
                  ? "Save & Resubmit"
                  : "Save Changes"
                : "Submit & Generate PDF"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}