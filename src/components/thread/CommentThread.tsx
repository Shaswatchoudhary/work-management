import { useState } from "react";
import { useAuthStore } from "../../store/authStore.ts";
import { useTicketStore } from "../../store/ticketStore.ts";
import { fmtRel } from "../../utils/dateFormatter.ts";
import { ROLE_LABEL } from "../../constants/roles.ts";
import { Textarea } from "../ui/Field.tsx";
import Button from "../ui/CustomButton.tsx";

interface CommentThreadProps {
  ticketId: string;
}

export default function CommentThread({ ticketId }: CommentThreadProps) {
  const user = useAuthStore((s) => s.user);
  const ticket = useTicketStore((s) => s.tickets.find((t) => t.id === ticketId));
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
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {ticket.comments.length === 0 && (
          <div className="text-xs text-muted-foreground">No activity yet.</div>
        )}
        {ticket.comments.map((c) => (
          <div key={c.id} className="rounded-md border border-border bg-[#0f0f0f] p-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{ROLE_LABEL[c.role] || c.role}</span>
                <span className="text-muted-foreground">{fmtRel(c.at)}</span>
              </div>
            </div>
            <div className="mt-1 text-sm">{c.text}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Textarea
          placeholder="Add a comment..."
          value={text}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
          className="min-h-[60px]"
        />
        <Button onClick={submit}>Reply</Button>
      </div>
    </div>
  );
}
