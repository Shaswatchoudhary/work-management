import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import StatCard from "../StatCard";

describe("StatCard Component", () => {
  it("renders label and value correctly", () => {
    render(<StatCard label="Total Users" value={1250} />);
    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("1250")).toBeInTheDocument();
  });

  it("renders hint when provided", () => {
    render(<StatCard label="Test" value="10" hint="This is a hint" />);
    expect(screen.getByText("This is a hint")).toBeInTheDocument();
  });

  it("renders default sub-label based on tone when hint is missing", () => {
    render(<StatCard label="Test" value="10" tone="success" />);
    expect(screen.getByText("resolved")).toBeInTheDocument();
  });

  it("applies tone styles correctly", () => {
    const { container } = render(<StatCard label="Test" value="10" tone="danger" />);
    const card = container.firstChild as HTMLDivElement;
    expect(card.style.background).toBe("rgb(254, 242, 242)"); // #FEF2F2
  });
});
