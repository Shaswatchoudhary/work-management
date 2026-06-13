import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Input, Textarea, Select, Label } from "../Field";

describe("Field Components", () => {
  describe("Input", () => {
    it("renders input field and accepts value changes", () => {
      render(<Input placeholder="Enter name" value="hello" onChange={() => {}} />);
      const input = screen.getByPlaceholderText("Enter name") as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.value).toBe("hello");
    });

    it("handles custom style and className overrides", () => {
      const { container } = render(<Input className="my-input" style={{ width: "200px" }} />);
      const input = container.firstChild as HTMLInputElement;
      expect(input).toHaveClass("my-input");
      expect(input.style.width).toBe("200px");
    });

    it("toggles border color on focus and blur", () => {
      const { container } = render(<Input />);
      const input = container.firstChild as HTMLInputElement;
      fireEvent.focus(input);
      expect(input.style.borderColor).toBe("rgb(79, 110, 247)"); // #4f6ef7
      fireEvent.blur(input);
      expect(input.style.borderColor).toBe("var(--border)");
    });
  });

  describe("Textarea", () => {
    it("renders textarea and accepts value", () => {
      render(<Textarea placeholder="Enter description" defaultValue="long text" />);
      const textarea = screen.getByPlaceholderText("Enter description") as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();
      expect(textarea.value).toBe("long text");
    });

    it("toggles border color on focus and blur", () => {
      const { container } = render(<Textarea />);
      const textarea = container.firstChild as HTMLTextAreaElement;
      fireEvent.focus(textarea);
      expect(textarea.style.borderColor).toBe("rgb(79, 110, 247)");
      fireEvent.blur(textarea);
      expect(textarea.style.borderColor).toBe("var(--border)");
    });
  });

  describe("Select", () => {
    it("renders select with children options", () => {
      render(
        <Select defaultValue="opt2">
          <option value="opt1">Option 1</option>
          <option value="opt2">Option 2</option>
        </Select>
      );
      const select = screen.getByRole("combobox") as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      expect(select.value).toBe("opt2");
      expect(screen.getByText("Option 1")).toBeInTheDocument();
    });

    it("toggles border color on focus and blur", () => {
      const { container } = render(
        <Select>
          <option>Option</option>
        </Select>
      );
      const select = container.firstChild as HTMLSelectElement;
      fireEvent.focus(select);
      expect(select.style.borderColor).toBe("rgb(79, 110, 247)");
      fireEvent.blur(select);
      expect(select.style.borderColor).toBe("var(--border)");
    });
  });

  describe("Label", () => {
    it("renders label tag with children text", () => {
      render(<Label htmlFor="test-input">Test Label</Label>);
      const label = screen.getByText("Test Label") as HTMLLabelElement;
      expect(label).toBeInTheDocument();
      expect(label.getAttribute("for")).toBe("test-input");
    });
  });
});
