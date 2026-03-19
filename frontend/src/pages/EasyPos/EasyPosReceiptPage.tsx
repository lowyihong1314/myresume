import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import type { MerchantProfile } from "../../data/easyposMerchantStore.ts";
import type { SaleRecord } from "../../data/easyposStore.ts";
import { getReceiptPreview, getReceiptPublicUrl } from "../../data/easyposReceipt.ts";
import { GlassPanel, Money, ProductImage } from "./shared";

type EasyPosReceiptPageProps = {
  merchant: MerchantProfile;
  sale: SaleRecord;
  onBack: () => void;
  onDownload: () => void;
};

export function EasyPosReceiptPage({
  merchant,
  sale,
  onBack,
  onDownload,
}: EasyPosReceiptPageProps) {
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const publicReceiptUrl = getReceiptPublicUrl(sale);

  useEffect(() => {
    if (!qrCanvasRef.current || !publicReceiptUrl) {
      return;
    }

    void QRCode.toCanvas(qrCanvasRef.current, publicReceiptUrl, {
      width: 156,
      margin: 1,
      color: {
        dark: "#111827",
        light: "#ffffff",
      },
    });
  }, [publicReceiptUrl]);

  return (
    <section className="easypos-receipt-page mt-6">
      <GlassPanel className="easypos-receipt-shell">
        <div className="easypos-receipt-toolbar sticky top-4 z-20 -mx-2 rounded-[24px] border border-[var(--easypos-border)] bg-[color:var(--easypos-modal-bg)]/95 px-4 py-4 backdrop-blur md:mx-0">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--easypos-accent-soft)]">
                Receipt
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[var(--easypos-text)]">{sale.id}</h2>
              <p className="mt-2 text-sm text-[var(--easypos-muted)]">
                {new Date(sale.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={onBack}
                className="rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-button-muted)] px-4 py-3 text-sm font-bold text-[var(--easypos-text)]"
              >
                Done
              </button>
              <button
                type="button"
                onClick={onDownload}
                className="rounded-xl bg-[var(--easypos-button-primary)] px-5 py-3 text-sm font-bold text-[var(--easypos-button-primary-text)]"
              >
                Download Receipt
              </button>
            </div>
          </div>
        </div>

        {publicReceiptUrl ? (
          <div className="easypos-receipt-public-link mt-6 grid gap-4 rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-input-bg)] p-4 md:grid-cols-[176px_1fr] md:items-center">
            <div className="flex justify-center">
              <canvas
                ref={qrCanvasRef}
                className="rounded-2xl bg-white p-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--easypos-accent-soft)]">
                Public Receipt
              </p>
              <p className="mt-2 text-sm text-[var(--easypos-muted)]">
                Scan this QR code to open the hosted receipt page and save it as PDF.
              </p>
              <a
                href={publicReceiptUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex break-all text-sm font-semibold text-[var(--easypos-accent-soft)]"
              >
                {publicReceiptUrl}
              </a>
            </div>
          </div>
        ) : null}

        <div className="easypos-receipt-summary mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-input-bg)] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--easypos-muted)]">
              Merchant
            </p>
            <p className="mt-2 text-sm font-bold text-[var(--easypos-text)]">{merchant.name || "Merchant"}</p>
          </div>
          <div className="rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-input-bg)] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--easypos-muted)]">
              Datetime
            </p>
            <p className="mt-2 text-sm font-bold text-[var(--easypos-text)]">{new Date(sale.createdAt).toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-input-bg)] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--easypos-muted)]">
              Items
            </p>
            <p className="mt-2 text-sm font-bold text-[var(--easypos-text)]">{sale.itemCount}</p>
          </div>
          <div className="rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-input-bg)] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--easypos-muted)]">
              Total
            </p>
            <p className="mt-2 text-sm font-bold text-[var(--easypos-text)]"><Money value={sale.total} /></p>
          </div>
        </div>

        <div className="easypos-receipt-items mt-6 flex flex-col gap-3">
          {sale.items.map((item) => (
            <div
              key={`${sale.id}-${item.id}`}
              className="flex items-center gap-4 rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-input-bg)] p-4"
            >
              <ProductImage
                productName={item.name}
                imageUrl={item.imageUrl}
                className="easypos-receipt-item-image aspect-square h-16 w-16 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[var(--easypos-text)]">{item.name}</p>
                <p className="mt-1 text-sm text-[var(--easypos-muted)]">
                  {item.quantity} x <Money value={item.price} />
                </p>
              </div>
              <p className="text-sm font-bold text-[var(--easypos-accent-soft)]">
                <Money value={item.lineTotal} />
              </p>
            </div>
          ))}
        </div>

        <pre className="easypos-receipt-preview mt-6 max-h-[38vh] overflow-auto rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-input-bg)] p-4 text-sm leading-6 whitespace-pre-wrap text-[var(--easypos-text)]">
          {getReceiptPreview(sale, merchant)}
        </pre>
      </GlassPanel>
    </section>
  );
}
