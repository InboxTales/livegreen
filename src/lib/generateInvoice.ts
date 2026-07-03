import { jsPDF } from "jspdf";
import type { Order } from "@/lib/api";

// ─── Sender / Company details ──────────────────────────────────────────────
const SENDER = {
  contactName: "Ajay",
  line1: "Live Green, Geeta Hospital Road",
  line2: "Sajjapuram, Tanuku",
  line3: "West Godavari 534211",
  line4: "Andhra Pradesh",
  line5: "India",
};

// ─── Palette ───────────────────────────────────────────────────────────────
const BLACK   = [0,   0,   0  ] as const;
const DARK    = [30,  30,  30 ] as const;
const GRAY    = [80,  80,  80 ] as const;
const LGRAY   = [150, 150, 150] as const;
const RULE    = [200, 200, 200] as const;
const HEADBG  = [245, 245, 245] as const;   // light grey header row

// ─── Helpers ───────────────────────────────────────────────────────────────
function setColor(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}
function setFill(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}
function setDraw(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}

function bold(doc: jsPDF, text: string, x: number, y: number, size = 10) {
  doc.setFontSize(size);
  doc.setFont("helvetica", "bold");
  setColor(doc, DARK);
  doc.text(String(text ?? ""), x, y);
}
function regular(doc: jsPDF, text: string, x: number, y: number, size = 9.5) {
  doc.setFontSize(size);
  doc.setFont("helvetica", "normal");
  setColor(doc, DARK);
  doc.text(String(text ?? ""), x, y);
}
function small(doc: jsPDF, text: string, x: number, y: number) {
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  setColor(doc, GRAY);
  doc.text(String(text ?? ""), x, y);
}

function hline(doc: jsPDF, y: number, x1 = 15, x2 = 195) {
  setDraw(doc, RULE);
  doc.setLineWidth(0.3);
  doc.line(x1, y, x2, y);
}
function vline(doc: jsPDF, x: number, y1: number, y2: number) {
  setDraw(doc, RULE);
  doc.setLineWidth(0.3);
  doc.line(x, y1, x, y2);
}
function rect(doc: jsPDF, x: number, y: number, w: number, h: number) {
  setDraw(doc, RULE);
  doc.setLineWidth(0.3);
  doc.rect(x, y, w, h);
}

async function imageToDataUrl(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas ctx unavailable"));
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = src;
  });
}

