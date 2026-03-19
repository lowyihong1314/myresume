import type { MerchantProfile } from "./easyposMerchantStore.ts";
import type { EasyPosSettings } from "./easyposSettingsStore.ts";
import type { InventoryEvent, Product, SaleRecord } from "./easyposStore.ts";

export type EasyPosRemoteState = {
  products: Product[];
  sales: SaleRecord[];
  inventoryEvents: InventoryEvent[];
  merchant: MerchantProfile | null;
  settings: EasyPosSettings | null;
  updatedAt: string | null;
};

export type EasyPosMerchantAccess = {
  id: number;
  role: string;
  merchant_owner_id: number;
  name: string;
  registrationNumber: string;
  phone: string;
  email: string;
  address: string;
  footerNote: string;
  createdAt: string;
  updatedAt: string;
};

export type EasyPosMerchantMember = {
  userId: number;
  username: string;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  createdAt: string;
};

async function fetchJson(path: string, options: RequestInit = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || "Request failed.");
  }

  return payload;
}

export async function loadEasyPosRemoteState(
  merchantId: number,
): Promise<EasyPosRemoteState | null> {
  const payload = await fetchJson(`/api/easypos/state?merchant_id=${merchantId}`, {
    method: "GET",
  });
  return payload.state || null;
}

export async function upsertEasyPosProduct(input: {
  merchantId: number;
  product: Product;
}) {
  return fetchJson(`/api/easypos/product/upsert?merchant_id=${input.merchantId}`, {
    method: "POST",
    body: JSON.stringify({ product: input.product }),
  });
}

export async function deleteEasyPosProduct(input: {
  merchantId: number;
  productId: string;
}) {
  return fetchJson(`/api/easypos/product/delete?merchant_id=${input.merchantId}`, {
    method: "POST",
    body: JSON.stringify({ productId: input.productId }),
  });
}

export async function uploadEasyPosProductImage(input: {
  merchantId: number;
  productId: string;
  file: File;
}) {
  const body = new FormData();
  body.set("productId", input.productId);
  body.set("image", input.file);

  const response = await fetch(`/api/easypos/product/image?merchant_id=${input.merchantId}`, {
    method: "POST",
    body,
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || "Failed to upload product image.");
  }

  return payload;
}

export async function stockInEasyPos(input: {
  merchantId: number;
  productId: string;
  quantity: number;
  unitCost: number;
}) {
  return fetchJson(`/api/easypos/stock-in?merchant_id=${input.merchantId}`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function damageEasyPos(input: {
  merchantId: number;
  productId: string;
  quantity: number;
}) {
  return fetchJson(`/api/easypos/damage?merchant_id=${input.merchantId}`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function checkoutEasyPos(input: {
  merchantId: number;
  cart: Array<{ id: string; name: string; price: number; quantity: number }>;
}) {
  return fetchJson(`/api/easypos/checkout?merchant_id=${input.merchantId}`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function loadEasyPosMerchants(): Promise<EasyPosMerchantAccess[]> {
  const payload = await fetchJson("/api/easypos/merchants", { method: "GET" });
  return payload.merchants || [];
}

export async function createEasyPosMerchant(input: {
  name: string;
  registrationNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  footerNote?: string;
}): Promise<EasyPosMerchantAccess> {
  const payload = await fetchJson("/api/easypos/merchants", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.merchant;
}

export async function updateEasyPosMerchant(input: {
  merchantId: number;
  merchant: MerchantProfile;
}) {
  return fetchJson(`/api/easypos/merchant/update?merchant_id=${input.merchantId}`, {
    method: "POST",
    body: JSON.stringify({ merchant: input.merchant }),
  });
}

export async function deleteEasyPosMerchant(merchantId: number) {
  return fetchJson(`/api/easypos/merchant/delete?merchant_id=${merchantId}`, {
    method: "POST",
  });
}

export async function loadEasyPosMerchantMembers(
  merchantId: number,
): Promise<EasyPosMerchantMember[]> {
  const payload = await fetchJson(`/api/easypos/merchant/members?merchant_id=${merchantId}`, {
    method: "GET",
  });
  return payload.members || [];
}

export async function addEasyPosMerchantMember(input: {
  merchantId: number;
  username: string;
}) {
  return fetchJson(`/api/easypos/merchant/members/add?merchant_id=${input.merchantId}`, {
    method: "POST",
    body: JSON.stringify({ username: input.username }),
  });
}

export async function removeEasyPosMerchantMember(input: {
  merchantId: number;
  userId: number;
}) {
  return fetchJson(`/api/easypos/merchant/members/remove?merchant_id=${input.merchantId}`, {
    method: "POST",
    body: JSON.stringify({ userId: input.userId }),
  });
}

export async function updateEasyPosSettings(input: {
  merchantId: number;
  settings: EasyPosSettings;
}) {
  return fetchJson(`/api/easypos/settings/update?merchant_id=${input.merchantId}`, {
    method: "POST",
    body: JSON.stringify({ settings: input.settings }),
  });
}

export async function loadEasyPosDashboard(merchantId?: number | null) {
  const suffix = merchantId ? `?merchant_id=${merchantId}` : "";
  return fetchJson(`/api/easypos/dashboard${suffix}`, { method: "GET" });
}
