import { Role } from "../types";

export const ROLES = {
  HELPDESK: "helpdesk" as const,
  HR: "hr" as const,
  ADMIN: "admin" as const,
};

export const ROLE_LABEL: Record<Role, string> = {
  helpdesk: "Help Desk",
  hr: "HR",
  admin: "Admin",
};

export const ROLE_HOME: Record<Role, string> = {
  helpdesk: "/helpdesk",
  hr: "/hr",
  admin: "/admin",
};
