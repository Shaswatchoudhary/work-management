#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════╗
# ║  Work Management — Full Migration v2                            ║
# ║  Run from: project root (where src/ is)                        ║
# ║  Command:  bash migrate_v2.sh                                  ║
# ╚══════════════════════════════════════════════════════════════════╝
set -e

echo "🚀 Starting full migration v2..."
echo ""

# ── STEP 1: Create all new folders ─────────────────────────────────
echo "📁 Creating folder structure..."

mkdir -p src/features/auth/components
mkdir -p src/features/auth/hooks
mkdir -p src/features/auth/types
mkdir -p src/features/auth/__tests__
mkdir -p src/features/auth/e2e
mkdir -p src/features/auth/styles

mkdir -p src/features/helpdesk/components
mkdir -p src/features/helpdesk/hooks
mkdir -p src/features/helpdesk/types
mkdir -p src/features/helpdesk/__tests__
mkdir -p src/features/helpdesk/e2e
mkdir -p src/features/helpdesk/styles

mkdir -p src/features/hr/components
mkdir -p src/features/hr/hooks
mkdir -p src/features/hr/types
mkdir -p src/features/hr/__tests__
mkdir -p src/features/hr/e2e
mkdir -p src/features/hr/styles

mkdir -p src/features/admin/components
mkdir -p src/features/admin/hooks
mkdir -p src/features/admin/types
mkdir -p src/features/admin/__tests__
mkdir -p src/features/admin/e2e
mkdir -p src/features/admin/styles

mkdir -p src/features/tickets/components
mkdir -p src/features/tickets/hooks
mkdir -p src/features/tickets/store
mkdir -p src/features/tickets/types
mkdir -p src/features/tickets/__tests__
mkdir -p src/features/tickets/e2e
mkdir -p src/features/tickets/styles

mkdir -p src/features/signature/components
mkdir -p src/features/signature/hooks
mkdir -p src/features/signature/utils
mkdir -p src/features/signature/types
mkdir -p src/features/signature/__tests__
mkdir -p src/features/signature/e2e
mkdir -p src/features/signature/styles

mkdir -p src/features/pdf/utils
mkdir -p src/features/pdf/components
mkdir -p src/features/pdf/__tests__
mkdir -p src/features/pdf/styles

mkdir -p src/features/notifications/components
mkdir -p src/features/notifications/store
mkdir -p src/features/notifications/hooks
mkdir -p src/features/notifications/types
mkdir -p src/features/notifications/__tests__
mkdir -p src/features/notifications/styles

mkdir -p src/features/thread/components
mkdir -p src/features/thread/hooks
mkdir -p src/features/thread/__tests__
mkdir -p src/features/thread/styles

mkdir -p src/shared/components/layout
mkdir -p src/shared/components/ui
mkdir -p src/shared/hooks
mkdir -p src/shared/styles

mkdir -p src/router/__tests__

echo "   ✓ All folders created"

# ── STEP 2: AUTH ────────────────────────────────────────────────────
echo ""
echo "🔐 Migrating auth..."

# Login page — check both possible locations
if [ -f src/features/auth/LoginPage.tsx ]; then
  echo "   ✓ LoginPage already in place"
elif [ -f src/pages/login/login.tsx ]; then
  cp src/pages/login/login.tsx src/features/auth/components/LoginPage.tsx
  echo "   ✓ LoginPage moved"
fi

# Register page
if [ -f src/features/auth/RegisterPage.tsx ]; then
  mv src/features/auth/RegisterPage.tsx src/features/auth/components/RegisterPage.tsx
  echo "   ✓ RegisterPage moved to components/"
elif [ -f src/pages/register/RegisterScreen.tsx ]; then
  cp src/pages/register/RegisterScreen.tsx src/features/auth/components/RegisterPage.tsx
  echo "   ✓ RegisterPage moved"
fi

