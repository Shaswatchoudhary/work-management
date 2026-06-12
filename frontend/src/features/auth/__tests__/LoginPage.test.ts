import { describe, test, expect, beforeEach } from "vitest";
import { useAuthStore } from "../../../store/authStore";

// Define a mock user object
const mockAdminUser = {
  id: "u-admin",
  name: "Suresh Verma",
  email: "admin@company.com",
  role: "admin" as const,
  department: "Administration",
};

describe("LOGIN", () => {
  beforeEach(() => {
    useAuthStore.getState().login("admin@company.com", "1234", "admin");
  })

  test("Admin login Should work", () => {
    expect(useAuthStore.getState().user?.role).toBe(mockAdminUser.role);
    expect(useAuthStore.getState().user?.email).toBe(mockAdminUser.email);
    expect(useAuthStore.getState().user?.name).toBe(mockAdminUser.name);
    expect(useAuthStore.getState().user?.id).toBe(mockAdminUser.id);
    expect(useAuthStore.getState().user?.department).toBe(mockAdminUser.department);
  });
});
