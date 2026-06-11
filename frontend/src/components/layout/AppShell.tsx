import { useState, useRef } from "react";
import { useAuthStore } from "../../store/authStore.ts";
import { useNotificationStore } from "../../store/notificationStore.ts";
import { useNavigate } from "react-router-dom";
import "./AppShell.scss";

const Icon = {
  dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  ticket:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18M3 12h18M3 17h10" /></svg>,
  plus:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  inspect:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
  users:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  payment:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>,
  report:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>,
  bell:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
  activity:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  logout:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
  queue:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18M3 12h18M3 17h10" /></svg>,
};

const TAB_ICONS: Record<string, React.ReactNode> = {
  dashboard:  Icon.dashboard,
  tickets:    Icon.ticket,
  new:        Icon.plus,
  inspection: Icon.inspect,
  queue:      Icon.queue,
  all:        Icon.ticket,
  payments:   Icon.payment,
  reports:    Icon.report,
  users:      Icon.users,
};

const activityColors: Record<string, string> = {
  approved: "#16A34A",
  rejected: "#DC2626",
  payment:  "#0284C7",
  assigned: "#D97706",
  default:  "#AAA",
};

function getActivityColor(title: string) {
  const t = title.toLowerCase();
  if (t.includes("approved")) return activityColors.approved;
  if (t.includes("rejected")) return activityColors.rejected;
  if (t.includes("payment"))  return activityColors.payment;
  if (t.includes("assigned")) return activityColors.assigned;
  return activityColors.default;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)    return "just now";
  if (mins < 60)   return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

interface Tab { key: string; label: string; }
interface AppShellProps {
  role: "helpdesk" | "hr" | "admin";
  activeTab: string;
  onTab: (tab: string) => void;
  tabs: Tab[];
  children: React.ReactNode;
}

export default function AppShell({ activeTab, onTab, tabs, children }: AppShellProps) {
  const user          = useAuthStore((s) => s.user);
  const logout        = useAuthStore((s) => s.logout);
  const notifications = useNotificationStore((s) => s.notifications);
  const markAllRead   = useNotificationStore((s) => s.markAllRead);
  const navigate      = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [sideHover,  setSideHover]  = useState(false);
  const [rightHover, setRightHover] = useState(false);
  const sideTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onSideEnter  = () => { if (sideTimer.current)  clearTimeout(sideTimer.current);  setSideHover(true);  };
  const onSideLeave  = () => { sideTimer.current  = setTimeout(() => setSideHover(false),  200); };
  const onRightEnter = () => { if (rightTimer.current) clearTimeout(rightTimer.current); setRightHover(true); };
  const onRightLeave = () => { rightTimer.current = setTimeout(() => setRightHover(false), 200); };

  const unread   = notifications.filter((n) => !n.read).length;
  const initials = user?.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() ?? "??";
  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="app-shell">

      {/* TOPBAR */}
      <div className="topbar">

        <div className="logo-container">
          <div className="logo-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
          </div>
          <span className="logo-text">Work Management</span>
        </div>

        <div className="tabs-container">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => onTab(t.key)}
              className={`tab-btn ${activeTab === t.key ? "is-active" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ✅ Sirf ek bell — topbar mein */}
        <div className="user-actions">
          <div style={{ position: "relative" }}>
            <button onClick={() => markAllRead()} aria-label="notifications" className="notification-bell-btn">
              {Icon.bell}
            </button>
            {unread > 0 && <div className="badge-dot" />}
          </div>
          <div className="profile-dropdown-container" ref={profileRef}>
            <button
              onClick={() => setShowProfile((v) => !v)}
              className="profile-btn"
            >
              {initials}
            </button>

            {showProfile && (
              <div className="profile-menu">
                <div className="user-name">{user?.name}</div>
                <div className="user-role">{user?.role}</div>
                {user?.department && <div className="user-dept">{user.department}</div>}
                <div className="menu-divider">
                  <button onClick={handleLogout} className="signout-btn">
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="body-container">

        {/* LEFT SIDEBAR */}
        <div
          onMouseEnter={onSideEnter}
          onMouseLeave={onSideLeave}
          className={`sidebar ${sideHover ? "is-expanded" : ""}`}
        >
          {sideHover && (
            <div className="section-label">Menu</div>
          )}

          {tabs.map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => onTab(t.key)}
                title={!sideHover ? t.label : undefined}
                className={`sidebar-btn ${active ? "is-active" : ""} ${sideHover ? "sidebar-expanded-btn" : ""}`}
              >
                <span className="btn-icon">{TAB_ICONS[t.key] ?? Icon.ticket}</span>
                {sideHover && <span className="btn-text">{t.label}</span>}
              </button>
            );
          })}

          <div style={{ flex: 1 }} />

          {/* ✅ Sirf logout — no Profile/Settings/Account label */}
          <button
            onClick={handleLogout}
            title={!sideHover ? "Sign out" : undefined}
            className={`sidebar-btn is-logout ${sideHover ? "sidebar-expanded-btn" : ""}`}
          >
            <span className="btn-icon">{Icon.logout}</span>
            {sideHover && <span className="btn-text">Sign out</span>}
          </button>
        </div>

        {/* ✅ MAIN CONTENT — background cream */}
        <div className="main-content">
          {children}
        </div>

        {/* RIGHT PANEL */}
        <div
          onMouseEnter={onRightEnter}
          onMouseLeave={onRightLeave}
          className={`right-panel ${rightHover ? "is-expanded" : ""}`}
        >
          {/* ✅ Collapsed: sirf activity icon, no bell */}
          {!rightHover && (
            <div className="collapsed-content">
              <div className="activity-trigger" title="Activity">
                {Icon.activity}
              </div>
            </div>
          )}

          {rightHover && (
            <div className="expanded-content">
              <div className="panel-header">
                <div className="title">Recent Activity</div>
                <div className="subtitle">Latest ticket updates</div>
              </div>

              <div className="activity-list">
                {notifications.length === 0 && (
                  <div className="empty-activity">No activity yet</div>
                )}
                {notifications.slice(0, 20).map((n, i) => (
                  <div key={n.id ?? i} className="activity-item">
                    <div className="item-row">
                      <div className="status-dot" style={{ backgroundColor: getActivityColor(n.title) }} />
                      <div className="item-details">
                        <div className="item-title">{n.title}</div>
                        <div className="item-time">{timeAgo(n.at)}</div>
                      </div>
                    </div>
                    {i < notifications.length - 1 && <div className="item-divider" />}
                  </div>
                ))}
              </div>

              <div className="panel-section">
                <div className="section-title">Ticket health</div>
                {[
                  { label: "Closed",      pct: 42, color: "#16A34A" },
                  { label: "Pending",     pct: 29, color: "#D97706" },
                  { label: "In Progress", pct: 21, color: "#0284C7" },
                  { label: "Rejected",    pct: 8,  color: "#DC2626" },
                ].map(({ label, pct, color }) => (
                  <div key={label} className="health-item">
                    <div className="item-label-row">
                      <span className="label">{label}</span>
                      <span className="value">{pct}%</span>
                    </div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="panel-section">
                <div className="section-title">Quick actions</div>
                <div className="quick-actions-grid">
                  {[{ label: "New ticket", icon: "+" }, { label: "Export", icon: "↓" }, { label: "Filter", icon: "⊞" }, { label: "Refresh", icon: "↻" }].map(({ label, icon }) => (
                    <button key={label} className="action-btn">
                      <span className="action-icon">{icon}</span>{label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}