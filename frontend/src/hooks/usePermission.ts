
import { useAuthStore } from "../store/authStore";

export function usePermission() {
  const role = useAuthStore((s) => s.user?.role);
  return {
    canApprove: role === "hr" || role === "admin",
    canSign: role === "hr" || role === "admin",
    canReleasePay: role === "admin",
    canCreateTicket: role === "helpdesk",
    canViewReports: role === "admin",
    role,
  };
}
