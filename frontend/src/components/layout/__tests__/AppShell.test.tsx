import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AppShell from "../AppShell";
import { useAuthStore } from "../../../store/authStore";
import { useNotificationStore } from "../../../store/notificationStore";

const mockUser = {
  id: "u-helpdesk",
  name: "Arjun Mehta",
  role: "helpdesk" as const,
  email: "helpdesk@company.com",
  department: "Facilities",
};

const defaultTabs = [
  { key: "dashboard", label: "Dashboard" },
  { key: "tickets", label: "My Tickets" },
  { key: "new", label: "New Request" },
];

const renderShell = (overrides = {}) => {
  return render(
    <MemoryRouter>
      <AppShell
        role="helpdesk"
        tabs={defaultTabs}
        activeTab="dashboard"
        onTab={vi.fn()}
        {...overrides}
      >
        <div data-testid="shell-child">Child content</div>
      </AppShell>
    </MemoryRouter>
  );
};

describe("AppShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser });
    useNotificationStore.setState({ notifications: [] });
  });

  it("renders brand name", () => {
    renderShell();
    expect(screen.getByText("Work Management")).toBeInTheDocument();
  });

  it("renders user role label in profile menu", () => {
    renderShell();
    const profileBtn = document.querySelector(".profile-btn");
    expect(profileBtn).toBeInTheDocument();
    fireEvent.click(profileBtn!);
    expect(screen.getByText("helpdesk")).toBeInTheDocument();
  });

  it("renders all tab labels in topbar", () => {
    renderShell();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("My Tickets")).toBeInTheDocument();
    expect(screen.getByText("New Request")).toBeInTheDocument();
  });

  it("active tab is highlighted", () => {
    renderShell({ activeTab: "tickets" });
    const ticketBtn = screen.getByText("My Tickets");
    expect(ticketBtn.closest("button")).toHaveClass("is-active");
  });

  it("calls onTab when topbar tab clicked", () => {
    const onTab = vi.fn();
    renderShell({ onTab });
    fireEvent.click(screen.getByText("My Tickets"));
    expect(onTab).toHaveBeenCalledWith("tickets");
  });

  it("renders children content", () => {
    renderShell();
    expect(screen.getByTestId("shell-child")).toBeInTheDocument();
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("renders signed in user name inside profile menu", () => {
    renderShell();
    const profileBtn = document.querySelector(".profile-btn")!;
    fireEvent.click(profileBtn);
    expect(screen.getByText("Arjun Mehta")).toBeInTheDocument();
  });

  it("renders user department in profile menu if present", () => {
    renderShell();
    const profileBtn = document.querySelector(".profile-btn")!;
    fireEvent.click(profileBtn);
    expect(screen.getByText("Facilities")).toBeInTheDocument();
  });

  it("renders bell notification button", () => {
    renderShell();
    expect(screen.getByRole("button", { name: /notifications/i })).toBeInTheDocument();
  });

  it("shows no unread badge when no notifications", () => {
    renderShell();
    expect(document.querySelector(".badge-dot")).not.toBeInTheDocument();
  });

  it("shows unread badge dot when unread notifications exist", () => {
    useNotificationStore.setState({
      notifications: [
        { id: "n-1", title: "Test notif", forRole: "helpdesk", read: false, at: new Date().toISOString() },
      ],
    });
    renderShell();
    expect(document.querySelector(".badge-dot")).toBeInTheDocument();
  });

  it("shows recent activity when right panel is hovered", () => {
    renderShell();
    const rightPanel = document.querySelector(".right-panel")!;
    fireEvent.mouseEnter(rightPanel);
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
  });

  it("shows empty notifications message when activity is empty", () => {
    renderShell();
    const rightPanel = document.querySelector(".right-panel")!;
    fireEvent.mouseEnter(rightPanel);
    expect(screen.getByText(/no activity yet/i)).toBeInTheDocument();
  });

  it("renders notification items when present in the activity panel", () => {
    useNotificationStore.setState({
      notifications: [
        { id: "n-1", title: "TKT-001 approved by HR", forRole: "helpdesk", read: false, at: new Date().toISOString() },
      ],
    });
    renderShell();
    const rightPanel = document.querySelector(".right-panel")!;
    fireEvent.mouseEnter(rightPanel);
    expect(screen.getByText("TKT-001 approved by HR")).toBeInTheDocument();
  });

  it("renders sign out button inside profile menu", () => {
    renderShell();
    const profileBtn = document.querySelector(".profile-btn")!;
    fireEvent.click(profileBtn);
    expect(document.querySelector(".signout-btn")).toBeInTheDocument();
  });

  it("calls logout and navigates on sign out", () => {
    const logoutSpy = vi.spyOn(useAuthStore.getState(), "logout");
    renderShell();
    const profileBtn = document.querySelector(".profile-btn")!;
    fireEvent.click(profileBtn);
    const signoutBtn = document.querySelector(".signout-btn")!;
    fireEvent.click(signoutBtn);
    expect(logoutSpy).toHaveBeenCalled();
  });

  it("renders hr role label for hr user", () => {
    useAuthStore.setState({
      user: { ...mockUser, role: "hr", id: "u-hr", name: "Priya Sharma", email: "hr@company.com" },
    });
    renderShell();
    const profileBtn = document.querySelector(".profile-btn")!;
    fireEvent.click(profileBtn);
    expect(screen.getByText("hr")).toBeInTheDocument();
  });

  it("renders admin role label for admin user", () => {
    useAuthStore.setState({
      user: { ...mockUser, role: "admin", id: "u-admin", name: "Suresh Verma", email: "admin@company.com" },
    });
    renderShell();
    const profileBtn = document.querySelector(".profile-btn")!;
    fireEvent.click(profileBtn);
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("displays timeAgo values properly for notifications", () => {
    const now = Date.now();
    useNotificationStore.setState({
      notifications: [
        { id: "n-1", title: "Approved ticket", forRole: "helpdesk", read: false, at: new Date(now - 1000).toISOString() },
        { id: "n-2", title: "Rejected ticket", forRole: "helpdesk", read: false, at: new Date(now - 120000).toISOString() },
        { id: "n-3", title: "Payment processed", forRole: "helpdesk", read: false, at: new Date(now - 3 * 3600000).toISOString() },
        { id: "n-4", title: "Assigned ticket", forRole: "helpdesk", read: false, at: new Date(now - 3 * 86400000).toISOString() },
        { id: "n-5", title: "Unknown action", forRole: "helpdesk", read: false, at: new Date(now - 1000).toISOString() },
      ],
    });
    renderShell();
    const rightPanel = document.querySelector(".right-panel")!;
    fireEvent.mouseEnter(rightPanel);
    expect(screen.getAllByText("just now").length).toBeGreaterThan(0);
    expect(screen.getByText("2m ago")).toBeInTheDocument();
    expect(screen.getByText("3h ago")).toBeInTheDocument();
    expect(screen.getByText("3d ago")).toBeInTheDocument();
  });

  it("calls markAllRead when clicking the bell icon", () => {
    renderShell();
    const bellBtn = screen.getByRole("button", { name: /notifications/i });
    fireEvent.click(bellBtn);
  });

  it("calls onTab when sidebar tab is clicked", () => {
    const onTab = vi.fn();
    renderShell({ onTab });
    const sidebar = document.querySelector(".sidebar")!;
    fireEvent.mouseEnter(sidebar);
    const btns = sidebar.querySelectorAll(".sidebar-btn");
    // Click the "My Tickets" tab (which is the second button index 1)
    fireEvent.click(btns[1]);
    expect(onTab).toHaveBeenCalledWith("tickets");
  });
});