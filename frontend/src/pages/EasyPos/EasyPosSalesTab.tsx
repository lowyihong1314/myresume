import type { SaleRecord } from "../../data/easyposStore.ts";
import { GlassPanel, Money, ProductImage } from "./shared";

type EasyPosSalesTabProps = {
  sales: SaleRecord[];
  onOpenReceipt: (sale: SaleRecord) => void;
};

export function EasyPosSalesTab({ sales, onOpenReceipt }: EasyPosSalesTabProps) {
  return (
    <section className="easypos-sales-tab mt-6">
      <GlassPanel className="easypos-sales-history">
        <p className="easypos-section-label text-xs font-bold uppercase tracking-[0.18em] text-[var(--easypos-accent-soft)]">
          Sales History
        </p>
        <div className="easypos-sales-history-list mt-4 flex flex-col gap-3">
          {sales.length === 0 ? (
            <div className="easypos-sales-history-empty rounded-2xl border border-dashed border-[var(--easypos-border)] px-4 py-6 text-center text-sm text-[var(--easypos-muted)]">
              No completed sales saved yet.
            </div>
          ) : (
            sales.map((sale) => (
              <div
                key={sale.id}
                className="easypos-sales-history-item flex flex-col gap-3 rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-surface)] px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-4">
                  <ProductImage
                    productName={sale.items[0]?.name || sale.id}
                    imageUrl={sale.items[0]?.imageUrl}
                    className="easypos-sales-history-image aspect-square h-16 w-16 shrink-0"
                  />
                  <div className="easypos-sales-history-copy">
                    <p className="easypos-sales-history-id text-sm font-bold text-[var(--easypos-text)]">{sale.id}</p>
                    <p className="easypos-sales-history-date text-sm text-[var(--easypos-muted)]">
                      {new Date(sale.createdAt).toLocaleString()}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sale.items.slice(0, 3).map((item) => (
                        <span
                          key={`${sale.id}-${item.id}`}
                          className="rounded-full bg-[var(--easypos-accent-badge)] px-3 py-1 text-xs font-bold text-[var(--easypos-accent-soft)]"
                        >
                          {item.name} x{item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="easypos-sales-history-meta flex gap-6 text-sm">
                  <span className="easypos-sales-history-count text-[var(--easypos-muted)]">
                    {sale.itemCount} sale item(s)
                  </span>
                  <span className="easypos-sales-history-total font-bold text-[var(--easypos-accent-soft)]">
                    <Money value={sale.total} />
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenReceipt(sale)}
                  className="easypos-sales-history-download rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-button-muted)] px-4 py-2 text-sm font-bold text-[var(--easypos-text)]"
                >
                  Open Receipt
                </button>
              </div>
            ))
          )}
        </div>
      </GlassPanel>
    </section>
  );
}
