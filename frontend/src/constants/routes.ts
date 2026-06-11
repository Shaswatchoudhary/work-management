// routes.ts
// All route path strings in one place.
// Import here instead of hardcoding "/helpdesk" everywhere.
export const ROUTES = {
  root:      "/",
  login:     "/login",
  register:  "/register",
  helpdesk:  "/helpdesk",
  hr:        "/hr",
  admin:     "/admin",
} as const;
