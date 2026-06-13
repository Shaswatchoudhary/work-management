import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Ticket, SafeUser } from "../../types/index.ts";
import { fmtMoney } from "../../utils/dateFormatter.ts";
import { STATUS_LABEL } from "../../constants/ticketStatus.ts";
import "./pdfGenerator.scss"
export interface SignatureBlock {
  label: string;
  name: string;
  role: string;
  department: string;
  signedAt: string;
  purpose: string;
  hash: string;
  canvasPNG: string;
  matched: boolean;
  confidence: number;
}

export interface TicketData {
  id: string;
  title: string;
  category: string;
  priority: string;
  location: string;
  cost: string;
  status: string;
  raisedBy: string;
  raisedAt: string;
  tags: string;
  description: string;
  assignee?: string;
  submittedAt?: string;
  hrApprovedAt?: string;
  adminApprovedAt?: string;
  workDoneAt?: string;
  inspectedAt?: string;
  closedAt?: string;
  signatures?: {
    hrApproval?: SignatureBlock;
    adminApproval?: SignatureBlock;
    hrInspection?: SignatureBlock;
    adminPayment?: SignatureBlock;
  };
}

export type StatusCallback = (
  message: string,
  type: "processing" | "done" | "error"
) => void;

const safe = (v?: string | number | null): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const fmt = (v?: string): string => {
  if (!v) return "Pending";
  try {
    return new Date(v).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return v;
  }
};

function injectSafeColorVars(): HTMLStyleElement {
  const style = document.createElement("style");
  style.id = "pdf-color-override";
  style.textContent = `
    .pdf-root, .pdf-root * { color-scheme: light !important; }
    :root, [data-theme], .dark, [class*="dark"] {
      --background: #ffffff !important;
      --foreground: #111111 !important;
      --border: #cccccc !important;
    }
  `;
  document.head.appendChild(style);
  return style;
}

function removeSafeColorVars(s: HTMLStyleElement): void {
  s.parentNode?.removeChild(s);
}

const html2canvasOptions = () => ({
  scale: 2,
  useCORS: true,
  backgroundColor: "#ffffff",
  logging: false,
  windowWidth: 794,
});

// ── Pending signature box ──────────────────────────────────────────────
const buildPendingBox = (index: number, label: string, color: string): string => `
<div class="pdf-sig-box-pending">
  <div class="pdf-sig-box-pending__header">
    <div class="pdf-sig-box-pending__number">
      <div class="number">${index + 1}</div>
    </div>
    <div class="pdf-sig-box-pending__label" style="color: ${color};">${label}</div>
  </div>
  <div class="pdf-sig-box-pending__body">
    <div class="pdf-sig-box-pending__text">Pending signature</div>
    <div class="pdf-sig-box-pending__divider"></div>
    <div class="pdf-sig-box-pending__footer">Not yet signed</div>
  </div>
</div>`;

// ── Signed signature box ───────────────────────────────────────────────
const buildSignedBox = (sig: SignatureBlock, index: number, label: string, color: string): string => {
  const shortHash = sig.hash.length > 12 ? sig.hash.slice(0, 12) : sig.hash;
  return `
<div class="pdf-sig-box-signed">
  <div class="pdf-sig-box-signed__header">
    <div class="pdf-sig-box-signed__number">
      <div class="number">${index + 1}</div>
    </div>
    <div class="pdf-sig-box-signed__label" style="color: ${color};">${label}</div>
  </div>
  <div class="pdf-sig-box-signed__body">
    <div class="pdf-sig-box-signed__canvas-wrapper">
      <img src="${sig.canvasPNG}" class="pdf-sig-box-signed__canvas" />
    </div>
    <div class="pdf-sig-box-signed__divider"></div>
    <table class="pdf-sig-box-signed__details-table">
      <tr>
        <td class="pdf-sig-box-signed__detail-label">Name:</td>
        <td class="pdf-sig-box-signed__detail-value">${safe(sig.name)}</td>
      </tr>
      <tr>
        <td class="pdf-sig-box-signed__detail-label">Role:</td>
        <td class="pdf-sig-box-signed__detail-value pdf-sig-box-signed__detail-value--role">${safe(sig.role)}</td>
      </tr>
      <tr>
        <td class="pdf-sig-box-signed__detail-label">Signed:</td>
        <td class="pdf-sig-box-signed__detail-value pdf-sig-box-signed__detail-value--date">${safe(fmt(sig.signedAt))}</td>
      </tr>
      <tr>
        <td class="pdf-sig-box-signed__detail-label">Hash:</td>
        <td class="pdf-sig-box-signed__detail-value pdf-sig-box-signed__detail-value--hash">${safe(shortHash)}</td>
      </tr>
    </table>
    <div class="pdf-sig-box-signed__verification">PIN VERIFIED &middot; DIGITALLY SIGNED</div>
  </div>
</div>`;
};

