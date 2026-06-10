import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.ts";
import { ROLE_HOME } from "../constants/roles.ts";
import { Role } from "../types";

interface ProtectedRouteProps {
  role: Role;
  children: React.ReactNode;
}

export default function ProtectedRoute({ role, children }: ProtectedRouteProps) {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  if (!hasHydrated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#F7F5F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    );
  }

  if (!user || !ROLE_HOME[user.role]) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }

  return <>{children}</>;
}
