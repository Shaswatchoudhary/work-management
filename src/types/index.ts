export type Role = "helpdesk" | "hr" | "admin";

// ===== SIGNATURE TYPES =====

// Har ek signature ka purpose — 4 total milenge PDF mein
export type SignaturePurpose =
  | "hr_approval"               // 1st sign — HR ne ticket approve kiya
  | "admin_approval"            // 2nd sign — Admin ne final approve kiya
  | "hr_inspection"             // 3rd sign — HR ne inspection ki
  | "admin_inspection_payment"; // 4th sign — Admin ne inspect + payment authorize ki

// Ek signature block ka pura data — PDF mein yahi embed hoga
export interface SignatureBlock {
  signedBy: string;        // "Priya Sharma"
  role: string;            // "HR Manager"
  userId: string;          // "u-hr" — kaun tha track karne ke liye
  purpose: SignaturePurpose;
  ticketId: string;        // "TKT-1005"
  signedAt: string;        // ISO string — "2026-06-07T10:42:18.000Z"
  hash: string;            // tamper detection ke liye — change hoga toh mismatch hoga
  deviceHint: string;      // browser fingerprint — extra security layer
  signatureImage: string;  // base64 PNG of the drawn canvas signature
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  pin: string;   // ← 4-digit personal PIN, password se alag
  role: Role;
  department: string;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
}

export type Status =
  | "draft"
  | "pending_hr"
  | "pending_admin"
  | "rejected_hr"
  | "rejected_admin"
  | "work_in_progress"
  | "inspection_pending"
  | "payment_pending"
  | "closed";

export type Priority = "Low" | "Medium" | "High" | "Critical";

export interface Assignee {
  name: string;
  department: string;
}

export interface Inspection {
  passed: boolean;
  notes: string;
  signedByHr: boolean;
  signedByAdmin: boolean;
  hrInspectionSig?: string;
  adminInspectionSig?: string;
}

export interface Payment {
  amount: number;
  releasedAt: string;
}

export interface TicketPdf {
  name: string;
  type: "requirement" | "inspection" | "payment";
  dataUrl: string;
  at: string;
}

export interface Comment {
  id: string;
  userId: string;
  role: Role;
  text: string;
  at: string;
}

export interface Ticket {
  id: string;
  title: string;
  category: string;
  priority: Priority;
  location: string;
  estimatedCost: number;
  description: string;
  tags: string[];
  status: Status;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignee: Assignee | null;
  inspection: Inspection | null;
  payment: Payment | null;
  pdfs: TicketPdf[];
  comments: Comment[];
  hrSignature?: string;
  adminSignature?: string;
  hrApprovedAt?: string;
  adminApprovedAt?: string;
  // === DIGITAL SIGNATURES ===
  signatures?: {
    hrApproval?: SignatureBlock;        // pehla sign — HR approval
    adminApproval?: SignatureBlock;     // doosra sign — Admin approval
    hrInspection?: SignatureBlock;      // teesra sign — HR inspection
    adminPayment?: SignatureBlock;      // chautha sign — Admin payment auth
  };
}

export interface Notification {
  id: string;
  title: string;
  forRole: Role | "all";
  read: boolean;
  at: string;
}

export interface AuthState {
  user: SafeUser | null;
  hasHydrated: boolean;
  login: (email: string, password: string, role: Role) => { ok: boolean; user?: SafeUser; error?: string };
  logout: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export interface TicketState {
  tickets: Ticket[];
  addTicket: (data: Omit<Ticket, "id" | "status" | "createdBy" | "createdAt" | "updatedAt" | "assignee" | "inspection" | "payment" | "pdfs" | "comments">, user: SafeUser) => Ticket;
  updateTicket: (id: string, patch: Partial<Ticket>) => void;
  addComment: (id: string, comment: Omit<Comment, "id" | "at">) => void;
  addPdf: (id: string, pdf: TicketPdf) => void;
  setStatus: (id: string, status: Status, opts?: { comment?: Omit<Comment, "id" | "at">; patch?: Partial<Ticket> }) => void;
  getById: (id: string) => Ticket | undefined;
  reset: () => void;
}

export interface NotificationState {
  notifications: Notification[];
  addNotification: (n: Omit<Notification, "id" | "read" | "at">) => void;
  markRead: (id: string) => void;
  markAllRead: (forRole?: Role) => void;
  unreadCount: (forRole?: Role) => number;
}

export interface PdfResult {
  name: string;
  blob: Blob;
  dataUrl: string;
}
