#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════╗
# ║  Work Management — Folder Migration Script                      ║
# ║  Run from: frontend/ root (where package.json is)              ║
# ║  Command:  bash migrate.sh                                      ║
# ╚══════════════════════════════════════════════════════════════════╝
set -e  # stop on any error

echo "🚀 Starting folder migration..."
echo ""

# ── STEP 1: Create all new feature folders ─────────────────────────
echo "📁 Creating feature folders..."
mkdir -p src/features/helpdesk
mkdir -p src/features/hr
mkdir -p src/features/admin
mkdir -p src/features/auth
mkdir -p src/features/tickets/hooks
mkdir -p src/features/signature
mkdir -p src/features/thread
mkdir -p src/features/payment
mkdir -p src/features/categories
mkdir -p src/features/pdf
echo "   ✓ Feature folders created"

# ── STEP 2: Move pages ─────────────────────────────────────────────
echo ""
echo "📄 Moving pages..."
[ -f src/pages/helpdesk/HelpdeskScreen.tsx ] && mv src/pages/helpdesk/HelpdeskScreen.tsx src/features/helpdesk/HelpdeskScreen.tsx && echo "   ✓ HelpdeskScreen"
[ -f src/pages/hr/HrScreen.tsx ]             && mv src/pages/hr/HrScreen.tsx             src/features/hr/HrScreen.tsx             && echo "   ✓ HrScreen"
[ -f src/pages/admin/adminScreen.tsx ]        && mv src/pages/admin/adminScreen.tsx        src/features/admin/AdminScreen.tsx       && echo "   ✓ AdminScreen"
[ -f src/pages/login/login.tsx ]              && mv src/pages/login/login.tsx              src/features/auth/LoginPage.tsx          && echo "   ✓ LoginPage"
[ -f src/pages/register/RegisterScreen.tsx ]  && mv src/pages/register/RegisterScreen.tsx  src/features/auth/RegisterPage.tsx       && echo "   ✓ RegisterPage"

# ── STEP 3: Move ticket components ────────────────────────────────
echo ""
echo "🎫 Moving ticket components..."
[ -f src/components/ticket/TicketDetail.tsx ]   && mv src/components/ticket/TicketDetail.tsx   src/features/tickets/TicketDetail.tsx   && echo "   ✓ TicketDetail"
[ -f src/components/ticket/TicketTable.tsx ]    && mv src/components/ticket/TicketTable.tsx    src/features/tickets/TicketTable.tsx    && echo "   ✓ TicketTable"
[ -f src/components/ticket/TicketForm.tsx ]     && mv src/components/ticket/TicketForm.tsx     src/features/tickets/TicketForm.tsx     && echo "   ✓ TicketForm"
[ -f src/components/ticket/TicketPDFPage.tsx ]  && mv src/components/ticket/TicketPDFPage.tsx  src/features/tickets/TicketPDFPage.tsx  && echo "   ✓ TicketPDFPage"
[ -f src/components/ticket/StatusTimeline.tsx ] && mv src/components/ticket/StatusTimeline.tsx src/features/tickets/StatusTimeline.tsx && echo "   ✓ StatusTimeline"
[ -f src/components/ticket/RequirementDoc.tsx ] && mv src/components/ticket/RequirementDoc.tsx src/features/tickets/RequirementDoc.tsx && echo "   ✓ RequirementDoc"

# ── STEP 4: Move signature ─────────────────────────────────────────
echo ""
echo "✍️  Moving signature..."
[ -f src/components/signature/PinThenDrawSignature.tsx ] && mv src/components/signature/PinThenDrawSignature.tsx src/features/signature/PinThenDrawSignature.tsx && echo "   ✓ PinThenDrawSignature"
[ -f src/components/signature/SignatureBlock.tsx ]        && mv src/components/signature/SignatureBlock.tsx        src/features/signature/SignatureBlock.tsx        && echo "   ✓ SignatureBlock"
[ -f src/components/signature/SignaturePad.tsx ]          && mv src/components/signature/SignaturePad.tsx          src/features/signature/SignaturePad.tsx          && echo "   ✓ SignaturePad"
[ -f src/utils/signatureEngine.ts ]                       && mv src/utils/signatureEngine.ts                       src/features/signature/signatureEngine.ts        && echo "   ✓ signatureEngine"

# ── STEP 5: Move thread ────────────────────────────────────────────
echo ""
echo "💬 Moving thread..."
[ -f src/components/thread/CommentThread.tsx ] && mv src/components/thread/CommentThread.tsx src/features/thread/CommentThread.tsx && echo "   ✓ CommentThread"

