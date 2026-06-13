import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Badge, { StatusBadge, PriorityBadge } from "../CustomBadge";

describe("CustomBadge", () => {
  it("renders badge children correctly", () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText("Test Badge")).toBeInTheDocument();
  });

  it("applies tone styles correctly", () => {
    const { container } = render(<Badge tone="success">Success</Badge>);
    const span = container.firstChild as HTMLSpanElement;
    expect(span.style.color).toBe("rgb(16, 185, 129)"); // #10b981 color conversion check
  });

  it("merges custom className and styles", () => {
    const { container } = render(
      <Badge className="custom-class" style={{ marginTop: "10px" }}>
        Badge
      </Badge>
    );
    const span = container.firstChild as HTMLSpanElement;
    expect(span).toHaveClass("custom-class");
    expect(span.style.marginTop).toBe("10px");
  });

  it("StatusBadge mapping renders correct label and tone", () => {
    render(<StatusBadge status="closed" />);
    const badge = screen.getByText("Closed");
    expect(badge).toBeInTheDocument();
  });

  it("StatusBadge fallback to status string when label or tone is missing", () => {
    render(<StatusBadge status={"unknown" as any} />);
    const badge = screen.getByText("unknown");
    expect(badge).toBeInTheDocument();
  });

  it("PriorityBadge renders Critical correctly", () => {
    render(<PriorityBadge priority="Critical" />);
    const badge = screen.getByText("Critical");
    expect(badge).toBeInTheDocument();
  });

  it("PriorityBadge renders High correctly", () => {
    render(<PriorityBadge priority="High" />);
    const badge = screen.getByText("High");
    expect(badge).toBeInTheDocument();
  });

  it("PriorityBadge renders Medium correctly", () => {
    render(<PriorityBadge priority="Medium" />);
    const badge = screen.getByText("Medium");
    expect(badge).toBeInTheDocument();
  });

  it("PriorityBadge renders Low correctly", () => {
    render(<PriorityBadge priority="Low" />);
    const badge = screen.getByText("Low");
    expect(badge).toBeInTheDocument();
  });
});
