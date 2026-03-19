import type { EasyPosMerchantAccess } from "../../data/easyposApi.ts";
import type { OfflineCheckoutRecord } from "../../data/easyposOfflineCheckoutStore.ts";
import { GlassPanel, Money } from "./shared";

type EasyPosOfflineCheckoutTabProps = {
  offlineCheckouts: OfflineCheckoutRecord[];
  merchants: EasyPosMerchantAccess[];
};

export function EasyPosOfflineCheckoutTab({
  offlineCheckouts,
  merchants,
}: EasyPosOfflineCheckoutTabProps) {
  const merchantNameLookup = new Map(merchants.map((merchant) => [merchant.id, merchant.name]));

  return (
    <section className="easypos-offline-checkout-state mt-6">
      <GlassPanel className="easypos-offline-checkout-panel">
        <p className="easypos-section-label text-xs font-bold uppercase tracking-[0.18em] text-[var(--easypos-accent-soft)]">
          Offline Checkout State
        </p>
        <p className="mt-2 text-sm text-[var(--easypos-muted)]">
          Offline checkouts stay in localhost first, then auto-submit once realtime returns to
          live.
        </p>

        <div className="easypos-offline-checkout-list mt-5 flex flex-col gap-3">
          {offlineCheckouts.length === 0 ? (
            <div className="easypos-offline-checkout-empty rounded-2xl border border-dashed border-[var(--easypos-border)] px-4 py-6 text-center text-sm text-[var(--easypos-muted)]">
              No offline checkout waiting to sync.
            </div>
          ) : (
            offlineCheckouts.map((checkout) => (
              <div
                key={checkout.id}
                className="easypos-offline-checkout-item rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-surface)] px-4 py-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="easypos-offline-checkout-copy">
                    <p className="text-sm font-bold text-[var(--easypos-text)]">{checkout.id}</p>
                    <p className="mt-1 text-sm text-[var(--easypos-muted)]">
                      {merchantNameLookup.get(checkout.merchantId) || `Merchant #${checkout.merchantId}`}
                    </p>
                    <p className="mt-1 text-sm text-[var(--easypos-muted)]">
                      {new Date(checkout.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="easypos-offline-checkout-meta flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-[var(--easypos-accent-badge)] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--easypos-accent-soft)]">
                      {checkout.syncState}
                    </span>
                    <span className="text-sm text-[var(--easypos-muted)]">
                      {checkout.itemCount} item(s)
                    </span>
                    <span className="text-sm font-bold text-[var(--easypos-accent-soft)]">
                      <Money value={checkout.total} />
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  {checkout.cart.map((item) => (
                    <div
                      key={`${checkout.id}-${item.id}`}
                      className="flex items-center justify-between rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-button-muted)] px-3 py-2 text-sm"
                    >
                      <span className="font-semibold text-[var(--easypos-text)]">
                        {item.name} x {item.quantity}
                      </span>
                      <span className="text-[var(--easypos-muted)]">
                        <Money value={item.price * item.quantity} />
                      </span>
                    </div>
                  ))}
                </div>

                {checkout.lastError ? (
                  <p className="mt-4 text-sm text-[var(--easypos-danger)]">{checkout.lastError}</p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </GlassPanel>
    </section>
  );
}
