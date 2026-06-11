import { useState } from "react";
import { useAuthStore } from "../../store/authStore.ts";
import { useTicketStore } from "../../store/ticketStore.ts";
import { fmtRel } from "../../utils/dateFormatter.ts";
import { ROLE_LABEL } from "../../constants/roles.ts";
import "./CommentThread.scss";

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
    <div className="comment-thread">
      {/* Comment list */}
      <div className="comment-list">
        {ticket.comments.length === 0 && (
          <div className="empty-text">No activity yet.</div>
        )}
        {ticket.comments.map((c) => (
          <div key={c.id} className="comment-item">
            <div className="comment-meta">
              <span className="comment-role">
                {ROLE_LABEL[c.role] || c.role}
              </span>
              <span className="comment-time">{fmtRel(c.at)}</span>
            </div>
            <div className="comment-body">{c.text}</div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="comment-input-container">
        <textarea
          placeholder="Add a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          className="comment-textarea"
        />
        <button
          onClick={submit}
          className="comment-submit-btn"
        >
          Reply
        </button>
      </div>
    </div>
  );
}