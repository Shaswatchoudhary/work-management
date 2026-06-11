export type Role = "helpdesk" | "hr" | "admin";

// ===== SIGNATURE TYPES =====
export type SignaturePurpose =
  | "hr_approval"
  | "admin_approval"
  | "hr_inspection"
  | "admin_inspection_payment";

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

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  pin: string;
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
  signatures?: {
    hrApproval?: SignatureBlock;
    adminApproval?: SignatureBlock;
    hrInspection?: SignatureBlock;
    adminPayment?: SignatureBlock;
  };
}

export interface Notification {
  id: string;
  title: string;
  forRole: Role | "all";
  read: boolean;
  at: string;
}

// ✅ Sirf ek AuthState — purani wali hata di, verifyCredentials add ki
export interface AuthState {
  user: SafeUser | null;
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  verifyCredentials: (
    email: string,
    password: string,
    role: Role,
  ) => { ok: true; user: SafeUser } | { ok: false; error: string };

  login: (
    email: string,
    password: string,
    role: Role,
  ) => { ok: true; user: SafeUser } | { ok: false; error: string };

  logout: () => void;
}

export interface TicketState {
  tickets: Ticket[];
  addTicket: (
    data: Omit<Ticket, "id" | "status" | "createdBy" | "createdAt" | "updatedAt" | "assignee" | "inspection" | "payment" | "pdfs" | "comments">,
    user: SafeUser,
  ) => Ticket;
  updateTicket: (id: string, patch: Partial<Ticket>) => void;
  addComment: (id: string, comment: Omit<Comment, "id" | "at">) => void;
  addPdf: (id: string, pdf: TicketPdf) => void;
  setStatus: (
    id: string,
    status: Status,
    opts?: { comment?: Omit<Comment, "id" | "at">; patch?: Partial<Ticket> },
  ) => void;
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