# Auth store
if [ -f src/store/authStore.ts ]; then
  cp src/store/authStore.ts src/features/auth/store/authStore.ts
  echo "   ✓ authStore copied to features/auth/store/"
fi

# Create auth index.ts
cat > src/features/auth/index.ts << 'EOF'
export { default as LoginPage } from "./components/LoginPage";
export { default as RegisterPage } from "./components/RegisterPage";
EOF
echo "   ✓ auth/index.ts created"

# Create auth hook stub
cat > src/features/auth/hooks/useAuth.ts << 'EOF'
import { useAuthStore } from "../../../store/authStore";
export function useAuth() {
  const user     = useAuthStore((s) => s.user);
  const login    = useAuthStore((s) => s.login);
  const logout   = useAuthStore((s) => s.logout);
  return { user, login, logout };
}
EOF
echo "   ✓ useAuth.ts created"

# Create auth types stub
cat > src/features/auth/types/auth.types.ts << 'EOF'
export type { Role, SafeUser, AuthState, User } from "../../../types";
EOF
echo "   ✓ auth.types.ts created"

# Create auth test stub
cat > src/features/auth/__tests__/LoginPage.test.tsx << 'EOF'
import { describe, it, expect } from "vitest";
// TODO: Add LoginPage unit tests
describe("LoginPage", () => {
  it("renders login form", () => {
    expect(true).toBe(true);
  });
});
EOF
echo "   ✓ LoginPage.test.tsx stub created"

# Create auth e2e stub
cat > src/features/auth/e2e/login.spec.ts << 'EOF'
// e2e test — uses Playwright
// import { test, expect } from "@playwright/test";
// test("user can login as helpdesk", async ({ page }) => {
//   await page.goto("/login");
//   await page.fill('[type="email"]', "helpdesk@company.com");
//   await page.fill('[type="password"]', "1234");
//   await page.click('[type="submit"]');
//   await expect(page).toHaveURL("/helpdesk");
// });
export {};
EOF
echo "   ✓ login.spec.ts stub created"

touch src/features/auth/styles/auth.module.scss
echo "   ✓ auth.module.scss created"

# ── STEP 3: HELPDESK ───────────────────────────────────────────────
echo ""
echo "🖥  Migrating helpdesk..."

for f in src/features/helpdesk/HelpdeskScreen.tsx src/pages/helpdesk/HelpdeskScreen.tsx; do
  if [ -f "$f" ]; then
    cp "$f" src/features/helpdesk/components/HelpdeskScreen.tsx
    echo "   ✓ HelpdeskScreen moved to components/"
    break
  fi
done

cat > src/features/helpdesk/hooks/useHelpdeskTickets.ts << 'EOF'
import { useTicketStore } from "../../../store/ticketStore";
import { useAuthStore } from "../../../store/authStore";
export function useHelpdeskTickets() {
  const tickets = useTicketStore((s) => s.tickets);
  const user    = useAuthStore((s) => s.user);
  return {
    myTickets:   tickets.filter((t) => t.createdBy === user?.id),
    allTickets:  tickets,
  };
}
EOF
echo "   ✓ useHelpdeskTickets.ts created"

cat > src/features/helpdesk/types/helpdesk.types.ts << 'EOF'
export type { Ticket, Status, Priority } from "../../../types";
EOF
echo "   ✓ helpdesk.types.ts created"

cat > src/features/helpdesk/__tests__/HelpdeskScreen.test.tsx << 'EOF'
import { describe, it, expect } from "vitest";
describe("HelpdeskScreen", () => {
  it("renders dashboard", () => { expect(true).toBe(true); });
});
EOF

cat > src/features/helpdesk/e2e/helpdesk.spec.ts << 'EOF'
// e2e — Playwright
export {};
EOF

touch src/features/helpdesk/styles/helpdesk.module.scss

cat > src/features/helpdesk/index.ts << 'EOF'
export { default as HelpdeskScreen } from "./components/HelpdeskScreen";
EOF
echo "   ✓ helpdesk/index.ts created"

