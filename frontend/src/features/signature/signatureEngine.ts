import { SignatureBlock, SignaturePurpose } from "./types";
import { MOCK_USERS } from "../../data/mockUsers";

// ─── Hash generate karna ───────────────────────────────────────────────────
// Yeh hash tamper detection ke liye hai.
// Agar koi PDF ke baad manually data badalne ki koshish kare,
// hash mismatch hoga aur pata chal jayega.
// we have used sha256 hash algo instead of djb2 because it is more secure and reliable. 
export const generateSecureHash = async (data: {
  userId: string;
  ticketId: string;
  purpose: string;
  signedAt: string;
}): Promise<string> => {
  const raw = `${data.userId}|${data.ticketId}|${data.purpose}|${data.signedAt}`;

  // String ko bytes me convert karein
  const msgBuffer = new TextEncoder().encode(raw);

  // Browser ka built-in crypto module use karke SHA-256 hash banayein
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

  // Array buffer ko Hex String me convert karein
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex.toUpperCase(); // Yeh ek 64-character ka secure hash dega
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
// Note: Hash async hone ki vajah se is function ko bhi async banaya gaya hai.
export const createSignatureBlock = async (
  userId: string,
  userName: string,
  ticketId: string,
  purpose: SignaturePurpose,
  signatureImage: string, // base64 PNG of the drawn canvas signature
): Promise<SignatureBlock> => {
  const signedAt = new Date().toISOString(); // exact timestamp — ISO format

  // Purpose ke hisaab se role label
  const roleLabel: Record<SignaturePurpose, string> = {
    hr_approval: "HR Manager",
    admin_approval: "Administrator",
    hr_inspection: "HR Inspector",
    admin_inspection_payment: "Admin — Payment Authority",
  };

  // Naya SHA-256 hash secure function call kiya await ke sath
  const hash = await generateSecureHash({ userId, ticketId, purpose, signedAt });

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
// Note: Hash validation async hone ki vajah se yeh function ab Promise<boolean> return karega.
export const verifySignatureIntegrity = async (sig: SignatureBlock): Promise<boolean> => {
  const expected = await generateSecureHash({
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
};
