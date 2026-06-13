import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CommentThread from "../CommentThread";
import { useTicketStore } from "../../../store/ticketStore";
import { useAuthStore } from "../../../store/authStore";

const mockUser = {
  id: "u-helpdesk",
  name: "Arjun Mehta",
  role: "helpdesk" as const,
  email: "helpdesk@company.com",
  department: "Facilities",
};

const baseTicket = {
  id: "TKT-001",
  title: "Test ticket",
  category: "Maintenance",
  priority: "Medium" as const,
  location: "Floor 1",
  estimatedCost: 1000,
  description: "Test desc",
  tags: [],
  status: "pending_hr" as const,
  createdBy: "u-helpdesk",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  assignee: null,
  inspection: null,
  payment: null,
  pdfs: [],
  signatures: {},
  comments: [],
};

describe("CommentThread", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser });
    useTicketStore.setState({ tickets: [{ ...baseTicket }] });
  });

  it("renders empty state when no comments", () => {
    render(<CommentThread ticketId="TKT-001" />);
    expect(screen.getByText("No activity yet.")).toBeInTheDocument();
  });

  it("renders existing comments", () => {
    useTicketStore.setState({
      tickets: [{
        ...baseTicket,
        comments: [
          {
            id: "c-1",
            userId: "u-hr",
            role: "hr" as const,
            text: "Approved by HR.",
            at: new Date().toISOString(),
          },
          {
            id: "c-2",
            userId: "u-helpdesk",
            role: "helpdesk" as const,
            text: "Thank you!",
            at: new Date().toISOString(),
          },
        ],
      }],
    });

    render(<CommentThread ticketId="TKT-001" />);

    expect(screen.getByText("Approved by HR.")).toBeInTheDocument();
    expect(screen.getByText("Thank you!")).toBeInTheDocument();
  });

  it("shows role label for each comment", () => {
    useTicketStore.setState({
      tickets: [{
        ...baseTicket,
        comments: [
          {
            id: "c-1",
            userId: "u-hr",
            role: "hr" as const,
            text: "HR comment here.",
            at: new Date().toISOString(),
          },
        ],
      }],
    });

    render(<CommentThread ticketId="TKT-001" />);
    expect(screen.getByText("HR")).toBeInTheDocument();
    expect(screen.getByText("HR comment here.")).toBeInTheDocument();
  });

  it("renders textarea and reply button", () => {
    render(<CommentThread ticketId="TKT-001" />);
    expect(screen.getByPlaceholderText("Add a comment...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reply/i })).toBeInTheDocument();
  });

  it("adds a comment when text is entered and Reply is clicked", () => {
    const addCommentSpy = vi.spyOn(useTicketStore.getState(), "addComment");

    render(<CommentThread ticketId="TKT-001" />);

    const textarea = screen.getByPlaceholderText("Add a comment...");
    fireEvent.change(textarea, { target: { value: "This is a test comment" } });

    expect(textarea).toHaveValue("This is a test comment");

    fireEvent.click(screen.getByRole("button", { name: /reply/i }));

    expect(addCommentSpy).toHaveBeenCalledWith("TKT-001", {
      userId: "u-helpdesk",
      role: "helpdesk",
      text: "This is a test comment",
    });
  });

  it("clears textarea after submitting comment", () => {
    render(<CommentThread ticketId="TKT-001" />);

    const textarea = screen.getByPlaceholderText("Add a comment...");
    fireEvent.change(textarea, { target: { value: "Some comment" } });
    fireEvent.click(screen.getByRole("button", { name: /reply/i }));

    expect(textarea).toHaveValue("");
  });

  it("does not submit empty or whitespace-only comment", () => {
    const addCommentSpy = vi.spyOn(useTicketStore.getState(), "addComment");

    render(<CommentThread ticketId="TKT-001" />);

    const textarea = screen.getByPlaceholderText("Add a comment...");
    fireEvent.change(textarea, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: /reply/i }));

    expect(addCommentSpy).not.toHaveBeenCalled();
  });

  it("trims whitespace before submitting comment", () => {
    const addCommentSpy = vi.spyOn(useTicketStore.getState(), "addComment");

    render(<CommentThread ticketId="TKT-001" />);

    const textarea = screen.getByPlaceholderText("Add a comment...");
    fireEvent.change(textarea, { target: { value: "  padded comment  " } });
    fireEvent.click(screen.getByRole("button", { name: /reply/i }));

    expect(addCommentSpy).toHaveBeenCalledWith("TKT-001", expect.objectContaining({
      text: "padded comment",
    }));
  });

  it("returns null when ticket does not exist", () => {
    const { container } = render(<CommentThread ticketId="TKT-NONEXISTENT" />);
    expect(container.firstChild).toBeNull();
  });

  it("shows multiple comments in order", () => {
    useTicketStore.setState({
      tickets: [{
        ...baseTicket,
        comments: [
          { id: "c-1", userId: "u-hr", role: "hr" as const, text: "First comment", at: new Date().toISOString() },
          { id: "c-2", userId: "u-admin", role: "admin" as const, text: "Second comment", at: new Date().toISOString() },
          { id: "c-3", userId: "u-helpdesk", role: "helpdesk" as const, text: "Third comment", at: new Date().toISOString() },
        ],
      }],
    });

    render(<CommentThread ticketId="TKT-001" />);

    const comments = screen.getAllByText(/comment/i);
    expect(comments).toHaveLength(3);
  });

  it("shows admin role label correctly", () => {
    useTicketStore.setState({
      tickets: [{
        ...baseTicket,
        comments: [
          { id: "c-1", userId: "u-admin", role: "admin" as const, text: "Admin approved.", at: new Date().toISOString() },
        ],
      }],
    });

    render(<CommentThread ticketId="TKT-001" />);
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("shows helpdesk role label correctly", () => {
    useTicketStore.setState({
      tickets: [{
        ...baseTicket,
        comments: [
          { id: "c-1", userId: "u-helpdesk", role: "helpdesk" as const, text: "Submitted.", at: new Date().toISOString() },
        ],
      }],
    });

    render(<CommentThread ticketId="TKT-001" />);
    expect(screen.getByText("Help Desk")).toBeInTheDocument();
  });

  it("updates textarea value as user types", () => {
    render(<CommentThread ticketId="TKT-001" />);

    const textarea = screen.getByPlaceholderText("Add a comment...");
    fireEvent.change(textarea, { target: { value: "T" } });
    expect(textarea).toHaveValue("T");

    fireEvent.change(textarea, { target: { value: "Typing more..." } });
    expect(textarea).toHaveValue("Typing more...");
  });

  it("allows submitting multiple comments in sequence", () => {
    const addCommentSpy = vi.spyOn(useTicketStore.getState(), "addComment");

    render(<CommentThread ticketId="TKT-001" />);
    const textarea = screen.getByPlaceholderText("Add a comment...");

    fireEvent.change(textarea, { target: { value: "First" } });
    fireEvent.click(screen.getByRole("button", { name: /reply/i }));

    fireEvent.change(textarea, { target: { value: "Second" } });
    fireEvent.click(screen.getByRole("button", { name: /reply/i }));

    expect(addCommentSpy).toHaveBeenCalledTimes(2);
    expect(addCommentSpy).toHaveBeenNthCalledWith(1, "TKT-001", expect.objectContaining({ text: "First" }));
    expect(addCommentSpy).toHaveBeenNthCalledWith(2, "TKT-001", expect.objectContaining({ text: "Second" }));
  });
});