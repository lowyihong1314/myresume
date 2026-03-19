import { json, parseJsonBody } from "../http";
import type {
  EasyPosInventoryEventRow,
  EasyPosMerchantRow,
  EasyPosRealtimeEvent,
  MerchantMemberRow,
  EasyPosProductRow,
  EasyPosSaleItemRow,
  EasyPosSaleRow,
  EasyPosSettingsRow,
  Env,
  UserMerchantRow,
} from "../types";
import { getCurrentUser } from "../users/session";

function getMerchantIdFromUrl(url: URL) {
  const rawMerchantId = url.searchParams.get("merchant_id");
  const merchantId = Number(rawMerchantId);
  if (!rawMerchantId || Number.isNaN(merchantId) || merchantId <= 0) {
    return null;
  }
  return merchantId;
}

async function broadcastEasyPosEvent(
  env: Env,
  merchantId: number,
  event: EasyPosRealtimeEvent,
) {
  try {
    const stub = env.EASYPOS_REALTIME.getByName(String(merchantId));
    await stub.fetch("https://easypos-realtime.internal/broadcast", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.error("EasyPOS realtime broadcast failed", error);
  }
}

async function getAccessibleMerchant(
  env: Env,
  userId: number,
  merchantId: number,
) {
  return env.my_db
    .prepare(
      `SELECT
        utm.user_id AS user_id,
        m.id AS merchant_id,
        utm.role AS role,
        m.name AS name,
        m.registration_number AS registration_number,
        m.phone AS phone,
        m.email AS email,
        m.address AS address,
        m.footer_note AS footer_note,
        m.merchant_owner_id AS merchant_owner_id,
        m.created_at AS created_at,
        m.updated_at AS updated_at
      FROM user_to_merchant utm
      INNER JOIN merchants m ON m.id = utm.merchant_id
      WHERE utm.user_id = ? AND utm.merchant_id = ?`,
    )
    .bind(userId, merchantId)
    .first<UserMerchantRow>();
}

async function requireMerchantAccess(request: Request, env: Env) {
  const user = await getCurrentUser(request, env.my_db);

  if (!user) {
    return {
      error: json(
        { ok: false, message: "Not authenticated." },
        { status: 401 },
      ),
      user: null,
      merchantId: null,
    };
  }

  const merchantId = getMerchantIdFromUrl(new URL(request.url));
  if (!merchantId) {
    return {
      error: json(
        { ok: false, message: "merchant_id is required." },
        { status: 400 },
      ),
      user,
      merchantId: null,
    };
  }

  const merchantAccess = await getAccessibleMerchant(env, user.id, merchantId);
  if (!merchantAccess) {
    return {
      error: json(
        { ok: false, message: "Merchant access denied." },
        { status: 403 },
      ),
      user,
      merchantId,
    };
  }

  return { error: null, user, merchantId };
}

async function requireMerchantOwner(request: Request, env: Env) {
  const user = await getCurrentUser(request, env.my_db);

  if (!user) {
    return {
      error: json(
        { ok: false, message: "Not authenticated." },
        { status: 401 },
      ),
      user: null,
      merchantId: null,
    };
  }

  const merchantId = getMerchantIdFromUrl(new URL(request.url));
  if (!merchantId) {
    return {
      error: json(
        { ok: false, message: "merchant_id is required." },
        { status: 400 },
      ),
      user,
      merchantId: null,
    };
  }

  const merchantAccess = await getAccessibleMerchant(env, user.id, merchantId);
  if (!merchantAccess) {
    return {
      error: json(
        { ok: false, message: "Merchant access denied." },
        { status: 403 },
      ),
      user,
      merchantId,
    };
  }

  if (merchantAccess.role !== "owner") {
    return {
      error: json(
        { ok: false, message: "Owner access required." },
        { status: 403 },
      ),
      user,
      merchantId,
    };
  }

  return { error: null, user, merchantId };
}

async function getMerchantProduct(env: Env, merchantId: number, productId: string) {
  return env.my_db
    .prepare(
      "SELECT user_id, merchant_id, creator_id, product_id, name, price, stock, unit_cost, image_id, image_url FROM easypos_products WHERE merchant_id = ? AND product_id = ?",
    )
    .bind(merchantId, productId)
    .first<EasyPosProductRow>();
}

function requireCloudflareImages(env: Env) {
  const missing: string[] = [];

  if (!env.CLOUDFLARE_ACCOUNT_ID) {
    missing.push("CLOUDFLARE_ACCOUNT_ID");
  }

  if (!env.CLOUDFLARE_IMAGES_API_TOKEN) {
    missing.push("CLOUDFLARE_IMAGES_API_TOKEN");
  }

  if (!env.CLOUDFLARE_IMAGES_DELIVERY_HASH) {
    missing.push("CLOUDFLARE_IMAGES_DELIVERY_HASH");
  }

  if (missing.length > 0) {
    return json(
      {
        ok: false,
        message: `Cloudflare Images is not configured on this worker. Missing env: ${missing.join(", ")}`,
      },
      { status: 500 },
    );
  }

  return null;
}

async function buildDashboardSummary(env: Env, merchantId: number) {
  const today = new Date().toISOString().slice(0, 10);
  const salesResult = await env.my_db
    .prepare(
      "SELECT user_id, sale_id, public_token, created_at, total, item_count FROM easypos_sales WHERE merchant_id = ? AND substr(created_at, 1, 10) = ? ORDER BY created_at DESC, row_id DESC LIMIT 5",
    )
    .bind(merchantId, today)
    .all<EasyPosSaleRow>();

  const totalsResult = await env.my_db
    .prepare(
      "SELECT COALESCE(SUM(total), 0) AS daily_total, COUNT(*) AS daily_count, COALESCE(SUM(item_count), 0) AS daily_items FROM easypos_sales WHERE merchant_id = ? AND substr(created_at, 1, 10) = ?",
    )
    .bind(merchantId, today)
    .first<{ daily_total: number; daily_count: number; daily_items: number }>();

  const inventoryEventsResult = await env.my_db
    .prepare(
      "SELECT COUNT(*) AS today_inventory_events FROM easypos_inventory_events WHERE merchant_id = ? AND substr(created_at, 1, 10) = ?",
    )
    .bind(merchantId, today)
    .first<{ today_inventory_events: number }>();

  return {
    dailyTotal: Number(totalsResult?.daily_total || 0),
    dailyCount: Number(totalsResult?.daily_count || 0),
    dailyItems: Number(totalsResult?.daily_items || 0),
    recentSales: (salesResult.results || []).map((sale) => ({
      id: sale.sale_id,
      publicToken: sale.public_token || undefined,
      createdAt: sale.created_at,
      total: Number(sale.total || 0),
      itemCount: Number(sale.item_count || 0),
    })),
    todayInventoryEvents: Number(inventoryEventsResult?.today_inventory_events || 0),
  };
}

async function loadNormalizedState(env: Env, merchantId: number) {
  const [productsResult, salesResult, saleItemsResult, inventoryEventsResult] =
    await env.my_db.batch([
      env.my_db
        .prepare(
          "SELECT user_id, merchant_id, creator_id, product_id, name, price, stock, unit_cost, image_id, image_url FROM easypos_products WHERE merchant_id = ? ORDER BY row_id ASC",
        )
        .bind(merchantId),
      env.my_db
        .prepare(
          "SELECT user_id, merchant_id, sale_id, public_token, created_at, total, item_count FROM easypos_sales WHERE merchant_id = ? ORDER BY created_at DESC, row_id DESC",
        )
        .bind(merchantId),
      env.my_db
        .prepare(
          "SELECT user_id, merchant_id, sale_id, product_id, name, price, quantity, line_total, image_url FROM easypos_sale_items WHERE merchant_id = ? ORDER BY row_id ASC",
        )
        .bind(merchantId),
      env.my_db
        .prepare(
          "SELECT user_id, merchant_id, event_id, type, created_at, product_id, product_name, quantity, unit_price, unit_cost, total_value, total_cost, reference_id FROM easypos_inventory_events WHERE merchant_id = ? ORDER BY created_at DESC, row_id DESC",
        )
        .bind(merchantId),
    ]);

  const merchant = await env.my_db
    .prepare(
      "SELECT id, merchant_owner_id, name, registration_number, phone, email, address, footer_note FROM merchants WHERE id = ?",
    )
    .bind(merchantId)
    .first<EasyPosMerchantRow>();

  const settings = await env.my_db
    .prepare("SELECT merchant_id, dark_mode FROM easypos_settings WHERE merchant_id = ?")
    .bind(merchantId)
    .first<EasyPosSettingsRow>();

  const products =
    (productsResult.results as EasyPosProductRow[] | undefined)?.map((row) => ({
      id: row.product_id,
      creatorId: row.creator_id || undefined,
      name: row.name,
      price: Number(row.price || 0),
      stock: Number(row.stock || 0),
      unitCost: Number(row.unit_cost || 0),
      imageId: row.image_id || undefined,
      imageUrl: row.image_url || undefined,
    })) || [];

  const saleItems = (saleItemsResult.results as EasyPosSaleItemRow[] | undefined) || [];
  const saleItemsBySaleId = new Map<string, EasyPosSaleItemRow[]>();
  for (const item of saleItems) {
    const current = saleItemsBySaleId.get(item.sale_id) || [];
    current.push(item);
    saleItemsBySaleId.set(item.sale_id, current);
  }

  const sales =
    (salesResult.results as EasyPosSaleRow[] | undefined)?.map((row) => ({
      id: row.sale_id,
      publicToken: row.public_token || undefined,
      createdAt: row.created_at,
      total: Number(row.total || 0),
      itemCount: Number(row.item_count || 0),
      items: (saleItemsBySaleId.get(row.sale_id) || []).map((item) => ({
        id: item.product_id,
        name: item.name,
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 0),
        lineTotal: Number(item.line_total || 0),
        imageUrl: item.image_url || undefined,
      })),
    })) || [];

  const inventoryEvents =
    (inventoryEventsResult.results as EasyPosInventoryEventRow[] | undefined)?.map((row) => ({
      id: row.event_id,
      type: row.type,
      createdAt: row.created_at,
      productId: row.product_id,
      productName: row.product_name,
      quantity: Number(row.quantity || 0),
      unitPrice:
        row.unit_price === null || row.unit_price === undefined
          ? undefined
          : Number(row.unit_price),
      unitCost:
        row.unit_cost === null || row.unit_cost === undefined
          ? undefined
          : Number(row.unit_cost),
      totalValue:
        row.total_value === null || row.total_value === undefined
          ? undefined
          : Number(row.total_value),
      totalCost:
        row.total_cost === null || row.total_cost === undefined
          ? undefined
          : Number(row.total_cost),
      referenceId: row.reference_id || undefined,
    })) || [];

  return {
    products,
    sales,
    inventoryEvents,
    merchant: merchant
      ? {
          name: merchant.name,
          registrationNumber: merchant.registration_number,
          phone: merchant.phone,
          email: merchant.email,
          address: merchant.address,
          footerNote: merchant.footer_note,
        }
      : null,
    settings: settings
      ? {
          darkMode: Boolean(settings.dark_mode),
        }
      : null,
    updatedAt: null,
  };
}