// ── Build full HTML document ───────────────────────────────────────────
const buildDocumentHTML = (ticket: TicketData): string => {
  const sigs = ticket.signatures ?? {};

  const sigBlocks: (SignatureBlock | undefined)[] = [
    sigs.hrApproval,
    sigs.adminApproval,
    sigs.hrInspection,
    sigs.adminPayment,
  ];

  const labels = ["HR APPROVAL", "ADMIN APPROVAL", "HR INSPECTION", "ADMIN — INSPECTION & PAYMENT"];
  const colors = ["#0e6b5e", "#1a3a6b", "#0e6b5e", "#7a4b00"];

  const detailRows: [string, string][] = [
    ["Category", ticket.category ?? "—"],
    ["Priority", ticket.priority ?? "—"],
    ["Location", ticket.location ?? "—"],
    ["Estimated Cost", ticket.cost ?? "—"],
    ["Status", ticket.status ?? "—"],
    ["Raised By", ticket.raisedBy ?? "—"],
    ["Raised At", ticket.raisedAt ?? "—"],
    ["Tags", ticket.tags ?? "—"],
    ...(ticket.assignee ? [["Assignee", ticket.assignee] as [string, string]] : []),
  ];

  const detailRowsHTML = detailRows.map(([label, value]) => `
<tr>
  <td class="pdf-details-label">${safe(label)}</td>
  <td class="pdf-details-value">${safe(value)}</td>
</tr>`).join("");

  const sigBoxes = sigBlocks.map((block, idx) =>
    block
      ? buildSignedBox(block, idx, labels[idx], colors[idx])
      : buildPendingBox(idx, labels[idx], colors[idx])
  );

  const sigRowsHTML = `
<tr>
  <td class="pdf-signature-cell-left">${sigBoxes[0]}</td>
  <td class="pdf-signature-cell-right">${sigBoxes[1]}</td>
</tr>
<tr>
  <td class="pdf-signature-cell-bottom-left">${sigBoxes[2]}</td>
  <td class="pdf-signature-cell-bottom-right">${sigBoxes[3]}</td>
</tr>`;

  const generatedDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return `
<div class="pdf-root">
  <table class="pdf-header-table">
    <tr>
      <td class="pdf-header-left">
        <div class="pdf-header-label">Work Management</div>
        <div class="pdf-header-title">Requirement Document</div>
      </td>
      <td class="pdf-header-right">
        Ref: <strong>${safe(ticket.id)}</strong><br>
        Date: ${safe(generatedDate)}<br>
        Status: ${safe(ticket.status)}
      </td>
    </tr>
  </table>

  <div class="pdf-divider"></div>

  <div class="pdf-subtitle">${safe(ticket.title)}</div>

  <table class="pdf-details-table">
    ${detailRowsHTML}
  </table>

  <div class="pdf-description-label">Description</div>
  <div class="pdf-description-box">${safe(ticket.description || "—")}</div>

  <div class="pdf-divider"></div>

  <div class="pdf-signatures-label">Authorized Signatures</div>

  <table class="pdf-signatures-table">
    ${sigRowsHTML}
  </table>
</div>`;
};

// ── Canvas → A4 pages ─────────────────────────────────────────────────
async function canvasToPdf(fullCanvas: HTMLCanvasElement): Promise<{ pdf: jsPDF; dataUrl: string }> {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const pageHPx = Math.floor((fullCanvas.width * pageH) / pageW);

  let sourceY = 0, pageIndex = 0;

  while (sourceY < fullCanvas.height) {
    await new Promise<void>((r) => setTimeout(r, 0));
    const sliceH = Math.min(pageHPx, fullCanvas.height - sourceY);
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = fullCanvas.width;
    pageCanvas.height = sliceH;
    const ctx = pageCanvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pageCanvas.width, sliceH);
    ctx.drawImage(fullCanvas, 0, sourceY, fullCanvas.width, sliceH, 0, 0, fullCanvas.width, sliceH);
    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(pageCanvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pageW, (sliceH * pageW) / fullCanvas.width);
    sourceY += sliceH;
    pageIndex += 1;
  }

  return { pdf, dataUrl: pdf.output("datauristring") };
}

