import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore.ts";
import { useNotificationStore } from "../../store/notificationStore.ts";
import { ROLE_LABEL } from "../../constants/roles.ts";
import { fmtRel } from "../../utils/dateFormatter.ts";
import { Role } from "../../types";

interface Tab {
  key: string;
  label: string;
}

interface AppShellProps {
  role: Role;
  tabs: Tab[];
  activeTab: string;
  onTab: (key: string) => void;
  children: React.ReactNode;
}

export default function AppShell({ role, tabs, activeTab, onTab, children }: AppShellProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const allNotifications = useNotificationStore((s) => s.notifications);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const notifications = allNotifications.filter((n) => n.forRole === role || n.forRole === "all");
  const unread = notifications.filter((n) => !n.read).length;

  const [openBell, setOpenBell] = useState(false);
  const [bellPos, setBellPos] = useState({ bottom: 0, right: 0 });
  const bellRef = useRef<HTMLButtonElement>(null);

  const handleBellClick = () => {
    if (!openBell && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setBellPos({
        bottom: rect.bottom,
        right: window.innerWidth - rect.right,
      });
    }
    setOpenBell((v) => !v);
    if (!openBell) markAllRead(role);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen w-full relative flex overflow-hidden bg-gradient-to-br from-[#00173d] via-[#003c96] to-[#0070f3] font-sans z-10 text-white">

      {/* ── Background SVGs ── */}
      <div className="absolute top-[8%] left-[45%] w-36 h-36 opacity-80 pointer-events-none blur-[0.5px] z-0 animate-pulse">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="cyanTorus" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f2fe" />
              <stop offset="100%" stopColor="#4facfe" />
            </linearGradient>
            <filter id="shadow">
              <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.3" />
            </filter>
          </defs>
          <circle cx="50" cy="50" r="30" fill="none" stroke="url(#cyanTorus)" strokeWidth="14" filter="url(#shadow)" />
        </svg>
      </div>

      <div className="absolute top-[35%] left-[12%] w-24 h-24 opacity-90 pointer-events-none z-0">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="zigGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a1c4fd" />
              <stop offset="100%" stopColor="#c2e9fb" />
            </linearGradient>
          </defs>
          <path d="M20,50 L40,30 L60,50 L80,30" fill="none" stroke="url(#zigGrad)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="absolute bottom-[5%] left-[5%] w-72 h-72 opacity-50 pointer-events-none blur-[3px] z-0">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <linearGradient id="spiralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0a52d6" />
              <stop offset="100%" stopColor="#001845" />
            </linearGradient>
          </defs>
          <path d="M 30,150 C 30,70 170,70 170,130 C 170,170 100,170 100,130 C 100,100 140,100 140,120" fill="none" stroke="url(#spiralGrad)" strokeWidth="22" strokeLinecap="round" />
        </svg>
      </div>

      <div className="absolute bottom-[10%] left-[30%] w-44 h-44 opacity-85 pointer-events-none blur-[1px] z-0">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="blueTorus" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38f9d7" />
              <stop offset="100%" stopColor="#2575fc" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="30" fill="none" stroke="url(#blueTorus)" strokeWidth="15" />
        </svg>
      </div>

      <div className="absolute top-[18%] right-[10%] w-80 h-80 opacity-75 pointer-events-none blur-[2px] z-0">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <linearGradient id="rightSpiral" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0072ff" />
              <stop offset="100%" stopColor="#001845" />
            </linearGradient>
          </defs>
          <path d="M 50,30 Q 150,40 160,110 T 80,160 T 130,80" fill="none" stroke="url(#rightSpiral)" strokeWidth="24" strokeLinecap="round" />
        </svg>
      </div>

      <div className="absolute bottom-[8%] right-[6%] w-72 h-44 opacity-75 pointer-events-none z-0">
        <svg viewBox="0 0 200 100" className="w-full h-full">
          <defs>
            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4facfe" />
              <stop offset="100%" stopColor="#00f2fe" />
            </linearGradient>
          </defs>
          <path d="M 20,50 Q 60,10 100,50 T 180,50" fill="none" stroke="url(#waveGrad)" strokeWidth="22" strokeLinecap="round" />
        </svg>
      </div>

      <div className="absolute bottom-[28%] right-[22%] w-24 h-20 opacity-80 pointer-events-none z-0">
        <svg viewBox="0 0 100 60" className="w-full h-full">
          <defs>
            <linearGradient id="smallWave" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#66a6ff" />
              <stop offset="100%" stopColor="#89f7fe" />
            </linearGradient>
          </defs>
          <path d="M 10,20 Q 30,5 50,20 T 90,20" fill="none" stroke="url(#smallWave)" strokeWidth="8" strokeLinecap="round" />
          <path d="M 10,40 Q 30,25 50,40 T 90,40" fill="none" stroke="url(#smallWave)" strokeWidth="8" strokeLinecap="round" />
        </svg>
      </div>

      {/* ── Sidebar ── */}
      <aside className="w-60 shrink-0 border-r border-white/10 bg-white/[0.04] backdrop-blur-[15px] flex flex-col z-10 shadow-lg">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="text-lg font-bold tracking-tight text-white">Work Management</div>
          <div className="text-[10px] uppercase tracking-wider text-white/55 mt-1 font-semibold">
            {ROLE_LABEL[role]} Portal
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => onTab(t.key)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${activeTab === t.key
                  ? "bg-white/10 text-white border border-white/15 shadow-sm"
                  : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="rounded-lg bg-white/[0.04] border border-white/10 p-3 shadow-inner">
            <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
              Signed in as
            </div>
            <div className="text-sm font-bold mt-0.5 text-white">{user?.name}</div>
            <div className="text-[10px] text-white/60 truncate">{user?.email}</div>
            <button
              onClick={handleLogout}
              className="mt-3 w-full text-xs rounded-md border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold py-1.5 transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0 z-10 bg-transparent">

        <header className="h-14 border-b border-white/10 bg-white/[0.02] backdrop-blur-[10px] px-6 flex items-center justify-between shadow-sm">
          <div className="text-sm font-semibold text-white/70">
            {tabs.find((t) => t.key === activeTab)?.label}
          </div>

          {/* Bell button */}
          <div>
            <button
              ref={bellRef}
              onClick={handleBellClick}
              className="relative h-9 w-9 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 flex items-center justify-center text-white cursor-pointer transition-colors shadow-sm"
              aria-label="Notifications"
            >
              <BellIcon />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-[#ff3366] text-[10px] font-bold flex items-center justify-center text-white animate-pulse">
                  {unread}
                </span>
              )}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-transparent">
          {children}
        </div>
      </main>

      {/* ── Notification Portal — renders directly on body, above everything ── */}
      {openBell && createPortal(
        <>
          {/* Click-outside overlay */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 99998 }}
            onClick={() => setOpenBell(false)}
          />

          {/* Dropdown */}
          <div
            className="fixed w-80 rounded-xl border border-white/20 shadow-2xl"
            style={{
              zIndex: 99999,
              top: bellPos.bottom + 8,
              right: bellPos.right,
              background: "rgba(0, 18, 65, 0.97)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
          >
            {/* Dropdown header */}
            <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-widest text-white/50 font-semibold">
                Notifications
              </span>
              {unread > 0 && (
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-semibold">
                  {unread} new
                </span>
              )}
            </div>

            {/* Notification list */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 && (
                <div className="px-4 py-10 text-center text-xs text-white/40">
                  No notifications
                </div>
              )}
              {notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className="px-4 py-3 border-b border-white/[0.06] last:border-0 hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-2.5">
                    {!n.read ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    ) : (
                      <div className="w-1.5 h-1.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white leading-snug">
                        {n.title}
                      </div>
                      <div className="text-[11px] text-white/45 mt-1">
                        {fmtRel(n.at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-white/35">
                  {notifications.length} total
                </span>
                <button
                  onClick={() => markAllRead(role)}
                  className="text-[11px] text-blue-300 hover:text-blue-200 transition-colors cursor-pointer"
                >
                  Mark all read
                </button>
              </div>
            )}
          </div>
        </>,
        document.body
      )}

    </div>
  );
}

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}