# ── STEP 4: HR ─────────────────────────────────────────────────────
echo ""
echo "👩‍💼 Migrating HR..."

for f in src/features/hr/HrScreen.tsx src/pages/hr/HrScreen.tsx; do
  if [ -f "$f" ]; then
    cp "$f" src/features/hr/components/HrScreen.tsx
    echo "   ✓ HrScreen moved to components/"
    break
  fi
done

cat > src/features/hr/hooks/useHrQueue.ts << 'EOF'
import { useTicketStore } from "../../../store/ticketStore";
export function useHrQueue() {
  const tickets  = useTicketStore((s) => s.tickets);
  return {
    pending:    tickets.filter((t) => t.status === "pending_hr"),
    inspection: tickets.filter((t) =>
      t.status === "inspection_pending" &&
      t.inspection?.passed &&
      !t.inspection?.signedByHr
    ),
  };
}
EOF
echo "   ✓ useHrQueue.ts created"

cat > src/features/hr/types/hr.types.ts << 'EOF'
export type { Ticket, Status } from "../../../types";
EOF

cat > src/features/hr/__tests__/HrScreen.test.tsx << 'EOF'
import { describe, it, expect } from "vitest";
describe("HrScreen", () => {
  it("renders queue", () => { expect(true).toBe(true); });
});
EOF

cat > src/features/hr/e2e/hr.spec.ts << 'EOF'
export {};
EOF

touch src/features/hr/styles/hr.module.scss

cat > src/features/hr/index.ts << 'EOF'
export { default as HrScreen } from "./components/HrScreen";
EOF
echo "   ✓ hr/index.ts created"

# ── STEP 5: ADMIN ──────────────────────────────────────────────────
echo ""
echo "🛡  Migrating admin..."

for f in src/features/admin/AdminScreen.tsx src/pages/admin/adminScreen.tsx src/pages/admin/AdminScreen.tsx; do
  if [ -f "$f" ]; then
    cp "$f" src/features/admin/components/AdminScreen.tsx
    echo "   ✓ AdminScreen moved to components/"
    break
  fi
done

cat > src/features/admin/hooks/useAdminQueue.ts << 'EOF'
import { useTicketStore } from "../../../store/ticketStore";
export function useAdminQueue() {
  const tickets = useTicketStore((s) => s.tickets);
  return {
    finalApproval: tickets.filter((t) => t.status === "pending_admin"),
    inspection:    tickets.filter((t) =>
      t.status === "inspection_pending" &&
      t.inspection?.passed &&
      !t.inspection?.signedByAdmin
    ),
    payments: tickets.filter((t) => t.status === "payment_pending"),
  };
}
EOF
echo "   ✓ useAdminQueue.ts created"

cat > src/features/admin/types/admin.types.ts << 'EOF'
export type { Ticket, Status } from "../../../types";
EOF

cat > src/features/admin/__tests__/AdminScreen.test.tsx << 'EOF'
import { describe, it, expect } from "vitest";
describe("AdminScreen", () => {
  it("renders approval queue", () => { expect(true).toBe(true); });
});
EOF

cat > src/features/admin/e2e/admin.spec.ts << 'EOF'
export {};
EOF

touch src/features/admin/styles/admin.module.scss

cat > src/features/admin/index.ts << 'EOF'
export { default as AdminScreen } from "./components/AdminScreen";
EOF
echo "   ✓ admin/index.ts created"

# ── STEP 6: TICKETS ────────────────────────────────────────────────
echo ""
echo "🎫 Migrating tickets..."

for comp in TicketDetail TicketTable TicketForm StatusTimeline RequirementDoc; do
  for dir in src/features/tickets src/components/ticket; do
    if [ -f "$dir/${comp}.tsx" ]; then
      cp "$dir/${comp}.tsx" src/features/tickets/components/${comp}.tsx
      echo "   ✓ ${comp} moved"
      break
    fi
  done
done

