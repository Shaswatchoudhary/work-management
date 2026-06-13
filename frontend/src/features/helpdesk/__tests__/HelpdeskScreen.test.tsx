import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import HelpdeskScreen from "../HelpdeskScreen";

// Mock Ticket Store
vi.mock("../../../store/ticketStore.ts", () => ({
  useTicketStore: (selector: any) =>
    selector({
      tickets: [
        {
          id: "TKT-1",
          title: "Printer Issue",
          location: "Office",
          category: "Maintenance",
          status: "pending_hr",
        },
        {
          id: "TKT-2",
          title: "Network Issue",
          location: "Floor 2",
          category: "IT",
          status: "closed",
        },
      ],
    }),
}));

// Mock AppShell
vi.mock("../../../components/layout/AppShell.tsx", () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

// Mock StatCard
vi.mock("../../../components/ui/StatCard.tsx", () => ({
  default: ({ label, value }: any) => (
    <div>
      {label}: {value}
    </div>
  ),
}));

// Mock TicketTable
vi.mock("../../tickets/TicketTable.tsx", () => ({
  default: () => <div>Ticket Table</div>,
}));

// Mock TicketDetail
vi.mock("../../tickets/TicketDetail.tsx", () => ({
  default: () => <div>Ticket Detail</div>,
}));

// Mock TicketForm
vi.mock("../../tickets/TicketForm.tsx", () => ({
  default: () => <div>Ticket Form</div>,
}));

describe("HelpdeskScreen", () => {
  const renderScreen = () =>
    render(
      <MemoryRouter>
        <HelpdeskScreen />
      </MemoryRouter>
    );

  it("renders dashboard title", () => {
    renderScreen();

    expect(
      screen.getByText("Help Desk Dashboard")
    ).toBeInTheDocument();
  });

  it("renders stats cards", () => {
    renderScreen();

    expect(screen.getByText(/Total:/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending:/i)).toBeInTheDocument();
    expect(screen.getByText(/Closed:/i)).toBeInTheDocument();
  });

  it("renders recently updated section", () => {
    renderScreen();

    expect(
      screen.getByText("Recently updated")
    ).toBeInTheDocument();
  });
});