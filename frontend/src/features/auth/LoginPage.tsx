import { useNavigate, Link } from "react-router-dom";
import { useState, useCallback } from "react";
import { useAuthStore } from "../../store/authStore.ts";
import { ROLE_HOME } from "../../constants/roles.ts";
import { Role } from "../../types";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

const C = {
  bg: "#F7F5F0",
  card: "#FFFFFF",
  border: "#EDE9E0",
  inputBg: "#FAFAF7",
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  amberText: "#92400E",
  text: "#1A1A1A",
  muted: "#AAA",
  subtle: "#777",
  error: "#991B1B",
  errorBg: "#FEF2F2",
  errorBorder: "#FECACA",
};

type LoginStep = "credentials" | "confirm";

const ROLE_CONFIG: Record<Role, { label: string; desc: string; color: string; bg: string; border: string }> = {
  helpdesk: { label: "Help Desk", desc: "Create and track internal requests", color: "#92400E", bg: "#FEF3C7", border: "#FCD34D" },
  hr: { label: "HR", desc: "Review and approve ticket requests", color: "#065F46", bg: "#D1FAE5", border: "#6EE7B7" },
  admin: { label: "Admin", desc: "Final approvals, payments and reports", color: "#1E40AF", bg: "#DBEAFE", border: "#93C5FD" },
};

