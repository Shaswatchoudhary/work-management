import { STATUS_STEPS, STATUS_LABEL } from "../../constants/ticketStatus.ts";
import { Status } from "../../types";

interface StatusTimelineProps {
  status: Status;
}

export default function StatusTimeline({ status }: StatusTimelineProps) {
  const isRejected = status === "rejected_hr" || status === "rejected_admin";
  const idx = isRejected ? -1 : STATUS_STEPS.indexOf(status);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", overflowX: "auto", paddingBottom: "8px" }}>
      {STATUS_STEPS.map((s, i) => {
        const active  = i <= idx;
        const current = i === idx;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              borderRadius: "6px", padding: "4px 8px", fontSize: "10px", fontWeight: 500,
              border: current
                ? "0.5px solid #F59E0B"
                : active
                  ? "0.5px solid #BBF7D0"
                  : "0.5px solid #EDE9E0",
              background: current
                ? "#FFFBEB"
                : active
                  ? "#F0FDF4"
                  : "#FAFAF7",
              color: current
                ? "#92400E"
                : active
                  ? "#16A34A"
                  : "#AAA",
            }}>
              <span style={{
                width: "6px", height: "6px", borderRadius: "50%",
                background: current ? "#F59E0B" : active ? "#16A34A" : "#DDD",
                flexShrink: 0,
              }} />
              {STATUS_LABEL[s]}
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div style={{ height: "1px", width: "12px", background: i < idx ? "#BBF7D0" : "#EDE9E0" }} />
            )}
          </div>
        );
      })}
      {isRejected && (
        <div style={{ marginLeft: "8px", borderRadius: "6px", border: "0.5px solid #FECACA", background: "#FEF2F2", padding: "4px 8px", fontSize: "10px", fontWeight: 500, color: "#DC2626" }}>
          {STATUS_LABEL[status]}
        </div>
      )}
    </div>
  );
}