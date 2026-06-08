import { useState, useCallback } from "react";
import { verifyPin, createSignatureBlock } from "../../utils/signatureEngine";
import { SignatureBlock, SignaturePurpose } from "../../types";

interface PinSignatureProps {
  userId: string;
  userName: string;
  ticketId: string;
  purpose: SignaturePurpose;        // kaunsa signature chahiye — 4 mein se
  label: string;                    // human-readable label jo UI mein dikhega
  existingSignature?: SignatureBlock; // agar pehle se sign ho gaya — readonly mode
  onSigned: (block: SignatureBlock) => void; // parent ko data dena
}

// Purpose ke liye header label
const PURPOSE_LABELS: Record<SignaturePurpose, string> = {
  hr_approval: "HR Approval",
  admin_approval: "Admin Final Approval",
  hr_inspection: "HR Inspection Co-signature",
  admin_inspection_payment: "Admin Inspection + Payment Authorization",
};

// ── Signature display (locked, read-only) ─────────────────────────────────
// Ek baar sign ho gaya toh yeh component render hota hai — edit nahi ho sakta
const SignedDisplay = ({ sig }: { sig: SignatureBlock }) => (
  <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/[0.06] p-4">
    {/* Header — verified badge */}
    <div className="flex items-center justify-between mb-3">
      <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
        {PURPOSE_LABELS[sig.purpose]}
      </span>
      <span className="flex items-center gap-1 text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
        <span>✓</span> Verified & Locked
      </span>
    </div>

    {/* Signature visual — white box jaise physical document pe dikhta hai */}
    <div className="bg-white rounded-md p-4 border border-gray-200 select-none pointer-events-none">
      {/* Cursive name — signature ki tarah dikhta hai */}
      <div
        className="text-gray-800 pb-2 mb-3 border-b border-gray-300"
        style={{
          fontFamily: "'Dancing Script', 'Brush Script MT', cursive",
          fontSize: 26,
          lineHeight: 1.2,
        }}
      >
        {sig.signedBy}
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
        <div>
          <span className="text-gray-400 uppercase tracking-wider text-[9px]">Signed by</span>
          <div className="text-gray-800 font-semibold">{sig.signedBy}</div>
        </div>
        <div>
          <span className="text-gray-400 uppercase tracking-wider text-[9px]">Role</span>
          <div className="text-gray-800 font-semibold">{sig.role}</div>
        </div>
        <div className="col-span-2">
          <span className="text-gray-400 uppercase tracking-wider text-[9px]">Date & Time</span>
          <div className="text-gray-800 font-semibold font-mono text-[11px]">
            {new Date(sig.signedAt).toLocaleString("en-IN", {
              day: "2-digit", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit", second: "2-digit",
              hour12: true,
            })}
          </div>
        </div>
        <div className="col-span-2">
          <span className="text-gray-400 uppercase tracking-wider text-[9px]">Integrity Hash</span>
          <div className="text-gray-600 font-mono text-[10px]">{sig.hash}</div>
        </div>
      </div>

      {/* PIN verified badge */}
      <div className="mt-3 flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[7px] font-bold leading-none">✓</span>
        </div>
        <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">
          PIN Verified · Digitally Signed · Non-editable
        </span>
      </div>
    </div>
  </div>
);

// ── Main PinSignature Component ────────────────────────────────────────────
export default function PinSignature({
  userId,
  userName,
  ticketId,
  purpose,
  label,
  existingSignature,
  onSigned,
}: PinSignatureProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  // MAX 3 attempts — uske baad lock ho jaata hai
  const MAX_ATTEMPTS = 3;

  // ── Agar pehle se sign ho gaya — sirf display karo, kuch nahi hoga
  if (existingSignature) {
    return <SignedDisplay sig={existingSignature} />;
  }

  // ── PIN verify karna
  const handleVerify = useCallback(() => {
    if (locked || loading) return;

    if (pin.length !== 4) {
      setError("4-digit PIN dalna zaroori hai.");
      return;
    }

    setLoading(true);

    // Slight delay — real API jaisi feel (UX)
    setTimeout(() => {
      const valid = verifyPin(userId, pin);

      if (!valid) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPin("");
        setLoading(false);

        if (newAttempts >= MAX_ATTEMPTS) {
          // 3 baar galat — account lock
          setLocked(true);
          setError("3 galat attempts. Contact admin to unlock.");
        } else {
          setError(`Galat PIN. ${MAX_ATTEMPTS - newAttempts} attempt(s) bache hain.`);
        }
        return;
      }

      // PIN sahi — signature block generate karo
      const block = createSignatureBlock(userId, userName, ticketId, purpose, ""); //
      setLoading(false);
      onSigned(block); // parent ko dedo — woh ticketStore mein save karega
    }, 400);
  }, [pin, locked, loading, attempts, userId, userName, ticketId, purpose, onSigned]);

  return (
    <div className="rounded-lg border border-white/15 bg-white/[0.04] p-4 space-y-4">
      {/* Title */}
      <div>
        <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-0.5">
          {PURPOSE_LABELS[purpose]}
        </div>
        <p className="text-sm text-white/60">
          {label} — apna 4-digit personal PIN enter karke sign karo.
        </p>
      </div>

      {/* 4 dot visual indicator */}
      <div className="flex gap-3 justify-center py-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all duration-150 ${
              pin.length > i
                ? "border-[#4f6ef7] bg-[#4f6ef7]/15 text-white scale-105"
                : "border-white/15 bg-white/5 text-transparent"
            }`}
          >
            {pin.length > i ? "●" : ""}
          </div>
        ))}
      </div>

      {/* Actual input — number only, max 4 digits */}
      <input
        type="password"
        inputMode="numeric"
        maxLength={4}
        value={pin}
        onChange={(e) => {
          if (locked) return;
          setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
          setError(""); // error clear karo jab type karo
        }}
        onKeyDown={(e) => e.key === "Enter" && handleVerify()}
        disabled={locked}
        placeholder="••••"
        className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white text-center font-mono text-2xl tracking-[0.5em] focus:outline-none focus:border-[#4f6ef7] focus:bg-[#4f6ef7]/5 disabled:opacity-40 transition-all"
        autoFocus
      />

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 text-center">
          {error}
        </div>
      )}

      {/* Locked state */}
      {locked && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-center">
          <div className="text-red-300 text-sm font-semibold">🔒 Account Locked</div>
          <div className="text-red-400/70 text-xs mt-1">Admin se contact karo PIN reset karne ke liye.</div>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleVerify}
        disabled={pin.length !== 4 || locked || loading}
        className="w-full py-3 bg-[#4f6ef7] text-white text-sm font-bold rounded-xl transition-all
                   disabled:opacity-30 disabled:cursor-not-allowed
                   hover:bg-[#3d5ae0] active:scale-[0.98] cursor-pointer"
      >
        {loading ? "Verifying..." : "Verify PIN & Sign"}
      </button>

      <p className="text-[10px] text-white/25 text-center">
        ⚠️ Yeh signature legally binding hai. Apna PIN kisi ke saath share mat karo.
      </p>
    </div>
  );
}
