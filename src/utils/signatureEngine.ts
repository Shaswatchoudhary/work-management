import { SignatureBlock, SignaturePurpose } from "../types";
import { MOCK_USERS } from "../data/mockUsers";

// ─── Hash generate karna ───────────────────────────────────────────────────
// Yeh hash tamper detection ke liye hai.
// Agar koi PDF ke baad manually data badalne ki koshish kare,
// hash mismatch hoga aur pata chal jayega.
export const generateSignatureHash = (data: {
  userId: string;
  ticketId: string;
  purpose: string;
  signedAt: string;
}): string => {
  const raw = `${data.userId}|${data.ticketId}|${data.purpose}|${data.signedAt}`;
  // DJB2 hash algorithm — simple, fast, collision-resistant for our use
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
  }
  // Unsigned 32-bit int → hex string, padded to 8 chars
  return (hash >>> 0).toString(16).toUpperCase().padStart(8, "0");
};

// ─── Browser fingerprint ───────────────────────────────────────────────────
// Exact IP track nahi kar sakte (no backend), lekin basic device info store karte hain.
// Agar koi aur device se sign kare, yeh different hoga.
const getDeviceHint = (): string => {
  const ua = navigator.userAgent.slice(0, 30);
  const res = `${window.screen.width}x${window.screen.height}`;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return btoa(`${ua}|${res}|${tz}`).slice(0, 16);
};

// ─── PIN verify karna ─────────────────────────────────────────────────────
// userId ke basis pe MOCK_USERS mein dhundho aur PIN match karo.
// Production mein yeh API call hogi (bcrypt compare server side).
export const verifyPin = (userId: string, enteredPin: string): boolean => {
  const user = MOCK_USERS.find((u) => u.id === userId);
  if (!user) return false;
  return user.pin === enteredPin; // production: server-side bcrypt.compare()
};

// ─── SignatureBlock banana ─────────────────────────────────────────────────
// PIN verify hone ke baad yeh function signature block generate karta hai.
// Yahi data PDF mein embed hoga aur ticketStore mein save hoga.
export const createSignatureBlock = (
  userId: string,
  userName: string,
  ticketId: string,
  purpose: SignaturePurpose,
  signatureImage: string, // base64 PNG of the drawn canvas signature
): SignatureBlock => {
  const signedAt = new Date().toISOString(); // exact timestamp — ISO format

  // Purpose ke hisaab se role label
  const roleLabel: Record<SignaturePurpose, string> = {
    hr_approval: "HR Manager",
    admin_approval: "Administrator",
    hr_inspection: "HR Inspector",
    admin_inspection_payment: "Admin — Payment Authority",
  };

  const hash = generateSignatureHash({ userId, ticketId, purpose, signedAt });

  return {
    signedBy: userName,
    role: roleLabel[purpose],
    userId,
    purpose,
    ticketId,
    signedAt,         // exact ISO timestamp — jab PIN verify hua tab ka
    hash,             // tamper detection
    deviceHint: getDeviceHint(),
    signatureImage,   // base64 PNG of the drawn canvas signature
  };
};

// ─── Signature verify karna (tamper check) ────────────────────────────────
// PDF download karne se pehle ya audit mein use karo.
// Agar kisi ne store mein data manually badla, hash mismatch karega.
export const verifySignatureIntegrity = (sig: SignatureBlock): boolean => {
  const expected = generateSignatureHash({
    userId: sig.userId,
    ticketId: sig.ticketId,
    purpose: sig.purpose,
    signedAt: sig.signedAt,
  });
  return expected === sig.hash;
};

// ─── Timestamp format karna — PDF display ke liye ─────────────────────────
export const formatSignatureTimestamp = (isoString: string): string => {
  return new Date(isoString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  // Output: "07 Jun 2026, 03:42:18 PM"
};
