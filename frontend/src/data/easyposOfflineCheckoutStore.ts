export type OfflineCheckoutCartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type OfflineCheckoutSyncState = "queued" | "submitting" | "failed";

export type OfflineCheckoutRecord = {
  id: string;
  merchantId: number;
  createdAt: string;
  cart: OfflineCheckoutCartItem[];
  total: number;
  itemCount: number;
  syncState: OfflineCheckoutSyncState;
  lastError?: string;
};

const OFFLINE_CHECKOUTS_KEY = "easypos-offline-checkouts";

function hasWindow() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isOfflineCheckoutCartItem(value: unknown): value is OfflineCheckoutCartItem {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.price === "number" &&
    Number.isFinite(candidate.price) &&
    typeof candidate.quantity === "number" &&
    Number.isFinite(candidate.quantity)
  );
}

function isOfflineCheckoutSyncState(value: unknown): value is OfflineCheckoutSyncState {
  return value === "queued" || value === "submitting" || value === "failed";
}

function isOfflineCheckoutRecord(value: unknown): value is OfflineCheckoutRecord {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.merchantId === "number" &&
    Number.isFinite(candidate.merchantId) &&
    typeof candidate.createdAt === "string" &&
    Array.isArray(candidate.cart) &&
    candidate.cart.every(isOfflineCheckoutCartItem) &&
    typeof candidate.total === "number" &&
    Number.isFinite(candidate.total) &&
    typeof candidate.itemCount === "number" &&
    Number.isFinite(candidate.itemCount) &&
    isOfflineCheckoutSyncState(candidate.syncState) &&
    (candidate.lastError === undefined || typeof candidate.lastError === "string")
  );
}

export function loadOfflineCheckouts(): OfflineCheckoutRecord[] {
  if (!hasWindow()) return [];

  try {
    const raw = window.localStorage.getItem(OFFLINE_CHECKOUTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isOfflineCheckoutRecord) : [];
  } catch {
    window.localStorage.removeItem(OFFLINE_CHECKOUTS_KEY);
    return [];
  }
}

export function saveOfflineCheckouts(records: OfflineCheckoutRecord[]) {
  if (!hasWindow()) return;
  window.localStorage.setItem(OFFLINE_CHECKOUTS_KEY, JSON.stringify(records));
}

export function createOfflineCheckoutRecord(input: {
  merchantId: number;
  cart: OfflineCheckoutCartItem[];
}): OfflineCheckoutRecord {
  const total = input.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = input.cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    id: `offline-checkout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    merchantId: input.merchantId,
    createdAt: new Date().toISOString(),
    cart: input.cart.map((item) => ({ ...item })),
    total,
    itemCount,
    syncState: "queued",
  };
}
