import type { MerchantProfile } from "./easyposMerchantStore.ts";
import type { SaleRecord } from "./easyposStore.ts";

function buildReceiptText(sale: SaleRecord, merchant: MerchantProfile): string {
  const lines = [
    merchant.name || "Merchant",
    merchant.registrationNumber ? `Reg No: ${merchant.registrationNumber}` : "",
    merchant.phone ? `Phone: ${merchant.phone}` : "",
    merchant.email ? `Email: ${merchant.email}` : "",
    merchant.address ? `Address: ${merchant.address}` : "",
    "",
    "Receipt",
    `Sale ID: ${sale.id}`,
    `Datetime: ${new Date(sale.createdAt).toLocaleString()}`,
    "",
    ...sale.items.map(
      (item) =>
        `${item.name} x${item.quantity} @ RM ${item.price.toFixed(2)} = RM ${item.lineTotal.toFixed(2)}`,
    ),
    "",
    `Items: ${sale.itemCount}`,
    `Total: RM ${sale.total.toFixed(2)}`,
    "",
    merchant.footerNote || "Thank you.",
  ];

  return lines.filter(Boolean).join("\n");
}

function downloadLocalReceipt(sale: SaleRecord, merchant: MerchantProfile) {
  const receiptText = buildReceiptText(sale, merchant);
  const blob = new Blob([receiptText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${sale.id}-receipt.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function getReceiptPublicUrl(sale: SaleRecord, options?: { autoPrint?: boolean }) {
  if (!sale.publicToken || typeof window === "undefined") {
    return null;
  }

  const url = new URL("/easypos/receipt", window.location.origin);
  url.searchParams.set("token", sale.publicToken);
  if (options?.autoPrint) {
    url.searchParams.set("download", "1");
  }
  return url.toString();
}

export function generateReceipt(sale: SaleRecord, merchant: MerchantProfile) {
  const publicUrl = getReceiptPublicUrl(sale, { autoPrint: true });
  if (publicUrl) {
    window.open(publicUrl, "_blank", "noopener,noreferrer");
    return;
  }

  downloadLocalReceipt(sale, merchant);
}

export function getReceiptPreview(sale: SaleRecord, merchant: MerchantProfile) {
  return buildReceiptText(sale, merchant);
}
