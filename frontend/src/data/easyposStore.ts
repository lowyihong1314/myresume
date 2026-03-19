export type Product = {
  id: string;
  creatorId?: number;
  name: string;
  price: number;
  stock: number;
  unitCost: number;
  imageId?: string;
  imageUrl?: string;
};

export type SaleItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
  imageUrl?: string;
};

export type SaleRecord = {
  id: string;
  createdAt: string;
  total: number;
  itemCount: number;
  items: SaleItem[];
  publicToken?: string;
};

export type InventoryEventType = "sales" | "damage" | "stock_in";

export type InventoryEvent = {
  id: string;
  type: InventoryEventType;
  createdAt: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice?: number;
  unitCost?: number;
  totalValue?: number;
  totalCost?: number;
  referenceId?: string;
};

const PRODUCTS_KEY = "easypos-products";
const SALES_KEY = "easypos-sales";
const INVENTORY_EVENTS_KEY = "easypos-inventory-events";

export const defaultProducts: Product[] = [
  { id: "americano", name: "Americano", price: 8.5, stock: 20, unitCost: 3.4 },
  { id: "latte", name: "Cafe Latte", price: 10.9, stock: 18, unitCost: 4.6 },
  { id: "croissant", name: "Butter Croissant", price: 6.2, stock: 15, unitCost: 2.3 },
  { id: "brownie", name: "Chocolate Brownie", price: 7.8, stock: 12, unitCost: 2.8 },
];

function hasWindow() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeRead<T>(key: string, fallback: T, validate: (value: unknown) => value is T): T {
  if (!hasWindow()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    return validate(parsed) ? parsed : fallback;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  if (!hasWindow()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    (candidate.creatorId === undefined ||
      (typeof candidate.creatorId === "number" && Number.isFinite(candidate.creatorId))) &&
    typeof candidate.name === "string" &&
    typeof candidate.price === "number" &&
    Number.isFinite(candidate.price) &&
    typeof candidate.stock === "number" &&
    Number.isFinite(candidate.stock) &&
    typeof candidate.unitCost === "number" &&
    Number.isFinite(candidate.unitCost) &&
    (candidate.imageId === undefined || typeof candidate.imageId === "string") &&
    (candidate.imageUrl === undefined || typeof candidate.imageUrl === "string")
  );
}

function isSaleItem(value: unknown): value is SaleItem {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.price === "number" &&
    Number.isFinite(candidate.price) &&
    typeof candidate.quantity === "number" &&
    Number.isFinite(candidate.quantity) &&
    typeof candidate.lineTotal === "number" &&
    Number.isFinite(candidate.lineTotal) &&
    (candidate.imageUrl === undefined || typeof candidate.imageUrl === "string")
  );
}

function isSaleRecord(value: unknown): value is SaleRecord {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.total === "number" &&
    Number.isFinite(candidate.total) &&
    typeof candidate.itemCount === "number" &&
    Number.isFinite(candidate.itemCount) &&
    (candidate.publicToken === undefined || typeof candidate.publicToken === "string") &&
    Array.isArray(candidate.items) &&
    candidate.items.every(isSaleItem)
  );
}

function isProductList(value: unknown): value is Product[] {
  return Array.isArray(value) && value.every(isProduct);
}

function isSalesList(value: unknown): value is SaleRecord[] {
  return Array.isArray(value) && value.every(isSaleRecord);
}

function isInventoryEventType(value: unknown): value is InventoryEventType {
  return value === "sales" || value === "damage" || value === "stock_in";
}

function isInventoryEvent(value: unknown): value is InventoryEvent {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    isInventoryEventType(candidate.type) &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.productId === "string" &&
    typeof candidate.productName === "string" &&
    typeof candidate.quantity === "number" &&
    Number.isFinite(candidate.quantity) &&
    (candidate.unitCost === undefined ||
      (typeof candidate.unitCost === "number" && Number.isFinite(candidate.unitCost))) &&
    (candidate.unitPrice === undefined ||
      (typeof candidate.unitPrice === "number" && Number.isFinite(candidate.unitPrice))) &&
    (candidate.totalCost === undefined ||
      (typeof candidate.totalCost === "number" && Number.isFinite(candidate.totalCost))) &&
    (candidate.totalValue === undefined ||
      (typeof candidate.totalValue === "number" && Number.isFinite(candidate.totalValue))) &&
    (candidate.referenceId === undefined || typeof candidate.referenceId === "string")
  );
}

function isInventoryEventList(value: unknown): value is InventoryEvent[] {
  return Array.isArray(value) && value.every(isInventoryEvent);
}

export function loadProducts(): Product[] {
  const products = safeRead(PRODUCTS_KEY, defaultProducts, isProductList);
  return (products.length > 0 ? products : defaultProducts).map((product) => ({
    ...product,
    creatorId: typeof product.creatorId === "number" ? product.creatorId : undefined,
    unitCost: Number(product.unitCost || 0),
    imageId: typeof product.imageId === "string" ? product.imageId : undefined,
    imageUrl: typeof product.imageUrl === "string" ? product.imageUrl : undefined,
  }));
}

export function saveProducts(products: Product[]) {
  safeWrite(PRODUCTS_KEY, products);
}

export function loadSales(): SaleRecord[] {
  return safeRead(SALES_KEY, [], isSalesList);
}

export function saveSales(sales: SaleRecord[]) {
  safeWrite(SALES_KEY, sales);
}

export function loadInventoryEvents(): InventoryEvent[] {
  return safeRead(INVENTORY_EVENTS_KEY, [], isInventoryEventList);
}

export function saveInventoryEvents(events: InventoryEvent[]) {
  safeWrite(INVENTORY_EVENTS_KEY, events);
}

export function createSaleRecord(
  cartItems: Array<Pick<SaleItem, "id" | "name" | "price" | "quantity">>,
): SaleRecord {
  const items = cartItems.map((item) => ({
    ...item,
    lineTotal: item.price * item.quantity,
  }));
  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    id: `sale-${Date.now()}`,
    createdAt: new Date().toISOString(),
    total,
    itemCount,
    items,
  };
}

export function createInventoryEventsFromSale(saleRecord: SaleRecord): InventoryEvent[] {
  return saleRecord.items.map((item) => ({
    id: `inventory-sales-${saleRecord.id}-${item.id}`,
    type: "sales",
    createdAt: saleRecord.createdAt,
    productId: item.id,
    productName: item.name,
    quantity: item.quantity,
    unitPrice: item.price,
    totalValue: item.lineTotal,
    referenceId: saleRecord.id,
  }));
}

export function createInventoryEvent(input: {
  type: Exclude<InventoryEventType, "sales">;
  productId: string;
  productName: string;
  quantity: number;
  unitCost?: number;
}): InventoryEvent {
  return {
    id: `inventory-${input.type}-${input.productId}-${Date.now()}`,
    type: input.type,
    createdAt: new Date().toISOString(),
    productId: input.productId,
    productName: input.productName,
    quantity: input.quantity,
    unitCost: input.unitCost,
    totalCost: input.unitCost !== undefined ? input.unitCost * input.quantity : undefined,
  };
}
