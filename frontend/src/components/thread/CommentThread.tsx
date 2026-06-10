import { useState } from "react";
import { useAuthStore } from "../../store/authStore.ts";
import { useTicketStore } from "../../store/ticketStore.ts";
import { fmtRel } from "../../utils/dateFormatter.ts";
import { ROLE_LABEL } from "../../constants/roles.ts";

interface CommentThreadProps {
  ticketId: string;
}

export default function CommentThread({ ticketId }: CommentThreadProps) {
  const user      = useAuthStore((s) => s.user);
  const ticket    = useTicketStore((s) => s.tickets.find((t) => t.id === ticketId));
  const addComment = useTicketStore((s) => s.addComment);
  const [text, setText] = useState("");

  if (!ticket) return null;

  const submit = () => {
    if (!text.trim()) return;
    addComment(ticketId, { userId: user!.id, role: user!.role, text: text.trim() });
    setText("");
  };

  return (
    <div>
      {/* Comment list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "280px", overflowY: "auto", marginBottom: "10px" }}>
        {ticket.comments.length === 0 && (
          <div style={{ fontSize: "12px", color: "#AAA" }}>No activity yet.</div>
        )}
        {ticket.comments.map((c) => (
          <div key={c.id} style={{ borderRadius: "8px", border: "0.5px solid #EDE9E0", background: "#FAFAF7", padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#555" }}>
                {ROLE_LABEL[c.role] || c.role}
              </span>
              <span style={{ fontSize: "10px", color: "#BBB" }}>{fmtRel(c.at)}</span>
            </div>
            <div style={{ fontSize: "13px", color: "#333", lineHeight: 1.5 }}>{c.text}</div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
        <textarea
          placeholder="Add a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          style={{
            flex: 1, padding: "8px 12px", fontSize: "13px",
            border: "0.5px solid #EDE9E0", borderRadius: "8px",
            background: "#fff", color: "#333", outline: "none",
            resize: "vertical", fontFamily: "inherit",
          }}
        />
        <button
          onClick={submit}
          style={{
            height: "36px", padding: "0 14px",
            background: "#F59E0B", border: "none", borderRadius: "8px",
            color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Reply
        </button>
      </div>
    </div>
  );
}