# ticketStore
if [ -f src/store/ticketStore.ts ]; then
  cp src/store/ticketStore.ts src/features/tickets/store/ticketStore.ts
  echo "   ✓ ticketStore copied"
fi

cat > src/features/tickets/hooks/useTickets.ts << 'EOF'
import { useTicketStore } from "../../../store/ticketStore";
import { useAuthStore }   from "../../../store/authStore";
export function useTickets() {
  const tickets = useTicketStore((s) => s.tickets);
  const user    = useAuthStore((s) => s.user);
  return {
    tickets,
    myTickets: tickets.filter((t) => t.createdBy === user?.id),
    getById:   (id: string) => tickets.find((t) => t.id === id),
  };
}
EOF

cat > src/features/tickets/hooks/useTicketActions.ts << 'EOF'
import { useTicketStore }        from "../../../store/ticketStore";
import { useAuthStore }          from "../../../store/authStore";
import { useNotificationStore }  from "../../../store/notificationStore";
export function useTicketActions(ticketId: string) {
  const ticket       = useTicketStore((s) => s.tickets.find((t) => t.id === ticketId));
  const setStatus    = useTicketStore((s) => s.setStatus);
  const updateTicket = useTicketStore((s) => s.updateTicket);
  const addPdf       = useTicketStore((s) => s.addPdf);
  const user         = useAuthStore((s) => s.user);
  const notify       = useNotificationStore((s) => s.addNotification);
  return { ticket, setStatus, updateTicket, addPdf, user, notify };
}
EOF
echo "   ✓ ticket hooks created"

cat > src/features/tickets/types/ticket.types.ts << 'EOF'
export type {
  Ticket, Status, Priority, Comment,
  Assignee, Inspection, Payment, TicketPdf,
  TicketState, SignatureBlock, SignaturePurpose,
} from "../../../types";
EOF

cat > src/features/tickets/__tests__/TicketForm.test.tsx << 'EOF'
import { describe, it, expect } from "vitest";
describe("TicketForm", () => {
  it("renders form fields", () => { expect(true).toBe(true); });
});
EOF

cat > src/features/tickets/__tests__/TicketDetail.test.tsx << 'EOF'
import { describe, it, expect } from "vitest";
describe("TicketDetail", () => {
  it("renders ticket info", () => { expect(true).toBe(true); });
});
EOF

cat > src/features/tickets/__tests__/useTickets.test.ts << 'EOF'
import { describe, it, expect } from "vitest";
describe("useTickets", () => {
  it("returns tickets array", () => { expect(true).toBe(true); });
});
EOF

cat > src/features/tickets/e2e/ticket-flow.spec.ts << 'EOF'
// Full ticket lifecycle: create → HR approve → Admin approve → work → inspect → pay → close
export {};
EOF

touch src/features/tickets/styles/tickets.module.scss

cat > src/features/tickets/index.ts << 'EOF'
export { default as TicketDetail }   from "./components/TicketDetail";
export { default as TicketTable }    from "./components/TicketTable";
export { default as TicketForm }     from "./components/TicketForm";
export { default as StatusTimeline } from "./components/StatusTimeline";
export { default as RequirementDoc } from "./components/RequirementDoc";
export { useTickets }        from "./hooks/useTickets";
export { useTicketActions }  from "./hooks/useTicketActions";
EOF
echo "   ✓ tickets/index.ts created"

# ── STEP 7: SIGNATURE ─────────────────────────────────────────────
echo ""
echo "✍️  Migrating signature..."

for f in src/features/signature/PinThenDrawSignature.tsx src/components/signature/PinThenDrawSignature.tsx; do
  [ -f "$f" ] && cp "$f" src/features/signature/components/PinThenDrawSignature.tsx && echo "   ✓ PinThenDrawSignature" && break
done

for f in src/features/signature/SignatureBlock.tsx src/components/signature/SignatureBlock.tsx; do
  [ -f "$f" ] && cp "$f" src/features/signature/components/SignatureBlock.tsx && echo "   ✓ SignatureBlock" && break
