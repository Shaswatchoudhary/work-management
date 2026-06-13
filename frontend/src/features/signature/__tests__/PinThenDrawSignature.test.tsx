import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PinThenDrawSignature from "../PinThenDrawSignature";
import * as signatureEngine from "../signatureEngine";

// Canvas mocks
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  clearRect: vi.fn(),
  getImageData: () => ({
    data: [0, 0, 0, 255],
  }),
})) as any;

HTMLCanvasElement.prototype.toDataURL = vi.fn(
  () => "data:image/png;base64,mock-signature"
);
// Mock the signatureEngine module
vi.mock("../signatureEngine", () => {
  const verifyPin = vi.fn();
  const createSignatureBlock = vi.fn();
  return { verifyPin, createSignatureBlock };
});

describe("PinThenDrawSignature", () => {
  const defaultProps = {
    userId: "USR-1",
    userName: "Suresh",
    ticketId: "TKT-101",
    purpose: "admin_approval" as const,
    label: "Admin Approval",
    onSigned: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders PIN verification screen", () => {
    render(<PinThenDrawSignature {...defaultProps} />);

    expect(
      screen.getByText(/Admin Final Approval/i)
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /verify pin/i,
      })
    ).toBeInTheDocument();
  });

  it("shows error for invalid PIN", async () => {
    vi.mocked(signatureEngine.verifyPin).mockResolvedValue(false);

    render(<PinThenDrawSignature {...defaultProps} />);

    fireEvent.change(
      screen.getByPlaceholderText("••••"),
      {
        target: { value: "9999" },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /verify pin/i,
      })
    );

    expect(
      await screen.findByText(/Wrong PIN/i)
    ).toBeInTheDocument();
  });

  it("enables verification when PIN length is 4", () => {
    render(<PinThenDrawSignature {...defaultProps} />);

    fireEvent.change(
      screen.getByPlaceholderText("••••"),
      {
        target: { value: "1234" },
      }
    );

    expect(
      screen.getByRole("button", {
        name: /verify pin/i,
      })
    ).not.toBeDisabled();
  });

  it("opens draw mode after valid PIN", async () => {
    vi.mocked(signatureEngine.verifyPin).mockResolvedValue(true);

    render(<PinThenDrawSignature {...defaultProps} />);

    fireEvent.change(
      screen.getByPlaceholderText("••••"),
      {
        target: { value: "1234" },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /verify pin/i,
      })
    );

    expect(
      await screen.findByText(/draw your signature below/i)
    ).toBeInTheDocument();
  });

  it("locks user after 3 failed PIN attempts", async () => {
    vi.mocked(signatureEngine.verifyPin).mockResolvedValue(false);

    render(<PinThenDrawSignature {...defaultProps} />);

    const input =
      screen.getByPlaceholderText("••••");

    for (let i = 0; i < 3; i++) {
      fireEvent.change(input, {
        target: { value: "9999" },
      });

      fireEvent.click(
        screen.getByRole("button", { name: /verify pin/i })
      );

      await waitFor(() => {
        expect(
          screen.queryByText(/verifying/i)
        ).not.toBeInTheDocument();
      });
    }

    expect(
      await screen.findByText(
        /too many wrong attempts/i
      )
    ).toBeInTheDocument();
  });

  it("renders existing signature in locked mode", () => {
    render(
      <PinThenDrawSignature
        {...defaultProps}
        existingSignature={{
          signedBy: "Suresh",
          role: "Administrator",
          signedAt: new Date().toISOString(),
          ticketId: "TKT-101",
          hash: "ABC123",
          purpose: "admin_approval",
          signatureImage:
            "data:image/png;base64,mock",
        } as any}
      />
    );

    expect(
      screen.getByText(/Verified & Locked/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Signed by/i)
    ).toBeInTheDocument();
  });

  it("saves signature and calls onSigned", async () => {
    vi.mocked(signatureEngine.verifyPin).mockResolvedValue(true);

    vi.mocked(
      signatureEngine.createSignatureBlock
    ).mockResolvedValue({
      signedBy: "Suresh",
      role: "Administrator",
      signedAt: new Date().toISOString(),
      ticketId: "TKT-101",
      hash: "ABC123",
      purpose: "admin_approval",
      signatureImage:
        "data:image/png;base64,mock",
    } as any);

    const onSigned = vi.fn();

    render(
      <PinThenDrawSignature
        {...defaultProps}
        onSigned={onSigned}
      />
    );

    fireEvent.change(
      screen.getByPlaceholderText("••••"),
      {
        target: { value: "1234" },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /verify pin/i,
      })
    );

    await screen.findByText(
      /draw your signature below/i
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /save signature/i,
      })
    );

    await waitFor(() => {
      expect(onSigned).toHaveBeenCalled();
    });
  });

  it("shows error if PIN is not 4 digits", async () => {
    render(<PinThenDrawSignature {...defaultProps} />);
    
    fireEvent.change(screen.getByPlaceholderText("••••"), {
      target: { value: "12" },
    });
    fireEvent.keyDown(screen.getByPlaceholderText("••••"), { key: "Enter", code: "Enter" });
    
    expect(await screen.findByText(/4-digit PIN required/i)).toBeInTheDocument();
  });

  it("handles Enter keypress to verify PIN", async () => {
    vi.mocked(signatureEngine.verifyPin).mockResolvedValue(true);
    render(<PinThenDrawSignature {...defaultProps} />);
    
    fireEvent.change(screen.getByPlaceholderText("••••"), {
      target: { value: "1234" },
    });
    fireEvent.keyDown(screen.getByPlaceholderText("••••"), { key: "Enter", code: "Enter" });
    
    expect(await screen.findByText(/draw your signature below/i)).toBeInTheDocument();
  });

  it("shows error when trying to save an empty canvas", async () => {
    vi.mocked(signatureEngine.verifyPin).mockResolvedValue(true);
    
    // Mock getContext to return all zeroes for empty canvas check
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
      getImageData: () => ({
        data: [0, 0, 0, 0], // all zeroes (alpha channel is 0)
      }),
    })) as any;

    render(<PinThenDrawSignature {...defaultProps} />);
    
    fireEvent.change(screen.getByPlaceholderText("••••"), {
      target: { value: "1234" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verify pin/i }));
    
    await screen.findByText(/draw your signature below/i);
    
    fireEvent.click(screen.getByRole("button", { name: /save signature/i }));
    
    expect(await screen.findByText(/Please draw your signature before saving/i)).toBeInTheDocument();
    
    // Restore original mock
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it("simulates mouse and touch drawing interactions", async () => {
    vi.mocked(signatureEngine.verifyPin).mockResolvedValue(true);
    
    const { container } = render(<PinThenDrawSignature {...defaultProps} />);
    
    fireEvent.change(screen.getByPlaceholderText("••••"), {
      target: { value: "1234" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verify pin/i }));
    
    await screen.findByText(/draw your signature below/i);
    
    const canvas = container.querySelector(".signature-canvas");
    expect(canvas).toBeInTheDocument();
    
    // Mouse events
    fireEvent.mouseDown(canvas!, { clientX: 50, clientY: 50 });
    fireEvent.mouseMove(canvas!, { clientX: 60, clientY: 60 });
    fireEvent.mouseUp(canvas!);
    fireEvent.mouseLeave(canvas!);
    
    // Touch events
    fireEvent.touchStart(canvas!, { touches: [{ clientX: 50, clientY: 50 }] } as any);
    fireEvent.touchMove(canvas!, { touches: [{ clientX: 60, clientY: 60 }] } as any);
    fireEvent.touchEnd(canvas!);
    
    // Clear canvas
    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
  });
});