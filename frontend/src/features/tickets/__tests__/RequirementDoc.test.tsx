import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import RequirementDoc from "../RequirementDoc";
import { Ticket } from "../../../types";

const mockTicketComplete: Ticket = {
  id: "TKT-1001",
  title: "Server Repair",
  category: "IT Support",
  priority: "High",
  location: "Data Center Room 4",
  estimatedCost: 15000,
  status: "closed",
  createdBy: "u-helpdesk",
  createdAt: "2026-06-09T10:00:00.000Z",
  updatedAt: "2026-06-09T12:00:00.000Z",
  tags: ["Network", "Urgent"],
  description: "Replaced faulty switch board.",
  assignee: {
    name: "Ramesh Kumar",
    department: "Network Operations",
  },
  inspection: null,
  payment: null,
  comments: [],
  signatures: {
    hrApproval: {
      signedBy: "Priya Sharma",
      role: "HR Manager",
      userId: "u-hr",
      purpose: "hr_approval",
      ticketId: "TKT-1001",
      signedAt: "2026-06-09T10:30:00.000Z",
      hash: "9F25C0C7",
      deviceHint: "device-hint",
      signatureImage: "data:image/png;base64,hrsig",
    },
    adminApproval: {
      signedBy: "Suresh Verma",
      role: "Administrator",
      userId: "u-admin",
      purpose: "admin_approval",
      ticketId: "TKT-1001",
      signedAt: "2026-06-09T11:00:00.000Z",
      hash: "940DB80E",
      deviceHint: "device-hint",
      signatureImage: "data:image/png;base64,adminsig",
    },
  },
  pdfs: [],
};

const mockTicketUnsigned: Ticket = {
  id: "TKT-1002",
  title: "Leak Repair",
  category: "Maintenance",
  priority: "Low",
  location: "First Floor",
  estimatedCost: 0,
  status: "pending_hr",
  createdBy: "u-helpdesk",
  createdAt: "2026-06-09T10:00:00.000Z",
  updatedAt: "2026-06-09T10:00:00.000Z",
  tags: [],
  description: "",
  assignee: null,
  inspection: null,
  payment: null,
  comments: [],
  signatures: {},
  pdfs: [],
};

describe("RequirementDoc", () => {
  it("renders document details with complete data and active signatures", () => {
    render(<RequirementDoc ticket={mockTicketComplete} />);

    // Header info
    expect(screen.getByText("TKT-1001")).toBeInTheDocument();
    expect(screen.getByText("Server Repair")).toBeInTheDocument();
    expect(screen.getByText("IT Support")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Data Center Room 4")).toBeInTheDocument();
    expect(screen.getByText(/₹15,000/i)).toBeInTheDocument();
    expect(screen.getByText("Network, Urgent")).toBeInTheDocument();
    expect(screen.getByText("Ramesh Kumar (Network Operations)")).toBeInTheDocument();
    expect(screen.getByText("Replaced faulty switch board.")).toBeInTheDocument();

    // Check signed card signatures
    expect(screen.getByAltText(/HR Approval signature/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Admin Approval signature/i)).toBeInTheDocument();
    expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
    expect(screen.getByText("Suresh Verma")).toBeInTheDocument();
    expect(screen.getByText("Hash: 9F25C0C7")).toBeInTheDocument();
    expect(screen.getByText("Hash: 940DB80E")).toBeInTheDocument();

    // Remaining signatures should show pending
    const pendingSigns = screen.getAllByText("Pending signature");
    expect(pendingSigns.length).toBe(2);
  });

  it("renders pending and empty values correctly for unsigned ticket", () => {
    render(<RequirementDoc ticket={mockTicketUnsigned} />);

    expect(screen.getByText("TKT-1002")).toBeInTheDocument();
    expect(screen.getByText("Leak Repair")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Not yet signed").length).toBe(4);
  });
});
