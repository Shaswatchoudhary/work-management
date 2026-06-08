import { Status, Priority } from "../types";

export const STATUS = {
  DRAFT: "draft" as const,
  PENDING_HR: "pending_hr" as const,
  PENDING_ADMIN: "pending_admin" as const,
  REJECTED_HR: "rejected_hr" as const,
  REJECTED_ADMIN: "rejected_admin" as const,
  WORK_IN_PROGRESS: "work_in_progress" as const,
  INSPECTION_PENDING: "inspection_pending" as const,
  PAYMENT_PENDING: "payment_pending" as const,
  CLOSED: "closed" as const,
};

export const STATUS_LABEL: Record<Status, string> = {
  draft: "Draft",
  pending_hr: "Pending HR",
  pending_admin: "Pending Admin",
  rejected_hr: "Rejected by HR",
  rejected_admin: "Rejected by Admin",
  work_in_progress: "Work in Progress",
  inspection_pending: "Inspection Pending",
  payment_pending: "Payment Pending",
  closed: "Closed",
};

export const STATUS_TONE: Record<Status, string> = {
  draft: "muted",
  pending_hr: "warning",
  pending_admin: "warning",
  rejected_hr: "danger",
  rejected_admin: "danger",
  work_in_progress: "info",
  inspection_pending: "info",
  payment_pending: "warning",
  closed: "success",
};

export const PRIORITY: Priority[] = ["Low", "Medium", "High", "Critical"];

export const STATUS_STEPS: Status[] = [
  "pending_hr",
  "pending_admin",
  "work_in_progress",
  "inspection_pending",
  "payment_pending",
  "closed",
];
