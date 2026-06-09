import { STATUS_STEPS, STATUS_LABEL } from "../../constants/ticketStatus.ts";
import { Status } from "../../types";

interface StatusTimelineProps {
  status: Status;
}

export default function StatusTimeline({ status }: StatusTimelineProps) {
  const isRejected = status === "rejected_hr" || status === "rejected_admin";
  const idx = isRejected ? -1 : STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {STATUS_STEPS.map((s, i) => {
        const active = i <= idx;
        const current = i === idx;
        return (
          <div key={s} className="flex items-center gap-1 shrink-0">
            <div
              className={`flex items-center gap-2 rounded-md px-2 py-1 text-[10px] font-medium border ${
                current
                  ? "bg-[#4f6ef7]/15 border-[#4f6ef7] text-[#7d94f9]"
                  : active
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                    : "bg-[#0f0f0f] border-border text-muted-foreground"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${active ? "bg-current" : "bg-muted-foreground/40"}`}
              />
              {STATUS_LABEL[s]}
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`h-px w-3 ${i < idx ? "bg-emerald-500/50" : "bg-border"}`} />
            )}
          </div>
        );
      })}
      {isRejected && (
        <div className="ml-2 rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-[10px] font-medium text-red-400">
          {STATUS_LABEL[status]}
        </div>
      )}
    </div>
  );
}
