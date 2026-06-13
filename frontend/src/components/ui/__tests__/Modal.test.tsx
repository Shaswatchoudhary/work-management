import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Modal from "../Modal";

describe("Modal Component", () => {
  it("does not render when open is false", () => {
    const { container } = render(
      <Modal open={false} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText("Modal Content")).not.toBeInTheDocument();
  });

  it("renders when open is true", () => {
    render(
      <Modal open={true} title="My Modal" onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    );
    expect(screen.getByText("My Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal Content")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <Modal open={true} onClose={handleClose}>
        <div>Content</div>
      </Modal>
    );
    const closeBtn = screen.getByRole("button", { name: "×" });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("changes close button color on mouse hover", () => {
    render(
      <Modal open={true} onClose={() => {}}>
        <div>Content</div>
      </Modal>
    );
    const closeBtn = screen.getByRole("button", { name: "×" });
    expect(closeBtn.style.color).toBe("rgba(255, 255, 255, 0.6)");
    fireEvent.mouseEnter(closeBtn);
    expect(closeBtn.style.color).toBe("rgb(255, 255, 255)");
    fireEvent.mouseLeave(closeBtn);
    expect(closeBtn.style.color).toBe("rgba(255, 255, 255, 0.6)");
  });

  it("calls onClose when escape key is pressed", () => {
    const handleClose = vi.fn();
    render(
      <Modal open={true} onClose={handleClose}>
        <div>Content</div>
      </Modal>
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("cleans up escape listener and body styles on unmount", () => {
    const handleClose = vi.fn();
    const { unmount } = render(
      <Modal open={true} onClose={handleClose}>
        <div>Content</div>
      </Modal>
    );
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("does not trigger onClose on Escape when open is false", () => {
    const handleClose = vi.fn();
    const { rerender } = render(
      <Modal open={false} onClose={handleClose}>
        <div>Content</div>
      </Modal>
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).not.toHaveBeenCalled();
  });

  it("respects modal sizes", () => {
    const { container } = render(
      <Modal open={true} size="sm">
        <div>Content</div>
      </Modal>
    );
    // Find dialog block using child index from root div
    const outerDiv = container.firstChild as HTMLDivElement;
    const dialog = outerDiv.childNodes[1] as HTMLDivElement;
    expect(dialog.style.maxWidth).toBe("448px");
  });
});
