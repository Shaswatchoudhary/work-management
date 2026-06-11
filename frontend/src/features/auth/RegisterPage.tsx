import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2, Copy, Check } from "lucide-react";
import { Role } from "../../types";

// ── Design tokens (cream/amber theme) ────────────────────────────────────────
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

const ROLES: Role[] = ["helpdesk", "hr", "admin"];

const ROLE_CONFIG: Record<Role, { label: string; desc: string; color: string; bg: string; border: string }> = {
  helpdesk: { label: "Help Desk", desc: "Create and track internal requests", color: "#92400E", bg: "#FEF3C7", border: "#FCD34D" },
  hr: { label: "HR", desc: "Review and approve ticket requests", color: "#065F46", bg: "#D1FAE5", border: "#6EE7B7" },
  admin: { label: "Admin", desc: "Final approvals, payments and reports", color: "#1E40AF", bg: "#DBEAFE", border: "#93C5FD" },
};

const DEMO_ACCOUNTS: Record<Role, { email: string; password: string; name: string }> = {
  helpdesk: { email: "helpdesk@company.com", password: "1234", name: "Arjun Mehta" },
  hr: { email: "hr@company.com", password: "1234", name: "Priya Sharma" },
  admin: { email: "admin@company.com", password: "1234", name: "Suresh Verma" },
};

// ── Shared input style ────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", height: "40px",
  border: `0.5px solid ${C.border}`, borderRadius: "9px",
  padding: "0 12px", fontSize: "13px", color: "#222",
  background: C.inputBg, outline: "none", boxSizing: "border-box",
};