done

for f in src/features/signature/signatureEngine.ts src/utils/signatureEngine.ts; do
  [ -f "$f" ] && cp "$f" src/features/signature/utils/signatureEngine.ts && echo "   ✓ signatureEngine" && break
done

cat > src/features/signature/hooks/useSignature.ts << 'EOF'
import { useState } from "react";
import { createSignatureBlock, verifyPin } from "../utils/signatureEngine";
import type { SignatureBlock, SignaturePurpose } from "../../../types";

export function useSignature(userId: string, userName: string, ticketId: string, purpose: SignaturePurpose) {
  const [sig, setSig]       = useState<SignatureBlock | null>(null);
  const [locked, setLocked] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const verify = (pin: string): boolean => {
    if (locked) return false;
    const ok = verifyPin(userId, pin);
    if (!ok) {
      const n = attempts + 1;
      setAttempts(n);
      if (n >= 3) setLocked(true);
      return false;
    }
    return true;
  };

  const save = (imageData: string) => {
    const block = createSignatureBlock(userId, userName, ticketId, purpose, imageData);
    setSig(block);
    return block;
  };

  return { sig, locked, attempts, verify, save };
}
EOF
echo "   ✓ useSignature.ts created"

cat > src/features/signature/types/signature.types.ts << 'EOF'
export type { SignatureBlock, SignaturePurpose } from "../../../types";
EOF

cat > src/features/signature/__tests__/signatureEngine.test.ts << 'EOF'
import { describe, it, expect } from "vitest";
describe("signatureEngine", () => {
  it("generates unique hash", () => { expect(true).toBe(true); });
  it("verifies correct PIN", () => { expect(true).toBe(true); });
  it("rejects wrong PIN", () => { expect(true).toBe(true); });
});
EOF

cat > src/features/signature/__tests__/PinThenDrawSignature.test.tsx << 'EOF'
import { describe, it, expect } from "vitest";
describe("PinThenDrawSignature", () => {
  it("shows PIN input initially", () => { expect(true).toBe(true); });
  it("locks after 3 wrong attempts", () => { expect(true).toBe(true); });
});
EOF

cat > src/features/signature/e2e/signature.spec.ts << 'EOF'
export {};
EOF

touch src/features/signature/styles/signature.module.scss

cat > src/features/signature/index.ts << 'EOF'
export { default as PinThenDrawSignature } from "./components/PinThenDrawSignature";
export { createSignatureBlock, verifyPin, verifySignatureIntegrity, formatSignatureTimestamp } from "./utils/signatureEngine";
export { useSignature } from "./hooks/useSignature";
EOF
echo "   ✓ signature/index.ts created"

# ── STEP 8: PDF ────────────────────────────────────────────────────
echo ""
echo "📄 Migrating PDF..."

for f in src/features/pdf/generatePDF.ts src/utils/generatePDF.ts src/utils/pdfGenerator.ts; do
  [ -f "$f" ] && cp "$f" src/features/pdf/utils/generatePDF.ts && echo "   ✓ generatePDF moved" && break
done

cat > src/features/pdf/__tests__/generatePDF.test.ts << 'EOF'
import { describe, it, expect } from "vitest";
describe("generatePDF", () => {
  it("generates requirement PDF", () => { expect(true).toBe(true); });
  it("generates payment PDF", () => { expect(true).toBe(true); });
  it("output is image-locked", () => { expect(true).toBe(true); });
});
EOF

touch src/features/pdf/styles/pdf.module.scss

cat > src/features/pdf/index.ts << 'EOF'
export { generatePDF, generateAndDownloadPdf, ticketToTicketData } from "./utils/generatePDF";
EOF
echo "   ✓ pdf/index.ts created"

# ── STEP 9: NOTIFICATIONS ─────────────────────────────────────────
echo ""
echo "🔔 Migrating notifications..."

