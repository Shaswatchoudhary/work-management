import { useRef, useState } from "react";
import SignatureBlock from "../signature/SignatureBlock";
import { generatePDF, TicketData } from "../pdf/generatePDF";



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
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Ticket details – styled with Tailwind (allowed) */}
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {mockTicket.title} — Requirement Document
        </h1>
        <div className="grid grid-cols-2 gap-4 text-sm">
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
          <div className="col-span-2">
            <strong>Tags:</strong> {mockTicket.tags}
          </div>
        </div>

        {/* Description block */}
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <p className="text-gray-800">{mockTicket.description}</p>
        </div>
      </div>

      {/* Visible signature preview – captured for the PDF */}
      <div className="max-w-4xl mx-auto mb-6">
        <SignatureBlock ref={sigRef} />
      </div>

      {/* Action button + status */}
      <div className="max-w-4xl mx-auto flex items-center">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`px-6 py-2 rounded-md text-white font-medium focus:outline-none transition ${loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700"
            }`}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-2 inline-block"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
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
            className={`ml-4 text-sm font-medium ${statusType === "error"
              ? "text-red-600"
              : statusType === "done"
                ? "text-green-600"
                : "text-blue-600"
              }`}
          >
            {statusMsg}
          </p>
        )}
      </div>
    </div>
  );
}
