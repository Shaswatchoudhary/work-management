import { format, formatDistanceToNow } from "date-fns";

export const fmtDate = (date: string | Date): string => {
  return format(new Date(date), "MMM d, yyyy");
};

export const fmtMoney = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const fmtRel = (date: string | Date): string => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};
