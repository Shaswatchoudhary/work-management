import { useState, useCallback, useRef, useEffect } from "react";
import { verifyPin, createSignatureBlock } from "../../utils/signatureEngine";
import { SignatureBlock, SignaturePurpose } from "../../types";

interface PinThenDrawSignatureProps {
  userId: string;
  userName: string;
  ticketId: string;
  purpose: SignaturePurpose;
  label: string;
  existingSignature?: SignatureBlock;
  onSigned: (block: SignatureBlock) => void;
}

const PURPOSE_LABELS: Record<SignaturePurpose, string> = {
  hr_approval:               "HR Approval",
  admin_approval:            "Admin Final Approval",
  hr_inspection:             "HR Inspection Co-signature",
  admin_inspection_payment:  "Admin Inspection + Payment Authorization",
};

// ── Locked display — sign ho gaya, kuch edit nahi hoga ────────────────────
const SignedDisplay = ({ sig }: { sig: SignatureBlock }) => (
  <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/[0.06] p-4 pointer-events-none select-none">
    <div className="flex items-center justify-between mb-3">
      <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
        {PURPOSE_LABELS[sig.purpose]}
      </span>
      <span className="flex items-center gap-1 text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
        ✓ Verified & Locked
      </span>
    </div>

    {/* Drawn signature image */}
    <div className="bg-white rounded-md p-2 border border-gray-200 mb-3">
      {sig.signatureImage ? (
        <img
          src={sig.signatureImage}
          alt="Signature"
          className="w-full h-[80px] object-contain"
        />
      ) : (
        <div
          className="text-gray-800 text-center py-4"
          style={{ fontFamily: "'Dancing Script', cursive", fontSize: 26 }}
        >
          {sig.signedBy}
        </div>
      )}
    </div>

    {/* All details — plain spans only, no inputs */}
    <div className="bg-white rounded-md p-3 border border-gray-200 space-y-2 text-[11px]">
      <div className="flex gap-3">
        <span className="text-gray-400 w-24 flex-shrink-0 uppercase tracking-wider text-[9px] pt-0.5">Signed by</span>
        <span className="text-gray-800 font-semibold">{sig.signedBy}</span>
      </div>
      <div className="flex gap-3">
        <span className="text-gray-400 w-24 flex-shrink-0 uppercase tracking-wider text-[9px] pt-0.5">Role</span>
        <span className="text-gray-800 font-semibold">{sig.role}</span>
      </div>
      <div className="flex gap-3">
        <span className="text-gray-400 w-24 flex-shrink-0 uppercase tracking-wider text-[9px] pt-0.5">Date & Time</span>
        <span className="text-gray-800 font-semibold font-mono text-[10px]">
          {new Date(sig.signedAt).toLocaleString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
            hour12: true,
          })}
        </span>
      </div>
      <div className="flex gap-3">
        <span className="text-gray-400 w-24 flex-shrink-0 uppercase tracking-wider text-[9px] pt-0.5">Ticket ID</span>
        <span className="text-gray-800 font-semibold">{sig.ticketId}</span>
      </div>
      <div className="flex gap-3">
        <span className="text-gray-400 w-24 flex-shrink-0 uppercase tracking-wider text-[9px] pt-0.5">Hash</span>
        <span className="text-gray-500 font-mono text-[9px] break-all">{sig.hash}</span>
      </div>
    </div>

    <div className="mt-2 flex items-center gap-1.5">
      <div className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-[7px] font-bold leading-none">✓</span>
      </div>
      <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">
        PIN Verified · Digitally Signed · Non-editable
      </span>
    </div>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────
