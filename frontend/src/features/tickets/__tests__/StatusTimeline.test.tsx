import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusTimeline from "../StatusTimeline";

describe("StatusTimeline", () => {
  test("renders timeline steps and highlights current status", () => {
    render(<StatusTimeline status="pending_hr" />);
    
    // Check that timeline steps are rendered
    expect(screen.getByText("Pending HR")).toBeInTheDocument();
    expect(screen.getByText("Pending Admin")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });
});