# ── STEP 6: Move payment + categories ─────────────────────────────
echo ""
echo "💳 Moving payment + categories..."
[ "$(ls -A src/components/payment/ 2>/dev/null)" ] && mv src/components/payment/* src/features/payment/ && echo "   ✓ payment files"
[ "$(ls -A src/components/categories/ 2>/dev/null)" ] && mv src/components/categories/* src/features/categories/ && echo "   ✓ categories files"

# ── STEP 7: Move PDF util ──────────────────────────────────────────
echo ""
echo "📄 Moving PDF..."
[ -f src/utils/generatePDF.ts ] && mv src/utils/generatePDF.ts src/features/pdf/generatePDF.ts && echo "   ✓ generatePDF"

# ── STEP 8: Remove now-empty old folders ──────────────────────────
echo ""
echo "🗑  Cleaning up empty folders..."
rmdir src/components/ticket     2>/dev/null && echo "   ✓ removed components/ticket"    || true
rmdir src/components/signature  2>/dev/null && echo "   ✓ removed components/signature" || true
rmdir src/components/thread     2>/dev/null && echo "   ✓ removed components/thread"    || true
rmdir src/components/payment    2>/dev/null && echo "   ✓ removed components/payment"   || true
rmdir src/components/categories 2>/dev/null && echo "   ✓ removed components/categories"|| true
rmdir src/pages/helpdesk 2>/dev/null || true
rmdir src/pages/hr       2>/dev/null || true
rmdir src/pages/admin    2>/dev/null || true
rmdir src/pages/login    2>/dev/null || true
rmdir src/pages/register 2>/dev/null || true
rmdir src/pages          2>/dev/null && echo "   ✓ removed pages/" || true

# ── STEP 9: Create new stub files ─────────────────────────────────
echo ""
echo "✨ Creating new stub files..."

cat > src/features/tickets/hooks/useTickets.ts << 'STUB'
// useTickets.ts
// Ticket list fetch, filter, paginate logic
// Replace filter logic from HelpdeskScreen / HrScreen / AdminScreen here
import { useMemo } from "react";
import { useTicketStore } from "../../../store/ticketStore";

export function useTickets() {
  const tickets = useTicketStore((s) => s.tickets);
  return { tickets };
}
STUB
echo "   ✓ useTickets.ts"

cat > src/features/tickets/hooks/useTicketActions.ts << 'STUB'
// useTicketActions.ts
// approve, reject, assign, markDone, inspectionPass/Fail
// Extracted from TicketDetail renderActions()
import { useTicketStore } from "../../../store/ticketStore";
import { useAuthStore } from "../../../store/authStore";
import { useNotificationStore } from "../../../store/notificationStore";

export function useTicketActions(ticketId: string) {
  const setStatus    = useTicketStore((s) => s.setStatus);
  const updateTicket = useTicketStore((s) => s.updateTicket);
  const user         = useAuthStore((s) => s.user);
  const notify       = useNotificationStore((s) => s.addNotification);
  return { setStatus, updateTicket, user, notify };
}
STUB
echo "   ✓ useTicketActions.ts"

cat > src/hooks/usePermission.ts << 'STUB'
// usePermission.ts
// Role-based permission checks — use in components to show/hide actions
import { useAuthStore } from "../store/authStore";

export function usePermission() {
  const role = useAuthStore((s) => s.user?.role);
  return {
    canApprove:     role === "hr" || role === "admin",
    canSign:        role === "hr" || role === "admin",
    canReleasePay:  role === "admin",
    canCreateTicket:role === "helpdesk",
    canViewReports: role === "admin",
    role,
  };
}
STUB
echo "   ✓ usePermission.ts"

cat > src/constants/routes.ts << 'STUB'
// routes.ts
// All route path strings in one place.
// Import here instead of hardcoding "/helpdesk" everywhere.
export const ROUTES = {
  root:      "/",
  login:     "/login",
  register:  "/register",
  helpdesk:  "/helpdesk",
  hr:        "/hr",
  admin:     "/admin",
} as const;
STUB
echo "   ✓ routes.ts"

echo ""
echo "════════════════════════════════════════"
echo "✅ Migration complete!"
echo ""
echo "NEXT STEP: Update imports in all moved files."
echo "VSCode tip: Cmd+Shift+H (Find & Replace across files)"
echo ""
echo "Key import path changes:"
echo "  components/ticket/   →  features/tickets/"
echo "  components/signature/ →  features/signature/"
echo "  components/thread/   →  features/thread/"
echo "  pages/helpdesk/      →  features/helpdesk/"
echo "  pages/hr/            →  features/hr/"
echo "  pages/admin/         →  features/admin/"
echo "  pages/login/         →  features/auth/"
echo "  utils/generatePDF    →  features/pdf/generatePDF"
echo "  utils/signatureEngine →  features/signature/signatureEngine"
echo "════════════════════════════════════════"