export async function handleEasyPosStateGet(request: Request, env: Env) {
  const access = await requireMerchantAccess(request, env);
  if (access.error || !access.merchantId) return access.error;

  const normalizedState = await loadNormalizedState(env, access.merchantId);

  return json({
    ok: true,
    state: normalizedState,
  });
}

export async function handleEasyPosRealtimeConnect(request: Request, env: Env) {
  const access = await requireMerchantAccess(request, env);
  if (access.error || !access.merchantId) return access.error;

  if (request.headers.get("Upgrade") !== "websocket") {
    return json(
      { ok: false, message: "WebSocket upgrade required." },
      { status: 426 },
    );
  }

  const stub = env.EASYPOS_REALTIME.getByName(String(access.merchantId));
  return stub.fetch(request);
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildPublicReceiptHtml(input: {
  saleId: string;
  publicToken: string;
  createdAt: string;
  total: number;
  itemCount: number;
  merchant: EasyPosMerchantRow;
  items: EasyPosSaleItemRow[];
  download: boolean;
}) {
  const itemRows = input.items
    .map(
      (item) => `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:12px;">
              ${
                item.image_url
                  ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" style="width:52px;height:52px;object-fit:cover;border-radius:12px;border:1px solid #e5e7eb;" />`
                  : `<div style="width:52px;height:52px;border-radius:12px;border:1px solid #e5e7eb;background:#f3f4f6;color:#6b7280;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">No Image</div>`
              }
              <span>${escapeHtml(item.name)}</span>
            </div>
          </td>
          <td>${Number(item.quantity || 0)}</td>
          <td>RM ${Number(item.price || 0).toFixed(2)}</td>
          <td>RM ${Number(item.line_total || 0).toFixed(2)}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.saleId)} Receipt</title>
    <style>
      :root {
        color-scheme: light;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        font-family: "Segoe UI", sans-serif;
        background: #f4efe7;
        color: #1f2937;
      }
      .page {
        min-height: 100vh;
        padding: 32px 16px;
        display: flex;
        justify-content: center;
      }
      .receipt {
        width: 100%;
        max-width: 720px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 24px;
        box-shadow: 0 24px 64px rgba(15, 23, 42, 0.12);
        overflow: hidden;
      }
      .header {
        padding: 28px;
        background: linear-gradient(135deg, #fff5eb 0%, #ffffff 100%);
        border-bottom: 1px solid #e5e7eb;
      }
      .eyebrow {
        margin: 0;
        color: #c66a00;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }
      h1 {
        margin: 12px 0 0;
        font-size: 32px;
      }
      .meta,
      .merchant,
      .footer {
        padding: 24px 28px 0;
      }
      .actions {
        padding: 20px 28px 0;
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .button {
        appearance: none;
        border: 0;
        border-radius: 999px;
        padding: 12px 18px;
        cursor: pointer;
        font-weight: 700;
        text-decoration: none;
      }
      .button-primary {
        background: #c66a00;
        color: #fff7ed;
      }
      .button-muted {
        background: #f3f4f6;
        color: #111827;
      }
      .grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }
      .card {
        border: 1px solid #e5e7eb;
        border-radius: 18px;
        padding: 16px;
        background: #fafaf9;
      }
      .label {
        display: block;
        font-size: 12px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.14em;
      }
      .value {
        display: block;
        margin-top: 8px;
        font-size: 18px;
        font-weight: 700;
      }
      table {
        width: calc(100% - 56px);
        margin: 24px 28px 0;
        border-collapse: collapse;
      }
      th,
      td {
        border-bottom: 1px solid #e5e7eb;
        padding: 14px 0;
        text-align: left;
        font-size: 14px;
      }
      th {
        color: #6b7280;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
      }
      .footer {
        padding-bottom: 28px;
        color: #6b7280;
      }
      @media print {
        body {
          background: #ffffff;
        }
        .page {
          padding: 0;
        }
        .receipt {
          box-shadow: none;
          border: 0;
          border-radius: 0;
        }
        .actions {
          display: none;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <article class="receipt">
        <header class="header">
          <p class="eyebrow">EasyPOS Receipt</p>
          <h1>${escapeHtml(input.merchant.name || "Merchant")}</h1>
        </header>
        <section class="actions">
          <button class="button button-primary" onclick="window.print()">Save as PDF</button>
          <a class="button button-muted" href="${escapeHtml(`/easypos/receipt?token=${encodeURIComponent(input.publicToken)}`)}">Open Clean View</a>
        </section>
        <section class="merchant">
          <div class="grid">
            <div class="card">
              <span class="label">Sale ID</span>
              <span class="value">${escapeHtml(input.saleId)}</span>
            </div>
            <div class="card">
              <span class="label">Datetime</span>
              <span class="value">${escapeHtml(new Date(input.createdAt).toLocaleString())}</span>
            </div>
            <div class="card">
              <span class="label">Items</span>
              <span class="value">${Number(input.itemCount || 0)}</span>
            </div>
            <div class="card">
              <span class="label">Total</span>
              <span class="value">RM ${Number(input.total || 0).toFixed(2)}</span>
            </div>
          </div>
          <div style="margin-top:16px;color:#4b5563;font-size:14px;line-height:1.7;">
            ${input.merchant.registration_number ? `<div>Reg No: ${escapeHtml(input.merchant.registration_number)}</div>` : ""}
            ${input.merchant.phone ? `<div>Phone: ${escapeHtml(input.merchant.phone)}</div>` : ""}
            ${input.merchant.email ? `<div>Email: ${escapeHtml(input.merchant.email)}</div>` : ""}
            ${input.merchant.address ? `<div>Address: ${escapeHtml(input.merchant.address)}</div>` : ""}
          </div>
        </section>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Line Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <section class="footer">
          ${escapeHtml(input.merchant.footer_note || "Thank you for your purchase.")}
        </section>
      </article>
    </div>
    ${
      input.download
        ? `<script>window.addEventListener("load", () => { setTimeout(() => window.print(), 250); });</script>`
        : ""
    }
  </body>
</html>`;
}

export async function handleEasyPosMerchantsGet(request: Request, env: Env) {
  const user = await getCurrentUser(request, env.my_db);

  if (!user) {
    return json(
      { ok: false, message: "Not authenticated." },
      { status: 401 },
    );
  }

  const merchants = await env.my_db
    .prepare(
      `SELECT
        utm.user_id AS user_id,
        m.id AS merchant_id,
        utm.role AS role,
        m.name AS name,
        m.registration_number AS registration_number,
        m.phone AS phone,
        m.email AS email,
        m.address AS address,
        m.footer_note AS footer_note,
        m.merchant_owner_id AS merchant_owner_id,
        m.created_at AS created_at,
        m.updated_at AS updated_at
      FROM user_to_merchant utm
      INNER JOIN merchants m ON m.id = utm.merchant_id
      WHERE utm.user_id = ?
      ORDER BY m.updated_at DESC, m.id DESC`,
    )
    .bind(user.id)
    .all<UserMerchantRow>();

  return json({
    ok: true,
    merchants: (merchants.results || []).map((merchant) => ({
      id: merchant.merchant_id,
      role: merchant.role,
      merchant_owner_id: merchant.merchant_owner_id,
      name: merchant.name,
      registrationNumber: merchant.registration_number,
      phone: merchant.phone,
      email: merchant.email,
      address: merchant.address,
      footerNote: merchant.footer_note,
      createdAt: merchant.created_at,
      updatedAt: merchant.updated_at,
    })),
  });
}

export async function handleEasyPosDashboardGet(request: Request, env: Env) {
  const user = await getCurrentUser(request, env.my_db);

  if (!user) {
    return json(
      { ok: false, message: "Not authenticated." },
      { status: 401 },
    );
  }

  const merchants = await env.my_db
    .prepare(
      `SELECT
        utm.user_id AS user_id,
        m.id AS merchant_id,
        utm.role AS role,
        m.name AS name,
        m.registration_number AS registration_number,
        m.phone AS phone,
        m.email AS email,
        m.address AS address,
        m.footer_note AS footer_note,
        m.merchant_owner_id AS merchant_owner_id,
        m.created_at AS created_at,
        m.updated_at AS updated_at
      FROM user_to_merchant utm
      INNER JOIN merchants m ON m.id = utm.merchant_id
      WHERE utm.user_id = ?
      ORDER BY m.updated_at DESC, m.id DESC`,
    )
    .bind(user.id)
    .all<UserMerchantRow>();

  const merchantList = (merchants.results || []).map((merchant) => ({
    id: merchant.merchant_id,
    role: merchant.role,
    merchant_owner_id: merchant.merchant_owner_id,
    name: merchant.name,
    registrationNumber: merchant.registration_number,
    phone: merchant.phone,
    email: merchant.email,
    address: merchant.address,
    footerNote: merchant.footer_note,
    createdAt: merchant.created_at,
    updatedAt: merchant.updated_at,
  }));

  const requestedMerchantId = getMerchantIdFromUrl(new URL(request.url));
  const activeMerchantId =
    merchantList.find((merchant) => merchant.id === requestedMerchantId)?.id ||
    merchantList[0]?.id ||
    null;

  const summary = activeMerchantId
    ? await buildDashboardSummary(env, activeMerchantId)
    : {
        dailyTotal: 0,
        dailyCount: 0,
        dailyItems: 0,
        recentSales: [],
        todayInventoryEvents: 0,
      };

  return json({
    ok: true,
    merchants: merchantList,
    activeMerchantId,
    summary,
  });
}

export async function handleEasyPosMerchantCreate(request: Request, env: Env) {
  const user = await getCurrentUser(request, env.my_db);

  if (!user) {
    return json(
      { ok: false, message: "Not authenticated." },
      { status: 401 },
    );
  }

  const body = await parseJsonBody(request);
  const name =
    typeof body?.name === "string" && body.name.trim()
      ? body.name.trim()
      : `${user.display_name || user.username} Merchant`;
  const registrationNumber =
    typeof body?.registrationNumber === "string" ? body.registrationNumber.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const address = typeof body?.address === "string" ? body.address.trim() : "";
  const footerNote =
    typeof body?.footerNote === "string" && body.footerNote.trim()
      ? body.footerNote.trim()
      : "Thank you for your purchase.";
  const now = new Date().toISOString();

  const insertMerchant = await env.my_db
    .prepare(
      `INSERT INTO merchants (
        merchant_owner_id,
        name,
        registration_number,
        phone,
        email,
        address,
        footer_note,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      user.id,
      name,
      registrationNumber,
      phone,
      email,
      address,
      footerNote,
      now,
      now,
    )
    .run();

  const merchantId = Number(insertMerchant.meta.last_row_id);

  await env.my_db
    .prepare(
      `INSERT INTO user_to_merchant (
        user_id,
        merchant_id,
        role,
        created_at
      ) VALUES (?, ?, 'owner', ?)`,
    )
    .bind(user.id, merchantId, now)
    .run();

  await env.my_db
    .prepare(
      `INSERT INTO easypos_settings (
        merchant_id,
        dark_mode,
        updated_at
      ) VALUES (?, 1, ?)
      ON CONFLICT(merchant_id) DO NOTHING`,
    )
    .bind(merchantId, now)
    .run();

  return json({
    ok: true,
    merchant: {
      id: merchantId,
      role: "owner",
      merchant_owner_id: user.id,
      name,
      registrationNumber,
      phone,
      email,
      address,
      footerNote,
      createdAt: now,
      updatedAt: now,
    },
  });
}

export async function handleEasyPosPublicReceiptGet(request: Request, env: Env) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  const download = url.searchParams.get("download") === "1";

  if (!token) {
    return new Response("Receipt token is required.", { status: 400 });
  }

  const sale = await env.my_db
    .prepare(
      "SELECT user_id, merchant_id, sale_id, public_token, created_at, total, item_count FROM easypos_sales WHERE public_token = ? LIMIT 1",
    )
    .bind(token)
    .first<EasyPosSaleRow>();

  if (!sale?.merchant_id) {
    return new Response("Receipt not found.", { status: 404 });
  }

  const merchant = await env.my_db
    .prepare(
      "SELECT id, merchant_owner_id, name, registration_number, phone, email, address, footer_note FROM merchants WHERE id = ? LIMIT 1",
    )
    .bind(sale.merchant_id)
    .first<EasyPosMerchantRow>();

  const items = await env.my_db
    .prepare(
      "SELECT user_id, merchant_id, sale_id, product_id, name, price, quantity, line_total, image_url FROM easypos_sale_items WHERE merchant_id = ? AND sale_id = ? ORDER BY row_id ASC",
    )
    .bind(sale.merchant_id, sale.sale_id)
    .all<EasyPosSaleItemRow>();

  if (!merchant) {
    return new Response("Merchant not found.", { status: 404 });
  }

  const html = buildPublicReceiptHtml({
    saleId: sale.sale_id,
    publicToken: token,
    createdAt: sale.created_at,
    total: Number(sale.total || 0),
    itemCount: Number(sale.item_count || 0),
    merchant,
    items: items.results || [],
    download,
  });

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, max-age=60",
    },
  });
}

