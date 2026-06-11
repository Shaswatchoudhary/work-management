import { STATUS_STEPS, STATUS_LABEL } from "../../constants/ticketStatus.ts";
import { Status } from "../../types";
import "./styles/StatusTimeline.scss";

interface StatusTimelineProps {
  status: Status;
}

export default function StatusTimeline({ status }: StatusTimelineProps) {
  const isRejected = status === "rejected_hr" || status === "rejected_admin";
  const idx = isRejected ? -1 : STATUS_STEPS.indexOf(status);

  return (
    <div className="status-timeline-container">
      {STATUS_STEPS.map((s, i) => {
        const active  = i <= idx;
        const current = i === idx;
        return (
          <div key={s} className="step-wrapper">
            <div
              className={`step-badge ${current ? "is-current" : active ? "is-active" : ""}`}
            >
              <span className="dot" />
              {STATUS_LABEL[s]}
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div
                className={`connecting-line ${i < idx ? "is-passed" : ""}`}
              />
            )}
          </div>
        );
      })}
      {isRejected && (
        <div className="rejected-badge">
          {STATUS_LABEL[status]}
        </div>
      )}
    </div>
  );
}