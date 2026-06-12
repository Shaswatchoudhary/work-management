import { describe, test, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AppRouter from "../AppRouter";
import { useAuthStore } from "../../store/authStore";
import { useTicketStore } from "../../store/ticketStore";
import { useNotificationStore } from "../../store/notificationStore";

describe("AppRouter", () => {
  beforeEach(() => {
    // Reset state before each test
    useAuthStore.getState().logout();
    useAuthStore.setState({ hasHydrated: true });
    useTicketStore.getState().reset();
    useNotificationStore.setState({ notifications: [] });
    localStorage.clear();
  });

  test("shows loading spinner when store has not hydrated", () => {
    useAuthStore.setState({ hasHydrated: false });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("renders login page when not logged in and accessing /login", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /Welcome back/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@company.com")).toBeInTheDocument();
  });

  test("renders registration page when not logged in and accessing /register", () => {
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /Create account/i })).toBeInTheDocument();
  });

  test("redirects unauthenticated users to /login when visiting root", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /Welcome back/i })).toBeInTheDocument();
  });

  test("renders dashboard when logged in as helpdesk and accessing /helpdesk", () => {
    // Mock logged-in helpdesk user
    useAuthStore.setState({
      user: {
        id: "u-helpdesk",
        name: "Arjun Mehta",
        email: "helpdesk@company.com",
        role: "helpdesk",
        department: "Facilities",
      },
    });

    render(
      <MemoryRouter initialEntries={["/helpdesk"]}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /Help Desk Dashboard/i })).toBeInTheDocument();
  });

  test("redirects logged-in helpdesk user to /helpdesk when visiting root", () => {
    useAuthStore.setState({
      user: {
        id: "u-helpdesk",
        name: "Arjun Mehta",
        email: "helpdesk@company.com",
        role: "helpdesk",
        department: "Facilities",
      },
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /Help Desk Dashboard/i })).toBeInTheDocument();
  });

  test("redirects logged-in user away from /login to their home dashboard", () => {
    useAuthStore.setState({
      user: {
        id: "u-helpdesk",
        name: "Arjun Mehta",
        email: "helpdesk@company.com",
        role: "helpdesk",
        department: "Facilities",
      },
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /Help Desk Dashboard/i })).toBeInTheDocument();
  });
});
