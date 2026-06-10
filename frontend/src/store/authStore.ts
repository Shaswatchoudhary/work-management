import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_USERS } from "../data/mockUsers";
import { Role, SafeUser, AuthState } from "../types";

const VALID_ROLES: Role[] = ["helpdesk", "hr", "admin"];

const isValidUser = (user: SafeUser | null): user is SafeUser =>
  user !== null && VALID_ROLES.includes(user.role);

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hasHydrated: false,

      setHasHydrated: (hasHydrated: boolean) => set({ hasHydrated }),

      verifyCredentials: (email: string, password: string, role: Role) => {
        const u = MOCK_USERS.find(
          (x) => x.email === email && x.password === password && x.role === role,
        );
        if (!u) return { ok: false as const, error: "Invalid credentials or role mismatch." };
        const { password: _, ...safe } = u;
        return { ok: true as const, user: safe };
      },

      login: (email: string, password: string, role: Role) => {
        const u = MOCK_USERS.find(
          (x) => x.email === email && x.password === password && x.role === role,
        );
        if (!u) return { ok: false as const, error: "Invalid credentials or role mismatch." };
        const { password: _, ...safe } = u;
        set({ user: safe });
        return { ok: true as const, user: safe };
      },

      logout: () => set({ user: null }),
    }),
    {
      name: "ticketms-auth",
      partialize: (state) => ({
        user: isValidUser(state.user) ? state.user : null,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!isValidUser(state.user)) state.logout();
        state.setHasHydrated(true);
      },
    },
  ),
);