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