export default function PinThenDrawSignature({
  userId,
  userName,
  ticketId,
  purpose,
  label,
  existingSignature,
  onSigned,
}: PinThenDrawSignatureProps) {
  // mode: idle → PIN entry | draw → canvas | signed → locked display
  const [mode, setMode] = useState<"idle" | "draw" | "signed">("idle");

  // savedBlock — naya sign hone pe yahan store hoga (existingSignature prop nahi hoga tab)
  const [savedBlock, setSavedBlock] = useState<SignatureBlock | null>(null);

  const [pin, setPin]           = useState("");
  const [error, setError]       = useState("");
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked]     = useState(false);
  const [loading, setLoading]   = useState(false);

  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const isDrawing   = useRef(false);
  const MAX_ATTEMPTS = 3;

  // Agar existingSignature prop aaya — seedha signed mode
  useEffect(() => {
    if (existingSignature) setMode("signed");
  }, [existingSignature]);

  // ── Canvas handlers ────────────────────────────────────────────────────
  const getPos = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement,
  ) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      isDrawing.current = true;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { x, y } = getPos(e, canvas);
      ctx.beginPath();
      ctx.moveTo(x, y);
    }, [],
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (!isDrawing.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { x, y } = getPos(e, canvas);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#1a1a2e";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }, [],
  );

  const stopDrawing = useCallback(() => { isDrawing.current = false; }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setError("");
  }, []);

  // ── Save signature — canvas → base64 → SignatureBlock ─────────────────
  const saveSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Empty canvas check
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const isEmpty = !data.some((v, i) => i % 4 === 3 && v > 0); // check alpha channel

    if (isEmpty) {
      setError("Please draw your signature before saving.");
      return;
    }

    const signatureImage = canvas.toDataURL("image/png");
    const block = createSignatureBlock(userId, userName, ticketId, purpose, signatureImage);

    // Save locally so SignedDisplay can render even without existingSignature prop
    setSavedBlock(block);
    setMode("signed");

    // Pass up to parent — parent saves to store
    onSigned(block);
  }, [userId, userName, ticketId, purpose, onSigned]);

  // ── PIN verify ─────────────────────────────────────────────────────────
  const handleVerify = useCallback(() => {
    if (locked || loading) return;
    if (pin.length !== 4) { setError("4-digit PIN required."); return; }

    setLoading(true);
    setTimeout(() => {
      const valid = verifyPin(userId, pin);
      if (!valid) {
        const n = attempts + 1;
        setAttempts(n);
        setPin("");
        setLoading(false);
        if (n >= MAX_ATTEMPTS) {
          setLocked(true);
          setError("Too many wrong attempts. Contact admin.");
        } else {
          setError(`Wrong PIN. ${MAX_ATTEMPTS - n} attempt(s) remaining.`);
        }
        return;
      }
      setLoading(false);
      setError("");
      setMode("draw");
    }, 400);
  }, [pin, locked, loading, attempts, userId]);

  // ── Render: signed mode ────────────────────────────────────────────────
  // Show whichever block we have — existing prop OR newly saved
  if (mode === "signed") {
    const displaySig = existingSignature ?? savedBlock;
    if (displaySig) return <SignedDisplay sig={displaySig} />;
  }

  // ── Render: draw mode ──────────────────────────────────────────────────
  if (mode === "draw") {
    return (
      <div className="rounded-lg border border-white/15 bg-white/[0.04] p-4 space-y-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-0.5">
            {PURPOSE_LABELS[purpose]}
          </div>
          <p className="text-sm text-white/60">PIN verified. Now draw your signature below.</p>
        </div>

        {/* Canvas — white background, black ink */}
        <div className="rounded-lg overflow-hidden border border-white/20 bg-white">
          <canvas
            ref={canvasRef}
            width={560}
            height={160}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-[160px] cursor-crosshair touch-none block"
          />
        </div>

        <p className="text-[10px] text-white/30 text-center">
          Draw inside the white box above
        </p>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 text-center">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={clearCanvas}
            className="flex-1 py-2.5 bg-white/5 border border-white/15 text-white/70 text-sm font-medium rounded-xl hover:bg-white/10 transition-all"
          >
            Clear
          </button>
          <button
            onClick={saveSignature}
            className="flex-1 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-all"
          >
            Save Signature
          </button>
        </div>
      </div>
    );
  }

  // ── Render: idle mode — PIN entry ──────────────────────────────────────
  return (
    <div className="rounded-lg border border-white/15 bg-white/[0.04] p-4 space-y-4">
      <div>
        <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-0.5">
          {PURPOSE_LABELS[purpose]}
        </div>
        <p className="text-sm text-white/60">{label} — enter your 4-digit PIN to unlock signature.</p>
      </div>

      {/* 4 dot indicators */}
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

      <input
        type="password"
        inputMode="numeric"
        maxLength={4}
        value={pin}
        onChange={(e) => {
          if (locked) return;
          setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
          setError("");
        }}
        onKeyDown={(e) => e.key === "Enter" && handleVerify()}
        disabled={locked}
        placeholder="••••"
        className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white text-center font-mono text-2xl tracking-[0.5em] focus:outline-none focus:border-[#4f6ef7] disabled:opacity-40 transition-all"
        autoFocus
      />

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 text-center">
          {error}
        </div>
      )}

      {locked && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-center">
          <div className="text-red-300 text-sm font-semibold">🔒 Locked</div>
          <div className="text-red-400/70 text-xs mt-1">Contact admin to reset.</div>
        </div>
      )}

      <button
        onClick={handleVerify}
        disabled={pin.length !== 4 || locked || loading}
        className="w-full py-3 bg-[#4f6ef7] text-white text-sm font-bold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#3d5ae0] transition-all cursor-pointer"
      >
        {loading ? "Verifying..." : "Verify PIN"}
      </button>

      <p className="text-[10px] text-white/25 text-center">
        ⚠️ This signature is legally binding. Do not share your PIN.
      </p>
    </div>
  );
}