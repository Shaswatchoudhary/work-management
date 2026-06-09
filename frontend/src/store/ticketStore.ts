import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_TICKETS } from "../data/mockTickets";
import { Ticket, TicketState, SafeUser, Comment, TicketPdf, Status } from "../types";

const nextId = (tickets: Ticket[]): string => {
  const nums = tickets.map((t) => parseInt(t.id.replace("TKT-", ""), 10) || 0);
  const max = nums.length ? Math.max(...nums) : 1000;
  return `TKT-${max + 1}`;
};

export const useTicketStore = create<TicketState>()(
  persist(
    (set, get) => ({
      tickets: MOCK_TICKETS,

      addTicket: (data, user: SafeUser) => {
        const tickets = get().tickets;
        const id = nextId(tickets);
        const now = new Date().toISOString();

        const ticket: Ticket = {
          id,
          ...data,
          status: "pending_hr" as Status,
          createdBy: user.id,
          createdAt: now,
          updatedAt: now,
          assignee: null,
          inspection: null,
          payment: null,
          pdfs: [],
          signatures: {},
          comments: [
            {
              id: "c-" + Date.now(),
              userId: user.id,
              role: user.role,
              text: "Ticket submitted.",
              at: now,
            },
          ],
        };

        set({ tickets: [ticket, ...tickets] });
        return ticket;
      },

      // Signatures hamesha merge hongi — kabhi overwrite nahi
      updateTicket: (id: string, patch: Partial<Ticket>) =>
        set((s) => ({
          tickets: s.tickets.map((t) => {
            if (t.id !== id) return t;
            return {
              ...t,
              ...patch,
              signatures: {
                ...t.signatures,
                ...(patch.signatures ?? {}),
              },
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      addComment: (id: string, comment: Omit<Comment, "id" | "at">) =>
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === id
              ? {
                  ...t,
                  comments: [
                    ...t.comments,
                    {
                      id: "c-" + Date.now(),
                      at: new Date().toISOString(),
                      ...comment,
                    },
                  ],
                  updatedAt: new Date().toISOString(),
                }
              : t,
          ),
        })),

      addPdf: (id: string, pdf: TicketPdf) =>
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === id ? { ...t, pdfs: [...t.pdfs, pdf] } : t,
          ),
        })),

      setStatus: (id: string, status: Status, opts = {}) => {
        const { comment, patch } = opts;
        set((s) => ({
          tickets: s.tickets.map((t) => {
            if (t.id !== id) return t;

            const incoming = patch ?? {};

            return {
              ...t,
              ...incoming,
              status,
              updatedAt: new Date().toISOString(),
              // Signatures kabhi overwrite nahi hongi
              // Purane signs preserve, naye merge
              signatures: {
                ...t.signatures,
                ...(incoming.signatures ?? {}),
              },
              comments: comment
                ? [
                    ...t.comments,
                    {
                      id: "c-" + Date.now(),
                      at: new Date().toISOString(),
                      ...comment,
                    },
                  ]
                : t.comments,
            };
          }),
        }));
      },

      getById: (id: string) => get().tickets.find((t) => t.id === id),

      reset: () => set({ tickets: MOCK_TICKETS }),
    }),
    {
      name: "ticketms-tickets",
    },
  ),
);