import { useNavigate, Link } from "react-router-dom";
import { useState, useCallback } from "react";
import { useAuthStore } from "../../store/authStore.ts";
import { ROLE_HOME } from "../../constants/roles.ts";
import { Role } from "../../types";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import "./LoginPage.scss"

const ROLE_CONFIG: Record<Role, { label: string; desc: string; iconColor: string }> = {
  helpdesk: { label: "Help Desk", desc: "Create and track internal requests", iconColor: "#92400E" },
  hr: { label: "HR", desc: "Review and approve ticket requests", iconColor: "#065F46" },
  admin: { label: "Admin", desc: "Final approvals, payments and reports", iconColor: "#1E40AF" },
};

type LoginStep = "credentials" | "confirm";

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

  // Step 1 — verify only, don't touch store yet
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

      setLoading(false);
      if (!matched) { setErr("Invalid email or password."); return; }
      setDetectedRole(matched.role);
      setDetectedName(matched.name);
      setStep("confirm");
    },
    [verifyCredentials, email, password],
  );

  // Step 2 — set store and navigate
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
    <div className="login-page">
      <div className="login-container">

        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo__icon">
            {/*  */}
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
          </div>
          <span className="login-logo__text">Work Management</span>
        </div>

        {/* Card */}
        <div className="login-card">

          {/* ── STEP 1: Credentials ── */}
          {step === "credentials" && (
            <>
              <h1 className="login-title">Welcome back</h1>
              <p className="login-subtitle">
                Don't have an account?{" "}
                <Link to="/register">Register</Link>
              </p>

              <form className="login-form" onSubmit={handleCredentials} noValidate>

                {/* Email */}
                <div className="login-field">
                  <label className="login-field__label" htmlFor="login-email">Email</label>
                  <input
                    id="login-email"
                    className="login-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                {/* Password */}
                <div className="login-field">
                  <label className="login-field__label" htmlFor="login-password">Password</label>
                  <div className="login-field__wrapper">
                    <input
                      id="login-password"
                      className="login-input login-input--password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="login-eye-btn"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Forgot */}
                <div className="login-forgot">
                  <a href="#">Forgot password?</a>
                </div>

                {/* Error */}
                {err && (
                  <div role="alert" className="login-error">{err}</div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className="login-btn-primary"
                  disabled={loading}
                >
                  {loading ? "Checking..." : "Continue"}
                </button>
              </form>
            </>
          )}

          {/* ── STEP 2: Confirm Role ── */}
          {step === "confirm" && detectedRole && (
            <>
              <h1 className="login-title">Confirm your role</h1>
              <p className="login-confirm-subtitle">
                We found your account. Please confirm before continuing.
              </p>

              <div className="login-account-card">
                <div className="login-account-label">Signed in as</div>
                <div className="login-account-email">{email}</div>

                <div className="login-role-label">Your role</div>
                <div className={`login-role-badge login-role-badge--${detectedRole}`}>
                  <CheckCircle2
                    size={18}
                    color={ROLE_CONFIG[detectedRole].iconColor}
                  />
                  <div className="login-role-badge__info">
                    <span className="login-role-badge__name">
                      {ROLE_CONFIG[detectedRole].label}
                    </span>
                    <span className="login-role-badge__desc">
                      {ROLE_CONFIG[detectedRole].desc}
                    </span>
                  </div>
                </div>

                {detectedName && (
                  <div className="login-hello">
                    Hello, <span>{detectedName}</span>!
                  </div>
                )}
              </div>

              <button
                className="login-btn-primary login-btn-confirm"
                onClick={handleConfirm}
              >
                Go to {ROLE_CONFIG[detectedRole].label} Dashboard →
              </button>

              <button
                className="login-btn-secondary"
                onClick={handleBack}
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