// ── Label ─────────────────────────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "12px", fontWeight: 500, color: C.subtle, marginBottom: "5px" }}>
      {children}
    </div>
  );
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text).catch(() => { }); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: "0 0 0 6px", display: "inline-flex", alignItems: "center" }}
      aria-label="Copy"
    >
      {copied ? <Check size={13} color={C.amber} /> : <Copy size={13} />}
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
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setErr("");

      if (!name.trim()) { setErr("Full name is required."); return; }
      if (!email.trim()) { setErr("Email is required."); return; }
      if (!email.includes("@")) { setErr("Enter a valid email address."); return; }
      if (password.length < 4) { setErr("Password must be at least 4 chars."); return; }
      if (password !== confirm) { setErr("Passwords do not match."); return; }

      setLoading(true);

      // When backend is ready: replace with POST /auth/register
      // For now, simulate a short delay then mark done
      setTimeout(() => {
        setLoading(false);
        setDone(true);
      }, 800);
    },
    [name, email, password, confirm, role],
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "var(--font-sans, system-ui, sans-serif)" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px", justifyContent: "center" }}>
          <div style={{ width: "32px", height: "32px", background: C.amber, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "16px" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
          </div>
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#333" }}>Work Management</span>
        </div>

        {/* Card */}
        <div style={{ background: C.card, borderRadius: "20px", border: `0.5px solid ${C.border}`, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", overflow: "hidden" }}>

          {/* ── SUCCESS STATE ─────────────────────────────────────────────── */}
          {done && (
            <div style={{ padding: "40px 32px", textAlign: "center" }}>
              <div style={{ width: "56px", height: "56px", background: C.amberLight, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <CheckCircle2 size={28} color={C.amber} />
              </div>
              <div style={{ fontSize: "20px", fontWeight: 500, color: C.text, marginBottom: "8px" }}>Account created!</div>
              <div style={{ fontSize: "13px", color: C.muted, marginBottom: "28px", lineHeight: 1.6 }}>
                Your <strong style={{ color: ROLE_CONFIG[role].color }}>{ROLE_CONFIG[role].label}</strong> account has been set up.<br />You can now sign in.
              </div>
              <button
                onClick={() => navigate("/login")}
                style={{ width: "100%", height: "42px", background: C.amber, border: "none", borderRadius: "10px", color: "#fff", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
              >
                Go to Login
              </button>
            </div>
          )}

          {/* ── REGISTER FORM ─────────────────────────────────────────────── */}
          {!done && (
            <>
              {/* Top section — form */}
              <div style={{ padding: "32px 32px 24px" }}>
                <div style={{ fontSize: "22px", fontWeight: 500, color: C.text, marginBottom: "4px" }}>Create account</div>
                <div style={{ fontSize: "13px", color: C.muted, marginBottom: "28px" }}>
                  Already have one?{" "}
                  <Link to="/login" style={{ color: C.amber, fontWeight: 500, textDecoration: "none" }}>Sign in</Link>
                </div>

                <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: "0" }}>

                  {/* Full name */}
                  <div style={{ marginBottom: "16px" }}>
                    <FieldLabel>Full name</FieldLabel>
                    <input style={inputStyle} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Arjun Mehta" autoFocus autoComplete="name" />
                  </div>

                  {/* Email */}
                  <div style={{ marginBottom: "16px" }}>
                    <FieldLabel>Work email</FieldLabel>
                    <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" />
                  </div>

                  {/* Password */}
                  <div style={{ marginBottom: "16px" }}>
                    <FieldLabel>Password</FieldLabel>
                    <div style={{ position: "relative" }}>
                      <input style={{ ...inputStyle, paddingRight: "40px" }} type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 4 characters" autoComplete="new-password" />
                      <button type="button" onClick={() => setShowPass((p) => !p)} aria-label={showPass ? "Hide" : "Show"} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 0, display: "flex" }}>
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div style={{ marginBottom: "20px" }}>
                    <FieldLabel>Confirm password</FieldLabel>
                    <div style={{ position: "relative" }}>
                      <input style={{ ...inputStyle, paddingRight: "40px", borderColor: confirm && confirm !== password ? C.errorBorder : C.border }} type={showConfirm ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" autoComplete="new-password" />
                      <button type="button" onClick={() => setShowConfirm((p) => !p)} aria-label={showConfirm ? "Hide" : "Show"} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 0, display: "flex" }}>
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {confirm && confirm !== password && (
                      <div style={{ fontSize: "11px", color: C.error, marginTop: "4px" }}>Passwords do not match</div>
                    )}
                  </div>

                  {/* Role selector */}
                  <div style={{ marginBottom: "24px" }}>
                    <FieldLabel>Role</FieldLabel>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {ROLES.map((r) => {
                        const cfg = ROLE_CONFIG[r];
                        const selected = role === r;
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              padding: "10px 14px",
                              border: selected ? `1.5px solid ${cfg.border}` : `0.5px solid ${C.border}`,
                              borderRadius: "10px",
                              background: selected ? cfg.bg : C.inputBg,
                              cursor: "pointer",
                              transition: "all 0.15s",
                              textAlign: "left",
                            }}
                          >
                            <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: selected ? `2px solid ${cfg.color}` : `2px solid #CCC`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {selected && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: cfg.color }} />}
                            </div>
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: 500, color: selected ? cfg.color : "#444" }}>{cfg.label}</div>
                              <div style={{ fontSize: "11px", color: selected ? cfg.color : C.muted, opacity: selected ? 0.8 : 1, marginTop: "1px" }}>{cfg.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
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
                    {loading ? "Creating account..." : "Create account"}
                  </button>
                </form>
              </div>

              {/* ── DEMO ACCOUNTS SECTION ─────────────────────────────────── */}
              <div style={{ borderTop: `0.5px solid ${C.border}`, background: C.bg, padding: "20px 32px 28px" }}>
                <div style={{ fontSize: "11px", fontWeight: 500, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "12px" }}>
                  Demo accounts — click to fill
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {ROLES.map((r) => {
                    const acc = DEMO_ACCOUNTS[r];
                    const cfg = ROLE_CONFIG[r];
                    return (
                      <div
                        key={r}
                        style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: "10px", padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                            <span style={{ display: "inline-block", background: cfg.bg, color: cfg.color, fontSize: "10px", fontWeight: 600, padding: "1px 7px", borderRadius: "20px" }}>{cfg.label}</span>
                            <span style={{ fontSize: "11px", color: "#555" }}>{acc.name}</span>
                          </div>
                          <div style={{ fontSize: "11px", color: C.muted, display: "flex", alignItems: "center", gap: "4px" }}>
                            {acc.email}
                            <CopyBtn text={acc.email} />
                            <span style={{ color: C.border }}>·</span>
                            <span>pass: <strong style={{ color: "#555" }}>{acc.password}</strong></span>
                            <CopyBtn text={acc.password} />
                          </div>
                        </div>
                        {/* Quick fill button */}
                        <button
                          type="button"
                          onClick={() => {
                            setName(acc.name);
                            setEmail(acc.email);
                            setPassword(acc.password);
                            setConfirm(acc.password);
                            setRole(r);
                            setErr("");
                          }}
                          style={{ background: cfg.bg, border: `0.5px solid ${cfg.border}`, borderRadius: "7px", padding: "5px 10px", fontSize: "11px", fontWeight: 500, color: cfg.color, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
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