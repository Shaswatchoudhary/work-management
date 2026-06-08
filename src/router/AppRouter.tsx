import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.ts";
import { ROLE_HOME } from "../constants/roles.ts";
import LoginPage from "../pages/login/login.tsx";
import HrScreen from "../pages/hr/HrScreen.tsx";
import HelpdeskScreen from "../pages/helpdesk/HelpdeskScreen.tsx";
import AdminScreen from "../pages/admin/adminScreen.tsx";
import ProtectedRoute from "./ProtectedRoute.tsx";

export default function AppRouter() {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated); //hasHydrated is used to check if the user is logged in or not

  if (!hasHydrated) {
    return <div className="min-h-screen bg-[#0f0f0f]" />; // TODO: Add a loading spinner
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={user && ROLE_HOME[user.role] ? ROLE_HOME[user.role] : "/login"}
            replace
          />
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/hr"
        element={
          <ProtectedRoute role="hr">
            <HrScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/helpdesk"
        element={
          <ProtectedRoute role="helpdesk">
            <HelpdeskScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminScreen />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