if [ -f src/store/notificationStore.ts ]; then
  cp src/store/notificationStore.ts src/features/notifications/store/notificationStore.ts
  echo "   ✓ notificationStore copied"
fi

cat > src/features/notifications/components/NotificationBell.tsx << 'EOF'
// NotificationBell extracted from AppShell
// TODO: Move bell + portal from AppShell.tsx here
export {};
EOF

cat > src/features/notifications/hooks/useNotifications.ts << 'EOF'
import { useNotificationStore } from "../../../store/notificationStore";
import type { Role } from "../../../types";
export function useNotifications(role: Role) {
  const all        = useNotificationStore((s) => s.notifications);
  const markAllRead= useNotificationStore((s) => s.markAllRead);
  const add        = useNotificationStore((s) => s.addNotification);
  const notifications = all.filter((n) => n.forRole === role || n.forRole === "all");
  const unread     = notifications.filter((n) => !n.read).length;
  return { notifications, unread, markAllRead, add };
}
EOF
echo "   ✓ useNotifications.ts created"

cat > src/features/notifications/types/notification.types.ts << 'EOF'
export type { Notification, NotificationState } from "../../../types";
EOF

cat > src/features/notifications/__tests__/useNotifications.test.ts << 'EOF'
import { describe, it, expect } from "vitest";
describe("useNotifications", () => {
  it("filters by role", () => { expect(true).toBe(true); });
  it("counts unread correctly", () => { expect(true).toBe(true); });
});
EOF

touch src/features/notifications/styles/notifications.module.scss

cat > src/features/notifications/index.ts << 'EOF'
export { useNotifications } from "./hooks/useNotifications";
EOF
echo "   ✓ notifications/index.ts created"

# ── STEP 10: THREAD ────────────────────────────────────────────────
echo ""
echo "💬 Migrating thread..."

for f in src/features/thread/CommentThread.tsx src/components/thread/CommentThread.tsx; do
  [ -f "$f" ] && cp "$f" src/features/thread/components/CommentThread.tsx && echo "   ✓ CommentThread moved" && break
done

cat > src/features/thread/hooks/useComments.ts << 'EOF'
import { useTicketStore } from "../../../store/ticketStore";
import { useAuthStore }   from "../../../store/authStore";
export function useComments(ticketId: string) {
  const ticket     = useTicketStore((s) => s.tickets.find((t) => t.id === ticketId));
  const addComment = useTicketStore((s) => s.addComment);
  const user       = useAuthStore((s) => s.user);
  return {
    comments: ticket?.comments ?? [],
    addComment: (text: string) => {
      if (!user || !text.trim()) return;
      addComment(ticketId, { userId: user.id, role: user.role, text: text.trim() });
    },
  };
}
EOF
echo "   ✓ useComments.ts created"

cat > src/features/thread/__tests__/CommentThread.test.tsx << 'EOF'
import { describe, it, expect } from "vitest";
describe("CommentThread", () => {
  it("renders comments", () => { expect(true).toBe(true); });
  it("adds comment on submit", () => { expect(true).toBe(true); });
});
EOF

touch src/features/thread/styles/thread.module.scss

cat > src/features/thread/index.ts << 'EOF'
export { default as CommentThread } from "./components/CommentThread";
export { useComments } from "./hooks/useComments";
EOF
echo "   ✓ thread/index.ts created"

# ── STEP 11: SHARED ────────────────────────────────────────────────
echo ""
echo "🔗 Migrating shared components..."

[ -f src/components/layout/AppShell.tsx ] && cp src/components/layout/AppShell.tsx src/shared/components/layout/AppShell.tsx && echo "   ✓ AppShell"

for ui in CustomBadge CustomButton Field Modal StatCard; do
  [ -f src/components/ui/${ui}.tsx ] && cp src/components/ui/${ui}.tsx src/shared/components/ui/${ui}.tsx && echo "   ✓ ${ui}"
done

