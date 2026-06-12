import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
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

      verifyCredentials: async (email: string, password: string, role: Role) => {
        // Fallback to local mock users first for demo purposes
        const localUser = MOCK_USERS.find(
          (x) => x.email === email && x.password === password && x.role === role,
        );
        if (localUser) {
          const { password: _, ...safe } = localUser;
          return { ok: true as const, user: safe };
        }

        try {
          const response = await axios.post("http://localhost:8080/api/auth/login", {
            email,
            password,
          });
          const userData = response.data.user || response.data;
          if (userData && userData.role === role) {
            return { ok: true as const, user: userData };
          }
          return { ok: false as const, error: "Invalid credentials or role mismatch." };
        } catch (e: any) {
          if (e.response && (e.response.status === 401 || e.response.status === 400)) {
            return { ok: false as const, error: e.response.data?.message || "Invalid credentials." };
          }
          return { ok: false as const, error: "Unable to connect to the authentication server." };
        }
      },

      login: async (email: string, password: string, role: Role) => {
        // Fallback to local mock users first for demo purposes
        const localUser = MOCK_USERS.find(
          (x) => x.email === email && x.password === password && x.role === role,
        );
        if (localUser) {
          const { password: _, ...safe } = localUser;
          set({ user: safe });
          return { ok: true as const, user: safe };
        }

        try {
          const response = await axios.post("http://localhost:8080/api/auth/login", {
            email,
            password,
          });
          const userData = response.data.user || response.data;
          if (userData && userData.role === role) {
            set({ user: userData });
            return { ok: true as const, user: userData };
          }
          return { ok: false as const, error: "Invalid credentials or role mismatch." };
        } catch (e: any) {
          if (e.response && (e.response.status === 401 || e.response.status === 400)) {
            return { ok: false as const, error: e.response.data?.message || "Invalid credentials." };
          }
          return { ok: false as const, error: "Unable to connect to the authentication server." };
        }
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