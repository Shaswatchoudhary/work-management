import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import HrScreen from "../HrScreen";

// Mock Ticket Store
vi.mock("../../../store/ticketStore.ts", () => ({
  useTicketStore: (selector: any) =>
    selector({
      tickets: [
        {
          id: "TKT-1",
          title: "Printer Issue",
          status: "pending_hr",
        },
        {
          id: "TKT-2",
          title: "Network Issue",
          status: "rejected_hr",
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

describe("HrScreen", () => {
  const renderScreen = () =>
    render(
      <MemoryRouter>
        <HrScreen />
      </MemoryRouter>
    );

  it("renders HR review queue title", () => {
    renderScreen();

    expect(
      screen.getByText("HR Review Queue")
    ).toBeInTheDocument();
  });

  it("renders statistics cards", () => {
    renderScreen();

    expect(
      screen.getByText(/Awaiting Review:/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Inspection Co-Sign:/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Approved Today:/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Rejected/i)
    ).toBeInTheDocument();
  });

  it("renders ticket table", () => {
    renderScreen();

    expect(
      screen.getByText("Ticket Table")
    ).toBeInTheDocument();
  });
});