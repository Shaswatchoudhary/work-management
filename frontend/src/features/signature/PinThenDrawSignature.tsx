import { useState, useCallback, useRef, useEffect } from "react";
import { verifyPin, createSignatureBlock } from "./signatureEngine";
import type { SignatureBlock, SignaturePurpose } from "./types";
import "./PinThenDrawSignature.scss";

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
  <div className="signature-locked-display">
    <div className="header-row">
      <span className="purpose-tag">
        {PURPOSE_LABELS[sig.purpose]}
      </span>
      <span className="badge-locked">
        ✓ Verified & Locked
      </span>
    </div>

    {/* Drawn signature image */}
    <div className="signature-img-box">
      {sig.signatureImage ? (
        <img
          src={sig.signatureImage}
          alt="Signature"
          className="signature-img"
        />
      ) : (
        <div className="signature-fallback-name">
          {sig.signedBy}
        </div>
      )}
    </div>

    {/* All details — plain spans only, no inputs */}
    <div className="details-box">
      <div className="detail-row">
        <span className="field-label">Signed by</span>
        <span className="field-value">{sig.signedBy}</span>
      </div>
      <div className="detail-row">
        <span className="field-label">Role</span>
        <span className="field-value">{sig.role}</span>
      </div>
      <div className="detail-row">
        <span className="field-label">Date & Time</span>
        <span className="field-value" style={{ fontFamily: "monospace", fontSize: "10px" }}>
          {new Date(sig.signedAt).toLocaleString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
            hour12: true,
          })}
        </span>
      </div>
      <div className="detail-row">
        <span className="field-label">Ticket ID</span>
        <span className="field-value">{sig.ticketId}</span>
      </div>
      <div className="detail-row">
        <span className="field-label">Hash</span>
        <span className="field-value-hash">{sig.hash}</span>
      </div>
    </div>

    <div className="verified-badge-footer">
      <div className="dot-check">
        <span className="check-char">✓</span>
      </div>
      <span className="badge-text">
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
      <div className="signature-verify-container draw-mode">
        <div className="section-header">
          <div className="purpose-title">
            {PURPOSE_LABELS[purpose]}
          </div>
          <p className="instructions">PIN verified. Now draw your signature below.</p>
        </div>

        {/* Canvas — white background, black ink */}
        <div className="canvas-wrapper">
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
            className="signature-canvas"
          />
        </div>

        <p className="canvas-help-text">
          Draw inside the white box above
        </p>

        {error && (
          <div className="error-block">
            {error}
          </div>
        )}

        <div className="button-row">
          <button
            onClick={clearCanvas}
            className="btn-clear"
            type="button"
          >
            Clear
          </button>
          <button
            onClick={saveSignature}
            className="btn-save"
            type="button"
          >
            Save Signature
          </button>
        </div>
      </div>
    );
  }

  // ── Render: idle mode — PIN entry ──────────────────────────────────────
  return (
    <div className="signature-verify-container">
      <div className="section-header">
        <div className="purpose-title">
          {PURPOSE_LABELS[purpose]}
        </div>
        <p className="instructions">{label} — enter your 4-digit PIN to unlock signature.</p>
      </div>

      {/* 4 dot indicators */}
      <div className="pin-dots-list">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`dot-box ${pin.length > i ? "active" : ""}`}
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
        className="pin-input"
        autoFocus
      />

      {error && (
        <div className="error-block">
          {error}
        </div>
      )}

      {locked && (
        <div className="locked-block">
          <div className="title">🔒 Locked</div>
          <div className="subtitle">Contact admin to reset.</div>
        </div>
      )}

      <button
        onClick={handleVerify}
        disabled={pin.length !== 4 || locked || loading}
        className="action-btn-full"
        type="button"
      >
        {loading ? "Verifying..." : "Verify PIN"}
      </button>

      <p className="caution-warning">
        ⚠️ This signature is legally binding. Do not share your PIN.
      </p>
    </div>
  );
}