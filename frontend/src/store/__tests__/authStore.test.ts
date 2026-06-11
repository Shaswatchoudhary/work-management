import { describe, test, expect, beforeEach } from "vitest";
import { useAuthStore } from "../authStore";

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset store state and clear localStorage before each test
    useAuthStore.getState().logout();
    localStorage.clear();
  });

  test("initial state user null hona chahiye", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
  });

  test("verifyCredentials incorrect credentials pe error return karta hai", () => {
    const result = useAuthStore.getState().verifyCredentials(
      "nonexistent@company.com",
      "password",
      "hr"
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeDefined();
    }
  });

  test("verifyCredentials correct credentials pe user object return karta hai", () => {
    const result = useAuthStore.getState().verifyCredentials(
      "hr@company.com",
      "1234",
      "hr"
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user?.role).toBe("hr");
      expect(result.user?.email).toBe("hr@company.com");
    }
  });

  test("login successful login pe store user state set karta hai", () => {
    const result = useAuthStore.getState().login(
      "admin@company.com",
      "1234",
      "admin"
    );
    expect(result.ok).toBe(true);
    expect(useAuthStore.getState().user).not.toBeNull();
    expect(useAuthStore.getState().user?.role).toBe("admin");
  });

  test("login failed login pe store user state null hi rakhta hai", () => {
    const result = useAuthStore.getState().login(
      "hr@company.com",
      "wrong-password",
      "hr"
    );
    expect(result.ok).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  test("logout store user state ko clear (null) karta hai", () => {
    // Pehle login karein
    useAuthStore.getState().login("helpdesk@company.com", "1234", "helpdesk");
    expect(useAuthStore.getState().user).not.toBeNull();

    // Fir logout karein
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
