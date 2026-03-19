import type { EasyPosMerchantAccess } from "../../data/easyposApi.ts";

type TabId =
  | "summary"
  | "manage"
  | "sales"
  | "pos"
  | "offline_checkout_state"
  | "settings"
  | "receipt";

type EasyPosHeaderProps = {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  onOpenSettings: () => void;
  merchants: EasyPosMerchantAccess[];
  selectedMerchantId: number | null;
  onSelectMerchantOption: (value: string) => void;
  realtimeStatus: "live" | "reconnecting" | "offline";
  offlineCheckoutCount: number;
  tokenBalance: number;
  defaultMaxToken: number;
};

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "summary", label: "Summary" },
  { id: "manage", label: "Manage Product" },
  { id: "sales", label: "Sales" },
  { id: "pos", label: "POS" },
];

export function EasyPosHeader({
  activeTab,
  onSelectTab,
  onOpenSettings,
  merchants,
  selectedMerchantId,
  onSelectMerchantOption,
  realtimeStatus,
  offlineCheckoutCount,
  tokenBalance,
  defaultMaxToken,
}: EasyPosHeaderProps) {
  const tokenProgressPercent =
    defaultMaxToken > 0
      ? Math.max(0, Math.min(100, (Number(tokenBalance || 0) / Number(defaultMaxToken || 1)) * 100))
      : 0;

  return (
    <section className="easypos-header rounded-[24px] border border-[var(--easypos-border)] bg-[var(--easypos-panel)]">
      <div className="easypos-header-inner flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="easypos-header-brand flex flex-col gap-3 lg:flex-row lg:items-center">
          <p className="easypos-header-kicker text-sm font-bold uppercase tracking-[0.24em] text-[var(--easypos-accent-soft)]">
            EASYPOS
          </p>
          <label className="easypos-header-merchant-picker flex items-center gap-3 rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-button-muted)] px-3 py-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--easypos-muted)]">
              Merchant
            </span>
            <select
              value={selectedMerchantId ? String(selectedMerchantId) : ""}
              onChange={(event) => onSelectMerchantOption(event.target.value)}
              className="min-w-[180px] bg-transparent text-sm font-bold text-[var(--easypos-text)] outline-none"
            >
              {merchants.map((merchant) => (
                <option key={merchant.id} value={merchant.id} className="text-slate-900">
                  {merchant.name}
                </option>
              ))}
              <option value="__add__" className="text-slate-900">
                Add Merchant
              </option>
            </select>
          </label>
          <div className="easypos-header-live-indicator flex items-center gap-2 rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-button-muted)] px-3 py-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                realtimeStatus === "live"
                  ? "bg-emerald-400"
                  : realtimeStatus === "reconnecting"
                    ? "bg-amber-400"
                    : "bg-slate-400"
              }`}
            />
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--easypos-muted)]">
              {realtimeStatus === "live"
                ? "Live"
                : realtimeStatus === "reconnecting"
                  ? "Reconnecting"
                  : "Offline"}
            </span>
          </div>
          <div className="easypos-header-token-progress min-w-[220px] rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-button-muted)] px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--easypos-muted)]">
                Tokens
              </span>
              <span className="text-sm font-bold text-[var(--easypos-text)]">
                {tokenBalance} / {defaultMaxToken}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--easypos-border)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--easypos-accent),var(--easypos-accent-soft))]"
                style={{ width: `${tokenProgressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="easypos-header-actions flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`easypos-tab easypos-tab-${tab.id} rounded-xl px-4 py-3 text-sm font-bold transition ${
                activeTab === tab.id
                  ? "bg-[var(--easypos-button-primary)] text-[var(--easypos-button-primary-text)]"
                  : "border border-[var(--easypos-border)] bg-[var(--easypos-button-muted)] text-[var(--easypos-text)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
          {offlineCheckoutCount > 0 ? (
            <button
              type="button"
              onClick={() => onSelectTab("offline_checkout_state")}
              className={`easypos-tab easypos-tab-offline-checkout-state rounded-xl px-4 py-3 text-sm font-bold transition ${
                activeTab === "offline_checkout_state"
                  ? "bg-[var(--easypos-button-primary)] text-[var(--easypos-button-primary-text)]"
                  : "border border-[var(--easypos-border)] bg-[var(--easypos-button-muted)] text-[var(--easypos-text)]"
              }`}
            >
              Offline Checkout State ({offlineCheckoutCount})
            </button>
          ) : null}
          <button
            type="button"
            onClick={onOpenSettings}
            className="easypos-settings-button rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-button-muted)] px-4 py-3 text-sm font-bold text-[var(--easypos-text)]"
          >
            Settings
          </button>
        </div>
      </div>
    </section>
  );
}
