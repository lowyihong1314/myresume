import { useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Product } from "../../data/easyposStore.ts";
import { GlassPanel, PosField, ProductImage } from "./shared";

type ProductFormState = {
  name: string;
  price: string;
  imageFile: File | null;
  imagePreviewUrl: string;
};

type EasyPosManageTabProps = {
  products: Product[];
  productForm: ProductFormState;
  setProductForm: Dispatch<SetStateAction<ProductFormState>>;
  onAddProduct: (event: FormEvent<HTMLFormElement>) => void;
  onProductChange: (id: string, field: "name" | "price", value: string) => void;
  stockAdjustments: Record<string, { quantity: string; unitCost: string }>;
  setStockAdjustments: Dispatch<
    SetStateAction<Record<string, { quantity: string; unitCost: string }>>
  >;
  onStockIn: (id: string) => void;
  onDamage: (id: string) => void;
  onRemoveProduct: (id: string) => void;
  onUploadProductImage: (productId: string, file: File) => void;
};

export function EasyPosManageTab({
  products,
  productForm,
  setProductForm,
  onAddProduct,
  onProductChange,
  stockAdjustments,
  setStockAdjustments,
  onStockIn,
  onDamage,
  onRemoveProduct,
  onUploadProductImage,
}: EasyPosManageTabProps) {
  const [manageView, setManageView] = useState<"add" | "product" | "stock">("add");

  return (
    <section className="easypos-manage-tab mt-6">
      <GlassPanel className="easypos-manage-shell">
        <div className="easypos-manage-navbar flex flex-wrap gap-3">
          {[
            { id: "add", label: "Add Product" },
            { id: "product", label: "Manage Product" },
            { id: "stock", label: "Manage Stock" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setManageView(item.id as "add" | "product" | "stock")}
              className={`easypos-manage-nav easypos-manage-nav-${item.id} rounded-xl px-4 py-3 text-sm font-bold ${
                manageView === item.id
                  ? "bg-[var(--color-primary)] text-[var(--color-bg-dark)]"
                  : "border border-[var(--easypos-border)] bg-[var(--easypos-button-muted)] text-[var(--easypos-text)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {manageView === "add" ? (
          <form onSubmit={onAddProduct} className="easypos-add-product-form mt-6">
            <div className="easypos-add-product-panel">
              <p className="easypos-section-label text-xs font-bold uppercase tracking-[0.18em] text-[var(--easypos-accent-soft)]">
                Add Product
              </p>
              <div className="easypos-add-product-fields mt-5 grid gap-4 md:grid-cols-2">
                <div className="easypos-add-product-image-panel md:row-span-3">
                  <ProductImage
                    productName={productForm.name || "New Product"}
                    imageUrl={productForm.imagePreviewUrl || undefined}
                    className="easypos-add-product-image aspect-square w-full"
                  />
                  <label className="easypos-add-product-upload mt-3 block">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        const previewUrl = file ? URL.createObjectURL(file) : "";
                        setProductForm((current) => ({
                          ...current,
                          imageFile: file,
                          imagePreviewUrl: previewUrl,
                        }));
                        event.currentTarget.value = "";
                      }}
                    />
                    <span className="block rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-button-muted)] px-4 py-3 text-center text-sm font-bold text-[var(--easypos-text)]">
                      Upload Product Image
                    </span>
                  </label>
                </div>
                <PosField
                  label="Product Name"
                  value={productForm.name}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Example: Iced Mocha"
                  inputClassName="easypos-add-product-name"
                />
                <PosField
                  label="Price"
                  type="number"
                  min="0"
                  value={productForm.price}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, price: event.target.value }))
                  }
                  placeholder="12.90"
                  inputClassName="easypos-add-product-price"
                />
                <button
                  type="submit"
                  className="easypos-add-product-submit rounded-xl bg-[var(--color-primary)] px-5 py-3 font-bold text-[var(--color-bg-dark)] md:col-span-1 md:w-fit"
                >
                  Add to Product List
                </button>
              </div>
            </div>
          </form>
        ) : null}

        {manageView === "product" ? (
          <div className="easypos-manage-right-column mt-6 flex flex-col gap-6">
            <div className="easypos-manage-products-panel">
              <p className="easypos-section-label text-xs font-bold uppercase tracking-[0.18em] text-[var(--easypos-accent-soft)]">
                Manage Product
              </p>
              <div className="easypos-manage-product-list mt-5 flex flex-col gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`easypos-manage-product-card easypos-manage-product-${product.id} rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-surface)] p-4`}
                  >
                    <div className="easypos-manage-product-grid grid gap-4 md:grid-cols-[160px_1.1fr_0.7fr_auto] md:items-end">
                      <div className="easypos-manage-product-image-panel">
                        <ProductImage
                          productName={product.name}
                          imageUrl={product.imageUrl}
                          className="easypos-manage-product-image aspect-square w-full"
                        />
                        <label className="easypos-manage-product-upload mt-3 block">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) {
                                onUploadProductImage(product.id, file);
                              }
                              event.currentTarget.value = "";
                            }}
                          />
                          <span className="block rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-button-muted)] px-4 py-3 text-center text-sm font-bold text-[var(--easypos-text)]">
                            Upload Product Image
                          </span>
                        </label>
                      </div>
                      <PosField
                        label="Name"
                        value={product.name}
                        onChange={(event) => onProductChange(product.id, "name", event.target.value)}
                        placeholder="Product name"
                        inputClassName="easypos-manage-product-name"
                      />
                      <div className="grid gap-3">
                        <PosField
                          label="Price"
                          type="number"
                          min="0"
                          value={product.price}
                          onChange={(event) => onProductChange(product.id, "price", event.target.value)}
                          placeholder="0.00"
                          inputClassName="easypos-manage-product-price"
                        />
                        <div className="rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-button-muted)] px-4 py-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--easypos-muted)]">
                            Creator
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[var(--easypos-text)]">
                            {product.creatorId ? `User #${product.creatorId}` : "Unknown"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveProduct(product.id)}
                        className="easypos-manage-product-remove rounded-xl bg-[rgba(239,68,68,0.16)] px-4 py-3 text-sm font-bold text-[var(--color-error)]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {manageView === "stock" ? (
          <div className="easypos-manage-right-column mt-6 flex flex-col gap-6">
            <div className="easypos-manage-stock-panel">
              <p className="easypos-section-label text-xs font-bold uppercase tracking-[0.18em] text-[var(--easypos-accent-soft)]">
                Manage Stock
              </p>
              <div className="easypos-manage-stock-list mt-5 flex flex-col gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`easypos-manage-stock-card easypos-manage-stock-${product.id} rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-surface)] p-4`}
                  >
                    <div className="easypos-manage-stock-header flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <ProductImage
                          productName={product.name}
                          imageUrl={product.imageUrl}
                          className="easypos-manage-stock-image aspect-square h-16 w-16 shrink-0"
                        />
                        <div className="easypos-manage-stock-copy">
                        <p className="easypos-manage-stock-name font-semibold text-[var(--easypos-text)]">{product.name}</p>
                        <p className="easypos-manage-stock-current text-sm text-[var(--easypos-muted)]">
                          Current stock: {product.stock}
                        </p>
                        </div>
                      </div>
                    </div>
                    <div className="easypos-manage-stock-grid mt-4 grid gap-4 md:grid-cols-[0.8fr_0.8fr_auto_auto] md:items-end">
                      <PosField
                        label="Quantity"
                        type="number"
                        min="1"
                        value={stockAdjustments[product.id]?.quantity || ""}
                        onChange={(event) =>
                          setStockAdjustments((current) => ({
                            ...current,
                            [product.id]: {
                              quantity: event.target.value,
                              unitCost: current[product.id]?.unitCost || "",
                            },
                          }))
                        }
                        placeholder="Quantity"
                        inputClassName="easypos-manage-stock-quantity"
                      />
                      <PosField
                        label="Unit Cost"
                        type="number"
                        min="0"
                        value={stockAdjustments[product.id]?.unitCost || ""}
                        onChange={(event) =>
                          setStockAdjustments((current) => ({
                            ...current,
                            [product.id]: {
                              quantity: current[product.id]?.quantity || "",
                              unitCost: event.target.value,
                            },
                          }))
                        }
                        placeholder="Cost"
                        inputClassName="easypos-manage-stock-cost"
                      />
                      <button
                        type="button"
                        onClick={() => onStockIn(product.id)}
                        className="easypos-manage-stock-in rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-[var(--color-bg-dark)]"
                      >
                        Stock In
                      </button>
                      <button
                        type="button"
                        onClick={() => onDamage(product.id)}
                        className="easypos-manage-stock-damage rounded-xl bg-[rgba(239,68,68,0.16)] px-4 py-3 text-sm font-bold text-[var(--color-error)]"
                      >
                        Damage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </GlassPanel>
    </section>
  );
}
