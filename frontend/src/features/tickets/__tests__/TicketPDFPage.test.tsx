import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TicketPDFPage from "../TicketPDFPage";
import * as generatePDFModule from "../../pdf/generatePDF";

// Mock pdf generator
vi.mock("../../pdf/generatePDF", () => {
  return {
    generatePDF: vi.fn(async (_ticket, { onStatus } = {}) => {
      onStatus?.("Rendering document...", "processing");
      onStatus?.("PDF downloaded successfully!", "done");
    }),
  };
});

describe("TicketPDFPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page with details and download button", () => {
    render(<TicketPDFPage />);

    expect(screen.getByText("amaa — Requirement Document")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Process & Download PDF" })).toBeInTheDocument();
  });

  it("handles successful PDF generation and displays status message", async () => {
    render(<TicketPDFPage />);

    const button = screen.getByRole("button", { name: "Process & Download PDF" });
    fireEvent.click(button);

    // Verify it updates state and shows completion message
    expect(await screen.findByText("PDF downloaded successfully!")).toBeInTheDocument();
    expect(generatePDFModule.generatePDF).toHaveBeenCalled();
  });

  it("handles error during PDF generation and displays error message", async () => {
    vi.mocked(generatePDFModule.generatePDF).mockImplementationOnce(async (_ticket, { onStatus } = {}) => {
      onStatus?.("Error: Failed to render", "error");
      throw new Error("Failed to render");
    });

    render(<TicketPDFPage />);

    const button = screen.getByRole("button", { name: "Process & Download PDF" });
    fireEvent.click(button);

    // Verify it updates state and shows error message
    expect(await screen.findByText("Error: Failed to render")).toBeInTheDocument();
  });
});
