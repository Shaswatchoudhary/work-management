import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Ticket, SafeUser } from "../types";
import { fmtMoney } from "./dateFormatter";
import { STATUS_LABEL } from "../constants/ticketStatus";

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

// ── Helpers ───────────────────────────────────────────────────────────────────

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
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch { return v; }
};

function ensureFontLoaded(): void {
  // Georgia is a system serif font — no network load needed
}

function injectSafeColorVars(): HTMLStyleElement {
  const style = document.createElement("style");
  style.id = "pdf-color-override";
  style.textContent = `
    #pdf-root, #pdf-root * { color-scheme: light !important; }
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
  scale: 3,
  useCORS: true,
  backgroundColor: "#ffffff",
  logging: false,
  windowWidth: 794,
});

// ── Signature box ─────────────────────────────────────────────────────────────
// Compact design — fits 4 boxes in 2×2 on one page with everything above it.
// Signature image height reduced to 56px so the whole doc fits on one A4 page.

const buildSigBox = (sig: SignatureBlock | undefined, index: number): string => {
  const labelColors = ["#0e6b5e", "#1a3a6b", "#0e6b5e", "#7a4b00"];
  const labelColor = labelColors[index] ?? "#1a3a6b";
  const labels = ["HR APPROVAL", "ADMIN APPROVAL", "HR INSPECTION", "ADMIN — INSPECTION &amp; PAYMENT"];

  if (!sig) {
    return `
<div style="border:1px solid #cccccc;border-radius:6px;background:#ffffff;font-family:Georgia,serif;">
  <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid #eeeeee;">
    <div style="width:20px;height:20px;border-radius:50%;background:#f0f0f0;font-size:10px;font-weight:700;color:#555;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${index + 1}</div>
    <div style="font-size:11px;font-weight:700;color:${labelColor};letter-spacing:0.3px;">${labels[index]}</div>
  </div>
  <div style="padding:14px 12px 12px;text-align:center;">
    <div style="font-size:12px;color:#aaaaaa;font-style:italic;margin-bottom:24px;">Pending signature</div>
    <div style="font-size:10px;color:#aaaaaa;font-style:italic;text-align:left;">Not yet signed</div>
  </div>
</div>`;
  }

  // Truncate hash to 8 chars for compact display
  const shortHash = sig.hash.length > 8 ? sig.hash.slice(0, 8) : sig.hash;

  return `
<div style="border:1px solid #cccccc;border-radius:6px;background:#ffffff;font-family:Georgia,serif;">
  <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid #eeeeee;">
    <div style="width:20px;height:20px;border-radius:50%;background:#f0f0f0;font-size:10px;font-weight:700;color:#555;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${index + 1}</div>
    <div style="font-size:11px;font-weight:700;color:${labelColor};letter-spacing:0.3px;">${safe(sig.label.replace(/^\d+\.\s*/, ""))}</div>
  </div>
  <div style="padding:10px 12px 10px;">

    <!-- Signature image — 56px height keeps everything on one page -->
    <div style="text-align:center;height:60px;display:flex;align-items:center;justify-content:center;margin-bottom:6px;">
      <img src="${sig.canvasPNG}" alt="sig" style="max-height:56px;max-width:90%;object-fit:contain;display:block;margin:0 auto;"/>
    </div>

    <!-- Thin underline below signature -->
    <div style="height:1px;background:#cccccc;margin-bottom:8px;"></div>

    <!-- 2-col mini table: Name/Role left, Signed/Hash right -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
      <tr>
        <td style="font-size:10px;color:#888;font-family:Georgia,serif;padding:0;width:40px;vertical-align:top;">Name:</td>
        <td style="font-size:11px;font-weight:700;color:#111;font-family:Georgia,serif;padding:0 8px 0 0;vertical-align:top;">${safe(sig.name)}</td>
        <td style="font-size:10px;color:#888;font-family:Georgia,serif;padding:0;width:42px;vertical-align:top;">Signed:</td>
        <td style="font-size:10px;color:#333;font-family:Georgia,serif;padding:0;vertical-align:top;">${safe(fmt(sig.signedAt))}</td>
      </tr>
      <tr>
        <td style="font-size:10px;color:#888;font-family:Georgia,serif;padding:2px 0 0;vertical-align:top;">Role:</td>
        <td style="font-size:10px;color:#444;font-family:Georgia,serif;padding:2px 8px 0 0;vertical-align:top;">${safe(sig.role)}</td>
        <td style="font-size:10px;color:#888;font-family:Georgia,serif;padding:2px 0 0;vertical-align:top;">Hash:</td>
        <td style="font-size:10px;color:#888;font-family:'Courier New',monospace;padding:2px 0 0;vertical-align:top;">${safe(shortHash)}</td>
      </tr>
    </table>

    <!-- PIN verified badge -->
    <div style="display:inline-flex;align-items:center;gap:5px;background:#dcfce7;border-radius:4px;padding:3px 8px;">
      <div style="width:6px;height:6px;border-radius:50%;background:#16a34a;flex-shrink:0;"></div>
      <span style="font-size:9px;font-weight:700;color:#15803d;letter-spacing:0.3px;font-family:Georgia,serif;">PIN VERIFIED · DIGITALLY SIGNED</span>
    </div>

  </div>
</div>`;
};

// ── Main document HTML ────────────────────────────────────────────────────────
// Everything compacted to fit on ONE A4 page (794×1123px at 96dpi).
// Key decisions:
//   - padding reduced (40px sides, 36px top)
//   - details table: no Status/RaisedAt rows (saves vertical space)
//   - description min-height: 50px (was 80px)
//   - NO workflow timeline (removed — saves ~80px)
//   - signature boxes compact (56px sig image, smaller padding)
//   - margin-bottom values tightened throughout

const buildDocumentHTML = (ticket: TicketData): string => {
  const sigs = ticket.signatures ?? {};
  const sigBlocks: (SignatureBlock | undefined)[] = [
    sigs.hrApproval, sigs.adminApproval,
    sigs.hrInspection, sigs.adminPayment,
  ];

  // Detail rows — kept minimal to save vertical space
  const detailRows: [string, string][] = [
    ["Category", ticket.category ?? "—"],
    ["Priority", ticket.priority ?? "—"],
    ["Location", ticket.location ?? "—"],
    ["Estimated Cost", ticket.cost ?? "—"],
    ["Status", ticket.status ?? "—"],
    ["Raised By", ticket.raisedBy ?? "—"],
    ["Raised At", ticket.raisedAt ?? "—"],
    ["Tags", ticket.tags ?? "—"],
  ];

  const detailRowsHTML = detailRows.map(([label, value]) => `
<tr>
  <td style="padding:7px 14px;font-size:12px;font-weight:700;color:#111;border:1px solid #cccccc;width:170px;font-family:Georgia,serif;background:#ffffff;vertical-align:top;">${safe(label)}</td>
  <td style="padding:7px 14px;font-size:12px;color:#222;border:1px solid #cccccc;font-family:Georgia,serif;background:#ffffff;vertical-align:top;word-break:break-word;">${safe(value)}</td>
</tr>`).join("");

  // 2×2 signature grid
  const sigRowsHTML: string[] = [];
  for (let i = 0; i < sigBlocks.length; i += 2) {
    sigRowsHTML.push(`
<tr>
  <td style="width:50%;padding:0 6px 10px 0;vertical-align:top;">${buildSigBox(sigBlocks[i], i)}</td>
  <td style="width:50%;padding:0 0 10px 6px;vertical-align:top;">${buildSigBox(sigBlocks[i + 1], i + 1)}</td>
</tr>`);
  }

  const generatedDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return `
<div
  id="pdf-root"
  style="
    width: 794px;
    min-height: 1123px;
    background: #ffffff;
    color: #111111;
    font-family: Georgia, 'Times New Roman', serif;
    box-sizing: border-box;
    padding: 36px 48px 40px 48px;
  "
>

  <!-- Header: brand left, ref right -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
    <tr>
      <td style="vertical-align:bottom;padding:0;">
        <div style="font-size:10px;letter-spacing:0.15em;color:#555;font-family:Georgia,serif;margin-bottom:3px;text-transform:uppercase;">Work Management</div>
        <div style="font-size:24px;font-weight:700;color:#111;font-family:Georgia,serif;line-height:1.1;">Requirement Document</div>
      </td>
      <td style="vertical-align:top;text-align:right;padding:0;">
        <div style="font-size:11px;font-family:Georgia,serif;line-height:1.9;color:#333;">
          Ref: <strong>${safe(ticket.id)}</strong><br/>
          Date: ${safe(generatedDate)}<br/>
          Status: ${safe(ticket.status)}
        </div>
      </td>
    </tr>
  </table>

  <!-- Thick divider -->
  <div style="height:2px;background:#111;margin-bottom:18px;"></div>

  <!-- Title -->
  <div style="font-size:18px;font-weight:700;color:#111;font-family:Georgia,serif;margin-bottom:14px;word-break:break-word;">${safe(ticket.title)}</div>

  <!-- Details table -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
    ${detailRowsHTML}
  </table>

  <!-- Description -->
  <div style="font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:#888;font-family:Georgia,serif;margin-bottom:6px;">Description</div>
  <div style="border:1px solid #cccccc;border-radius:4px;padding:10px 14px;font-size:12px;color:#222;font-family:Georgia,serif;line-height:1.6;white-space:pre-wrap;word-break:break-word;min-height:50px;margin-bottom:20px;">${safe(ticket.description || "—")}</div>

  <!-- Thick divider before signatures -->
  <div style="height:2px;background:#111;margin-bottom:14px;"></div>

  <!-- Signatures label -->
  <div style="font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:#888;font-family:Georgia,serif;margin-bottom:12px;">Authorized Signatures</div>

  <!-- 4 signature boxes 2×2 -->
  <table style="width:100%;border-collapse:collapse;">
    ${sigRowsHTML.join("")}
  </table>

</div>`;
};

// ── Canvas → PDF ──────────────────────────────────────────────────────────────

async function canvasToPdf(
  fullCanvas: HTMLCanvasElement,
): Promise<{ pdf: jsPDF; dataUrl: string }> {
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
    pageIndex++;
  }

  return { pdf, dataUrl: pdf.output("datauristring") };
}

// ── Internal render helper (no auto-download) ─────────────────────────────────
// Returns dataUrl only. Caller decides whether to save or just store.

async function renderToDataUrl(
  data: TicketData,
  onStatus?: StatusCallback,
): Promise<{ pdf: jsPDF; dataUrl: string }> {
  let hiddenWrapper: HTMLDivElement | null = null;
  try {
    ensureFontLoaded();
    await document.fonts.ready;

    hiddenWrapper = document.createElement("div");
    hiddenWrapper.style.cssText = `position:fixed;left:-10000px;top:0;width:794px;overflow:hidden;background:#ffffff;z-index:-1;pointer-events:none;`;
    hiddenWrapper.innerHTML = buildDocumentHTML(data);
    document.body.appendChild(hiddenWrapper);
    await document.fonts.ready;

    const pdfRoot = hiddenWrapper.querySelector("#pdf-root") as HTMLElement;
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

// ── Public: generatePDF — manual download only (used by Download button) ──────
// Called when user explicitly clicks "Download PDF" in TicketDetail.
// NOT called automatically on any approval action.

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

// ── ticketToTicketData ────────────────────────────────────────────────────────

export function ticketToTicketData(ticket: Ticket, user?: SafeUser): TicketData {
  const sigs = ticket.signatures ?? {};

  const toSigBlock = (
    s: import("../types").SignatureBlock | undefined,
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
      canvasPNG: s.signatureImage,
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

// ── generateAndDownloadPdf ────────────────────────────────────────────────────
// IMPORTANT: this now has a `download` flag.
//
//   download: true  → saves PDF file to disk (user explicitly asked)
//   download: false → only returns dataUrl (store it, don't trigger browser download)
//
// In TicketDetail, all approval onSigned callbacks should pass download: false.
// Only the "Download PDF" button should pass download: true.

export async function generateAndDownloadPdf(
  ticket: Ticket,
  user?: SafeUser,
  onStatus?: StatusCallback,
  options: { download?: boolean } = {},
): Promise<string> {
  const { download = false } = options; // default: NO auto-download
  const data = ticketToTicketData(ticket, user);
  const fileName = `${ticket.id}_document.pdf`;

  const { pdf, dataUrl } = await renderToDataUrl(data, onStatus);

  // Only save to disk when explicitly requested
  if (download) {
    pdf.save(fileName);
    onStatus?.("Downloaded!", "done");
  }

  return dataUrl;
}