// ─── Main export ───────────────────────────────────────────────────────────
export async function generateInvoice(order: Order): Promise<void> {
  const doc  = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const PW   = 210;
  const L    = 15;   // left margin
  const R    = 195;  // right margin
  const CW   = R - L;
  const MID  = L + CW / 2;  // ~105

  // ── 1. Title "Invoice #XXXX" ────────────────────────────────────────────
  let y = 18;
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  setColor(doc, BLACK);
  doc.text(`Invoice #${order.id}`, L, y);

  // ── 2. Top section box: date/invoice-no (left) | logo (right) ───────────
  y += 4;
  const topBoxH = 40;
  rect(doc, L, y, CW, topBoxH);
  vline(doc, MID, y, y + topBoxH);

  // Left cell: Date Added + Invoice No.
  const orderDate = new Date(order.date).toLocaleDateString("en-IN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
  const dateY = y + 14;
  bold(doc,    "Date Added:",  L + 4, dateY, 9);
  regular(doc, orderDate,      L + 28, dateY, 9);
  bold(doc,    "Invoice No.:", L + 4, dateY + 7, 9);
  regular(doc, String(order.id), L + 28, dateY + 7, 9);

  // Right cell: logo
  try {
    const logoData = await imageToDataUrl("/logo.png");
    const logoX = MID + 8;
    const logoY = y + 4;
    const logoW = 52;
    const logoH = 32;
    doc.addImage(logoData, "PNG", logoX, logoY, logoW, logoH);
  } catch {
    bold(doc, "Live Green Honey", MID + 6, y + 20, 12);
  }

  // ── 3. Address section box ───────────────────────────────────────────────
  y += topBoxH;
  const addrBoxH = 50;
  rect(doc, L, y, CW, addrBoxH);
  vline(doc, MID, y, y + addrBoxH);

  // Column headers
  const hdrY = y + 7;
  bold(doc, "Sender Address",   L + 4, hdrY, 9.5);
  bold(doc, "Shipping Address", MID + 4, hdrY, 9.5);
  hline(doc, y + 10, L, R);

  // Sender (left)
  let sy = y + 16;
  const lineH = 5.5;
  regular(doc, SENDER.contactName, L + 4, sy, 9); sy += lineH;
  regular(doc, SENDER.line1,       L + 4, sy, 9); sy += lineH;
  regular(doc, SENDER.line2,       L + 4, sy, 9); sy += lineH;
  regular(doc, SENDER.line3,       L + 4, sy, 9); sy += lineH;
  regular(doc, SENDER.line4,       L + 4, sy, 9); sy += lineH;
  regular(doc, SENDER.line5,       L + 4, sy, 9);

  // Shipping (right) — name + phone on one line, then address lines
  const cusName  = String(order.customerName || "");
  const cusPhone = String(order.phone || "");
  const addr1    = String(order.address || "");
  const cityZip  = `${String(order.city || "")} ${String(order.zip || "")}`.trim();
  const stateLine= String(order.state || "");

  let ry = y + 16;
  // Wrap name+phone in case it's long
  const nameLine = `${cusName} ${cusPhone}`.trim();
  const nameLines = doc.splitTextToSize(nameLine, CW / 2 - 8);
  nameLines.forEach((l: string) => {
    regular(doc, l, MID + 4, ry, 9); ry += lineH;
  });
  const addrLines = doc.splitTextToSize(addr1, CW / 2 - 8);
  addrLines.forEach((l: string) => {
    regular(doc, l, MID + 4, ry, 9); ry += lineH;
  });
  regular(doc, cityZip,   MID + 4, ry, 9); ry += lineH;
  regular(doc, stateLine, MID + 4, ry, 9); ry += lineH;
  regular(doc, "IN",      MID + 4, ry, 9);

  // ── 4. Product table ─────────────────────────────────────────────────────
  y += addrBoxH + 6;

  // Column layout (all within L→R)
  const col = {
    product:   L,
    qty:       L + 100,
    unitPrice: L + 130,
    total:     L + 163,
  };
  const tableW = CW;

  // Table header row
  const tHdrH = 9;
  setFill(doc, HEADBG);
  doc.rect(L, y, tableW, tHdrH, "F");
  setDraw(doc, RULE);
  doc.setLineWidth(0.3);
  doc.rect(L, y, tableW, tHdrH);

  bold(doc, "Product",    col.product   + 3, y + 6, 9);
  bold(doc, "Quantity",   col.qty       + 3, y + 6, 9);
  bold(doc, "Unit Price", col.unitPrice + 3, y + 6, 9);
  bold(doc, "Total",      col.total     + 3, y + 6, 9);

  // Vertical dividers in header
  [col.qty, col.unitPrice, col.total].forEach(cx =>
    vline(doc, cx, y, y + tHdrH)
  );

  y += tHdrH;

  // Item rows
  let invoiceTotal = 0;
  order.items.forEach((item: any) => {
    const price = Number(item.price)    || 0;
    const qty   = Number(item.quantity) || 0;
    const total = price * qty;
    invoiceTotal += total;

    const rowH = 9;
    doc.rect(L, y, tableW, rowH);
    [col.qty, col.unitPrice, col.total].forEach(cx =>
      vline(doc, cx, y, y + rowH)
    );

    const rawName = String(item.name || "Product");
    const nameLines2 = doc.splitTextToSize(rawName, col.qty - col.product - 5);
    // If multi-line, expand row
    const rH = Math.max(rowH, nameLines2.length * 5 + 4);
    if (rH > rowH) {
      // Redraw rect taller
      setFill(doc, [255, 255, 255]);
      doc.rect(L, y, tableW, rH, "FD");
      [col.qty, col.unitPrice, col.total].forEach(cx =>
        vline(doc, cx, y, y + rH)
      );
    }

    regular(doc, nameLines2[0],          col.product   + 3, y + 6, 9);
    if (nameLines2[1]) regular(doc, nameLines2[1], col.product + 3, y + 11, 9);

    regular(doc, String(qty),             col.qty       + 3, y + 6, 9);
    regular(doc, `Rs. ${price.toFixed(0)}`, col.unitPrice + 3, y + 6, 9);
    regular(doc, `Rs. ${total.toFixed(0)}`, col.total    + 3, y + 6, 9);

    y += rH > rowH ? rH : rowH;
  });

  // ── 5. Total breakdown rows ──────────────────────────────────────────────
  const subtotal = order.items.reduce((s: number, item: any) => s + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
  const couponDiscount = Number(order.couponDiscount) || 0;
  const adminDiscount = Number(order.adminDiscount) || 0;
  const shippingCost = Math.max(0, Number(order.totalAmount) - Math.max(0, subtotal - couponDiscount - adminDiscount));

  const rowH = 8;
  const colTotalX = col.total + 3;

  const drawSummaryRow = (label: string, valueStr: string, isBold = false) => {
    doc.rect(L, y, tableW, rowH);
    vline(doc, col.total, y, y + rowH);
    
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(9);
    setColor(doc, DARK);
    doc.text(label, col.total - 3, y + 5.5, { align: "right" });
    
    if (isBold) {
      bold(doc, valueStr, colTotalX, y + 5.5, 9);
    } else {
      regular(doc, valueStr, colTotalX, y + 5.5, 9);
    }
    y += rowH;
  };

  // Subtotal
  drawSummaryRow("Subtotal", `Rs. ${subtotal.toFixed(0)}`);

  // Coupon Discount
  if (couponDiscount > 0 || order.couponCode) {
    const couponLabel = order.couponCode ? `Coupon Discount (${order.couponCode})` : "Coupon Discount";
    drawSummaryRow(couponLabel, `-Rs. ${couponDiscount.toFixed(0)}`);
  }

  // Admin Discount
  drawSummaryRow("Admin Discount", adminDiscount > 0 ? `-Rs. ${adminDiscount.toFixed(0)}` : "Rs. 0");

  // Shipping
  drawSummaryRow("Shipping", `Rs. ${shippingCost.toFixed(0)}`);

  // Final Payable Amount
  drawSummaryRow("Final Payable Amount", `Rs. ${Number(order.totalAmount).toFixed(0)}`, true);

  // ── 6. Footer ─────────────────────────────────────────────────────────────
  y += 12;
  hline(doc, y);
  y += 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  setColor(doc, LGRAY);
  doc.text("Thank you for shopping with Live Green Honey!", PW / 2, y, { align: "center" });

  // ── Save ──────────────────────────────────────────────────────────────────
  doc.save(`Invoice_${order.id}.pdf`);
}
