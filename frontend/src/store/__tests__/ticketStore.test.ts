import { describe, test, expect, beforeEach } from "vitest";
import { useTicketStore } from "../ticketStore";
import { SafeUser } from "../../types";

describe("useTicketStore", () => {
  const mockUser: SafeUser = {
    id: "u-helpdesk",
    name: "Arjun Mehta",
    email: "helpdesk@company.com",
    role: "helpdesk",
    department: "Facilities",
  };

  beforeEach(() => {
    // Reset store state and clear localStorage before each test
    useTicketStore.getState().reset();
    localStorage.clear();
  });

  test("initial tickets load hone chahiye", () => {
    const tickets = useTicketStore.getState().tickets;
    expect(tickets.length).toBeGreaterThan(0);
  });

  test("getById correctly ticket find karta hai", () => {
    const tickets = useTicketStore.getState().tickets;
    const firstTicket = tickets[0];
    const found = useTicketStore.getState().getById(firstTicket.id);
    expect(found).toEqual(firstTicket);
  });

  test("addTicket ticket append karta hai aur unique ID assign karta hai", () => {
    const initialCount = useTicketStore.getState().tickets.length;
    const newTicket = useTicketStore.getState().addTicket(
      {
        title: "Test Ticket Title",
        description: "Test Ticket Description",
        category: "Maintenance",
        priority: "High",
        location: "Building A, Floor 2",
        estimatedCost: 1500,
        tags: ["plumbing", "urgent"],
      },
      mockUser
    );

    const updatedTickets = useTicketStore.getState().tickets;
    expect(updatedTickets.length).toBe(initialCount + 1);
    expect(newTicket.id).toMatch(/^TKT-\d+$/);
    expect(newTicket.title).toBe("Test Ticket Title");
    expect(newTicket.status).toBe("pending_hr");
    expect(newTicket.comments[0].text).toBe("Ticket submitted.");
  });

  test("addComment ticket mein naya comment append karta hai", () => {
    const tickets = useTicketStore.getState().tickets;
    const targetId = tickets[0].id;
    const initialCommentsCount = tickets[0].comments.length;

    useTicketStore.getState().addComment(targetId, {
      userId: mockUser.id,
      role: mockUser.role,
      text: "This is a test comment",
    });

    const updatedTicket = useTicketStore.getState().getById(targetId);
    expect(updatedTicket?.comments.length).toBe(initialCommentsCount + 1);
    expect(updatedTicket?.comments[updatedTicket.comments.length - 1].text).toBe(
      "This is a test comment"
    );
  });

  test("setStatus ticket status change karta hai aur optional comment save karta hai", () => {
    const tickets = useTicketStore.getState().tickets;
    const targetId = tickets[0].id;

    useTicketStore.getState().setStatus(targetId, "pending_admin", {
      comment: {
        userId: "u-hr",
        role: "hr",
        text: "HR approved this ticket",
      },
    });

    const updatedTicket = useTicketStore.getState().getById(targetId);
    expect(updatedTicket?.status).toBe("pending_admin");
    expect(
      updatedTicket?.comments[updatedTicket.comments.length - 1].text
    ).toBe("HR approved this ticket");
  });

  test("updateTicket fields update aur signatures merge karta hai", () => {
    const tickets = useTicketStore.getState().tickets;
    const targetId = tickets[0].id;

    const signatureMock = {
      signedBy: "Priya Sharma",
      role: "HR Manager",
      userId: "u-hr",
      purpose: "hr_approval" as const,
      ticketId: targetId,
      signedAt: new Date().toISOString(),
      hash: "MOCKHASH123",
      deviceHint: "MOCKDEVICE",
      signatureImage: "data:image/png;base64,mock...",
    };

    useTicketStore.getState().updateTicket(targetId, {
      title: "Updated Title",
      signatures: { hrApproval: signatureMock },
    });

    const updatedTicket = useTicketStore.getState().getById(targetId);
    expect(updatedTicket?.title).toBe("Updated Title");
    expect(updatedTicket?.signatures?.hrApproval).toEqual(signatureMock);
  });

  test("reset state ko original mock data pe set karta hai", () => {
    // Ek ticket add karke change karein
    useTicketStore.getState().addTicket(
      {
        title: "Temporary",
        description: "Temp",
        category: "Facilities",
        priority: "Low",
        location: "Building B",
        estimatedCost: 100,
        tags: ["temp"],
      },
      mockUser
    );
    
    useTicketStore.getState().reset();
    const tickets = useTicketStore.getState().tickets;
    // initial MOCK_TICKETS count checks
    expect(tickets.length).toBeGreaterThan(0);
    expect(tickets.some((t) => t.title === "Temporary")).toBe(false);
  });
});
