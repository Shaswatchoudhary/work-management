import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2, Copy, Check } from "lucide-react";
import { Role } from "../../types";
import "./RegisterPage.scss";

const ROLES: Role[] = ["helpdesk", "hr", "admin"];

const ROLE_CONFIG: Record<Role, { label: string; desc: string }> = {
  helpdesk: { label: "Help Desk", desc: "Create and track internal requests" },
  hr: { label: "HR", desc: "Review and approve ticket requests" },
  admin: { label: "Admin", desc: "Final approvals, payments and reports" },
};

const DEMO_ACCOUNTS: Record<Role, { email: string; password: string; name: string }> = {
  helpdesk: { email: "helpdesk@company.com", password: "1234", name: "Arjun Mehta" },
  hr: { email: "hr@company.com", password: "1234", name: "Priya Sharma" },
  admin: { email: "admin@company.com", password: "1234", name: "Suresh Verma" },
};

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="register-copy-btn"
      onClick={() => {
        navigator.clipboard.writeText(text).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      aria-label="Copy"
    >
      {copied ? <Check size={13} color="#F59E0B" /> : <Copy size={13} />}
    </button>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<Role>("helpdesk");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setErr("");

      if (!name.trim()) { setErr("Full name is required."); return; }
      if (!email.trim()) { setErr("Email is required."); return; }
      if (!email.includes("@")) { setErr("Enter a valid email address."); return; }
      if (password.length < 4) { setErr("Password must be at least 4 chars."); return; }
      if (password !== confirm) { setErr("Passwords do not match."); return; }

      setLoading(true);

      // ── BACKEND INTEGRATION (uncomment when backend is ready) ──────────
      // try {
      //   const response = await fetch("http://localhost:8080/api/auth/register", {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({ name, email, password, role }),
      //   });
      //   const data = await response.json();
      //   if (!response.ok) {
      //     setErr(data.message || "Registration failed. Try again.");
      //     setLoading(false);
      //     return;
      //   }
      //   setLoading(false);
      //   setDone(true);
      //   return;
      // } catch (error) {
      //   setErr("Server not reachable. Using demo mode.");
      // }
      // ───────────────────────────────────────────────────────────────────

      // ── DEMO MODE (remove when backend is ready) ───────────────────────
      setTimeout(() => {
        setLoading(false);
        setDone(true);
      }, 800);
      // ───────────────────────────────────────────────────────────────────
    },
    [name, email, password, confirm, role],
  );

  return (
    <div className="register-page">
      <div className="register-container">

        <div className="register-logo">
          <div className="register-logo__icon">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
          </div>
          <span className="register-logo__text">Work Management</span>
        </div>

        <div className="register-card">

          {done && (
            <div className="register-success">
              <div className="register-success__icon">
                <CheckCircle2 size={28} color="#F59E0B" />
              </div>
              <h1 className="register-success__title">Account created!</h1>
              <p className="register-success__desc">
                Your <strong>{ROLE_CONFIG[role].label}</strong> account has been set up.<br />
                You can now sign in.
              </p>
              <button className="register-success__btn" onClick={() => navigate("/login")}>
                Go to Login
              </button>
            </div>
          )}

          {!done && (
            <>
              <div className="register-form-section">
                <h1 className="register-title">Create account</h1>
                <p className="register-subtitle">
                  Already have one? <Link to="/login">Sign in</Link>
                </p>

                <form className="register-form" onSubmit={submit} noValidate>

                  <div className="register-field">
                    <label className="register-field__label" htmlFor="reg-name">Full name</label>
                    <input id="reg-name" className="register-input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Arjun Mehta" autoFocus autoComplete="name" />
                  </div>

                  <div className="register-field">
                    <label className="register-field__label" htmlFor="reg-email">Work email</label>
                    <input id="reg-email" className="register-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" />
                  </div>

                  <div className="register-field">
                    <label className="register-field__label" htmlFor="reg-pass">Password</label>
                    <div className="register-field__wrapper">
                      <input id="reg-pass" className="register-input register-input--password" type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 4 characters" autoComplete="new-password" />
                      <button type="button" className="register-eye-btn" onClick={() => setShowPass((p) => !p)} aria-label={showPass ? "Hide" : "Show"}>
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="register-field register-field--last">
                    <label className="register-field__label" htmlFor="reg-confirm">Confirm password</label>
                    <div className="register-field__wrapper">
                      <input
                        id="reg-confirm"
                        className={`register-input register-input--password${confirm && confirm !== password ? " register-input--error" : ""}`}
                        type={showConfirm ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                      />
                      <button type="button" className="register-eye-btn" onClick={() => setShowConfirm((p) => !p)} aria-label={showConfirm ? "Hide" : "Show"}>
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {confirm && confirm !== password && (
                      <div className="register-field__hint">Passwords do not match</div>
                    )}
                  </div>

                  <div className="register-role-section">
                    <span className="register-role-label">Role</span>
                    <div className="register-role-list">
                      {ROLES.map((r) => {
                        const selected = role === r;
                        return (
                          <button key={r} type="button" className={`register-role-btn${selected ? ` register-role-btn--${r}-selected` : ""}`} onClick={() => setRole(r)}>
                            <div className="register-role-btn__radio">
                              {selected && <div className="register-role-btn__radio-dot" />}
                            </div>
                            <div className="register-role-btn__info">
                              <span className="register-role-btn__name">{ROLE_CONFIG[r].label}</span>
                              <span className="register-role-btn__desc">{ROLE_CONFIG[r].desc}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {err && <div role="alert" className="register-error">{err}</div>}

                  <button type="submit" className="register-btn-submit" disabled={loading}>
                    {loading ? "Creating account..." : "Create account"}
                  </button>

                </form>
              </div>

              <div className="register-demo">
                <div className="register-demo__heading">Demo accounts — click to fill</div>
                <div className="register-demo__list">
                  {ROLES.map((r) => {
                    const acc = DEMO_ACCOUNTS[r];
                    return (
                      <div key={r} className="register-demo-item">
                        <div className="register-demo-item__info">
                          <div className="register-demo-item__top">
                            <span className={`register-demo-item__role-badge register-demo-item__role-badge--${r}`}>{ROLE_CONFIG[r].label}</span>
                            <span className="register-demo-item__name">{acc.name}</span>
                          </div>
                          <div className="register-demo-item__meta">
                            {acc.email}
                            <CopyBtn text={acc.email} />
                            <span className="register-demo-item__sep">·</span>
                            <span className="register-demo-item__pass-label">pass: <strong>{acc.password}</strong></span>
                            <CopyBtn text={acc.password} />
                          </div>
                        </div>
                        <button
                          type="button"
                          className={`register-demo-fill-btn register-demo-fill-btn--${r}`}
                          onClick={() => { setName(acc.name); setEmail(acc.email); setPassword(acc.password); setConfirm(acc.password); setRole(r); setErr(""); }}
                        >
                          Fill
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}