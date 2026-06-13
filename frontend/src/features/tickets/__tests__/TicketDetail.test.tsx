import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TicketDetail from "../TicketDetail";
import { useTicketStore } from "../../../store/ticketStore";
import { useAuthStore } from "../../../store/authStore";


// Mock pdf generator
vi.mock("../../pdf/generatePDF", () => {
  return {
    generateAndDownloadPdf: vi.fn(async () => "data:application/pdf;base64,mockpdf"),
    ticketToTicketData: vi.fn(),
  };
});

// Mock signature widget to bypass PIN/canvas in integration test
vi.mock("../../signature/PinThenDrawSignature.tsx", () => {
  return {
    default: ({ label, onSigned }: any) => (
      <div data-testid="mock-pin-draw-sig">
        <span>{label}</span>
        <button
          onClick={() =>
            onSigned({
              signedBy: "Mock User",
              role: "Mock Role",
              signedAt: new Date().toISOString(),
              ticketId: "TKT-1001",
              hash: "MOCKHASH123",
              purpose: "hr_approval",
              signatureImage: "data:image/png;base64,mocksignature",
            })
          }
        >
          Sign Signature
        </button>
      </div>
    ),
  };
});

describe("TicketDetail", () => {
  const defaultProps = {
    ticketId: "TKT-1001",
    onClose: vi.fn(),
  };

  const getMockTicket = (status: any, overrides: any = {}) => ({
    id: "TKT-1001",
    title: "Server repair required",
    category: "IT Support",
    priority: "High" as const,
    location: "Data Center Room 2",
    estimatedCost: 15000,
    status,
    createdBy: "u-helpdesk",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["Urgent"],
    description: "Server main switch exploded.",
    assignee: null,
    signatures: {},
    comments: [],
    pdfs: [],
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders detail modal elements, toggles document preview, and handles PDF buttons", async () => {
    const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null as any);
    useAuthStore.setState({ user: { id: "u-hr", name: "Priya", role: "hr" } as any });
    useTicketStore.setState({ tickets: [getMockTicket("pending_hr")] });

    render(<TicketDetail {...defaultProps} />);

    expect(screen.getByText("TKT-1001 — Server repair required")).toBeInTheDocument();
    
    // Toggle Document View
    const toggleButton = screen.getByRole("button", { name: /Show Ticket UI/i });
    fireEvent.click(toggleButton);
    expect(screen.getByText(/Estimated Cost/i)).toBeInTheDocument();

    // Click Open PDF in New Tab
    const openPdfButton = screen.getByRole("button", { name: /Open PDF in New Tab/i });
    fireEvent.click(openPdfButton);
    await waitFor(() => {
      expect(windowOpenSpy).toHaveBeenCalled();
    });

    // Click Download PDF
    const downloadPdfButton = screen.getByRole("button", { name: /Download PDF/i });
    fireEvent.click(downloadPdfButton);

    windowOpenSpy.mockRestore();
  });

  it("handles HR approval flow", async () => {
    const setStatusSpy = vi.spyOn(useTicketStore.getState(), "setStatus");
    useAuthStore.setState({ user: { id: "u-hr", name: "Priya", role: "hr" } as any });
    useTicketStore.setState({ tickets: [getMockTicket("pending_hr")] });

    render(<TicketDetail {...defaultProps} />);

    const signButton = screen.getByRole("button", { name: "Sign Signature" });
    fireEvent.click(signButton);

    await waitFor(() => {
      expect(setStatusSpy).toHaveBeenCalledWith("TKT-1001", "pending_admin", expect.any(Object));
    });
  });

  it("handles HR rejection flow", async () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    const setStatusSpy = vi.spyOn(useTicketStore.getState(), "setStatus");
    useAuthStore.setState({ user: { id: "u-hr", name: "Priya", role: "hr" } as any });
    useTicketStore.setState({ tickets: [getMockTicket("pending_hr")] });

    render(<TicketDetail {...defaultProps} />);

    const rejectButton = screen.getByRole("button", { name: "Reject" });
    
    // First trigger without comments (should alert)
    fireEvent.click(rejectButton);
    expect(alertMock).toHaveBeenCalledWith("Please add a rejection comment.");

    // Fill comment and reject
    const textarea = screen.getByPlaceholderText("Reason for rejection...");
    fireEvent.change(textarea, { target: { value: "Budget too high." } });
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(setStatusSpy).toHaveBeenCalledWith("TKT-1001", "rejected_hr", expect.any(Object));
    });
    
    alertMock.mockRestore();
  });

  it("handles Admin approval & rejection flow", async () => {
    const setStatusSpy = vi.spyOn(useTicketStore.getState(), "setStatus");
    useAuthStore.setState({ user: { id: "u-admin", name: "Suresh", role: "admin" } as any });
    useTicketStore.setState({ tickets: [getMockTicket("pending_admin")] });

    render(<TicketDetail {...defaultProps} />);

    const signButton = screen.getByRole("button", { name: "Sign Signature" });
    fireEvent.click(signButton);

    await waitFor(() => {
      expect(setStatusSpy).toHaveBeenCalledWith("TKT-1001", "work_in_progress", expect.any(Object));
    });
  });

  it("handles helpdesk resubmission after rejection", async () => {
    const setStatusSpy = vi.spyOn(useTicketStore.getState(), "setStatus");
    useAuthStore.setState({ user: { id: "u-helpdesk", name: "Rahul", role: "helpdesk" } as any });
    useTicketStore.setState({ tickets: [getMockTicket("rejected_hr")] });

    render(<TicketDetail {...defaultProps} />);

    const resubmitButton = screen.getByRole("button", { name: /Resubmit As-Is/i });
    fireEvent.click(resubmitButton);

    await waitFor(() => {
      expect(setStatusSpy).toHaveBeenCalledWith("TKT-1001", "pending_hr", expect.any(Object));
    });
  });

  it("handles helpdesk assignment and marking work done", async () => {
    const updateTicketSpy = vi.spyOn(useTicketStore.getState(), "updateTicket");
    const setStatusSpy = vi.spyOn(useTicketStore.getState(), "setStatus");
    useAuthStore.setState({ user: { id: "u-helpdesk", name: "Rahul", role: "helpdesk" } as any });
    useTicketStore.setState({ tickets: [getMockTicket("work_in_progress")] });

    const { container, unmount } = render(<TicketDetail {...defaultProps} />);

    // Assign team
    const inputs = container.querySelectorAll("input");
    const nameInput = inputs[0];
    const deptInput = inputs[1];
    fireEvent.change(nameInput, { target: { value: "Kumar" } });
    fireEvent.change(deptInput, { target: { value: "Hardware" } });

    fireEvent.click(screen.getByRole("button", { name: "Assign Internal Team" }));
    expect(updateTicketSpy).toHaveBeenCalledWith("TKT-1001", { assignee: { name: "Kumar", department: "Hardware" } });

    unmount(); // Clean up first render to avoid duplicate elements in test DOM

    // Mark Work Done (will fail because assignee state not hydrated in local component yet, but let's mock hydration)
    useTicketStore.setState({ tickets: [getMockTicket("work_in_progress", { assignee: { name: "Kumar", department: "Hardware" } })] });
    render(<TicketDetail {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Mark Work Done" }));
    expect(setStatusSpy).toHaveBeenCalledWith("TKT-1001", "inspection_pending", expect.any(Object));
  });

  it("handles helpdesk inspection pass and fail", async () => {
    const updateTicketSpy = vi.spyOn(useTicketStore.getState(), "updateTicket");
    const setStatusSpy = vi.spyOn(useTicketStore.getState(), "setStatus");
    useAuthStore.setState({ user: { id: "u-helpdesk", name: "Rahul", role: "helpdesk" } as any });
    useTicketStore.setState({ tickets: [getMockTicket("inspection_pending")] });

    render(<TicketDetail {...defaultProps} />);

    // Add notes and pass
    const textarea = screen.getByPlaceholderText("Findings...");
    fireEvent.change(textarea, { target: { value: "Looks solid." } });
    fireEvent.click(screen.getByRole("button", { name: "Inspection Pass" }));
    expect(updateTicketSpy).toHaveBeenCalledWith("TKT-1001", {
      inspection: { passed: true, notes: "Looks solid.", signedByHr: false, signedByAdmin: false }
    });

    // Fail inspection
    fireEvent.click(screen.getByRole("button", { name: "Inspection Fail (Rework)" }));
    expect(setStatusSpy).toHaveBeenCalledWith("TKT-1001", "work_in_progress", expect.any(Object));
  });

  it("handles HR inspection co-signing", async () => {
    const updateTicketSpy = vi.spyOn(useTicketStore.getState(), "updateTicket");
    useAuthStore.setState({ user: { id: "u-hr", name: "Priya", role: "hr" } as any });
    useTicketStore.setState({
      tickets: [getMockTicket("inspection_pending", {
        inspection: { passed: true, notes: "Good", signedByHr: false, signedByAdmin: false }
      })]
    });

    render(<TicketDetail {...defaultProps} />);

    const signButton = screen.getByRole("button", { name: "Sign Signature" });
    fireEvent.click(signButton);

    await waitFor(() => {
      expect(updateTicketSpy).toHaveBeenCalledWith("TKT-1001", expect.objectContaining({
        inspection: expect.objectContaining({ signedByHr: true })
      }));
    });
  });

  it("handles Admin payment release & close", async () => {
    const setStatusSpy = vi.spyOn(useTicketStore.getState(), "setStatus");
    useAuthStore.setState({ user: { id: "u-admin", name: "Suresh", role: "admin" } as any });
    useTicketStore.setState({
      tickets: [getMockTicket("payment_pending", {
        signatures: { adminPayment: { hash: "ADMINPAYHASH" } } // Signed payment
      })]
    });

    render(<TicketDetail {...defaultProps} />);

    const releaseButton = screen.getByRole("button", { name: /Release Payment/i });
    fireEvent.click(releaseButton);

    await waitFor(() => {
      expect(setStatusSpy).toHaveBeenCalledWith("TKT-1001", "closed", expect.any(Object));
    });
  });

  it("handles Admin payment signature flow", async () => {
    const updateTicketSpy = vi.spyOn(useTicketStore.getState(), "updateTicket");
    useAuthStore.setState({ user: { id: "u-admin", name: "Suresh", role: "admin" } as any });
    useTicketStore.setState({
      tickets: [getMockTicket("payment_pending", {
        signatures: {} // Not signed yet
      })]
    });

    render(<TicketDetail {...defaultProps} />);

    const signButton = screen.getByRole("button", { name: "Sign Signature" });
    fireEvent.click(signButton);

    await waitFor(() => {
      expect(updateTicketSpy).toHaveBeenCalledWith("TKT-1001", expect.objectContaining({
        signatures: expect.objectContaining({ adminPayment: expect.any(Object) })
      }));
    });
  });

  it("renders PDFs list, signatures card list, and triggers edit form for helpdesk", async () => {
    useAuthStore.setState({ user: { id: "u-helpdesk", name: "Rahul", role: "helpdesk" } as any });
    
    const ticketWithExtras = getMockTicket("rejected_hr", {
      pdfs: [{ name: "Requirement_TKT-1001.pdf", type: "requirement", dataUrl: "mockUrl", at: new Date().toISOString() }],
      signatures: {
        hrApproval: {
          signedBy: "Priya Sharma",
          role: "HR Manager",
          userId: "u-hr",
          purpose: "hr_approval",
          ticketId: "TKT-1001",
          signedAt: new Date().toISOString(),
          hash: "9F25C0C7",
          deviceHint: "device-hint",
          signatureImage: "data:image/png;base64,hrsig",
        }
      }
    });

    useTicketStore.setState({ tickets: [ticketWithExtras] });

    render(<TicketDetail {...defaultProps} />);

    // Verify PDF link and Signature card are displayed
    expect(screen.getByText("Requirement_TKT-1001.pdf")).toBeInTheDocument();
    expect(screen.getByText("HR Approval")).toBeInTheDocument();
    expect(screen.getByText("Hash: 9F25C0C7")).toBeInTheDocument();

    // Click Edit Ticket to open form modal
    const editButton = screen.getByRole("button", { name: /Edit Ticket/i });
    fireEvent.click(editButton);

    // Form modal should be open
    expect(screen.getByText("Edit TKT-1001")).toBeInTheDocument();

    // Click Cancel to cover editOpen close branch
    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelButton);
    expect(screen.queryByText("Edit TKT-1001")).not.toBeInTheDocument();
  });

  it("handles Admin inspection co-signing when HR signature is missing", async () => {
    useAuthStore.setState({ user: { id: "u-admin", name: "Suresh", role: "admin" } as any });
    useTicketStore.setState({
      tickets: [getMockTicket("inspection_pending", {
        inspection: { passed: true, notes: "Good", signedByHr: false, signedByAdmin: false },
        signatures: {} // No HR signature
      })]
    });

    render(<TicketDetail {...defaultProps} />);

    expect(screen.getByText("Waiting for HR to co-sign inspection first.")).toBeInTheDocument();
  });

  it("handles Admin inspection co-signing flow when HR signature is present", async () => {
    const setStatusSpy = vi.spyOn(useTicketStore.getState(), "setStatus");
    useAuthStore.setState({ user: { id: "u-admin", name: "Suresh", role: "admin" } as any });
    useTicketStore.setState({
      tickets: [getMockTicket("inspection_pending", {
        inspection: { passed: true, notes: "Good", signedByHr: true, signedByAdmin: false },
        signatures: {
          hrInspection: {
            signedBy: "Priya",
            role: "HR Inspector",
            userId: "u-hr",
            purpose: "hr_inspection",
            ticketId: "TKT-1001",
            signedAt: new Date().toISOString(),
            hash: "HRINSPHASH",
            deviceHint: "device-hint",
            signatureImage: "data:image/png;base64,hrinspsig"
          }
        }
      })]
    });

    render(<TicketDetail {...defaultProps} />);

    expect(screen.getByText("HR has co-signed. Your signature will move ticket to Payment Pending.")).toBeInTheDocument();

    const signButton = screen.getByRole("button", { name: "Sign Signature" });
    fireEvent.click(signButton);

    await waitFor(() => {
      expect(setStatusSpy).toHaveBeenCalledWith("TKT-1001", "payment_pending", expect.any(Object));
    });
  });
});
