export type SignaturePurpose = "hr_approval" | "admin_approval" | "hr_inspection" | "admin_inspection_payment";

export interface SignatureBlock {
  signedBy: string;
  role: string;
  userId: string;
  purpose: SignaturePurpose;
  ticketId: string;
  signedAt: string;
  hash: string;
  deviceHint: string;
  signatureImage?: string;
}

