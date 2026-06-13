import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TicketForm from "../TicketForm";
import { useTicketStore } from "../../../store/ticketStore";
import { useAuthStore } from "../../../store/authStore";

import { createMockTicket } from "./utils/mockTicket";

// Mock pdf generator
vi.mock("../../pdf/generatePDF", () => {
  return {
    generateAndDownloadPdf: vi.fn(async () => "data:application/pdf;base64,mockpdf"),
    ticketToTicketData: vi.fn(),
  };
});

describe("TicketForm", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    ticket: null,
  };

  const mockUser = {
    id: "u-helpdesk",
    name: "Suresh",
    role: "helpdesk" as const,
    email: "suresh@example.com",
    department: "IT",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser });
    useTicketStore.setState({
      tickets: [],
    });
  });

  it("renders new request form with empty fields", () => {
    render(<TicketForm {...defaultProps} />);

    expect(screen.getByText("New Request")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Short summary of the request")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Submit & Generate PDF/i })).toBeInTheDocument();
  });

  it("alerts user if required fields are missing", () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<TicketForm {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /Submit & Generate PDF/i }));
    expect(alertMock).toHaveBeenCalledWith("Title, location and description are required.");
    
    alertMock.mockRestore();
  });

  it("submits new request and triggers store actions", async () => {
    const addTicketSpy = vi.spyOn(useTicketStore.getState(), "addTicket");
    const onClose = vi.fn();
    
    render(<TicketForm {...defaultProps} onClose={onClose} />);

    fireEvent.change(screen.getByPlaceholderText("Short summary of the request"), {
      target: { value: "Broken chair" },
    });
    fireEvent.change(screen.getByPlaceholderText("Tower A, Floor 3..."), {
      target: { value: "3rd Floor Room 3" },
    });
    fireEvent.change(screen.getByPlaceholderText("Detailed problem statement..."), {
      target: { value: "The leg is broken" },
    });
    
    // Toggle a tag
    fireEvent.click(screen.getByRole("button", { name: "Urgent" }));

    fireEvent.click(screen.getByRole("button", { name: /Submit & Generate PDF/i }));

    await waitFor(() => {
      expect(addTicketSpy).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("renders and handles edit mode", async () => {
    const updateTicketSpy = vi.spyOn(useTicketStore.getState(), "updateTicket");
    const onClose = vi.fn();
      const existingTicket = createMockTicket({
        id: "TKT-1001",
        title: "Broken mouse",
        priority: "Low",
        location: "Office",
        estimatedCost: 100,
        status: "work_in_progress",
        description: "Mouse scroll is broken",
        signatures: {},
        pdfs: [],
        ...{},
      });

    render(<TicketForm {...defaultProps} onClose={onClose} ticket={existingTicket} />);

    expect(screen.getByText("Edit TKT-1001")).toBeInTheDocument();
    
    // Edit title
    fireEvent.change(screen.getByDisplayValue("Broken mouse"), {
      target: { value: "Broken mouse edited" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(updateTicketSpy).toHaveBeenCalledWith("TKT-1001", expect.objectContaining({
        title: "Broken mouse edited"
      }));
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("resubmits ticket with updated status and notifies HR when previously rejected", async () => {
    const setStatusSpy = vi.spyOn(useTicketStore.getState(), "setStatus");
    const onClose = vi.fn();
      const rejectedTicket = createMockTicket({
        id: "TKT-1002",
        title: "Wall leakage",
        priority: "Medium",
        location: "Basement",
        estimatedCost: 5000,
        status: "rejected_hr",
        description: "Water leaking near pipes",
        signatures: {
          hrApproval: {
            signedBy: "Priya Sharma",
            role: "HR Manager",
            userId: "u-hr",
            purpose: "hr_approval",
            ticketId: "TKT-1002",
            signedAt: new Date().toISOString(),
            hash: "ABC",
            deviceHint: "hint",
            signatureImage: "img",
          },
        },
        pdfs: [],
        ...{},
      });

    render(<TicketForm {...defaultProps} onClose={onClose} ticket={rejectedTicket} />);

    fireEvent.click(screen.getByRole("button", { name: /Save & Resubmit/i }));

    await waitFor(() => {
      expect(setStatusSpy).toHaveBeenCalledWith("TKT-1002", "pending_hr", expect.any(Object));
      expect(onClose).toHaveBeenCalled();
    });
  });
});
