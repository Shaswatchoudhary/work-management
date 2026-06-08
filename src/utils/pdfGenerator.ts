import jsPDF from "jspdf";
import { fmtDate, fmtMoney } from "./dateFormatter";
import { STATUS_LABEL } from "../constants/ticketStatus";
import { Ticket, SafeUser, PdfResult, SignatureBlock } from "../types";
import { formatSignatureTimestamp, verifySignatureIntegrity } from "./signatureEngine";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function header(doc: any, title: string): void {
  doc.setFillColor(15, 15, 15);
  doc.rect(0, 0, 210, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Work Management", 14, 15);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(title, 196, 15, { align: "right" });
  doc.setTextColor(20, 20, 20);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function kv(doc: any, y: number, label: string, value: string | number | undefined): void {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(label, 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(String(value ?? "—"), 60, y);
}

// ─── Single signature block draw karna ────────────────────────────────────
// ─── Single signature block — COMPACT VERSION ─────────────────────────────
const drawSignatureBlock = (
  doc: jsPDF,
  sig: SignatureBlock | undefined,
  x: number,
  y: number,
  w: number,
  label: string,
  slotNumber: number,
): void => {
  const h = 52; // ← 72 se 52 kar diya — compact but readable

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.rect(x, y, w, h);

  // Header bar
  doc.setFillColor(245, 245, 245);
  doc.rect(x, y, w, 8, "F");

  // Slot circle
  doc.setFillColor(80, 80, 80);
  doc.circle(x + 4.5, y + 4, 2.8, "F");
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(String(slotNumber), x + 4.5, y + 5.2, { align: "center" });

  // Label
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text(label.toUpperCase(), x + 9, y + 5.5);

  if (!sig) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(160, 160, 160);
    doc.text("Pending — Signature Required", x + w / 2, y + 24, { align: "center" });
    doc.setDrawColor(180, 180, 180);
    doc.setLineDashPattern([1, 2], 0);
    doc.line(x + 4, y + h - 10, x + w - 4, y + h - 10);
    doc.setLineDashPattern([], 0);
    doc.setFontSize(6);
    doc.setTextColor(180, 180, 180);
    doc.text("Authorized Signature", x + w / 2, y + h - 6, { align: "center" });
    return;
  }

  const isValid = verifySignatureIntegrity(sig);

  // Signature image — compact height
  if (sig.signatureImage) {
    try {
      doc.addImage(sig.signatureImage, "PNG", x + 2, y + 9, w - 4, 18);
    } catch {
      doc.setFontSize(12);
      doc.setFont("helvetica", "boldoblique");
      doc.setTextColor(10, 10, 80);
      doc.text(sig.signedBy, x + 3, y + 20);
    }
  } else {
    doc.setFontSize(12);
    doc.setFont("helvetica", "boldoblique");
    doc.setTextColor(10, 10, 80);
    doc.text(sig.signedBy, x + 3, y + 20);
  }

  // Separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(x + 2, y + 29, x + w - 2, y + 29);

  // Details — compact 2-column layout
  const leftDetails = [
    { lbl: "Name:",   val: sig.signedBy },
    { lbl: "Role:",   val: sig.role },
  ];
  const rightDetails = [
    { lbl: "Signed:", val: formatSignatureTimestamp(sig.signedAt) },
    { lbl: "Hash:",   val: sig.hash },
  ];

  // Left column
  leftDetails.forEach(({ lbl, val }, i) => {
    const ly = y + 33 + i * 5;
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text(lbl, x + 2, ly);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    // Truncate long values
    const truncated = val.length > 18 ? val.slice(0, 18) + "…" : val;
    doc.text(truncated, x + 12, ly);
  });

  // Right column
  rightDetails.forEach(({ lbl, val }, i) => {
    const ly = y + 33 + i * 5;
    const rx = x + w / 2 + 2;
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text(lbl, rx, ly);
    doc.setFont(lbl === "Hash:" ? "courier" : "helvetica", "normal");
    doc.setFontSize(lbl === "Hash:" ? 5 : 5.5);
    doc.setTextColor(30, 30, 30);
    const truncated = val.length > 20 ? val.slice(0, 20) + "…" : val;
    doc.text(truncated, rx + 10, ly);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
  });

  // Verified badge
  if (isValid) {
    doc.setFillColor(34, 197, 94);
    doc.roundedRect(x + 2, y + h - 7, 48, 5, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(4.5);
    doc.setFont("helvetica", "bold");
    doc.text("✓ PIN VERIFIED · DIGITALLY SIGNED", x + 4, y + h - 3.8);
  } else {
    doc.setFillColor(239, 68, 68);
    doc.roundedRect(x + 2, y + h - 7, 48, 5, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(4.5);
    doc.text("⚠ INTEGRITY CHECK FAILED", x + 4, y + h - 3.8);
  }
};

// ─── 4 signature blocks — ALL ON SAME PAGE ────────────────────────────────
export const addSignatureSectionToPdf = (
  doc: jsPDF,
  ticket: Ticket,
  contentEndY: number,  // ← ab caller se actual Y pass hoga
): void => {
  const sigs      = ticket.signatures ?? {};
  const pageH     = doc.internal.pageSize.getHeight();
  const blockH    = 52;
  const gap       = 4;
  const colW      = 89;
  const col1      = 14;
  const col2      = 107;
  const headerH   = 10;
  const footerH   = 8;

  // Total height needed: header + row1 + gap + row2 + footer
  const totalH = headerH + blockH + gap + blockH + footerH;

  // Agar content ke baad jagah nahi — new page
  let startY = contentEndY + 8;
  if (startY + totalH > pageH - 10) {
    doc.addPage();
    startY = 15;
  }

  // Section header
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("AUTHORIZED SIGNATURES", col1, startY);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(col1, startY + 2, 196, startY + 2);

  const row1Y = startY + headerH;
  const row2Y = row1Y + blockH + gap;

  drawSignatureBlock(doc, sigs.hrApproval,    col1, row1Y, colW, "HR Approval",               1);
  drawSignatureBlock(doc, sigs.adminApproval, col2, row1Y, colW, "Admin Final Approval",       2);
  drawSignatureBlock(doc, sigs.hrInspection,  col1, row2Y, colW, "HR Inspection",              3);
  drawSignatureBlock(doc, sigs.adminPayment,  col2, row2Y, colW, "Admin Inspection + Payment", 4);

  // Footer
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150, 150, 150);
  // doc.text(
  //   "Digitally verified signatures. Hash values can be independently verified. Generated by Work Management System.",
  //   col1, row2Y + blockH + 5, { maxWidth: 182 },
  // );
};

// ─── 4 signature blocks section — called in every PDF ─────────────────────


// ─── Requirement PDF ───────────────────────────────────────────────────────
export function generateRequirementPdf(ticket: Ticket, helpdeskUser: SafeUser | undefined): PdfResult {
  const doc = new jsPDF();
  header(doc, "Requirement Document");

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${ticket.id} — ${ticket.title}`, 14, 38);

  let y = 50;
  const rows: [string, string][] = [
    ["Category",       ticket.category],
    ["Priority",       ticket.priority],
    ["Location",       ticket.location],
    ["Estimated Cost", fmtMoney(ticket.estimatedCost)],
    ["Status",         STATUS_LABEL[ticket.status] || ticket.status],
    ["Raised By",      helpdeskUser?.name || ticket.createdBy],
    ["Raised At",      fmtDate(ticket.createdAt)],
    ["Tags",           (ticket.tags || []).join(", ") || "—"],
  ];
  rows.forEach(([k, v]) => { kv(doc, y, k, v); y += 7; });

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("Description", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(ticket.description || "—", 180);
  doc.text(lines, 14, y);
  y += lines.length * 5; // Track actual Y after description

  // ← 4 signature blocks
  addSignatureSectionToPdf(doc, ticket, y);

  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(`Generated ${fmtDate(new Date().toISOString())}`, 14, 289);

  return {
    name: `Requirement_${ticket.id}.pdf`,
    blob: doc.output("blob"),
    dataUrl: doc.output("datauristring"),
  };
}

// ─── Inspection PDF ────────────────────────────────────────────────────────
export function generateInspectionPdf(
  ticket: Ticket,
  _hrSig: string | undefined,
  _adminSig: string | undefined,
): PdfResult {
  const doc = new jsPDF();
  header(doc, "Inspection Report");

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${ticket.id} — ${ticket.title}`, 14, 38);

  let y = 50;
  const rows: [string, string][] = [
    ["Category",         ticket.category],
    ["Assigned To",      ticket.assignee ? `${ticket.assignee.name} (${ticket.assignee.department})` : "—"],
    ["Inspection Result",ticket.inspection?.passed ? "PASSED" : "FAILED"],
    ["Inspection Notes", ticket.inspection?.notes || "—"],
    ["Estimated Cost",   fmtMoney(ticket.estimatedCost)],
  ];
  rows.forEach(([k, v]) => { kv(doc, y, k, v); y += 7; });

  // ← 4 signature blocks
  addSignatureSectionToPdf(doc, ticket, y);

  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(`Generated ${fmtDate(new Date().toISOString())}`, 14, 289);

  return {
    name: `Inspection_${ticket.id}.pdf`,
    blob: doc.output("blob"),
    dataUrl: doc.output("datauristring"),
  };
}

// ─── Payment PDF ───────────────────────────────────────────────────────────
export function generatePaymentPdf(ticket: Ticket, _adminSig: string): PdfResult {
  const doc = new jsPDF();
  header(doc, "Payment Voucher");

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${ticket.id} — ${ticket.title}`, 14, 38);

  let y = 50;
  const rows: [string, string][] = [
    ["Amount Released", fmtMoney(ticket.payment?.amount ?? ticket.estimatedCost)],
    ["Released At",     fmtDate(ticket.payment?.releasedAt || new Date().toISOString())],
    ["Assigned To",     ticket.assignee ? `${ticket.assignee.name} (${ticket.assignee.department})` : "—"],
    ["Category",        ticket.category],
    ["Final Status",    "CLOSED"],
  ];
  rows.forEach(([k, v]) => { kv(doc, y, k, v); y += 7; });

  // ← 4 signature blocks
  addSignatureSectionToPdf(doc, ticket, y);

  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(`Generated ${fmtDate(new Date().toISOString())}`, 14, 289);

  return {
    name: `Payment_${ticket.id}.pdf`,
    blob: doc.output("blob"),
    dataUrl: doc.output("datauristring"),
  };
}

// ─── Download helper ───────────────────────────────────────────────────────
export function downloadPdf(pdf: PdfResult): void {
  const url = URL.createObjectURL(pdf.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = pdf.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}