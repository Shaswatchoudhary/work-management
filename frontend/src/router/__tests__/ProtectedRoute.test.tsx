import { describe, test, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoute";
import { useAuthStore } from "../../store/authStore";

describe("ProtectedRoute", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    useAuthStore.setState({ hasHydrated: true });
    localStorage.clear();
  });

  test("renders empty container during hydration", () => {
    useAuthStore.setState({ hasHydrated: false });

    render(
      <MemoryRouter>
        <ProtectedRoute role="helpdesk">
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  test("redirects to login if user is not authenticated", () => {
    render(
      <MemoryRouter initialEntries={["/helpdesk"]}>
        <Routes>
          <Route
            path="/helpdesk"
            element={
              <ProtectedRoute role="helpdesk">
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Login Screen")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  test("redirects to user home dashboard if role mismatch occurs", () => {
    // Mock logged in user as HR
    useAuthStore.setState({
      user: {
        id: "u-hr",
        name: "Priya Sharma",
        email: "hr@company.com",
        role: "hr",
        department: "Human Resources",
      },
    });

    render(
      <MemoryRouter initialEntries={["/helpdesk"]}>
        <Routes>
          <Route
            path="/helpdesk"
            element={
              <ProtectedRoute role="helpdesk">
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/hr" element={<div>HR Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("HR Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  test("renders children if authenticated and role matches", () => {
    // Mock logged in user as helpdesk
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
        <Routes>
          <Route
            path="/helpdesk"
            element={
              <ProtectedRoute role="helpdesk">
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});