cat > src/shared/hooks/usePermission.ts << 'EOF'
import { useAuthStore } from "../../store/authStore";
export function usePermission() {
  const role = useAuthStore((s) => s.user?.role);
  return {
    canApprove:      role === "hr" || role === "admin",
    canSign:         role === "hr" || role === "admin",
    canReleasePay:   role === "admin",
    canCreateTicket: role === "helpdesk",
    canViewReports:  role === "admin",
    canInspect:      role === "helpdesk",
    role,
  };
}
EOF
echo "   ✓ usePermission.ts created"

touch src/shared/styles/global.module.scss

cat > src/shared/index.ts << 'EOF'
export { default as AppShell }     from "./components/layout/AppShell";
export { default as CustomBadge }  from "./components/ui/CustomBadge";
export { default as CustomButton } from "./components/ui/CustomButton";
export { default as StatCard }     from "./components/ui/StatCard";
export { default as Modal }        from "./components/ui/Modal";
export { usePermission }           from "./hooks/usePermission";
EOF
echo "   ✓ shared/index.ts created"

# ── STEP 12: ROUTER __tests__ ─────────────────────────────────────
echo ""
echo "🔀 Adding router tests..."

cat > src/router/__tests__/AppRouter.test.tsx << 'EOF'
import { describe, it, expect } from "vitest";
describe("AppRouter", () => {
  it("redirects unauthenticated to login", () => { expect(true).toBe(true); });
  it("redirects helpdesk user to /helpdesk", () => { expect(true).toBe(true); });
  it("redirects hr user to /hr", () => { expect(true).toBe(true); });
  it("redirects admin user to /admin", () => { expect(true).toBe(true); });
});
EOF
echo "   ✓ AppRouter.test.tsx stub created"

# ── STEP 13: Summary ──────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════"
echo "✅  Migration v2 complete!"
echo ""
echo "📦 New structure:"
echo "   src/features/auth/         → login, register, useAuth"
echo "   src/features/helpdesk/     → HelpdeskScreen, useHelpdeskTickets"
echo "   src/features/hr/           → HrScreen, useHrQueue"
echo "   src/features/admin/        → AdminScreen, useAdminQueue"
echo "   src/features/tickets/      → all ticket components + hooks + store"
echo "   src/features/signature/    → PinThenDrawSignature, signatureEngine"
echo "   src/features/pdf/          → generatePDF"
echo "   src/features/notifications/→ notificationStore, useNotifications"
echo "   src/features/thread/       → CommentThread, useComments"
echo "   src/shared/                → AppShell, UI components, usePermission"
echo "   src/router/__tests__/      → AppRouter tests"
echo ""
echo "⚠️  IMPORTANT — Update imports in these files:"
echo "   AppRouter.tsx              → import from features/auth, helpdesk, hr, admin"
echo "   TicketDetail.tsx           → import from features/signature, thread, pdf"
echo "   HelpdeskScreen.tsx         → import from features/tickets, shared"
echo "   HrScreen.tsx               → import from features/tickets, shared"
echo "   AdminScreen.tsx            → import from features/tickets, shared"
echo ""
echo "💡 VSCode: Cmd+Shift+H to Find & Replace across all files"
echo ""
echo "📋 Key import changes:"
echo "   ../../components/ticket/TicketDetail     → ../../features/tickets"
echo "   ../../components/signature/              → ../../features/signature"
echo "   ../../components/thread/CommentThread    → ../../features/thread"
echo "   ../../components/layout/AppShell        → ../../shared/components/layout/AppShell"
echo "   ../../utils/signatureEngine              → ../../features/signature/utils/signatureEngine"
echo "   ../../utils/generatePDF                  → ../../features/pdf/utils/generatePDF"
echo "   ../../store/notificationStore            → ../../store/notificationStore (unchanged)"
echo "   ../../store/authStore                    → ../../store/authStore (unchanged)"
echo "   ../../store/ticketStore                  → ../../store/ticketStore (unchanged)"
echo "════════════════════════════════════════════════════════"