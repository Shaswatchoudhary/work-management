import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { forwardRef, useImperativeHandle } from "react";
import SignaturePad from "../SignaturePad";

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.ResizeObserver = MockResizeObserver as any;

// Mock signature canvas helper mocks
const mockClear = vi.fn();
const mockIsEmpty = vi.fn(() => false);
const mockToDataURL = vi.fn(() => "data:image/png;base64,mock-signature");

// Mock react-signature-canvas module
vi.mock("react-signature-canvas", () => {
  const MockSC = forwardRef((_props: any, ref: any) => {
    useImperativeHandle(ref, () => ({
      clear: mockClear,
      isEmpty: mockIsEmpty,
      getCanvas: () => ({
        toDataURL: mockToDataURL,
        getContext: () => ({
          setTransform: vi.fn(),
        }),
        style: {},
      }),
    }));
    return <div data-testid="mock-canvas" />;
  });
  MockSC.displayName = "MockSC";
  return {
    default: MockSC,
  };
});

describe("SignaturePad", () => {
  const defaultProps = {
    onSave: vi.fn(),
    initial: null,
    label: "Please sign",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsEmpty.mockReturnValue(false);
  });

  it("renders loading state initially, then loads canvas", async () => {
    render(<SignaturePad {...defaultProps} />);
    
    // Shows loading state
    expect(screen.getByText(/Loading signature pad/i)).toBeInTheDocument();

    // Eventually loads signature canvas
    const canvas = await screen.findByTestId("mock-canvas");
    expect(canvas).toBeInTheDocument();
    expect(screen.getByText("Please sign")).toBeInTheDocument();
  });

  it("calls onSave when save button is clicked with non-empty canvas", async () => {
    const onSave = vi.fn();
    render(<SignaturePad {...defaultProps} onSave={onSave} />);
    
    await screen.findByTestId("mock-canvas");
    
    const saveButton = screen.getByRole("button", { name: /Save Signature/i });
    fireEvent.click(saveButton);
    
    expect(mockToDataURL).toHaveBeenCalled();
    expect(onSave).toHaveBeenCalledWith("data:image/png;base64,mock-signature");
    expect(screen.getByText(/Signature captured/i)).toBeInTheDocument();
  });

  it("does not call onSave when canvas is empty", async () => {
    mockIsEmpty.mockReturnValue(true);
    const onSave = vi.fn();
    render(<SignaturePad {...defaultProps} onSave={onSave} />);
    
    await screen.findByTestId("mock-canvas");
    
    const saveButton = screen.getByRole("button", { name: /Save Signature/i });
    fireEvent.click(saveButton);
    
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.queryByText(/Signature captured/i)).not.toBeInTheDocument();
  });

  it("clears canvas when clear button is clicked", async () => {
    render(<SignaturePad {...defaultProps} />);
    
    await screen.findByTestId("mock-canvas");
    
    const clearButton = screen.getByRole("button", { name: /Clear/i });
    fireEvent.click(clearButton);
    
    expect(mockClear).toHaveBeenCalled();
  });
});
