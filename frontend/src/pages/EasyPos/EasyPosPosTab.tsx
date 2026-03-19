import type { Product } from "../../data/easyposStore.ts";
import { GlassPanel, Money, ProductImage } from "./shared";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
};

type EasyPosPosTabProps = {
  products: Product[];
  cart: CartItem[];
  cartTotal: number;
  onAddToCart: (product: Product) => void;
  onCartQuantity: (id: string, nextQuantity: number) => void;
  onCheckout: () => void;
};

export function EasyPosPosTab({
  products,
  cart,
  cartTotal,
  onAddToCart,
  onCartQuantity,
  onCheckout,
}: EasyPosPosTabProps) {
  return (
    <section className="easypos-pos-tab mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <GlassPanel className="easypos-pos-products-panel">
        <p className="easypos-section-label text-xs font-bold uppercase tracking-[0.18em] text-[var(--easypos-accent-soft)]">
          POS Counter
        </p>
        <div className="easypos-pos-product-grid mt-5 grid gap-4 md:grid-cols-2">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onAddToCart(product)}
              className={`easypos-pos-product-card easypos-pos-product-${product.id} rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-surface)] p-5 text-left transition hover:border-[var(--easypos-accent)]`}
            >
              <ProductImage
                productName={product.name}
                imageUrl={product.imageUrl}
                className="easypos-pos-product-image mb-4 aspect-[4/3] w-full"
              />
              <div className="easypos-pos-product-top flex items-start justify-between gap-4">
                <div className="easypos-pos-product-copy">
                  <p className="easypos-pos-product-name text-lg font-bold text-[var(--easypos-text)]">
                    {product.name}
                  </p>
                  <p className="easypos-pos-product-stock mt-2 text-sm text-[var(--easypos-muted)]">
                    Stock available: {product.stock}
                  </p>
                </div>
                <span className="easypos-pos-product-badge rounded-full bg-[var(--easypos-accent-badge)] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--easypos-accent-soft)]">
                  Add
                </span>
              </div>
              <p className="easypos-pos-product-price mt-5 text-xl font-bold text-[var(--easypos-accent-soft)]">
                <Money value={product.price} />
              </p>
            </button>
          ))}
        </div>
      </GlassPanel>

      <GlassPanel className="easypos-cart-panel">
        <div className="easypos-cart-header flex items-center justify-between gap-3">
          <div className="easypos-cart-copy">
            <p className="easypos-section-label text-xs font-bold uppercase tracking-[0.18em] text-[var(--easypos-accent-soft)]">
              Cart
            </p>
            <p className="easypos-cart-description mt-2 text-sm text-[var(--easypos-muted)]">
              Click products on the left, then collect payment here.
            </p>
          </div>
          <p className="easypos-cart-total text-2xl font-bold text-[var(--easypos-text)]">
            <Money value={cartTotal} />
          </p>
        </div>

        <div className="easypos-cart-list mt-5 flex flex-col gap-3">
          {cart.length === 0 ? (
            <div className="easypos-cart-empty rounded-2xl border border-dashed border-[var(--easypos-border)] px-4 py-6 text-center text-sm text-[var(--easypos-muted)]">
              No items in cart yet.
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className={`easypos-cart-item easypos-cart-item-${item.id} rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-surface)] p-4`}
              >
                <div className="easypos-cart-item-top flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ProductImage
                      productName={item.name}
                      imageUrl={item.imageUrl}
                      className="easypos-cart-item-image aspect-square h-14 w-14 shrink-0"
                    />
                    <div className="easypos-cart-item-copy">
                      <p className="easypos-cart-item-name font-semibold text-[var(--easypos-text)]">{item.name}</p>
                      <p className="easypos-cart-item-price text-sm text-[var(--easypos-muted)]">
                        <Money value={item.price} />
                      </p>
                    </div>
                  </div>
                  <div className="easypos-cart-item-controls flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onCartQuantity(item.id, item.quantity - 1)}
                      className="easypos-cart-item-decrease h-9 w-9 rounded-full border border-[var(--easypos-border)] bg-[var(--easypos-button-muted)] text-lg font-bold text-[var(--easypos-text)]"
                    >
                      -
                    </button>
                    <span className="easypos-cart-item-quantity min-w-8 text-center text-sm font-bold text-[var(--easypos-text)]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onCartQuantity(item.id, item.quantity + 1)}
                      className="easypos-cart-item-increase h-9 w-9 rounded-full border border-[var(--easypos-border)] bg-[var(--easypos-button-muted)] text-lg font-bold text-[var(--easypos-text)]"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="easypos-cart-item-footer mt-3 flex items-center justify-between text-sm">
                  <span className="easypos-cart-item-label text-[var(--easypos-muted)]">
                    Line total
                  </span>
                  <span className="easypos-cart-item-total font-bold text-[var(--easypos-accent-soft)]">
                    <Money value={item.quantity * item.price} />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={onCheckout}
          className="easypos-checkout-button mt-6 w-full rounded-xl bg-[var(--easypos-button-primary)] px-5 py-4 font-bold text-[var(--easypos-button-primary-text)]"
        >
          Checkout
        </button>
      </GlassPanel>
    </section>
  );
}