// ── Core render ───────────────────────────────────────────────────────
async function renderToDataUrl(data: TicketData, onStatus?: StatusCallback): Promise<{ pdf: jsPDF; dataUrl: string }> {
  let hiddenWrapper: HTMLDivElement | null = null;
  try {
    await document.fonts.ready;

    hiddenWrapper = document.createElement("div");
    hiddenWrapper.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;overflow:hidden;background:#ffffff;z-index:-1;pointer-events:none;";
    hiddenWrapper.innerHTML = buildDocumentHTML(data);
    document.body.appendChild(hiddenWrapper);
    await document.fonts.ready;

    const pdfRoot = hiddenWrapper.querySelector(".pdf-root") as HTMLElement;
    if (!pdfRoot) throw new Error("pdf-root not found");

    onStatus?.("Rendering document...", "processing");

    const colorOverride = injectSafeColorVars();
    let fullCanvas: HTMLCanvasElement;
    try {
      fullCanvas = await html2canvas(pdfRoot, html2canvasOptions());
    } finally {
      removeSafeColorVars(colorOverride);
    }

    onStatus?.("Building pages...", "processing");
    return await canvasToPdf(fullCanvas);
  } finally {
    if (hiddenWrapper?.parentNode) hiddenWrapper.parentNode.removeChild(hiddenWrapper);
  }
}

// ── Public: generatePDF ───────────────────────────────────────────────
export async function generatePDF(
  ticket: TicketData,
  { onStatus }: { onStatus?: StatusCallback } = {},
): Promise<void> {
  if (typeof document === "undefined")
    throw new Error("PDF generation is only available in the browser.");

  onStatus?.("Building document...", "processing");
  try {
    const { pdf } = await renderToDataUrl(ticket, onStatus);
    pdf.save(`${ticket.id}_requirement_document.pdf`);
    onStatus?.("PDF downloaded successfully!", "done");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generatePDF] Error:", message);
    onStatus?.(`Error: ${message}`, "error");
    throw err;
  }
}

// ── ticketToTicketData ────────────────────────────────────────────────
export function ticketToTicketData(ticket: Ticket, user?: SafeUser): TicketData {
  const sigs = ticket.signatures ?? {};

  const toSigBlock = (
    s: import("../../types/index.ts").SignatureBlock | undefined,
    label: string,
  ): SignatureBlock | undefined => {
    if (!s) return undefined;
    return {
      label,
      name: s.signedBy,
      role: s.role,
      department: "",
      signedAt: s.signedAt,
      purpose: s.purpose,
      hash: s.hash,
      canvasPNG: s.signatureImage || "",
      matched: true,
      confidence: 100,
    };
  };

  return {
    id: ticket.id,
    title: ticket.title,
    category: ticket.category,
    priority: ticket.priority,
    location: ticket.location,
    cost: fmtMoney(ticket.estimatedCost),
    status: STATUS_LABEL[ticket.status] || ticket.status,
    raisedBy: user?.name || ticket.createdBy,
    raisedAt: new Date(ticket.createdAt).toLocaleDateString("en-IN"),
    tags: (ticket.tags || []).join(", ") || "—",
    description: ticket.description || "—",
    assignee: ticket.assignee
      ? `${ticket.assignee.name} (${ticket.assignee.department})`
      : undefined,
    submittedAt: ticket.createdAt,
    hrApprovedAt: sigs.hrApproval?.signedAt,
    adminApprovedAt: sigs.adminApproval?.signedAt,
    workDoneAt: ticket.assignee ? ticket.updatedAt : undefined,
    inspectedAt: ticket.inspection?.passed ? ticket.updatedAt : undefined,
    closedAt: ticket.status === "closed" ? ticket.updatedAt : undefined,
    signatures: {
      hrApproval: toSigBlock(sigs.hrApproval, "1. HR APPROVAL"),
      adminApproval: toSigBlock(sigs.adminApproval, "2. ADMIN APPROVAL"),
      hrInspection: toSigBlock(sigs.hrInspection, "3. HR INSPECTION"),
      adminPayment: toSigBlock(sigs.adminPayment, "4. ADMIN — INSPECTION & PAYMENT"),
    },
  };
}

// ── generateAndDownloadPdf ────────────────────────────────────────────
export async function generateAndDownloadPdf(
  ticket: Ticket,
  user?: SafeUser,
  onStatus?: StatusCallback,
  options: { download?: boolean } = {},
): Promise<string> {
  const { download = false } = options;
  const data = ticketToTicketData(ticket, user);
  const { pdf, dataUrl } = await renderToDataUrl(data, onStatus);

  if (download) {
    pdf.save(`${ticket.id}_document.pdf`);
    onStatus?.("Downloaded!", "done");
  }

  return dataUrl;
}