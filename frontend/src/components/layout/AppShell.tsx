import { useState, useRef } from "react";
import { useAuthStore } from "../../store/authStore.ts";
import { useNotificationStore } from "../../store/notificationStore.ts";
import { useNavigate } from "react-router-dom";

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
    <div style={{ minHeight: "100vh", background: "#F7F5F0", display: "flex", flexDirection: "column", fontFamily: "var(--font-sans, system-ui, sans-serif)" }}>

      {/* TOPBAR */}
      <div style={{ height: "52px", background: "#fff", borderBottom: "0.5px solid #EDE9E0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", position: "sticky", top: 0, zIndex: 50, flexShrink: 0 }}>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "160px" }}>
          <div style={{ width: "28px", height: "28px", background: "#F59E0B", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
          </div>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#333", whiteSpace: "nowrap" }}>Work Management</span>
        </div>

        <div style={{ display: "flex", gap: "2px", background: "#F7F5F0", borderRadius: "10px", padding: "3px" }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => onTab(t.key)} style={{ padding: "5px 14px", fontSize: "12px", fontWeight: 500, borderRadius: "8px", border: "none", cursor: "pointer", background: activeTab === t.key ? "#fff" : "transparent", color: activeTab === t.key ? "#92400E" : "#999", boxShadow: activeTab === t.key ? "0 1px 4px rgba(0,0,0,0.06)" : "none", transition: "all 0.15s" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ✅ Sirf ek bell — topbar mein */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "160px", justifyContent: "flex-end" }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => markAllRead()} aria-label="notifications" style={{ width: "32px", height: "32px", borderRadius: "8px", border: "0.5px solid #EDE9E0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", cursor: "pointer" }}>
              {Icon.bell}
            </button>
            {unread > 0 && <div style={{ position: "absolute", top: "5px", right: "5px", width: "7px", height: "7px", borderRadius: "50%", background: "#F87171", border: "1.5px solid #fff" }} />}
          </div>
         <div style={{ position: "relative" }} ref={profileRef}>
  <button
    onClick={() => setShowProfile((v) => !v)}
    style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 600, color: "#92400E", border: "none", cursor: "pointer" }}
  >
    {initials}
  </button>

  {showProfile && (
    <div style={{ position: "absolute", right: 0, top: "38px", background: "#fff", border: "0.5px solid #EDE9E0", borderRadius: "10px", padding: "12px 14px", minWidth: "160px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 100 }}>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "#222" }}>{user?.name}</div>
      <div style={{ fontSize: "11px", color: "#AAA", marginTop: "2px", textTransform: "capitalize" }}>{user?.role}</div>
      {user?.department && <div style={{ fontSize: "11px", color: "#AAA" }}>{user.department}</div>}
      <div style={{ borderTop: "0.5px solid #EDE9E0", marginTop: "10px", paddingTop: "8px" }}>
        <button onClick={handleLogout} style={{ fontSize: "12px", color: "#DC2626", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}>
          Sign out
        </button>
      </div>
    </div>
  )}
</div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* LEFT SIDEBAR */}
        <div
          onMouseEnter={onSideEnter} onMouseLeave={onSideLeave}
          style={{ width: sideHover ? "180px" : "44px", minHeight: "calc(100vh - 52px)", background: "#fff", borderRight: "0.5px solid #EDE9E0", display: "flex", flexDirection: "column", padding: "10px 6px", gap: "2px", transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)", overflow: "hidden", flexShrink: 0, position: "sticky", top: "52px", alignSelf: "flex-start", height: "calc(100vh - 52px)" }}
        >
          {sideHover && (
            <div style={{ fontSize: "10px", fontWeight: 500, color: "#CCC", letterSpacing: "0.07em", textTransform: "uppercase", padding: "2px 8px 6px", whiteSpace: "nowrap" }}>Menu</div>
          )}

          {tabs.map((t) => {
            const active = activeTab === t.key;
            return (
              <button key={t.key} onClick={() => onTab(t.key)} title={!sideHover ? t.label : undefined}
                style={{ display: "flex", alignItems: "center", gap: sideHover ? "9px" : "0", justifyContent: sideHover ? "flex-start" : "center", padding: sideHover ? "7px 10px" : "9px", borderRadius: "8px", border: "none", cursor: "pointer", background: active ? "#FEF3C7" : "transparent", color: active ? "#92400E" : "#999", width: "100%", transition: "all 0.15s", whiteSpace: "nowrap", overflow: "hidden" }}
              >
                <span style={{ flexShrink: 0, display: "flex" }}>{TAB_ICONS[t.key] ?? Icon.ticket}</span>
                {sideHover && <span style={{ fontSize: "12px", fontWeight: 500 }}>{t.label}</span>}
              </button>
            );
          })}

          <div style={{ flex: 1 }} />

          {/* ✅ Sirf logout — no Profile/Settings/Account label */}
          <button onClick={handleLogout} title={!sideHover ? "Sign out" : undefined}
            style={{ display: "flex", alignItems: "center", gap: sideHover ? "9px" : "0", justifyContent: sideHover ? "flex-start" : "center", padding: sideHover ? "7px 10px" : "9px", borderRadius: "8px", border: "none", cursor: "pointer", background: "transparent", color: "#DC2626", width: "100%", transition: "all 0.15s", whiteSpace: "nowrap", overflow: "hidden" }}
          >
            <span style={{ flexShrink: 0, display: "flex" }}>{Icon.logout}</span>
            {sideHover && <span style={{ fontSize: "12px", fontWeight: 500 }}>Sign out</span>}
          </button>
        </div>

        {/* ✅ MAIN CONTENT — background cream */}
        <div style={{ flex: 1, padding: "24px 20px", overflowY: "auto", minWidth: 0, background: "#F7F5F0" }}>
          {children}
        </div>

        {/* RIGHT PANEL */}
        <div
          onMouseEnter={onRightEnter} onMouseLeave={onRightLeave}
          style={{ width: rightHover ? "240px" : "44px", minHeight: "calc(100vh - 52px)", background: "#fff", borderLeft: "0.5px solid #EDE9E0", display: "flex", flexDirection: "column", overflow: "hidden", transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)", flexShrink: 0, position: "sticky", top: "52px", alignSelf: "flex-start", height: "calc(100vh - 52px)" }}
        >
          {/* ✅ Collapsed: sirf activity icon, no bell */}
          {!rightHover && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#AAA" }} title="Activity">
                {Icon.activity}
              </div>
            </div>
          )}

          {rightHover && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
              <div style={{ padding: "14px 14px 10px", borderBottom: "0.5px solid #F0EDE6", flexShrink: 0 }}>
                <div style={{ fontSize: "12px", fontWeight: 500, color: "#333" }}>Recent Activity</div>
                <div style={{ fontSize: "11px", color: "#AAA", marginTop: "1px" }}>Latest ticket updates</div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {notifications.length === 0 && (
                  <div style={{ fontSize: "12px", color: "#CCC", textAlign: "center", paddingTop: "20px" }}>No activity yet</div>
                )}
                {notifications.slice(0, 20).map((n, i) => (
                  <div key={n.id ?? i}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                      <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: getActivityColor(n.title), flexShrink: 0, marginTop: "4px" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "12px", color: "#333", fontWeight: 500, lineHeight: 1.4, wordBreak: "break-word" }}>{n.title}</div>
                        <div style={{ fontSize: "10px", color: "#BBB", marginTop: "2px" }}>{timeAgo(n.at)}</div>
                      </div>
                    </div>
                    {i < notifications.length - 1 && <div style={{ height: "0.5px", background: "#F5F3EE", marginTop: "8px" }} />}
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "0.5px solid #EDE9E0", padding: "12px 14px", flexShrink: 0 }}>
                <div style={{ fontSize: "11px", fontWeight: 500, color: "#333", marginBottom: "10px" }}>Ticket health</div>
                {[
                  { label: "Closed",      pct: 42, color: "#16A34A" },
                  { label: "Pending",     pct: 29, color: "#D97706" },
                  { label: "In Progress", pct: 21, color: "#0284C7" },
                  { label: "Rejected",    pct: 8,  color: "#DC2626" },
                ].map(({ label, pct, color }) => (
                  <div key={label} style={{ marginBottom: "7px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                      <span style={{ fontSize: "11px", color: "#AAA" }}>{label}</span>
                      <span style={{ fontSize: "11px", fontWeight: 500, color: "#555" }}>{pct}%</span>
                    </div>
                    <div style={{ height: "4px", background: "#F5F3EE", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "4px" }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "0.5px solid #EDE9E0", padding: "12px 14px 14px", flexShrink: 0 }}>
                <div style={{ fontSize: "11px", fontWeight: 500, color: "#333", marginBottom: "8px" }}>Quick actions</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {[{ label: "New ticket", icon: "+" }, { label: "Export", icon: "↓" }, { label: "Filter", icon: "⊞" }, { label: "Refresh", icon: "↻" }].map(({ label, icon }) => (
                    <button key={label} style={{ background: "#FAFAF7", border: "0.5px solid #EDE9E0", borderRadius: "7px", padding: "6px 8px", fontSize: "11px", fontWeight: 500, color: "#555", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                      <span style={{ color: "#F59E0B", fontSize: "13px" }}>{icon}</span>{label}
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