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

      login: (email: string, password: string, role: Role) => {
        const u = MOCK_USERS.find(
          (x) => x.email === email && x.password === password && x.role === role,
        );
        if (!u) return { ok: false, error: "Invalid credentials or role mismatch." };
        const { password: _, ...safe } = u;
        set({ user: safe });
        return { ok: true, user: safe };
      },

      logout: () => set({ user: null }),
    }),
    {
      name: "ticketms-auth",

      // Sirf user save karo localStorage mein
      // hasHydrated save mat karo — woh runtime flag hai
      partialize: (state) => ({
        user: isValidUser(state.user) ? state.user : null,
      }),

      // localStorage se data load hone ke baad yeh callback chalta hai
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!isValidUser(state.user)) state.logout();
        state.setHasHydrated(true);
      },
    },
  ),
);