import { useState, useCallback, useRef, useEffect } from "react";
import { verifyPin, createSignatureBlock } from "./signatureEngine";
import { SignatureBlock, SignaturePurpose } from "./SignatureBlock";

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
  hr_approval: "HR Approval",
  admin_approval: "Admin Final Approval",
  hr_inspection: "HR Inspection Co-signature",
  admin_inspection_payment: "Admin Inspection + Payment Authorization",
};

// ── Locked display — sign ho gaya, kuch edit nahi hoga ────────────────────
const SignedDisplay = ({ sig }: { sig: SignatureBlock }) => (
  <div style={{ borderRadius: "10px", border: "0.5px solid #BBF7D0", background: "#F0FDF4", padding: "16px", pointerEvents: "none", userSelect: "none" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
      <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.07em", color: "#16A34A", fontWeight: 700 }}>
        {PURPOSE_LABELS[sig.purpose]}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px", background: "#BBF7D0", color: "#16A34A", padding: "4px 8px", borderRadius: "20px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        ✓ Verified & Locked
      </span>
    </div>

    {/* Drawn signature image */}
    <div style={{ background: "#fff", borderRadius: "8px", padding: "8px", border: "0.5px solid #EDE9E0", marginBottom: "12px" }}>
      {sig.signatureImage ? (
        <img
          src={sig.signatureImage}
          alt="Signature"
          style={{ width: "100%", height: "80px", objectFit: "contain" }}
        />
      ) : (
        <div
          style={{ color: "#333", textAlign: "center", padding: "16px 0", fontFamily: "'Georgia', serif", fontStyle: "italic", fontSize: "24px" }}
        >
          {sig.signedBy}
        </div>
      )}
    </div>

    {/* All details — plain spans only, no inputs */}
    <div style={{ background: "#fff", borderRadius: "8px", padding: "12px", border: "0.5px solid #EDE9E0", display: "flex", flexDirection: "column", gap: "8px", fontSize: "11px" }}>
      <div style={{ display: "flex", gap: "12px" }}>
        <span style={{ color: "#AAA", width: "96px", flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "9px", paddingTop: "2px" }}>Signed by</span>
        <span style={{ color: "#333", fontWeight: 600 }}>{sig.signedBy}</span>
      </div>
      <div style={{ display: "flex", gap: "12px" }}>
        <span style={{ color: "#AAA", width: "96px", flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "9px", paddingTop: "2px" }}>Role</span>
        <span style={{ color: "#333", fontWeight: 600 }}>{sig.role}</span>
      </div>
      <div style={{ display: "flex", gap: "12px" }}>
        <span style={{ color: "#AAA", width: "96px", flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "9px", paddingTop: "2px" }}>Date & Time</span>
        <span style={{ color: "#333", fontWeight: 600, fontFamily: "monospace", fontSize: "10px" }}>
          {new Date(sig.signedAt).toLocaleString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
            hour12: true,
          })}
        </span>
      </div>
      <div style={{ display: "flex", gap: "12px" }}>
        <span style={{ color: "#AAA", width: "96px", flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "9px", paddingTop: "2px" }}>Ticket ID</span>
        <span style={{ color: "#333", fontWeight: 600 }}>{sig.ticketId}</span>
      </div>
      <div style={{ display: "flex", gap: "12px" }}>
        <span style={{ color: "#AAA", width: "96px", flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "9px", paddingTop: "2px" }}>Hash</span>
        <span style={{ color: "#CCC", fontFamily: "monospace", fontSize: "9px", wordBreak: "break-all" }}>{sig.hash}</span>
      </div>
    </div>

    <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
      <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ color: "#fff", fontSize: "7px", fontWeight: 700, lineHeight: 1 }}>✓</span>
      </div>
      <span style={{ fontSize: "9px", color: "#16A34A", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
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

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
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
  const saveSignature = useCallback(async () => {
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
    const block = await createSignatureBlock(userId, userName, ticketId, purpose, signatureImage);

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
      <div style={{ borderRadius: "10px", border: "0.5px solid #EDE9E0", background: "#FAFAF7", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.07em", color: "#AAA", fontWeight: 600, marginBottom: "4px" }}>
            {PURPOSE_LABELS[purpose]}
          </div>
          <p style={{ fontSize: "13px", color: "#555" }}>PIN verified. Now draw your signature below.</p>
        </div>

        {/* Canvas — white background, black ink */}
        <div style={{ borderRadius: "10px", overflow: "hidden", border: "0.5px solid #EDE9E0", background: "#fff" }}>
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
            style={{ width: "100%", height: "160px", cursor: "crosshair", touchAction: "none", display: "block" }}
          />
        </div>

        <p style={{ fontSize: "10px", color: "#AAA", textAlign: "center" }}>
          Draw inside the white box above
        </p>

        {error && (
          <div style={{ borderRadius: "8px", border: "0.5px solid #FECACA", background: "#FEF2F2", padding: "8px 12px", fontSize: "12px", color: "#DC2626", textAlign: "center" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={clearCanvas}
            style={{ flex: 1, padding: "10px 14px", background: "#fff", border: "0.5px solid #EDE9E0", color: "#555", fontSize: "13px", fontWeight: 500, borderRadius: "10px", cursor: "pointer", transition: "background 0.15s" }}
          >
            Clear
          </button>
          <button
            onClick={saveSignature}
            style={{ flex: 1, padding: "10px 14px", background: "#16A34A", border: "none", color: "#fff", fontSize: "13px", fontWeight: 600, borderRadius: "10px", cursor: "pointer", transition: "background 0.15s" }}
          >
            Save Signature
          </button>
        </div>
      </div>
    );
  }

  // ── Render: idle mode — PIN entry ──────────────────────────────────────
  return (
    <div style={{ borderRadius: "10px", border: "0.5px solid #EDE9E0", background: "#FAFAF7", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <div>
        <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.07em", color: "#AAA", fontWeight: 600, marginBottom: "4px" }}>
          {PURPOSE_LABELS[purpose]}
        </div>
        <p style={{ fontSize: "13px", color: "#555" }}>{label} — enter your 4-digit PIN to unlock signature.</p>
      </div>

      {/* 4 dot indicators */}
      <div style={{ display: "flex", gap: "12px", justifyContent: "center", padding: "8px 0" }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: "48px", height: "48px", borderRadius: "10px", border: "2px solid",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px", fontWeight: 700, transition: "all 0.15s",
              borderColor: pin.length > i ? "#F59E0B" : "#EDE9E0",
              background: pin.length > i ? "#FFFBEB" : "#fff",
              color: pin.length > i ? "#F59E0B" : "transparent",
              transform: pin.length > i ? "scale(1.05)" : "scale(1)",
            }}
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
        style={{
          width: "100%", padding: "10px 14px",
          background: "#fff", border: "0.5px solid #EDE9E0", borderRadius: "10px",
          color: "#333", textAlign: "center", fontFamily: "monospace",
          fontSize: "24px", letterSpacing: "0.5em", outline: "none",
          opacity: locked ? 0.4 : 1, cursor: locked ? "not-allowed" : "text",
        }}
        autoFocus
      />

      {error && (
        <div style={{ borderRadius: "8px", border: "0.5px solid #FECACA", background: "#FEF2F2", padding: "8px 12px", fontSize: "12px", color: "#DC2626", textAlign: "center" }}>
          {error}
        </div>
      )}

      {locked && (
        <div style={{ borderRadius: "8px", border: "0.5px solid #FECACA", background: "#FEF2F2", padding: "10px 12px", textAlign: "center" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#DC2626" }}>🔒 Locked</div>
          <div style={{ fontSize: "11px", color: "#DC2626", marginTop: "4px", opacity: 0.8 }}>Contact admin to reset.</div>
        </div>
      )}

      <button
        onClick={handleVerify}
        disabled={pin.length !== 4 || locked || loading}
        style={{
          width: "100%", padding: "10px 14px",
          background: pin.length !== 4 || locked || loading ? "#FCD97A" : "#F59E0B",
          border: "none", borderRadius: "10px",
          color: "#fff", fontSize: "13px", fontWeight: 600,
          opacity: pin.length !== 4 || locked || loading ? 0.5 : 1,
          cursor: pin.length !== 4 || locked || loading ? "not-allowed" : "pointer",
          transition: "background 0.15s",
        }}
      >
        {loading ? "Verifying..." : "Verify PIN"}
      </button>

      <p style={{ fontSize: "10px", color: "#AAA", textAlign: "center" }}>
        ⚠️ This signature is legally binding. Do not share your PIN.
      </p>
    </div>
  );
}