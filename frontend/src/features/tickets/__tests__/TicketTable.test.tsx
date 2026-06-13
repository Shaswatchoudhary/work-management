import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TicketTable from "../TicketTable";
import { Ticket } from "../../../types";

const mockTickets: Ticket[] = [
  {
    id: "TKT-1001",
    title: "Printer Repair",
    category: "Maintenance",
    priority: "Low",
    location: "Office Room 12",
    estimatedCost: 200,
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
  },
  {
    id: "TKT-1002",
    title: "Database Server Down",
    category: "IT Support",
    priority: "Critical",
    location: "Data Center Room 1",
    estimatedCost: 1500,
    status: "closed",
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
  },
];

describe("TicketTable", () => {
  it("renders empty state message when tickets list is empty", () => {
    render(<TicketTable tickets={[]} onOpen={vi.fn()} emptyText="No pending work" />);
    expect(screen.getByText("No pending work")).toBeInTheDocument();
  });

  it("renders table headers and ticket rows", () => {
    const onOpen = vi.fn();
    render(<TicketTable tickets={mockTickets} onOpen={onOpen} />);

    // Headers
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();

    // Data rows
    expect(screen.getByText("TKT-1001")).toBeInTheDocument();
    expect(screen.getByText("Printer Repair")).toBeInTheDocument();
    expect(screen.getByText("TKT-1002")).toBeInTheDocument();
    expect(screen.getByText("Database Server Down")).toBeInTheDocument();

    // Check priorities and statuses text
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.getByText("Critical")).toBeInTheDocument();
    expect(screen.getByText("pending hr")).toBeInTheDocument();
    expect(screen.getByText("closed")).toBeInTheDocument();

    // Verify row click triggers onOpen
    const row = screen.getByText("TKT-1001").closest("tr");
    expect(row).not.toBeNull();
    fireEvent.click(row!);
    expect(onOpen).toHaveBeenCalledWith("TKT-1001");
  });
});
