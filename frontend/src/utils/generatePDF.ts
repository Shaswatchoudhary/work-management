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
  scale: 2,
  useCORS: true,
  backgroundColor: "#ffffff",
  logging: false,
  windowWidth: 794,
});

// ── Pending signature box ──────────────────────────────────────────────
const buildPendingBox = (index: number, label: string, color: string): string => `
<div style="border:1.5px solid #cccccc;border-radius:6px;background:#ffffff;font-family:Georgia,serif;height:100%;">
  <div style="background:#f5f5f5;border-bottom:1.5px solid #dddddd;padding:10px 14px;display:table;width:100%;box-sizing:border-box;">
    <div style="display:table-cell;vertical-align:middle;width:28px;">
      <div style="width:22px;height:22px;border-radius:50%;background:#dddddd;font-size:11px;font-weight:700;color:#444;text-align:center;line-height:22px;">${index + 1}</div>
    </div>
    <div style="display:table-cell;vertical-align:middle;font-size:12px;font-weight:700;color:${color};letter-spacing:0.4px;padding-left:8px;">${label}</div>
  </div>
  <div style="padding:32px 14px;text-align:center;">
    <div style="font-size:13px;color:#bbbbbb;font-style:italic;margin-bottom:8px;">Pending signature</div>
    <div style="height:1px;background:#eeeeee;margin:12px 20px;"></div>
    <div style="font-size:11px;color:#cccccc;font-style:italic;">Not yet signed</div>
  </div>
</div>`;

// ── Signed signature box ───────────────────────────────────────────────
const buildSignedBox = (sig: SignatureBlock, index: number, label: string, color: string): string => {
  const shortHash = sig.hash.length > 12 ? sig.hash.slice(0, 12) : sig.hash;
  return `
<div style="border:1.5px solid #cccccc;border-radius:6px;background:#ffffff;font-family:Georgia,serif;height:100%;">
  <div style="background:#f5f5f5;border-bottom:1.5px solid #dddddd;padding:10px 14px;display:table;width:100%;box-sizing:border-box;">
    <div style="display:table-cell;vertical-align:middle;width:28px;">
      <div style="width:22px;height:22px;border-radius:50%;background:#dddddd;font-size:11px;font-weight:700;color:#444;text-align:center;line-height:22px;">${index + 1}</div>
    </div>
    <div style="display:table-cell;vertical-align:middle;font-size:12px;font-weight:700;color:${color};letter-spacing:0.4px;padding-left:8px;">${label}</div>
  </div>
  <div style="padding:12px 16px 14px;">
    <div style="text-align:center;height:70px;line-height:70px;margin-bottom:10px;background:#fafafa;border:1px solid #eeeeee;border-radius:4px;">
      <img src="${sig.canvasPNG}" style="max-height:64px;max-width:90%;vertical-align:middle;display:inline-block;" />
    </div>
    <div style="height:1.5px;background:#dddddd;margin-bottom:10px;"></div>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="font-size:11px;color:#888;padding:0 0 4px 0;width:50px;vertical-align:top;">Name:</td>
        <td style="font-size:12px;font-weight:700;color:#111;padding:0 0 4px 4px;vertical-align:top;">${safe(sig.name)}</td>
      </tr>
      <tr>
        <td style="font-size:11px;color:#888;padding:0 0 4px 0;vertical-align:top;">Role:</td>
        <td style="font-size:11px;color:#444;padding:0 0 4px 4px;vertical-align:top;">${safe(sig.role)}</td>
      </tr>
      <tr>
        <td style="font-size:11px;color:#888;padding:0 0 4px 0;vertical-align:top;">Signed:</td>
        <td style="font-size:11px;color:#333;padding:0 0 4px 4px;vertical-align:top;">${safe(fmt(sig.signedAt))}</td>
      </tr>
      <tr>
        <td style="font-size:10px;color:#aaa;padding:0;vertical-align:top;">Hash:</td>
        <td style="font-size:10px;color:#aaa;font-family:'Courier New',monospace;padding:0 0 0 4px;vertical-align:top;">${safe(shortHash)}</td>
      </tr>
    </table>
    <div style="margin-top:10px;">
      <span style="font-size:11px;font-weight:700;color:#16a34a;">&#10003; PIN VERIFIED &middot; DIGITALLY SIGNED</span>
    </div>
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
  <td style="padding:7px 12px;font-size:12px;font-weight:700;color:#111;border:1px solid #cccccc;width:150px;background:#f9f9f9;vertical-align:top;">${safe(label)}</td>
  <td style="padding:7px 12px;font-size:12px;color:#222;border:1px solid #cccccc;background:#ffffff;vertical-align:top;word-break:break-word;">${safe(value)}</td>
</tr>`).join("");

  const sigBoxes = sigBlocks.map((block, idx) =>
    block
      ? buildSignedBox(block, idx, labels[idx], colors[idx])
      : buildPendingBox(idx, labels[idx], colors[idx])
  );

  const sigRowsHTML = `
<tr>
  <td style="width:50%;padding:0 6px 10px 0;vertical-align:top;">${sigBoxes[0]}</td>
  <td style="width:50%;padding:0 0 10px 6px;vertical-align:top;">${sigBoxes[1]}</td>
</tr>
<tr>
  <td style="width:50%;padding:0 6px 0 0;vertical-align:top;">${sigBoxes[2]}</td>
  <td style="width:50%;padding:0 0 0 6px;vertical-align:top;">${sigBoxes[3]}</td>
</tr>`;

  const generatedDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return `
<div id="pdf-root" style="width:794px;min-height:1117px;background:#ffffff;color:#111111;font-family:Georgia,'Times New Roman',serif;box-sizing:border-box;padding:0px 12px 10px 12px;display:flex;flex-direction:column;">

  <table style="width:100%;border-collapse:collapse;margin-bottom:10px;">
    <tr>
      <td style="vertical-align:bottom;padding:0;">
        <div style="font-size:10px;letter-spacing:0.2em;color:#666;margin-bottom:3px;text-transform:uppercase;">Work Management</div>
        <div style="font-size:26px;font-weight:700;color:#111;line-height:1.15;">Requirement Document</div>
      </td>
      <td style="vertical-align:top;text-align:right;padding:0;padding-top:4px;">
        <div style="font-size:12px;line-height:1.8;color:#444;">
          Ref: <strong>${safe(ticket.id)}</strong><br>
          Date: ${safe(generatedDate)}<br>
          Status: ${safe(ticket.status)}
        </div>
      </td>
    </tr>
  </table>

  <div style="height:3px;background:#111111;margin-bottom:14px;"></div>

  <div style="font-size:18px;font-weight:700;color:#111;margin-bottom:14px;word-break:break-word;">${safe(ticket.title)}</div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:16px;border:1px solid #cccccc;">
    ${detailRowsHTML}
  </table>

  <div style="font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:#888;margin-bottom:5px;">Description</div>
  <div style="border:1px solid #cccccc;border-radius:4px;padding:10px 14px;font-size:13px;color:#222;line-height:1.6;white-space:pre-wrap;word-break:break-word;margin-bottom:18px;min-height:60px;">${safe(ticket.description || "—")}</div>

  <div style="height:3px;background:#111111;margin-bottom:14px;"></div>

  <div style="font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin-bottom:12px;">Authorized Signatures</div>

  <table style="width:100%;border-collapse:collapse;flex:1;">
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