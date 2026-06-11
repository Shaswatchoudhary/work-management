import { useRef, useState } from "react";
import SignatureBlock from "../signature/SignatureBlock";
import { generatePDF, TicketData } from "../pdf/generatePDF";
import "./styles/TicketPDFPage.scss";

const mockTicket: TicketData = {
  id: "TKT-1017",
  title: "amaa",
  category: "Maintenance",
  priority: "High",
  location: "3rd Floor Room 302",
  cost: "₹12000",
  status: "Closed",
  raisedBy: "Rahul Mehta",
  raisedAt: "08 Jun 2026",
  tags: "HVAC · Urgent",
  description:
    "AC unit in Room 302 not cooling since last week. Temp above 28°C.",
  submittedAt: "01 Jun 2026",
  hrApprovedAt: "02 Jun 2026",
  adminApprovedAt: "03 Jun 2026",
  workDoneAt: "05 Jun 2026",
  inspectedAt: "06 Jun 2026",
  closedAt: "08 Jun 2026",
};

export default function TicketPDFPage() {
  // Ref used by html2canvas (passed to generatePDF)
  const sigRef = useRef<HTMLDivElement | null>(null);

  // UI state for button / status messages
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState<
    "processing" | "done" | "error"
  >("processing");

  /** Called when the user clicks the “Process & Download PDF” button */
  const handleGenerate = async () => {
    setLoading(true);
    setStatusMsg("");
    try {
      await generatePDF(mockTicket, {
        onStatus: (msg, type) => {
          setStatusMsg(msg);
          setStatusType(type);
        },
      });
    } catch {
      // generatePDF already set an error status
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pdf-page-container">
      {/* Ticket details */}
      <div className="pdf-doc-card">
        <h1 className="pdf-doc-title">
          {mockTicket.title} — Requirement Document
        </h1>
        <div className="pdf-details-grid">
          <div>
            <strong>Ticket ID:</strong> {mockTicket.id}
          </div>
          <div>
            <strong>Category:</strong> {mockTicket.category}
          </div>
          <div>
            <strong>Priority:</strong> {mockTicket.priority}
          </div>
          <div>
            <strong>Location:</strong> {mockTicket.location}
          </div>
          <div>
            <strong>Est. Cost:</strong> {mockTicket.cost}
          </div>
          <div>
            <strong>Status:</strong> {mockTicket.status}
          </div>
          <div>
            <strong>Raised By:</strong> {mockTicket.raisedBy}
          </div>
          <div>
            <strong>Raised At:</strong> {mockTicket.raisedAt}
          </div>
          <div className="span-full">
            <strong>Tags:</strong> {mockTicket.tags}
          </div>
        </div>

        {/* Description block */}
        <div className="pdf-desc-block">
          <p className="desc-text">{mockTicket.description}</p>
        </div>
      </div>

      {/* Visible signature preview */}
      <div className="pdf-preview-wrapper">
        <SignatureBlock ref={sigRef} />
      </div>

      {/* Action button + status */}
      <div className="pdf-actions-bar">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn-pdf-download"
        >
          {loading ? (
            <>
              <svg
                className="spinner-icon"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="spinner-bg"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="spinner-fill"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
              Processing…
            </>
          ) : (
            "Process & Download PDF"
          )}
        </button>

        {statusMsg && (
          <p
            className={`pdf-status-msg ${statusType === "error"
              ? "is-error"
              : statusType === "done"
                ? "is-done"
                : ""
              }`}
          >
            {statusMsg}
          </p>
        )}
      </div>
    </div>
  );
}

