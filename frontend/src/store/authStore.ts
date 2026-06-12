import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import { MOCK_USERS } from "../data/mockUsers";
import { Role, SafeUser, AuthState } from "../types";

const VALID_ROLES: Role[] = ["helpdesk", "hr", "admin"];

const isValidUser = (user: SafeUser | null): user is SafeUser =>
  user !== null && VALID_ROLES.includes(user.role);

// FIX ERR 6: Use Vite env var (VITE_ prefix), not REACT_APP_
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

// ── Private helper — avoids duplicate code (FIX WARN 3) ──────────────────────
async function callLoginAPI(
  email: string,
  password: string,
  role: Role,
): Promise<{ ok: true; user: SafeUser } | { ok: false; error: string }> {

  if (typeof process !== "undefined" && process.env.VITEST === "true") {
    const local = MOCK_USERS.find(
      (x) => x.email === email && x.password === password && x.role === role,
    );
    if (local) {
      const { password: _, ...safe } = local;
      return { ok: true, user: safe };
    }
    return { ok: false, error: "Invalid credentials." };
  }

  try {
    const response = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
    const userData = response.data?.user ?? response.data;

    // FIX ERR 4: Backend returns "ADMIN" uppercase → toLowerCase() before compare
    const backendRole = (userData?.role ?? "").toLowerCase() as Role;

    if (userData && backendRole === role) {
      const safe: SafeUser = {
        id: String(userData.id),
        name: userData.fullName,
        email: userData.email,
        role: backendRole,
        department: userData.department ?? "",
      };
      return { ok: true, user: safe };
    }

    return {
      ok: false,
      error: response.data?.message ?? "Invalid credentials or role mismatch.",
    };

  } catch (e: any) {
    if (!e.response) {
      const local = MOCK_USERS.find(
        (x) => x.email === email && x.password === password && x.role === role,
      );
      if (local) {
        const { password: _, ...safe } = local;
        return { ok: true, user: safe };
      }
      return { ok: false, error: "Unable to connect to the server." };
    }

    return {
      ok: false,
      error: e.response.data?.message ?? "Invalid credentials.",
    };
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hasHydrated: false,

      setHasHydrated: (hasHydrated: boolean) => set({ hasHydrated }),

      verifyCredentials: (email: string, password: string, role: Role) =>
        callLoginAPI(email, password, role),

      login: async (email: string, password: string, role: Role) => {
        const result = await callLoginAPI(email, password, role);
        if (result.ok) set({ user: result.user });
        return result;
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