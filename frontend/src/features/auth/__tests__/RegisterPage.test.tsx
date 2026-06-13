import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RegisterPage from "../RegisterPage";

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

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

    // Select role
    const hrRoleBtn = screen.getByText("HR", { selector: ".register-role-btn__name" }).closest("button")!;
    fireEvent.click(hrRoleBtn);

    // Submit the form
    const submitBtn = screen.getByRole("button", { name: /Create account/i });
    fireEvent.click(submitBtn);

    // Verify it sets loading state
    expect(submitBtn).toBeDisabled();

    // Wait for the simulated delay (50ms under VITEST) to resolve and render the success view
    await waitFor(
      () => {
        expect(screen.getByRole("heading", { name: /Account created!/i })).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    // Confirm role success details and redirect option are present
    expect(screen.getByText(/account has been set up/i)).toBeInTheDocument();
    
    // Go to login click
    const loginBtn = screen.getByRole("button", { name: /Go to Login/i });
    fireEvent.click(loginBtn);
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

  test("shows validation error on empty fields, invalid email format, and short password", () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    const submit = () => fireEvent.click(screen.getByRole("button", { name: /Create account/i }));

    // Empty name
    submit();
    expect(screen.getByRole("alert")).toHaveTextContent(/Full name is required/i);

    // Fill name, empty email
    fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: "Test User" } });
    submit();
    expect(screen.getByRole("alert")).toHaveTextContent(/Email is required/i);

    // Fill invalid email
    fireEvent.change(screen.getByLabelText(/Work email/i), { target: { value: "invalidemail" } });
    submit();
    expect(screen.getByRole("alert")).toHaveTextContent(/Enter a valid email address/i);

    // Short password
    fireEvent.change(screen.getByLabelText(/Work email/i), { target: { value: "valid@email.com" } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: "12" } });
    submit();
    expect(screen.getByRole("alert")).toHaveTextContent(/Password must be at least 4 chars/i);
  });

  test("toggles password and confirm password eye buttons", () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    const passInput = screen.getByLabelText(/^Password$/i) as HTMLInputElement;
    const confirmInput = screen.getByLabelText(/Confirm password/i) as HTMLInputElement;

    const eyeButtons = screen.getAllByRole("button", { name: "Show" });
    expect(eyeButtons.length).toBe(2);

    // Toggle password
    fireEvent.click(eyeButtons[0]);
    expect(passInput.type).toBe("text");

    // Toggle confirm password
    fireEvent.click(eyeButtons[1]);
    expect(confirmInput.type).toBe("text");
  });

  test("demo account fill button fills credentials and changes active role", () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    const fillButtons = screen.getAllByRole("button", { name: "Fill" });
    // Click fill for HR
    fireEvent.click(fillButtons[1]);

    const nameInput = screen.getByLabelText(/Full name/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/Work email/i) as HTMLInputElement;

    expect(nameInput.value).toBe("Priya Sharma");
    expect(emailInput.value).toBe("hr@company.com");
  });

  test("copy buttons invoke clipboard writeText", async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    const copyButtons = screen.getAllByRole("button", { name: "Copy" });
    expect(copyButtons.length).toBeGreaterThan(0);

    fireEvent.click(copyButtons[0]);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});
