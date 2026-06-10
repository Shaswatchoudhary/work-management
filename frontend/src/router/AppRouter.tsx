import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.ts";
import { ROLE_HOME } from "../constants/roles.ts";
import LoginPage from "../pages/login/login.tsx";
import RegisterPage from "../pages/register/RegisterScreen.tsx";
import HrScreen from "../pages/hr/HrScreen.tsx";
import HelpdeskScreen from "../pages/helpdesk/HelpdeskScreen.tsx";
import AdminScreen from "../pages/admin/adminScreen.tsx";
import ProtectedRoute from "./ProtectedRoute.tsx";

export default function AppRouter() {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  // hasHydrated: localStorage se data load hone tak wait karo.
  // Agar seedha render karte toh user null lagta aur login pe redirect ho jaata
  // even if user already logged in hai — isiliye yeh check zaroori hai.
  if (!hasHydrated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#F7F5F0", // cream — matches login/register page bg
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "14px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Amber spinner */}
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid #FEF3C7",
            borderTop: "3px solid #F59E0B",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <div style={{ fontSize: "13px", color: "#AAA" }}>Loading...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <Routes>

      {/* Root: redirect to role dashboard if logged in, else to login */}
      <Route
        path="/"
        element={
          <Navigate
            to={user && ROLE_HOME[user.role] ? ROLE_HOME[user.role] : "/login"}
            replace
          />
        }
      />

      {/* Auth pages — accessible only when NOT logged in */}
      <Route
        path="/login"
        element={
          user ? <Navigate to={ROLE_HOME[user.role]} replace /> : <LoginPage />
        }
      />
      <Route
        path="/register"
        element={
          user ? <Navigate to={ROLE_HOME[user.role]} replace /> : <RegisterPage />
        }
      />
      {/* <Route
        path="/roles"
        element={<RoleSelectionPage />}
      /> */}

      {/* Protected role routes */}
      <Route
        path="/helpdesk"
        element={
          <ProtectedRoute role="helpdesk">
            <HelpdeskScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr"
        element={
          <ProtectedRoute role="hr">
            <HrScreen />
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

      {/* 404 — fallback to root which handles redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}