const inputStyle: React.CSSProperties = {
  width: "100%", height: "40px",
  border: `0.5px solid ${C.border}`, borderRadius: "9px",
  padding: "0 12px", fontSize: "13px", color: "#222",
  background: C.inputBg, outline: "none", boxSizing: "border-box",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const verifyCredentials = useAuthStore((s) => s.verifyCredentials);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<LoginStep>("credentials");
  const [detectedRole, setDetectedRole] = useState<Role | null>(null);
  const [detectedName, setDetectedName] = useState("");

  // Step 1: sirf verify karo, store touch nahi hoga
  const handleCredentials = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setErr("");
      if (!email.trim()) { setErr("Email is required."); return; }
      if (!password.trim()) { setErr("Password is required."); return; }
      setLoading(true);

      const roles: Role[] = ["helpdesk", "hr", "admin"];
      let matched: { role: Role; name: string } | null = null;

      for (const r of roles) {
        const res = verifyCredentials(email.trim(), password, r);
        if (res.ok && res.user) {
          matched = { role: res.user.role, name: res.user.name };
          break;
        }
      }
    //   const register = async ()=> {
    //     try {
    //       const response = await fetch(
    //   "http://localhost:8080/api/auth/register",
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({ email, password }),
    //   }
    // );
    // const data  = await response.json();
    // console.log("data", data);

    //     } catch (error) {
    //       console.error("Login failed", error);
    //       alert("Login failed");
          
    //     }
    //   }

      setLoading(false);
      if (!matched) { setErr("Invalid email or password."); return; }
      setDetectedRole(matched.role);
      setDetectedName(matched.name);
      setStep("confirm");
    },
    [verifyCredentials, email, password],
  );

  // Step 2: ab store mein set karo aur navigate karo
  const handleConfirm = useCallback(() => {
    if (!detectedRole) return;
    login(email.trim(), password, detectedRole);
    navigate(ROLE_HOME[detectedRole]);
  }, [detectedRole, login, email, password, navigate]);

  const handleBack = useCallback(() => {
    setStep("credentials");
    setDetectedRole(null);
    setDetectedName("");
    setErr("");
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "var(--font-sans, system-ui, sans-serif)" }}>
      <div style={{ width: "100%", maxWidth: "380px" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px", justifyContent: "center" }}>
          <div style={{ width: "32px", height: "32px", background: C.amber, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
          </div>
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#333" }}>Work Management</span>
        </div>

        {/* Card */}
        <div style={{ background: C.card, borderRadius: "20px", padding: "36px 32px", border: `0.5px solid ${C.border}`, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>

          {/* STEP 1: Credentials */}
          {step === "credentials" && (
            <>
              <div style={{ fontSize: "22px", fontWeight: 500, color: C.text, marginBottom: "4px" }}>Welcome back</div>
              <div style={{ fontSize: "13px", color: C.muted, marginBottom: "28px" }}>
                Don't have an account?{" "}
                <Link to="/register" style={{ color: C.amber, fontWeight: 500, textDecoration: "none" }}>Register</Link>
              </div>

              <form onSubmit={handleCredentials} noValidate>

                {/* Email */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 500, color: C.subtle, marginBottom: "5px" }}>Email</div>
                  <input
                    style={inputStyle}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                    autoFocus
                  
                  />
                </div>

                {/* Password */}
                <div style={{ marginBottom: "10px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 500, color: C.subtle, marginBottom: "5px" }}>Password</div>
                  <div style={{ position: "relative" }}>
                    <input
                      style={{ ...inputStyle, paddingRight: "40px" }}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 0, display: "flex" }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Forgot */}
                <div style={{ textAlign: "right", marginBottom: "22px" }}>
                  <a href="#" style={{ fontSize: "11px", color: C.muted, textDecoration: "none" }}>Forgot password?</a>
                </div>

                {/* Error */}
                {err && (
                  <div role="alert" style={{ background: C.errorBg, border: `0.5px solid ${C.errorBorder}`, borderRadius: "8px", padding: "10px 12px", fontSize: "12px", color: C.error, marginBottom: "16px", textAlign: "center" }}>
                    {err}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: "100%", height: "42px", background: loading ? "#FCD97A" : C.amber, border: "none", borderRadius: "10px", color: "#fff", fontSize: "14px", fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", transition: "background 0.15s" }}
                >
                  {loading ? "Checking..." : "Continue"}
                </button>
              </form>
            </>
          )}

          {/* STEP 2: Confirm Role */}
          {step === "confirm" && detectedRole && (
            <>
              <div style={{ fontSize: "22px", fontWeight: 500, color: C.text, marginBottom: "4px" }}>Confirm your role</div>
              <div style={{ fontSize: "13px", color: C.muted, marginBottom: "24px" }}>We found your account. Please confirm before continuing.</div>

              {/* Account card */}
              <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
                <div style={{ fontSize: "11px", color: C.muted, marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Signed in as</div>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "#333", marginBottom: "16px" }}>{email}</div>

                <div style={{ fontSize: "11px", color: C.muted, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Your role</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: ROLE_CONFIG[detectedRole].bg, border: `0.5px solid ${ROLE_CONFIG[detectedRole].border}`, borderRadius: "10px", padding: "10px 14px", width: "100%", boxSizing: "border-box" }}>
                  <CheckCircle2 size={18} color={ROLE_CONFIG[detectedRole].color} />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: ROLE_CONFIG[detectedRole].color }}>{ROLE_CONFIG[detectedRole].label}</div>
                    <div style={{ fontSize: "11px", color: ROLE_CONFIG[detectedRole].color, opacity: 0.7, marginTop: "1px" }}>{ROLE_CONFIG[detectedRole].desc}</div>
                  </div>
                </div>

                {detectedName && (
                  <div style={{ fontSize: "12px", color: C.muted, marginTop: "10px" }}>
                    Hello, <span style={{ color: "#555", fontWeight: 500 }}>{detectedName}</span>!
                  </div>
                )}
              </div>

              <button
                onClick={handleConfirm}
                style={{ width: "100%", height: "42px", background: C.amber, border: "none", borderRadius: "10px", color: "#fff", fontSize: "14px", fontWeight: 500, cursor: "pointer", marginBottom: "10px" }}
              >
                Go to {ROLE_CONFIG[detectedRole].label} Dashboard →
              </button>

              <button
                onClick={handleBack}
                style={{ width: "100%", height: "38px", background: "none", border: `0.5px solid ${C.border}`, borderRadius: "10px", color: C.muted, fontSize: "13px", cursor: "pointer" }}
              >
                ← Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}