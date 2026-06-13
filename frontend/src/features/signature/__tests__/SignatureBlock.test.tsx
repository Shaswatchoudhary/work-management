import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { createRef } from "react";
import SignatureBlock, { DEFAULT_SIGNATURES } from "../SignatureBlock";

describe("SignatureBlock", () => {
  it("renders signature block component with 4 cards", () => {
    const ref = createRef<HTMLDivElement>();
    render(<SignatureBlock ref={ref} />);

    // Verify ref forwarding
    expect(ref.current).not.toBeNull();
    expect(ref.current?.className).toContain("signature-block-grid");

    // Verify titles rendering
    expect(screen.getByText("HR APPROVAL")).toBeInTheDocument();
    expect(screen.getByText("ADMIN FINAL APPROVAL")).toBeInTheDocument();
    expect(screen.getByText("HR INSPECTION")).toBeInTheDocument();
    expect(screen.getByText("ADMIN INSPECTION + PAYMENT")).toBeInTheDocument();

    // Verify names rendering (they should appear multiple times)
    const priyaCards = screen.getAllByText("Priya Sharma");
    expect(priyaCards.length).toBeGreaterThanOrEqual(2);

    const sureshCards = screen.getAllByText("Suresh Verma");
    expect(sureshCards.length).toBeGreaterThanOrEqual(2);

    // Verify specific hashes
    expect(screen.getByText("9F25C0C7")).toBeInTheDocument();
    expect(screen.getByText("940DB80E")).toBeInTheDocument();
    expect(screen.getByText("CCD14EF8")).toBeInTheDocument();
    expect(screen.getByText("7DD31AF7")).toBeInTheDocument();

    // Verify verified badges
    const badges = screen.getAllByText("PIN VERIFIED · DIGITALLY SIGNED");
    expect(badges.length).toBe(4);
  });

  it("exports correct DEFAULT_SIGNATURES meta-data", () => {
    expect(DEFAULT_SIGNATURES).toHaveLength(4);
    expect(DEFAULT_SIGNATURES[0].title).toBe("HR APPROVAL");
    expect(DEFAULT_SIGNATURES[1].title).toBe("ADMIN FINAL APPROVAL");
    expect(DEFAULT_SIGNATURES[2].title).toBe("HR INSPECTION");
    expect(DEFAULT_SIGNATURES[3].title).toBe("ADMIN INSPECTION + PAYMENT");
  });
});
