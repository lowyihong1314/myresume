import type { Product } from "../../data/easyposStore.ts";
import { GlassPanel, Money, ProductImage } from "./shared";

type Summary = {
  totalProducts: number;
  totalStock: number;
  inventoryValue: number;
  cartItems: number;
  cartTotal: number;
  totalSalesCount: number;
  totalRevenue: number;
};

type DailySalesPoint = {
  dateLabel: string;
  revenue: number;
  salesCount: number;
};

type EasyPosSummaryTabProps = {
  products: Product[];
  summary: Summary;
  dailySalesChart: DailySalesPoint[];
};

export function EasyPosSummaryTab({
  products,
  summary,
  dailySalesChart,
}: EasyPosSummaryTabProps) {
  const maxRevenue = Math.max(...dailySalesChart.map((item) => item.revenue), 1);

  return (
    <section className="easypos-summary-tab mt-6 grid gap-6 lg:grid-cols-4">
      {[
        { key: "products", label: "Products", value: summary.totalProducts },
        { key: "stock", label: "Total Stock", value: summary.totalStock },
        {
          key: "inventory-value",
          label: "Inventory Value",
          value: `RM ${summary.inventoryValue.toFixed(2)}`,
        },
        {
          key: "revenue",
          label: "Revenue",
          value: `RM ${summary.totalRevenue.toFixed(2)}`,
        },
      ].map((item) => (
        <GlassPanel key={item.key} className={`easypos-summary-card easypos-summary-card-${item.key}`}>
          <p className="easypos-summary-card-label text-xs font-bold uppercase tracking-[0.18em] text-[var(--easypos-accent-soft)]">
            {item.label}
          </p>
          <p className="easypos-summary-card-value mt-4 text-3xl font-bold text-[var(--easypos-text)]">
            {item.value}
          </p>
        </GlassPanel>
      ))}

      <GlassPanel className="easypos-summary-sales-count lg:col-span-2">
        <p className="easypos-summary-section-label text-xs font-bold uppercase tracking-[0.18em] text-[var(--easypos-accent-soft)]">
          Sales
        </p>
        <p className="easypos-summary-sales-count-value mt-4 text-4xl font-bold text-[var(--easypos-text)]">
          {summary.totalSalesCount}
        </p>
        <p className="easypos-summary-sales-count-note mt-2 text-sm text-[var(--easypos-muted)]">
          Revenue and sales count are separated. Inventory value is based on stock cost.
        </p>
      </GlassPanel>

      <GlassPanel className="easypos-summary-checkout lg:col-span-2">
        <p className="easypos-summary-section-label text-xs font-bold uppercase tracking-[0.18em] text-[var(--easypos-accent-soft)]">
          Checkout Snapshot
        </p>
        <p className="easypos-summary-checkout-value mt-4 text-lg font-bold text-[var(--easypos-text)]">
          {summary.cartItems} item(s) waiting in cart
        </p>
        <p className="easypos-summary-checkout-note mt-2 text-sm text-[var(--easypos-muted)]">
          Cart total: <Money value={summary.cartTotal} />
        </p>
      </GlassPanel>

      <GlassPanel className="easypos-summary-chart lg:col-span-4">
        <p className="easypos-summary-section-label text-xs font-bold uppercase tracking-[0.18em] text-[var(--easypos-accent-soft)]">
          Daily Sales
        </p>
        <div className="easypos-summary-chart-grid mt-6 grid grid-cols-7 gap-3 items-end">
          {dailySalesChart.map((item) => (
            <div key={item.dateLabel} className="easypos-summary-chart-bar-wrap flex flex-col items-center gap-2">
              <div
                className="easypos-summary-chart-bar w-full rounded-t-xl bg-[linear-gradient(180deg,var(--easypos-accent),var(--easypos-accent-muted))]"
                style={{ height: `${Math.max((item.revenue / maxRevenue) * 180, 8)}px` }}
                title={`${item.dateLabel}: RM ${item.revenue.toFixed(2)} / ${item.salesCount} sale(s)`}
              />
              <div className="text-center">
                <p className="text-xs font-bold text-[var(--easypos-text)]">{item.dateLabel}</p>
                <p className="text-[11px] text-[var(--easypos-muted)]">
                  RM {item.revenue.toFixed(0)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      <GlassPanel className="easypos-summary-products lg:col-span-4">
        <p className="easypos-summary-section-label text-xs font-bold uppercase tracking-[0.18em] text-[var(--easypos-accent-soft)]">
          Product Overview
        </p>
        <div className="easypos-summary-product-list mt-4 grid gap-3 md:grid-cols-2">
          {products.slice(0, 6).map((product) => (
            <div
              key={product.id}
              className="easypos-summary-product-item flex items-center gap-4 rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-surface)] px-4 py-3"
            >
              <ProductImage
                productName={product.name}
                imageUrl={product.imageUrl}
                className="easypos-summary-product-image aspect-square h-20 w-20 shrink-0"
              />
              <div className="easypos-summary-product-copy">
                <p className="easypos-summary-product-name font-semibold text-[var(--easypos-text)]">{product.name}</p>
                <p className="easypos-summary-product-stock text-sm text-[var(--easypos-muted)]">
                  Stock {product.stock} · Cost RM {product.unitCost.toFixed(2)}
                </p>
                <p className="text-xs text-[var(--easypos-muted)]">
                  Creator {product.creatorId ? `#${product.creatorId}` : "Unknown"}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="easypos-summary-product-price text-sm font-bold text-[var(--easypos-accent-soft)]">
                  Sell <Money value={product.price} />
                </p>
                <p className="text-xs text-[var(--easypos-muted)]">
                  Value RM {(product.stock * product.unitCost).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </section>
  );
}
