import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "../LoginPage";
import { useAuthStore } from "../../../store/authStore";

const renderPage = () => {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
};

describe("LoginPage Component", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it("renders credentials form with email and password fields", () => {
    renderPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
  });

  it("toggles password visibility when eye button is clicked", () => {
    renderPage();
    const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
    const toggleBtn = screen.getByLabelText(/show password/i);

    expect(passwordInput.type).toBe("password");
    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe("text");
    expect(screen.getByLabelText(/hide password/i)).toBeInTheDocument();
  });

  it("shows error validation message when email or password is empty", () => {
    renderPage();
    const submitBtn = screen.getByRole("button", { name: /continue/i });
    fireEvent.click(submitBtn);

    expect(screen.getByRole("alert")).toHaveTextContent(/Email is required/i);

    // Enter email but not password
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@company.com" } });
    fireEvent.click(submitBtn);
    expect(screen.getByRole("alert")).toHaveTextContent(/Password is required/i);
  });

  it("shows error message on invalid credentials submission", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "wrong@company.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "wrongpass" } });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Invalid email or password/i);
    });
  });

  it("successfully moves to step 2 role confirmation with valid credentials, and can go back", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "helpdesk@company.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "1234" } });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    // Verify step 2 renders confirmation
    await waitFor(() => {
      expect(screen.getByText(/Confirm your role/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/helpdesk@company.com/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Help Desk/i).length).toBeGreaterThan(0);

    // Click back button and verify credentials form returns
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("finalizes login and navigates to role home dashboard on confirm", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "helpdesk@company.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "1234" } });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/Confirm your role/i)).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole("button", { name: /Go to Help Desk Dashboard/i });
    fireEvent.click(confirmBtn);

    // Verify authStore now has the logged in user
    await waitFor(() => {
      expect(useAuthStore.getState().user).not.toBeNull();
    });
    expect(useAuthStore.getState().user?.role).toBe("helpdesk");
  });
});
