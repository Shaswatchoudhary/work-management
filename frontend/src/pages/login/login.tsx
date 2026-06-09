import { useNavigate } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { useAuthStore } from "../../store/authStore.ts";
import { ROLE_HOME, ROLE_LABEL } from "../../constants/roles.ts";
import { Role } from "../../types";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("helpdesk@company.com");
  const [password, setPassword] = useState("1234");
  const [role, setRole] = useState<Role>("helpdesk");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setErr("");
      setLoading(true);

      const res = login(email.trim(), password, role);

      setLoading(false);

      if (!res.ok) {
        setErr(res.error || "");
        return;
      }

      navigate(ROLE_HOME[res.user!.role]);
    },
    [login, navigate, email, password, role],
  );

  const quickFill = useCallback((r: Role) => {
    setRole(r);
    setEmail(`${r}@company.com`);
    setPassword("1234");
    setErr("");
  }, []);

  // Sync quickFill email when switching role tab
  useEffect(() => {
    setEmail(`${role}@company.com`);
  }, [role]);

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#00173d] via-[#003c96] to-[#0070f3] font-sans p-4">
      {/* Background shapes (rendered as highly styled SVGs) */}
      
      {/* 1. Cyan Torus/Ring (Top Center) */}
      <div className="absolute top-[8%] left-[45%] w-36 h-36 opacity-80 pointer-events-none filter blur-[0.5px] z-0 animate-pulse">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="cyanTorus" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f2fe" />
              <stop offset="100%" stopColor="#4facfe" />
            </linearGradient>
            <filter id="shadow">
              <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.3" />
            </filter>
          </defs>
          <circle cx="50" cy="50" r="30" fill="none" stroke="url(#cyanTorus)" strokeWidth="14" filter="url(#shadow)" />
        </svg>
      </div>

      {/* 2. Left Zigzag Squiggle */}
      <div className="absolute top-[35%] left-[12%] w-24 h-24 opacity-90 pointer-events-none z-0">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="zigGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a1c4fd" />
              <stop offset="100%" stopColor="#c2e9fb" />
            </linearGradient>
          </defs>
          <path d="M20,50 L40,30 L60,50 L80,30" fill="none" stroke="url(#zigGrad)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* 3. Bottom Left Big Spiral (Darker blue, layered behind) */}
      <div className="absolute bottom-[5%] left-[5%] w-72 h-72 opacity-50 pointer-events-none filter blur-[3px] z-0">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <linearGradient id="spiralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0a52d6" />
              <stop offset="100%" stopColor="#001845" />
            </linearGradient>
          </defs>
          <path d="M 30,150 C 30,70 170,70 170,130 C 170,170 100,170 100,130 C 100,100 140,100 140,120" fill="none" stroke="url(#spiralGrad)" strokeWidth="22" strokeLinecap="round" />
        </svg>
      </div>

      {/* 4. Bottom Center Cyan/Blue Torus */}
      <div className="absolute bottom-[10%] left-[30%] w-44 h-44 opacity-85 pointer-events-none filter blur-[1px] z-0">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="blueTorus" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38f9d7" />
              <stop offset="100%" stopColor="#2575fc" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="30" fill="none" stroke="url(#blueTorus)" strokeWidth="15" />
        </svg>
      </div>

      {/* 5. Right Big Dark Blue Spiral */}
      <div className="absolute top-[18%] right-[10%] w-80 h-80 opacity-75 pointer-events-none filter blur-[2px] z-0">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <linearGradient id="rightSpiral" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0072ff" />
              <stop offset="100%" stopColor="#001845" />
            </linearGradient>
          </defs>
          <path d="M 50,30 Q 150,40 160,110 T 80,160 T 130,80" fill="none" stroke="url(#rightSpiral)" strokeWidth="24" strokeLinecap="round" />
        </svg>
      </div>

      {/* 6. Bottom Right Wave Ribbon */}
      <div className="absolute bottom-[8%] right-[6%] w-72 h-44 opacity-75 pointer-events-none z-0">
        <svg viewBox="0 0 200 100" className="w-full h-full">
          <defs>
            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4facfe" />
              <stop offset="100%" stopColor="#00f2fe" />
            </linearGradient>
          </defs>
          <path d="M 20,50 Q 60,10 100,50 T 180,50" fill="none" stroke="url(#waveGrad)" strokeWidth="22" strokeLinecap="round" />
        </svg>
      </div>

      {/* 7. Right Small Double Waves */}
      <div className="absolute bottom-[28%] right-[22%] w-24 h-20 opacity-80 pointer-events-none z-0">
        <svg viewBox="0 0 100 60" className="w-full h-full">
          <defs>
            <linearGradient id="smallWave" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#66a6ff" />
              <stop offset="100%" stopColor="#89f7fe" />
            </linearGradient>
          </defs>
          <path d="M 10,20 Q 30,5 50,20 T 90,20" fill="none" stroke="url(#smallWave)" strokeWidth="8" strokeLinecap="round" />
          <path d="M 10,40 Q 30,25 50,40 T 90,40" fill="none" stroke="url(#smallWave)" strokeWidth="8" strokeLinecap="round" />
        </svg>
      </div>

      {/* Glassmorphic Outer Frame */}
      <div className="w-full max-w-[960px] min-h-[580px] relative border border-cyan-400/20 rounded-3xl backdrop-blur-[12px] bg-white/[0.01] shadow-[0_0_80px_rgba(0,191,255,0.1)] flex items-center justify-center p-6 z-10 animate-fade-in">
        
        {/* Glassmorphic Login Card */}
        <div className="w-full max-w-[390px] rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-[25px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <span className="text-white text-lg font-bold tracking-wide">Your logo</span>
          </div>

          <h2 className="text-white text-xl font-bold mb-4 text-left">Login</h2>

          {/* Role Segmented Controller */}
          <div className="bg-white/10 rounded-lg p-0.5 flex mb-5 border border-white/5 shadow-inner">
            {(["helpdesk", "hr", "admin"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => quickFill(r)}
                className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${
                  role === r
                    ? "bg-white text-black shadow-md"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                {ROLE_LABEL[r]}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@gmail.com"
                className="w-full h-10 px-3 rounded-lg bg-white text-black text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all border-none"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full h-10 pl-3 pr-10 rounded-lg bg-white text-black text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all border-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-left">
              <a href="#" className="text-xs text-white/60 hover:text-white transition-colors">
                Forgot Password?
              </a>
            </div>

            {/* Error Message */}
            {err && (
              <div
                role="alert"
                className="rounded-md border border-red-500/30 bg-red-500/10 text-red-300 text-xs p-2.5 text-center"
              >
                {err}
              </div>
            )}

            {/* Sign in Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-[#002866] hover:bg-[#00388b] text-white text-sm font-semibold rounded-lg shadow-md transition-all duration-200 active:scale-[0.98] disabled:opacity-50 mt-5 flex items-center justify-center cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
