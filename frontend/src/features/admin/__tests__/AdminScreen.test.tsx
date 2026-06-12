import { describe, test, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminScreen from "../AdminScreen";
import { useAuthStore } from "../../../store/authStore";
import { useTicketStore } from "../../../store/ticketStore";

describe("AdminScreen", () => {
  beforeEach(() => {
    // Set authenticated user to Admin
    useAuthStore.setState({
      user: {
        id: "u-admin",
        name: "Suresh Verma",
        email: "admin@company.com",
        role: "admin",
        department: "Administration",
      },
      hasHydrated: true,
    });
    // Reset tickets to default mock data
    useTicketStore.getState().reset();
  });

  test("Admin Screen renders with dashboard headers and stat cards", () => {
    render(
      <MemoryRouter>
        <AdminScreen />
      </MemoryRouter>
    );

    // Verify headers and dashboard labels
    expect(screen.getByRole("heading", { name: /Final Approval Queue/i })).toBeInTheDocument();
    expect(screen.getByText("Awaiting Approval")).toBeInTheDocument();
    expect(screen.getByText("Payment Pending")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });
});