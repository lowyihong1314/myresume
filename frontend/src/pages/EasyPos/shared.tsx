import type { ChangeEventHandler, ReactNode } from "react";

type MoneyProps = {
  value: number;
};

type PosFieldProps = {
  label: string;
  value: string | number;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  type?: string;
  min?: string | number;
  inputClassName?: string;
};

type PanelProps = {
  className?: string;
  children: ReactNode;
};

export function Money({ value }: MoneyProps) {
  return <>{`RM ${value.toFixed(2)}`}</>;
}

export function PosField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  inputClassName = "",
}: PosFieldProps) {
  return (
    <label className="easypos-field flex flex-col gap-2">
      <span className="easypos-field-label text-xs font-bold uppercase tracking-[0.16em] text-[var(--easypos-muted)]">
        {label}
      </span>
      <input
        type={type}
        min={min}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`easypos-field-input rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-input-bg)] px-4 py-3 text-sm text-[var(--easypos-text)] outline-none transition focus:border-[var(--easypos-accent)] ${inputClassName}`.trim()}
      />
    </label>
  );
}

export function GlassPanel({ className = "", children }: PanelProps) {
  return (
    <div
      className={`easypos-panel rounded-[28px] border border-[var(--easypos-border)] bg-[var(--easypos-panel)] p-6 ${className}`.trim()}
    >
      {children}
    </div>
  );
}

export function ProductImage({
  productName,
  imageUrl,
  className = "",
}: {
  productName: string;
  imageUrl?: string;
  className?: string;
}) {
  return (
    <div
      className={`easypos-product-image-container overflow-hidden rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-button-muted)] ${className}`.trim()}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={productName}
          className="easypos-product-image h-full w-full object-cover"
        />
      ) : (
        <div className="easypos-product-image-placeholder flex h-full w-full items-center justify-center text-center text-xs font-bold uppercase tracking-[0.16em] text-[var(--easypos-muted)]">
          No Image
        </div>
      )}
    </div>
  );
}