export async function handleEasyPosMerchantUpdate(request: Request, env: Env) {
  const access = await requireMerchantAccess(request, env);
  if (access.error || !access.user || !access.merchantId) return access.error;
  const { user, merchantId } = access;

  const body = await parseJsonBody(request);
  const merchant =
    body?.merchant && typeof body.merchant === "object" ? body.merchant : {};
  const now = new Date().toISOString();

  await env.my_db
    .prepare(
      `UPDATE merchants SET
        name = ?,
        registration_number = ?,
        phone = ?,
        email = ?,
        address = ?,
        footer_note = ?,
        updated_at = ?
      WHERE id = ?`,
    )
    .bind(
      String(merchant?.name || ""),
      String(merchant?.registrationNumber || ""),
      String(merchant?.phone || ""),
      String(merchant?.email || ""),
      String(merchant?.address || ""),
      String(merchant?.footerNote || ""),
      now,
      merchantId,
    )
    .run();

  await broadcastEasyPosEvent(env, merchantId, {
    type: "merchant.updated",
    merchantId,
    updatedAt: now,
    userId: user.id,
  });

  return json({
    ok: true,
    message: "Merchant updated.",
    state: await loadNormalizedState(env, merchantId),
  });
}

export async function handleEasyPosMerchantMembersGet(request: Request, env: Env) {
  const access = await requireMerchantAccess(request, env);
  if (access.error || !access.merchantId) return access.error;
  const { merchantId } = access;

  const members = await env.my_db
    .prepare(
      `SELECT
        utm.user_id AS user_id,
        u.username AS username,
        u.display_name AS display_name,
        u.email AS email,
        u.phone AS phone,
        utm.role AS role,
        utm.created_at AS created_at
      FROM user_to_merchant utm
      INNER JOIN users u ON u.id = utm.user_id
      WHERE utm.merchant_id = ?
      ORDER BY
        CASE WHEN utm.role = 'owner' THEN 0 ELSE 1 END,
        utm.created_at ASC,
        u.username ASC`,
    )
    .bind(merchantId)
    .all<MerchantMemberRow>();

  return json({
    ok: true,
    members: (members.results || []).map((member) => ({
      userId: member.user_id,
      username: member.username,
      displayName: member.display_name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      createdAt: member.created_at,
    })),
  });
}

