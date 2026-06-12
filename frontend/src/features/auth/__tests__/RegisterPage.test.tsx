import { describe, test, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RegisterPage from "../RegisterPage";

describe("RegisterPage", () => {
  test("submits registration successfully and shows success screen", async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    // Fill in the input fields
    fireEvent.change(screen.getByLabelText(/Full name/i), {
      target: { value: "New User" },
    });
    fireEvent.change(screen.getByLabelText(/Work email/i), {
      target: { value: "newuser@company.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "12345" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm password/i), {
      target: { value: "12345" },
    });

    // Submit the form
    const submitBtn = screen.getByRole("button", { name: /Create account/i });
    fireEvent.click(submitBtn);

    // Verify it sets loading state
    expect(submitBtn).toBeDisabled();

    // Wait for the simulated delay (800ms) to resolve and render the success view
    await waitFor(
      () => {
        expect(screen.getByRole("heading", { name: /Account created!/i })).toBeInTheDocument();
      },
      { timeout: 1500 }
    );

    // Confirm role success details and redirect option are present
    expect(screen.getByText(/Help Desk/i)).toBeInTheDocument();
    expect(screen.getByText(/account has been set up/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Go to Login/i })).toBeInTheDocument();
  });

  test("shows validation error on password mismatch", () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Full name/i), {
      target: { value: "New User" },
    });
    fireEvent.change(screen.getByLabelText(/Work email/i), {
      target: { value: "newuser@company.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "12345" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm password/i), {
      target: { value: "54321" }, // Mismatching password
    });

    fireEvent.click(screen.getByRole("button", { name: /Create account/i }));

    // Verify error text
    expect(screen.getByRole("alert")).toHaveTextContent(/Passwords do not match/i);
  });
});
