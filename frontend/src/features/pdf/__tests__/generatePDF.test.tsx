import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import {
  ticketToTicketData,
  generatePDF,
} from "../generatePDF";
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillStyle: "",
  fillRect: vi.fn(),
  drawImage: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  createImageData: vi.fn(),
  setTransform: vi.fn(),
  resetTransform: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
})) as any;

// Mock document.fonts.ready
beforeAll(() => {
  Object.defineProperty(document, "fonts", {
    value: {
      ready: Promise.resolve(),
    },
    writable: true,
  });
});

// Mock jsPDF
vi.mock("jspdf", () => {
  class MockJsPDF {
    save = vi.fn();
    addImage = vi.fn();
    addPage = vi.fn();
    output = vi.fn(() => "mock-data-url");

    internal = {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    };
  }

  return {
    jsPDF: MockJsPDF,
  };
});

// Mock html2canvas
vi.mock("html2canvas", () => ({
  default: vi.fn(async () => {
    const canvas = document.createElement("canvas");

    canvas.width = 1000;
    canvas.height = 1200;

    canvas.getContext = vi.fn(() => ({
      fillStyle: "",
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    })) as any;

    canvas.toDataURL = vi.fn(
      () => "data:image/png;base64,mock-image"
    );

    return canvas;
  }),
}));

describe("generatePDF utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("converts ticket to PDF data", () => {
    const ticket = {
      id: "TKT-101",
      title: "Printer Issue",
      category: "Maintenance",
      priority: "Medium",
      location: "Office",
      estimatedCost: 5000,
      status: "closed",
      createdBy: "Suresh",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
      description: "Printer not working",
      signatures: {},
    };

    const result = ticketToTicketData(ticket as any);

    expect(result.id).toBe("TKT-101");
    expect(result.title).toBe("Printer Issue");
    expect(result.category).toBe("Maintenance");
    expect(result.description).toBe("Printer not working");
  });

  it("creates PDF without throwing", async () => {
    const ticketData = {
      id: "TKT-101",
      title: "Printer Issue",
      category: "Maintenance",
      priority: "Medium",
      location: "Office",
      cost: "₹5000",
      status: "Closed",
      raisedBy: "Suresh",
      raisedAt: "10 Jun 2026",
      tags: "—",
      description: "Printer not working",
      signatures: {},
    };

    await expect(
      generatePDF(ticketData as any)
    ).resolves.toBeUndefined();
  });
});