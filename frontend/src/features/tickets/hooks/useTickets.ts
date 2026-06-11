// useTickets.ts
// Ticket list fetch, filter, paginate logic
// Replace filter logic from HelpdeskScreen / HrScreen / AdminScreen here
import { useMemo } from "react";
import { useTicketStore } from "../../../store/ticketStore";

export function useTickets() {
  const tickets = useTicketStore((s) => s.tickets);
  return { tickets };
}