export async function handleEasyPosMerchantMemberAdd(request: Request, env: Env) {
  const access = await requireMerchantOwner(request, env);
  if (access.error || !access.user || !access.merchantId) return access.error;
  const { user, merchantId } = access;

  const body = await parseJsonBody(request);
  const username = String(body?.username || "").trim();

  if (!username) {
    return json({ ok: false, message: "Username is required." }, { status: 400 });
  }

  const targetUser = await env.my_db
    .prepare(
      "SELECT id, username, display_name, email, phone, session_token, session_expires_at, created_at FROM users WHERE username = ? LIMIT 1",
    )
    .bind(username)
    .first();

  if (!targetUser?.id) {
    return json({ ok: false, message: "User not found." }, { status: 404 });
  }

  const existing = await env.my_db
    .prepare(
      "SELECT id FROM user_to_merchant WHERE user_id = ? AND merchant_id = ? LIMIT 1",
    )
    .bind(targetUser.id, merchantId)
    .first<{ id: number }>();

  if (existing?.id) {
    return json(
      { ok: false, message: "User already has access to this merchant." },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  await env.my_db
    .prepare(
      "INSERT INTO user_to_merchant (user_id, merchant_id, role, created_at) VALUES (?, ?, 'member', ?)",
    )
    .bind(targetUser.id, merchantId, now)
    .run();

  await broadcastEasyPosEvent(env, merchantId, {
    type: "merchant.member_added",
    merchantId,
    updatedAt: now,
    userId: user.id,
    entityId: String(targetUser.id),
  });

  return json({
    ok: true,
    message: `${username} added to merchant members.`,
  });
}

export async function handleEasyPosMerchantMemberRemove(request: Request, env: Env) {
  const access = await requireMerchantOwner(request, env);
  if (access.error || !access.user || !access.merchantId) return access.error;
  const { user, merchantId } = access;

  const body = await parseJsonBody(request);
  const userId = Number(body?.userId || 0);

  if (Number.isNaN(userId) || userId <= 0) {
    return json({ ok: false, message: "userId is required." }, { status: 400 });
  }

  if (userId === user.id) {
    return json(
      { ok: false, message: "Owner cannot remove themselves from merchant." },
      { status: 409 },
    );
  }

  const membership = await env.my_db
    .prepare(
      "SELECT role FROM user_to_merchant WHERE user_id = ? AND merchant_id = ? LIMIT 1",
    )
    .bind(userId, merchantId)
    .first<{ role: string }>();

  if (!membership?.role) {
    return json({ ok: false, message: "Merchant member not found." }, { status: 404 });
  }

  if (membership.role === "owner") {
    return json(
      { ok: false, message: "Cannot remove another owner from this screen." },
      { status: 409 },
    );
  }

  await env.my_db
    .prepare("DELETE FROM user_to_merchant WHERE user_id = ? AND merchant_id = ?")
    .bind(userId, merchantId)
    .run();

  await broadcastEasyPosEvent(env, merchantId, {
    type: "merchant.member_removed",
    merchantId,
    updatedAt: new Date().toISOString(),
    userId: user.id,
    entityId: String(userId),
  });

  return json({
    ok: true,
    message: "Merchant member removed.",
  });
}

export async function handleEasyPosMerchantDelete(request: Request, env: Env) {
  const access = await requireMerchantOwner(request, env);
  if (access.error || !access.merchantId) return access.error;
  const { merchantId } = access;
  const now = new Date().toISOString();

  await broadcastEasyPosEvent(env, merchantId, {
    type: "merchant.deleted",
    merchantId,
    updatedAt: now,
  });

  await env.my_db
    .prepare("DELETE FROM merchants WHERE id = ?")
    .bind(merchantId)
    .run();

  return json({
    ok: true,
    message: "Merchant removed.",
  });
}

export async function handleEasyPosSettingsUpdate(request: Request, env: Env) {
  const access = await requireMerchantAccess(request, env);
  if (access.error || !access.user || !access.merchantId) return access.error;
  const { user, merchantId } = access;

  const body = await parseJsonBody(request);
  const settings =
    body?.settings && typeof body.settings === "object" ? body.settings : {};
  const now = new Date().toISOString();

  await env.my_db
    .prepare(
      `INSERT INTO easypos_settings (
        merchant_id,
        dark_mode,
        updated_at
      ) VALUES (?, ?, ?)
      ON CONFLICT(merchant_id) DO UPDATE SET
        dark_mode = excluded.dark_mode,
        updated_at = excluded.updated_at`,
    )
    .bind(merchantId, settings?.darkMode ? 1 : 0, now)
    .run();

  return json({
    ok: true,
    message: "Settings updated.",
    state: await loadNormalizedState(env, merchantId),
  });
}

export async function handleEasyPosProductUpsert(request: Request, env: Env) {
  const access = await requireMerchantAccess(request, env);
  if (access.error || !access.user || !access.merchantId) return access.error;
  const { user, merchantId } = access;

  const body = await parseJsonBody(request);
  const product = body?.product;
  const productId = String(product?.id || "");
  const name = String(product?.name || "").trim();
  const price = Number(product?.price || 0);
  const stock = Number(product?.stock || 0);
  const unitCost = Number(product?.unitCost || 0);
  const imageId =
    typeof product?.imageId === "string" && product.imageId.trim() ? product.imageId.trim() : null;
  const imageUrl =
    typeof product?.imageUrl === "string" && product.imageUrl.trim()
      ? product.imageUrl.trim()
      : null;
  const now = new Date().toISOString();

  if (!productId || !name || Number.isNaN(price) || price <= 0) {
    return json(
      { ok: false, message: "Valid product id, name, and price are required." },
      { status: 400 },
    );
  }

  const existing = await getMerchantProduct(env, merchantId, productId);
  if (existing) {
    await env.my_db
      .prepare(
        "UPDATE easypos_products SET name = ?, price = ?, stock = ?, unit_cost = ?, image_id = ?, image_url = ?, updated_at = ? WHERE merchant_id = ? AND product_id = ?",
      )
      .bind(name, price, stock, unitCost, imageId, imageUrl, now, merchantId, productId)
      .run();
  } else {
    const creatorProductCount = await env.my_db
      .prepare(
        "SELECT COUNT(*) AS total FROM easypos_products WHERE creator_id = ?",
      )
      .bind(user.id)
      .first<{ total: number }>();

    if (Number(creatorProductCount?.total || 0) >= Number(user.max_product || 100)) {
      return json(
        {
          ok: false,
          message: `Product limit reached. Max product for this user is ${Number(user.max_product || 100)}.`,
        },
        { status: 403 },
      );
    }

    await env.my_db
      .prepare(
        "INSERT INTO easypos_products (user_id, merchant_id, creator_id, product_id, name, price, stock, unit_cost, image_id, image_url, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        user.id,
        merchantId,
        user.id,
        productId,
        name,
        price,
        stock,
        unitCost,
        imageId,
        imageUrl,
        now,
      )
      .run();
  }

  await broadcastEasyPosEvent(env, merchantId, {
    type: "product.updated",
    merchantId,
    updatedAt: now,
    userId: user.id,
    entityId: productId,
  });

  return json({
    ok: true,
    message: "Product saved.",
    state: await loadNormalizedState(env, merchantId),
  });
}

export async function handleEasyPosProductDelete(request: Request, env: Env) {
  const access = await requireMerchantAccess(request, env);
  if (access.error || !access.user || !access.merchantId) return access.error;
  const { user, merchantId } = access;

  const body = await parseJsonBody(request);
  const productId = String(body?.productId || "");

  if (!productId) {
    return json(
      { ok: false, message: "productId is required." },
      { status: 400 },
    );
  }

  await env.my_db
    .prepare("DELETE FROM easypos_products WHERE merchant_id = ? AND product_id = ?")
    .bind(merchantId, productId)
    .run();

  await broadcastEasyPosEvent(env, merchantId, {
    type: "product.deleted",
    merchantId,
    updatedAt: new Date().toISOString(),
    userId: user.id,
    entityId: productId,
  });

  return json({
    ok: true,
    message: "Product removed.",
    state: await loadNormalizedState(env, merchantId),
  });
}

export async function handleEasyPosProductImageUpload(request: Request, env: Env) {
  const access = await requireMerchantAccess(request, env);
  if (access.error || !access.user || !access.merchantId) return access.error;
  const { user, merchantId } = access;

  const configError = requireCloudflareImages(env);
  if (configError) {
    return configError;
  }

  const formData = await request.formData();
  const productId = String(formData.get("productId") || "").trim();
  const image = formData.get("image");

  if (!productId) {
    return json({ ok: false, message: "productId is required." }, { status: 400 });
  }

  if (!(image instanceof File)) {
    return json({ ok: false, message: "Image file is required." }, { status: 400 });
  }

  if (!image.type.startsWith("image/")) {
    return json({ ok: false, message: "Only image uploads are allowed." }, { status: 400 });
  }

  const product = await getMerchantProduct(env, merchantId, productId);
  if (!product) {
    return json({ ok: false, message: "Product not found." }, { status: 404 });
  }

  const uploadBody = new FormData();
  uploadBody.set("file", image, image.name || `${productId}.png`);
  uploadBody.set(
    "metadata",
    JSON.stringify({
      merchantId,
      productId,
      scope: "easypos-product-image",
    }),
  );
  uploadBody.set("requireSignedURLs", "false");

  const uploadResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_IMAGES_API_TOKEN}`,
      },
      body: uploadBody,
    },
  );

  const payload = (await uploadResponse.json()) as {
    success?: boolean;
    errors?: Array<{ message?: string }>;
    result?: { id?: string };
  };

  if (!uploadResponse.ok || !payload.success || !payload.result?.id) {
    return json(
      {
        ok: false,
        message: payload.errors?.[0]?.message || "Failed to upload product image.",
      },
      { status: 502 },
    );
  }

  const imageId = payload.result.id;
  const imageUrl = `https://imagedelivery.net/${env.CLOUDFLARE_IMAGES_DELIVERY_HASH}/${imageId}/public`;
  const now = new Date().toISOString();

  await env.my_db
    .prepare(
      "UPDATE easypos_products SET image_id = ?, image_url = ?, updated_at = ? WHERE merchant_id = ? AND product_id = ?",
    )
    .bind(imageId, imageUrl, now, merchantId, productId)
    .run();

  await broadcastEasyPosEvent(env, merchantId, {
    type: "product.updated",
    merchantId,
    updatedAt: now,
    userId: user.id,
    entityId: productId,
  });

  return json({
    ok: true,
    message: "Product image uploaded.",
    imageId,
    imageUrl,
    state: await loadNormalizedState(env, merchantId),
  });
}

export async function handleEasyPosStockIn(request: Request, env: Env) {
  const access = await requireMerchantAccess(request, env);
  if (access.error || !access.user || !access.merchantId) return access.error;
  const { user, merchantId } = access;

  const body = await parseJsonBody(request);
  const productId = String(body?.productId || "");
  const quantity = Number(body?.quantity || 0);
  const unitCost = Number(body?.unitCost || 0);
  const now = new Date().toISOString();

  if (!productId || Number.isNaN(quantity) || quantity <= 0 || Number.isNaN(unitCost) || unitCost < 0) {
    return json(
      { ok: false, message: "productId, quantity, and unitCost are required." },
      { status: 400 },
    );
  }

  const product = await getMerchantProduct(env, merchantId, productId);
  if (!product) {
    return json({ ok: false, message: "Product not found." }, { status: 404 });
  }

  await env.my_db
    .prepare(
      "UPDATE easypos_products SET stock = ?, unit_cost = ?, updated_at = ? WHERE merchant_id = ? AND product_id = ?",
    )
    .bind(Number(product.stock || 0) + quantity, unitCost, now, merchantId, productId)
    .run();

  await env.my_db
    .prepare(
      "INSERT INTO easypos_inventory_events (user_id, merchant_id, event_id, type, created_at, product_id, product_name, quantity, unit_cost, total_cost) VALUES (?, ?, ?, 'stock_in', ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      user.id,
      merchantId,
      `inventory-stock_in-${productId}-${Date.now()}`,
      now,
      productId,
      product.name,
      quantity,
      unitCost,
      unitCost * quantity,
    )
    .run();

  await broadcastEasyPosEvent(env, merchantId, {
    type: "stock.in",
    merchantId,
    updatedAt: now,
    userId: user.id,
    entityId: productId,
  });

  await broadcastEasyPosEvent(env, merchantId, {
    type: "settings.updated",
    merchantId,
    updatedAt: now,
    userId: user.id,
  });

  return json({
    ok: true,
    message: "Stock in saved.",
    state: await loadNormalizedState(env, merchantId),
  });
}

export async function handleEasyPosDamage(request: Request, env: Env) {
  const access = await requireMerchantAccess(request, env);
  if (access.error || !access.user || !access.merchantId) return access.error;
  const { user, merchantId } = access;

  const body = await parseJsonBody(request);
  const productId = String(body?.productId || "");
  const quantity = Number(body?.quantity || 0);
  const now = new Date().toISOString();

  if (!productId || Number.isNaN(quantity) || quantity <= 0) {
    return json(
      { ok: false, message: "productId and quantity are required." },
      { status: 400 },
    );
  }

  const product = await getMerchantProduct(env, merchantId, productId);
  if (!product) {
    return json({ ok: false, message: "Product not found." }, { status: 404 });
  }

  const nextStock = Math.max(Number(product.stock || 0) - quantity, 0);
  await env.my_db
    .prepare(
      "UPDATE easypos_products SET stock = ?, updated_at = ? WHERE merchant_id = ? AND product_id = ?",
    )
    .bind(nextStock, now, merchantId, productId)
    .run();

  await env.my_db
    .prepare(
      "INSERT INTO easypos_inventory_events (user_id, merchant_id, event_id, type, created_at, product_id, product_name, quantity, unit_cost, total_cost) VALUES (?, ?, ?, 'damage', ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      user.id,
      merchantId,
      `inventory-damage-${productId}-${Date.now()}`,
      now,
      productId,
      product.name,
      quantity,
      Number(product.unit_cost || 0),
      Number(product.unit_cost || 0) * quantity,
    )
    .run();

  await broadcastEasyPosEvent(env, merchantId, {
    type: "stock.damage",
    merchantId,
    updatedAt: now,
    userId: user.id,
    entityId: productId,
  });

  return json({
    ok: true,
    message: "Damage saved.",
    state: await loadNormalizedState(env, merchantId),
  });
}

export async function handleEasyPosCheckout(request: Request, env: Env) {
  const access = await requireMerchantAccess(request, env);
  if (access.error || !access.user || !access.merchantId) return access.error;
  const { user, merchantId } = access;

  const body = await parseJsonBody(request);
  const cart = Array.isArray(body?.cart) ? body.cart : [];
  if (cart.length === 0) {
    return json({ ok: false, message: "Cart is empty." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const saleId = `sale-${Date.now()}`;
  const publicToken = crypto.randomUUID();
  let total = 0;
  let itemCount = 0;

  for (const item of cart) {
    const productId = String(item?.id || "");
    const quantity = Number(item?.quantity || 0);
    if (!productId || Number.isNaN(quantity) || quantity <= 0) {
      return json({ ok: false, message: "Invalid cart item." }, { status: 400 });
    }

    const product = await getMerchantProduct(env, merchantId, productId);
    if (!product) {
      return json({ ok: false, message: `Product not found: ${productId}` }, { status: 404 });
    }
    if (quantity > Number(product.stock || 0)) {
      return json(
        { ok: false, message: `Insufficient stock for ${product.name}.` },
        { status: 409 },
      );
    }
  }

  for (const item of cart) {
    const productId = String(item?.id || "");
    const quantity = Number(item?.quantity || 0);
    const product = await getMerchantProduct(env, merchantId, productId);
    if (!product) continue;

    const price = Number(item?.price || product.price || 0);
    const lineTotal = price * quantity;
    total += lineTotal;
    itemCount += quantity;

    await env.my_db
      .prepare(
        "UPDATE easypos_products SET stock = ?, updated_at = ? WHERE merchant_id = ? AND product_id = ?",
      )
      .bind(Math.max(Number(product.stock || 0) - quantity, 0), now, merchantId, productId)
      .run();

    await env.my_db
      .prepare(
        "INSERT INTO easypos_sale_items (user_id, merchant_id, sale_id, product_id, name, price, quantity, line_total, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        user.id,
        merchantId,
        saleId,
        productId,
        String(item?.name || product.name),
        price,
        quantity,
        lineTotal,
        product.image_url,
      )
      .run();

    await env.my_db
      .prepare(
        "INSERT INTO easypos_inventory_events (user_id, merchant_id, event_id, type, created_at, product_id, product_name, quantity, unit_price, total_value, reference_id) VALUES (?, ?, ?, 'sales', ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        user.id,
        merchantId,
        `inventory-sales-${saleId}-${productId}`,
        now,
        productId,
        String(item?.name || product.name),
        quantity,
        price,
        lineTotal,
        saleId,
      )
      .run();
  }

  await env.my_db
    .prepare(
      "INSERT INTO easypos_sales (user_id, merchant_id, sale_id, public_token, created_at, total, item_count) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(user.id, merchantId, saleId, publicToken, now, total, itemCount)
    .run();

  await broadcastEasyPosEvent(env, merchantId, {
    type: "sale.created",
    merchantId,
    updatedAt: now,
    userId: user.id,
    entityId: saleId,
    referenceId: saleId,
  });

  const state = await loadNormalizedState(env, merchantId);
  const sale = state.sales.find((item) => item.id === saleId) || null;

  return json({
    ok: true,
    message: "Checkout completed.",
    sale,
    state,
  });
}
