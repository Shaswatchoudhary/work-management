import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Button from "../CustomButton";

describe("CustomButton", () => {
  it("renders children text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Click me" }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies variant styles correctly", () => {
    const { container } = render(<Button variant="danger">Danger</Button>);
    const button = container.firstChild as HTMLButtonElement;
    expect(button.style.color).toBe("rgb(255, 255, 255)");
  });

  it("applies size styles correctly", () => {
    const { container } = render(<Button size="sm">Small</Button>);
    const button = container.firstChild as HTMLButtonElement;
    expect(button.style.height).toBe("32px");
  });

  it("merges custom className and style prop", () => {
    const { container } = render(
      <Button className="my-btn" style={{ marginRight: "8px" }}>
        Custom
      </Button>
    );
    const button = container.firstChild as HTMLButtonElement;
    expect(button).toHaveClass("my-btn");
    expect(button.style.marginRight).toBe("8px");
  });

  it("can be disabled", () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    const button = screen.getByRole("button", { name: "Disabled" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
