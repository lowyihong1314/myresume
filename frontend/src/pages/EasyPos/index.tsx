import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addEasyPosMerchantMember,
  checkoutEasyPos,
  createEasyPosMerchant,
  damageEasyPos,
  deleteEasyPosMerchant,
  deleteEasyPosProduct,
  loadEasyPosMerchantMembers,
  updateEasyPosMerchant,
  updateEasyPosSettings,
  loadEasyPosMerchants,
  loadEasyPosRemoteState,
  removeEasyPosMerchantMember,
  type EasyPosMerchantAccess,
  type EasyPosMerchantMember,
  stockInEasyPos,
  uploadEasyPosProductImage,
  upsertEasyPosProduct,
} from "../../data/easyposApi.ts";
import { generateReceipt } from "../../data/easyposReceipt.ts";
import {
  createOfflineCheckoutRecord,
  loadOfflineCheckouts,
  saveOfflineCheckouts,
  type OfflineCheckoutRecord,
} from "../../data/easyposOfflineCheckoutStore.ts";
import {
  loadMerchantProfile,
  saveMerchantProfile,
  type MerchantProfile,
} from "../../data/easyposMerchantStore.ts";
import {
  loadEasyPosSettings,
  saveEasyPosSettings,
  type EasyPosSettings,
} from "../../data/easyposSettingsStore.ts";
import {
  defaultProducts,
  loadInventoryEvents,
  loadProducts,
  loadSales,
  saveInventoryEvents,
  saveProducts,
  saveSales,
  type InventoryEvent,
  type Product,
  type SaleRecord,
} from "../../data/easyposStore.ts";
import { EasyPosHeader } from "./EasyPosHeader";
import { EasyPosManageTab } from "./EasyPosManageTab";
import { EasyPosOfflineCheckoutTab } from "./EasyPosOfflineCheckoutTab";
import { EasyPosPosTab } from "./EasyPosPosTab";
import { EasyPosReceiptPage } from "./EasyPosReceiptPage";
import { EasyPosSalesTab } from "./EasyPosSalesTab";
import { EasyPosSettingsPage } from "./EasyPosSettingsPage";
import { EasyPosSummaryTab } from "./EasyPosSummaryTab";

type MainTabId = "summary" | "manage" | "sales" | "pos";
type TabId = MainTabId | "offline_checkout_state" | "settings" | "receipt";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
};

type ProductFormState = {
  name: string;
  price: string;
  imageFile: File | null;
  imagePreviewUrl: string;
};

type StockAdjustmentState = Record<string, { quantity: string; unitCost: string }>;

type AuthPayload = {
  user: {
    display_name?: string;
    username?: string;
    token_balance?: number;
    default_max_token?: number;
    token_refreshed_at?: string;
  };
};

type BannerMessage = {
  text: string;
  timeLabel: string;
};

async function fetchJson(path: string, options: RequestInit = {}): Promise<AuthPayload> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });

  const payload = (await response.json()) as { message?: string; user?: AuthPayload["user"] };

  if (!response.ok) {
    throw new Error(payload.message || "Request failed.");
  }

  return { user: payload.user || {} };
}

export default function EasyPos() {
  const navigate = useNavigate();
  const realtimeSocketRef = useRef<WebSocket | null>(null);
  const offlineCheckoutSyncRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [tokenBalance, setTokenBalance] = useState(0);
  const [defaultMaxToken, setDefaultMaxToken] = useState(5000);
  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const [lastMainTab, setLastMainTab] = useState<MainTabId>("summary");
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [inventoryEvents, setInventoryEvents] = useState<InventoryEvent[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [message, setMessageState] = useState<BannerMessage | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>({
    name: "",
    price: "",
    imageFile: null,
    imagePreviewUrl: "",
  });
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustmentState>({});
  const [merchantForm, setMerchantForm] = useState<MerchantProfile>(loadMerchantProfile());
  const [settings, setSettings] = useState<EasyPosSettings>(loadEasyPosSettings());
  const [merchants, setMerchants] = useState<EasyPosMerchantAccess[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<number | null>(
    loadEasyPosSettings().lastMerchantId,
  );
  const [isMerchantBootstrapping, setIsMerchantBootstrapping] = useState(true);
  const [createMerchantForm, setCreateMerchantForm] = useState<MerchantProfile>({
    name: "",
    registrationNumber: "",
    phone: "",
    email: "",
    address: "",
    footerNote: "Thank you for your purchase.",
  });
  const [merchantMembers, setMerchantMembers] = useState<EasyPosMerchantMember[]>([]);
  const [memberUsername, setMemberUsername] = useState("");
  const [activeReceipt, setActiveReceipt] = useState<SaleRecord | null>(null);
  const [receiptReturnTab, setReceiptReturnTab] = useState<MainTabId>("pos");
  const [offlineCheckouts, setOfflineCheckouts] = useState<OfflineCheckoutRecord[]>(
    loadOfflineCheckouts(),
  );
  const [remoteReady, setRemoteReady] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<"live" | "reconnecting" | "offline">(
    "offline",
  );
  const themeVars = settings.darkMode
    ? ({
        "--easypos-bg": "linear-gradient(135deg,#120b12 0%,#22121d 48%,#0a0f1c 100%)",
        "--easypos-bg-solid": "#0a0f1c",
        "--easypos-panel": "rgba(255,255,255,0.05)",
        "--easypos-surface": "rgba(10,15,28,0.62)",
        "--easypos-modal-bg": "rgba(10,15,28,0.96)",
        "--easypos-input-bg": "rgba(15,23,42,0.88)",
        "--easypos-border": "rgba(255,255,255,0.10)",
        "--easypos-text": "#ffffff",
        "--easypos-muted": "#94a3b8",
        "--easypos-accent": "#ff8400",
        "--easypos-accent-soft": "#ffd5b0",
        "--easypos-accent-muted": "rgba(255,132,0,0.3)",
        "--easypos-accent-badge": "rgba(255,132,0,0.16)",
        "--easypos-button-primary": "#ff8400",
        "--easypos-button-primary-text": "#0a0f1c",
        "--easypos-button-muted": "rgba(255,255,255,0.06)",
        "--easypos-danger": "#f87171",
        "--easypos-danger-muted": "rgba(239,68,68,0.16)",
        "--easypos-overlay": "rgba(0,0,0,0.68)",
      } as React.CSSProperties)
    : ({
        "--easypos-bg": "linear-gradient(135deg,#f7f2e8 0%,#f4ede1 45%,#e7edf5 100%)",
        "--easypos-bg-solid": "#f7f2e8",
        "--easypos-panel": "rgba(255,255,255,0.72)",
        "--easypos-surface": "rgba(255,255,255,0.85)",
        "--easypos-modal-bg": "rgba(255,255,255,0.96)",
        "--easypos-input-bg": "rgba(255,255,255,0.96)",
        "--easypos-border": "rgba(15,23,42,0.10)",
        "--easypos-text": "#162033",
        "--easypos-muted": "#5c6b80",
        "--easypos-accent": "#c66a00",
        "--easypos-accent-soft": "#b85f00",
        "--easypos-accent-muted": "rgba(198,106,0,0.26)",
        "--easypos-accent-badge": "rgba(198,106,0,0.10)",
        "--easypos-button-primary": "#c66a00",
        "--easypos-button-primary-text": "#fff7ed",
        "--easypos-button-muted": "rgba(255,255,255,0.78)",
        "--easypos-danger": "#dc2626",
        "--easypos-danger-muted": "rgba(220,38,38,0.10)",
        "--easypos-overlay": "rgba(15,23,42,0.28)",
      } as React.CSSProperties);

  useEffect(() => {
    let alive = true;

    async function validateSession() {
      try {
        const payload = await fetchJson("/api/auth/me", { method: "GET" });
        if (!alive) return;
        setSessionName(payload.user.display_name || payload.user.username || "Operator");
        setTokenBalance(Number(payload.user.token_balance || 0));
        setDefaultMaxToken(Number(payload.user.default_max_token || 5000));
        setError("");
      } catch (authError) {
        if (!alive) return;
        setError(authError instanceof Error ? authError.message : "Failed to validate session.");
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void validateSession();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadState() {
      const localProducts = loadProducts();
      const localSales = loadSales();
      const localInventoryEvents = loadInventoryEvents();
      const localMerchant = loadMerchantProfile();
      const localSettings = loadEasyPosSettings();

      if (cancelled) {
        return;
      }

      setProducts(localProducts);
      setSales(localSales);
      setInventoryEvents(localInventoryEvents);
      setMerchantForm(localMerchant);
      setSettings(localSettings);

      try {
        const merchantList = await loadEasyPosMerchants();
        if (cancelled) {
          return;
        }

        setMerchants(merchantList);
        setIsMerchantBootstrapping(false);

        const resolvedMerchantId =
          merchantList.find((merchant) => merchant.id === localSettings.lastMerchantId)?.id ||
          merchantList[0]?.id ||
          null;

        setSelectedMerchantId(resolvedMerchantId);

        if (!resolvedMerchantId) {
          setRemoteReady(true);
          return;
        }

        const remoteState = await loadEasyPosRemoteState(resolvedMerchantId);
        const members = await loadEasyPosMerchantMembers(resolvedMerchantId);
        if (cancelled || !remoteState) {
          return;
        }

        if (Array.isArray(remoteState.products)) {
          setProducts(remoteState.products);
        }
        if (Array.isArray(remoteState.sales)) {
          setSales(remoteState.sales);
        }
        if (Array.isArray(remoteState.inventoryEvents)) {
          setInventoryEvents(remoteState.inventoryEvents);
        }
        if (remoteState.merchant) {
          setMerchantForm(remoteState.merchant);
        }
        if (remoteState.settings) {
          setSettings((current) => ({
            ...current,
            ...remoteState.settings,
            lastMerchantId: resolvedMerchantId,
          }));
        }
        setMerchantMembers(members);
      } catch {
        // Keep local state as fallback if the D1-backed API is not available yet.
      } finally {
        if (!cancelled) {
          setIsMerchantBootstrapping(false);
          setRemoteReady(true);
        }
      }
    }

    void loadState();
    return () => {
      cancelled = true;
    };
  }, []);

  async function hydrateMerchantState(merchantId: number) {
    const remoteState = await loadEasyPosRemoteState(merchantId);
    const members = await loadEasyPosMerchantMembers(merchantId);

    if (Array.isArray(remoteState?.products)) {
      setProducts(remoteState.products);
    }
    if (Array.isArray(remoteState?.sales)) {
      setSales(remoteState.sales);
    }
    if (Array.isArray(remoteState?.inventoryEvents)) {
      setInventoryEvents(remoteState.inventoryEvents);
    }
    setMerchantMembers(members);
    if (remoteState?.merchant) {
      setMerchantForm(remoteState.merchant);
    }
    if (remoteState?.settings) {
      setSettings((current) => ({
        ...current,
        ...remoteState.settings,
        lastMerchantId: merchantId,
      }));
    }
  }

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    saveSales(sales);
  }, [sales]);

  function handleSetMainTab(tab: MainTabId) {
    setLastMainTab(tab);
    setActiveTab(tab);
  }

  function handleHeaderTabSelect(tab: TabId) {
    if (tab === "summary" || tab === "manage" || tab === "sales" || tab === "pos") {
      handleSetMainTab(tab);
      return;
    }

    setActiveTab(tab);
  }

  useEffect(() => {
    saveInventoryEvents(inventoryEvents);
  }, [inventoryEvents]);

  useEffect(() => {
    saveMerchantProfile(merchantForm);
  }, [merchantForm]);

  useEffect(() => {
    saveEasyPosSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveOfflineCheckouts(offlineCheckouts);
  }, [offlineCheckouts]);

  useEffect(() => {
    const previewUrl = productForm.imagePreviewUrl;

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [productForm.imagePreviewUrl]);

  function setMessage(text: string) {
    setMessageState({
      text,
      timeLabel: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    });
  }

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = window.setTimeout(() => {
      setMessageState(null);
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [message]);

  function describeRealtimeEvent(type?: string) {
    switch (type) {
      case "sale.created":
        return "Live update: sale created from another terminal.";
      case "stock.in":
        return "Live update: stock-in recorded.";
      case "stock.damage":
        return "Live update: damage recorded.";
      case "product.updated":
        return "Live update: product updated.";
      case "product.deleted":
        return "Live update: product removed.";
      case "merchant.updated":
        return "Live update: merchant profile updated.";
      case "settings.updated":
        return "Live update: settings updated.";
      case "merchant.member_added":
        return "Live update: merchant member added.";
      case "merchant.member_removed":
        return "Live update: merchant member removed.";
      case "merchant.deleted":
        return "Live update: merchant removed.";
      default:
        return "Live update received.";
    }
  }

  function ensureRealtimeLive(actionLabel: string) {
    if (realtimeStatus === "live") {
      return true;
    }

    setMessage(`Request blocked: ${actionLabel} requires realtime connection to be live.`);
    return false;
  }

  async function flushOfflineCheckouts(merchantId: number) {
    if (offlineCheckoutSyncRef.current) {
      return;
    }

    const queue = offlineCheckouts
      .filter((checkout) => checkout.merchantId === merchantId && checkout.syncState === "queued")
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

    if (queue.length === 0) {
      return;
    }

    offlineCheckoutSyncRef.current = true;

    try {
      for (const pendingCheckout of queue) {
        if (realtimeStatus !== "live") {
          break;
        }

        setOfflineCheckouts((current) =>
          current.map((checkout) =>
            checkout.id === pendingCheckout.id
              ? { ...checkout, syncState: "submitting", lastError: undefined }
              : checkout,
          ),
        );

        try {
          const payload = await checkoutEasyPos({
            merchantId,
            cart: pendingCheckout.cart,
          });

          setProducts(payload.state?.products || []);
          setSales(payload.state?.sales || []);
          setInventoryEvents(payload.state?.inventoryEvents || []);
          setOfflineCheckouts((current) =>
            current.filter((checkout) => checkout.id !== pendingCheckout.id),
          );
          setMessage(
            `Offline checkout synced: RM ${Number(pendingCheckout.total || 0).toFixed(2)}.`,
          );
        } catch (syncError) {
          const errorText =
            syncError instanceof Error ? syncError.message : "Failed to sync offline checkout.";

          setOfflineCheckouts((current) =>
            current.map((checkout) =>
              checkout.id === pendingCheckout.id
                ? { ...checkout, syncState: "failed", lastError: errorText }
                : checkout,
            ),
          );
          setMessage(errorText);
          break;
        }
      }
    } finally {
      offlineCheckoutSyncRef.current = false;
    }
  }

  useEffect(() => {
    if (!selectedMerchantId || loading || error === "Not authenticated.") {
      setRealtimeStatus("offline");
      return;
    }

    let cancelled = false;
    let reconnectTimer: number | null = null;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/easypos/realtime?merchant_id=${selectedMerchantId}`;

    const connect = () => {
      if (cancelled) {
        return;
      }

      setRealtimeStatus("reconnecting");
      const socket = new WebSocket(wsUrl);
      realtimeSocketRef.current = socket;

      socket.onopen = () => {
        setRealtimeStatus("live");
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            type?: string;
            merchantId?: number;
          };

          if (
            payload.type === "realtime.connected" ||
            payload.type === "pong" ||
            payload.type === "error"
          ) {
            return;
          }

          if (payload.merchantId !== selectedMerchantId) {
            return;
          }

          setMessage(describeRealtimeEvent(payload.type));
          void hydrateMerchantState(selectedMerchantId);
        } catch {
          // Ignore malformed realtime messages.
        }
      };

      socket.onclose = () => {
        if (cancelled) {
          return;
        }

        setRealtimeStatus("reconnecting");
        reconnectTimer = window.setTimeout(() => {
          connect();
        }, 1500);
      };

      socket.onerror = () => {
        setRealtimeStatus("reconnecting");
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      if (realtimeSocketRef.current) {
        realtimeSocketRef.current.close();
        realtimeSocketRef.current = null;
      }
      setRealtimeStatus("offline");
    };
  }, [selectedMerchantId, loading, error]);

  useEffect(() => {
    if (!selectedMerchantId || realtimeStatus !== "live") {
      return;
    }

    const hasPendingQueue = offlineCheckouts.some(
      (checkout) =>
        checkout.merchantId === selectedMerchantId && checkout.syncState === "queued",
    );

    if (!hasPendingQueue) {
      return;
    }

    void flushOfflineCheckouts(selectedMerchantId);
  }, [offlineCheckouts, realtimeStatus, selectedMerchantId]);

  useEffect(() => {
    if (activeTab === "offline_checkout_state" && offlineCheckouts.length === 0) {
      setActiveTab(lastMainTab);
    }
  }, [activeTab, lastMainTab, offlineCheckouts.length]);

  useEffect(() => {
    const htmlStyle = document.documentElement.style;
    const bodyStyle = document.body.style;
    const previousHtmlBackground = htmlStyle.background;
    const previousHtmlBackgroundColor = htmlStyle.backgroundColor;
    const previousBodyBackground = bodyStyle.background;
    const previousBodyBackgroundColor = bodyStyle.backgroundColor;

    htmlStyle.background = String(themeVars["--easypos-bg"] || "");
    htmlStyle.backgroundColor = String(themeVars["--easypos-bg-solid"] || "");
    bodyStyle.background = String(themeVars["--easypos-bg"] || "");
    bodyStyle.backgroundColor = String(themeVars["--easypos-bg-solid"] || "");

    return () => {
      htmlStyle.background = previousHtmlBackground;
      htmlStyle.backgroundColor = previousHtmlBackgroundColor;
      bodyStyle.background = previousBodyBackground;
      bodyStyle.backgroundColor = previousBodyBackgroundColor;
    };
  }, [themeVars]);

  const summary = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
    const inventoryValue = products.reduce(
      (sum, product) => sum + Number(product.unitCost || 0) * Number(product.stock || 0),
      0,
    );
    const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const totalSalesCount = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);

    return {
      totalProducts,
      totalStock,
      inventoryValue,
      cartItems,
      cartTotal,
      totalSalesCount,
      totalRevenue,
    };
  }, [cart, products, sales]);

  const dailySalesChart = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      return {
        key,
        dateLabel: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        revenue: 0,
        salesCount: 0,
      };
    });

    const lookup = new Map(days.map((day) => [day.key, day]));
    for (const sale of sales) {
      const key = sale.createdAt.slice(0, 10);
      const bucket = lookup.get(key);
      if (!bucket) continue;
      bucket.revenue += sale.total;
      bucket.salesCount += 1;
    }

    return days;
  }, [sales]);

  function handleAddProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = productForm.name.trim();
    const price = Number(productForm.price);

    if (!name || Number.isNaN(price) || price <= 0) {
      setMessage("Please enter a valid product name and price.");
      return;
    }

    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
    const product = { id, name, price, stock: 0, unitCost: 0 };

    if (!selectedMerchantId) {
      setMessage("Select a merchant first.");
      return;
    }
    if (!ensureRealtimeLive("add product")) {
      return;
    }

    void upsertEasyPosProduct({
      merchantId: selectedMerchantId,
      product,
    })
      .then(async (payload) => {
        if (productForm.imageFile) {
          const imagePayload = await uploadEasyPosProductImage({
            merchantId: selectedMerchantId,
            productId: product.id,
            file: productForm.imageFile,
          });

          setProducts(imagePayload.state?.products || payload.state?.products || []);
        } else {
          setProducts(payload.state?.products || []);
        }
        setProductForm({ name: "", price: "", imageFile: null, imagePreviewUrl: "" });
        setMessage(`${name} added to EasyPOS.`);
        handleSetMainTab("manage");
      })
      .catch((addError) => {
        setMessage(addError instanceof Error ? addError.message : "Failed to add product.");
      });
  }

  function handleProductChange(id: string, field: "name" | "price", value: string) {
    if (!selectedMerchantId) {
      setMessage("Select a merchant first.");
      return;
    }
    if (!ensureRealtimeLive("update product")) {
      return;
    }

    const nextProduct = products.find((product) => product.id === id);
    if (!nextProduct) return;

    const updatedProduct =
      field === "name"
        ? { ...nextProduct, name: value }
        : {
            ...nextProduct,
            price: Number.isNaN(Number(value)) ? 0 : Number(value),
          };

    setProducts((current) =>
      current.map((product) => (product.id === id ? updatedProduct : product)),
    );

    void upsertEasyPosProduct({
      merchantId: selectedMerchantId,
      product: updatedProduct,
    })
      .then((payload) => {
        setProducts(payload.state?.products || []);
        setMessage("Product list updated.");
      })
      .catch((updateError) => {
        setMessage(updateError instanceof Error ? updateError.message : "Failed to update product.");
      });
  }

  function consumeStockAdjustment(id: string) {
    const adjustment = stockAdjustments[id] || { quantity: "", unitCost: "" };
    const quantity = Number(adjustment.quantity);
    const unitCost = Number(adjustment.unitCost);

    if (!adjustment.quantity || Number.isNaN(quantity) || quantity <= 0) {
      setMessage("Enter a valid stock quantity.");
      return null;
    }

    setStockAdjustments((current) => ({
      ...current,
      [id]: { quantity: "", unitCost: current[id]?.unitCost || "" },
    }));
    return { quantity, unitCost };
  }

  function handleStockIn(id: string) {
    const adjustment = consumeStockAdjustment(id);
    if (adjustment === null) return;
    const { quantity, unitCost } = adjustment;

    const product = products.find((item) => item.id === id);
    if (!product) return;
    if (Number.isNaN(unitCost) || unitCost < 0) {
      setMessage("Enter a valid stock cost.");
      return;
    }

    if (!selectedMerchantId) {
      setMessage("Select a merchant first.");
      return;
    }
    if (!ensureRealtimeLive("stock in")) {
      return;
    }

    void stockInEasyPos({
      merchantId: selectedMerchantId,
      productId: id,
      quantity,
      unitCost,
    })
      .then((payload) => {
        setProducts(payload.state?.products || []);
        setInventoryEvents(payload.state?.inventoryEvents || []);
        setMessage(`${product.name}: stock increased by ${quantity} at RM ${unitCost.toFixed(2)}.`);
      })
      .catch((stockInError) => {
        setMessage(stockInError instanceof Error ? stockInError.message : "Failed to save stock in.");
      });
  }

  function handleDamage(id: string) {
    const adjustment = consumeStockAdjustment(id);
    if (adjustment === null) return;
    const { quantity } = adjustment;

    const product = products.find((item) => item.id === id);
    if (!product) return;

    if (!selectedMerchantId) {
      setMessage("Select a merchant first.");
      return;
    }
    if (!ensureRealtimeLive("damage")) {
      return;
    }

    void damageEasyPos({
      merchantId: selectedMerchantId,
      productId: id,
      quantity,
    })
      .then((payload) => {
        setProducts(payload.state?.products || []);
        setInventoryEvents(payload.state?.inventoryEvents || []);
        setMessage(`${product.name}: damaged stock recorded (${quantity}).`);
      })
      .catch((damageError) => {
        setMessage(damageError instanceof Error ? damageError.message : "Failed to save damage.");
      });
  }

  function handleRemoveProduct(id: string) {
    if (!selectedMerchantId) {
      setMessage("Select a merchant first.");
      return;
    }
    if (!ensureRealtimeLive("remove product")) {
      return;
    }

    setStockAdjustments((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });

    void deleteEasyPosProduct({
      merchantId: selectedMerchantId,
      productId: id,
    })
      .then((payload) => {
        setProducts(payload.state?.products || []);
        setCart((current) => current.filter((item) => item.id !== id));
        setMessage("Product removed from EasyPOS.");
      })
      .catch((deleteError) => {
        setMessage(deleteError instanceof Error ? deleteError.message : "Failed to remove product.");
      });
  }

  function handleUploadProductImage(productId: string, file: File) {
    if (!selectedMerchantId) {
      setMessage("Select a merchant first.");
      return;
    }
    if (!ensureRealtimeLive("upload product image")) {
      return;
    }

    void uploadEasyPosProductImage({
      merchantId: selectedMerchantId,
      productId,
      file,
    })
      .then((payload) => {
        setProducts(payload.state?.products || []);
        setMessage("Product image uploaded.");
      })
      .catch((uploadError) => {
        setMessage(
          uploadError instanceof Error ? uploadError.message : "Failed to upload product image.",
        );
      });
  }

  function handleAddToCart(product: Product) {
    if (product.stock <= 0) {
      setMessage(`${product.name} is out of stock.`);
      return;
    }

    const itemInCart = cart.find((item) => item.id === product.id);
    if (itemInCart && itemInCart.quantity >= product.stock) {
      setMessage(`Only ${product.stock} unit(s) available for ${product.name}.`);
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (!existing) {
        return [
          ...current,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            imageUrl: product.imageUrl,
          },
        ];
      }

      return current.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, imageUrl: product.imageUrl || item.imageUrl }
          : item,
      );
    });
    setMessage(`${product.name} added to cart.`);
  }

  function handleCartQuantity(id: string, nextQuantity: number) {
    if (nextQuantity <= 0) {
      setCart((current) => current.filter((item) => item.id !== id));
      return;
    }

    const product = products.find((item) => item.id === id);
    if (!product) return;

    setCart((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        return { ...item, quantity: Math.min(nextQuantity, product.stock) };
      }),
    );
  }

  function handleCheckout() {
    if (cart.length === 0) {
      setMessage("Cart is empty.");
      return;
    }

    if (!selectedMerchantId) {
      setMessage("Select a merchant first.");
      return;
    }

    if (realtimeStatus !== "live") {
      const pendingCheckout = createOfflineCheckoutRecord({
        merchantId: selectedMerchantId,
        cart,
      });
      setOfflineCheckouts((current) => [...current, pendingCheckout]);
      setCart([]);
      setMessage("Checkout saved to localhost. It will auto-submit when realtime is live.");
      return;
    }

    void checkoutEasyPos({
      merchantId: selectedMerchantId,
      cart,
    })
      .then((payload) => {
        setProducts(payload.state?.products || []);
        setSales(payload.state?.sales || []);
        setInventoryEvents(payload.state?.inventoryEvents || []);
        setCart([]);
        if (payload.sale) {
          setActiveReceipt(payload.sale);
          setReceiptReturnTab("pos");
          setActiveTab("receipt");
          setMessage(`Checkout completed. Total paid: RM ${Number(payload.sale.total || 0).toFixed(2)}.`);
        } else {
          setMessage("Checkout completed.");
        }
      })
      .catch((checkoutError) => {
        setMessage(checkoutError instanceof Error ? checkoutError.message : "Checkout failed.");
      });
  }

  function handleDownloadReceipt(sale: SaleRecord) {
    generateReceipt(sale, merchantForm);
    setMessage(`Receipt downloaded for ${sale.id}.`);
  }

  function handleOpenReceipt(sale: SaleRecord, returnTab: MainTabId) {
    setActiveReceipt(sale);
    setReceiptReturnTab(returnTab);
    setActiveTab("receipt");
  }

  function handleSaveMerchant() {
    saveMerchantProfile(merchantForm);
    saveEasyPosSettings(settings);

    if (!selectedMerchantId) {
      setMessage("Settings saved.");
      return;
    }
    if (!ensureRealtimeLive("save settings")) {
      return;
    }

    Promise.all([
      updateEasyPosMerchant({
        merchantId: selectedMerchantId,
        merchant: merchantForm,
      }),
      updateEasyPosSettings({
        merchantId: selectedMerchantId,
        settings,
      }),
    ])
      .then(([merchantPayload, settingsPayload]) => {
        setMerchantForm(merchantPayload.state?.merchant || merchantForm);
        setSettings((current) => ({
          ...current,
          ...(settingsPayload.state?.settings || settings),
          lastMerchantId: selectedMerchantId,
        }));
        setMerchants((current) =>
          current.map((merchant) =>
            merchant.id === selectedMerchantId
              ? {
                  ...merchant,
                  name: merchantForm.name,
                  registrationNumber: merchantForm.registrationNumber,
                  phone: merchantForm.phone,
                  email: merchantForm.email,
                  address: merchantForm.address,
                  footerNote: merchantForm.footerNote,
                }
              : merchant,
          ),
        );
        setMessage("Settings saved.");
      })
      .catch((saveError) => {
        setMessage(saveError instanceof Error ? saveError.message : "Failed to save settings.");
      });
  }

  async function handleSelectMerchant(merchantId: number) {
    setSelectedMerchantId(merchantId);
    setSettings((current) => ({ ...current, lastMerchantId: merchantId }));

    try {
      await hydrateMerchantState(merchantId);
    } catch {
      setMessage("Failed to load merchant state.");
    }
  }

  function handleSelectMerchantOption(value: string) {
    if (value === "__add__") {
      setActiveTab("settings");
      return;
    }

    const merchantId = Number(value);
    if (!Number.isNaN(merchantId) && merchantId > 0) {
      void handleSelectMerchant(merchantId);
    }
  }

  async function handleCreateMerchant() {
    try {
      const merchant = await createEasyPosMerchant(createMerchantForm);
      setMerchants((current) => {
        const withoutDuplicate = current.filter((item) => item.id !== merchant.id);
        return [...withoutDuplicate, merchant];
      });
      setCreateMerchantForm({
        name: "",
        registrationNumber: "",
        phone: "",
        email: "",
        address: "",
        footerNote: "Thank you for your purchase.",
      });
      await handleSelectMerchant(merchant.id);
      setLastMainTab("summary");
      setActiveTab("summary");
      setMessage(`Merchant ${merchant.name} created.`);
    } catch (createError) {
      setMessage(
        createError instanceof Error ? createError.message : "Failed to create merchant.",
      );
    }
  }

  async function handleAddMerchantMember() {
    if (!selectedMerchantId) {
      setMessage("Select a merchant first.");
      return;
    }
    if (!ensureRealtimeLive("add merchant member")) {
      return;
    }

    const username = memberUsername.trim();
    if (!username) {
      setMessage("Enter a username to add as merchant member.");
      return;
    }

    try {
      const payload = await addEasyPosMerchantMember({
        merchantId: selectedMerchantId,
        username,
      });
      const members = await loadEasyPosMerchantMembers(selectedMerchantId);
      setMerchantMembers(members);
      setMemberUsername("");
      setMessage(payload.message || "Merchant member added.");
    } catch (memberError) {
      setMessage(
        memberError instanceof Error ? memberError.message : "Failed to add merchant member.",
      );
    }
  }

  async function handleRemoveMerchant() {
    if (!selectedMerchantId) {
      setMessage("Select a merchant first.");
      return;
    }
    if (!ensureRealtimeLive("remove merchant")) {
      return;
    }

    const merchantIdToRemove = selectedMerchantId;

    try {
      const payload = await deleteEasyPosMerchant(merchantIdToRemove);
      const nextMerchants = merchants.filter((merchant) => merchant.id !== merchantIdToRemove);
      setMerchants(nextMerchants);
      setMerchantMembers([]);
      setActiveReceipt(null);

      const nextMerchantId = nextMerchants[0]?.id || null;
      setSelectedMerchantId(nextMerchantId);
      setSettings((current) => ({ ...current, lastMerchantId: nextMerchantId }));

      if (nextMerchantId) {
        await handleSelectMerchant(nextMerchantId);
        handleSetMainTab("summary");
      }

      setMessage(payload.message || "Merchant removed.");
    } catch (removeError) {
      setMessage(
        removeError instanceof Error ? removeError.message : "Failed to remove merchant.",
      );
    }
  }

  async function handleRemoveMerchantMember(member: EasyPosMerchantMember) {
    if (!selectedMerchantId) {
      setMessage("Select a merchant first.");
      return;
    }
    if (!ensureRealtimeLive("remove merchant member")) {
      return;
    }

    try {
      const payload = await removeEasyPosMerchantMember({
        merchantId: selectedMerchantId,
        userId: member.userId,
      });
      const members = await loadEasyPosMerchantMembers(selectedMerchantId);
      setMerchantMembers(members);
      setMessage(payload.message || `${member.username} removed from merchant.`);
    } catch (removeMemberError) {
      setMessage(
        removeMemberError instanceof Error
          ? removeMemberError.message
          : "Failed to remove merchant member.",
      );
    }
  }

  function handleExit() {
    document.documentElement.style.background = "";
    document.documentElement.style.backgroundColor = "";
    document.body.style.background = "";
    document.body.style.backgroundColor = "";
    navigate("/dashboard");
  }

  if (loading) {
    return (
      <div className="easypos-screen easypos-screen-loading min-h-screen bg-[var(--easypos-bg)] text-[var(--easypos-text)]">
        <div className="easypos-loading-shell mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
          <div className="easypos-loading-card rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-panel)] px-6 py-5 text-sm text-[var(--easypos-muted)]">
            Loading EasyPOS...
          </div>
        </div>
      </div>
    );
  }

  if (error === "Not authenticated.") {
    return (
      <div className="easypos-screen easypos-screen-unauthorized min-h-screen bg-[var(--easypos-bg)] px-6 py-16 text-[var(--easypos-text)]">
        <div className="easypos-auth-card mx-auto max-w-xl rounded-3xl border border-[var(--easypos-border)] bg-[var(--easypos-panel)] p-8 text-center backdrop-blur-xl">
          <p className="easypos-auth-kicker text-xs font-bold uppercase tracking-[0.2em] text-[var(--easypos-accent)]">
            Access Required
          </p>
          <h1 className="easypos-auth-title mt-4 text-3xl font-bold">Login first to use EasyPOS.</h1>
          <p className="easypos-auth-copy mt-3 text-sm text-[var(--easypos-muted)]">
            This POS dashboard is only available for authenticated users.
          </p>
          <a
            href="/"
            className="easypos-auth-home-link mt-6 inline-flex rounded-xl bg-[var(--easypos-button-primary)] px-5 py-3 font-bold text-[var(--easypos-button-primary-text)]"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  if (isMerchantBootstrapping) {
    return (
      <div className="easypos-screen easypos-screen-loading min-h-screen bg-[var(--easypos-bg)] text-[var(--easypos-text)]">
        <div className="easypos-loading-shell mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
          <div className="easypos-loading-card rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-panel)] px-6 py-5 text-sm text-[var(--easypos-muted)]">
            Loading merchants...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`easypos-theme easypos-screen easypos-screen-main min-h-screen text-[var(--easypos-text)] ${settings.darkMode ? "easypos-theme-dark" : "easypos-theme-light"}`}
      style={themeVars}
    >
      <div className="absolute inset-0 bg-[var(--easypos-bg)]" />
      <div className="relative">
      <div className="easypos-shell mx-auto max-w-7xl px-6 py-8 lg:px-10">
        {selectedMerchantId ? (
          <EasyPosHeader
            activeTab={activeTab}
            onSelectTab={handleHeaderTabSelect}
            onOpenSettings={() => setActiveTab("settings")}
            merchants={merchants}
            selectedMerchantId={selectedMerchantId}
            onSelectMerchantOption={handleSelectMerchantOption}
            realtimeStatus={realtimeStatus}
            offlineCheckoutCount={offlineCheckouts.length}
            tokenBalance={tokenBalance}
            defaultMaxToken={defaultMaxToken}
          />
        ) : null}

        {message ? (
          <div className="easypos-message-banner mt-6 rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-panel)] px-4 py-3 text-sm text-[var(--easypos-accent-soft)]">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <span>{message.text}</span>
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--easypos-muted)]">
                {message.timeLabel}
              </span>
            </div>
          </div>
        ) : null}

        {!selectedMerchantId ? (
          <div className="easypos-merchant-gate mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="easypos-panel rounded-[28px] border border-[var(--easypos-border)] bg-[var(--easypos-panel)] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--easypos-accent-soft)]">
                Select Merchant
              </p>
              <div className="mt-5 flex flex-col gap-3">
                {merchants.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--easypos-border)] px-4 py-6 text-sm text-[var(--easypos-muted)]">
                    No merchant found for this account yet. Create one to start EasyPos.
                  </div>
                ) : (
                  merchants.map((merchant) => (
                    <button
                      key={merchant.id}
                      type="button"
                      onClick={() => void handleSelectMerchant(merchant.id)}
                      className="rounded-2xl border border-[var(--easypos-border)] bg-[var(--easypos-surface)] px-4 py-4 text-left"
                    >
                      <p className="text-base font-bold text-[var(--easypos-text)]">{merchant.name}</p>
                      <p className="mt-1 text-sm text-[var(--easypos-muted)]">
                        {merchant.role} · owner #{merchant.merchant_owner_id}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="easypos-panel rounded-[28px] border border-[var(--easypos-border)] bg-[var(--easypos-panel)] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--easypos-accent-soft)]">
                Create Merchant
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input
                  value={createMerchantForm.name}
                  onChange={(event) =>
                    setCreateMerchantForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Merchant name"
                  className="rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-input-bg)] px-4 py-3 text-sm text-[var(--easypos-text)] outline-none"
                />
                <input
                  value={createMerchantForm.registrationNumber}
                  onChange={(event) =>
                    setCreateMerchantForm((current) => ({
                      ...current,
                      registrationNumber: event.target.value,
                    }))
                  }
                  placeholder="Registration number"
                  className="rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-input-bg)] px-4 py-3 text-sm text-[var(--easypos-text)] outline-none"
                />
                <input
                  value={createMerchantForm.phone}
                  onChange={(event) =>
                    setCreateMerchantForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  placeholder="Phone"
                  className="rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-input-bg)] px-4 py-3 text-sm text-[var(--easypos-text)] outline-none"
                />
                <input
                  value={createMerchantForm.email}
                  onChange={(event) =>
                    setCreateMerchantForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="Email"
                  className="rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-input-bg)] px-4 py-3 text-sm text-[var(--easypos-text)] outline-none"
                />
                <textarea
                  value={createMerchantForm.address}
                  onChange={(event) =>
                    setCreateMerchantForm((current) => ({ ...current, address: event.target.value }))
                  }
                  rows={3}
                  placeholder="Address"
                  className="rounded-xl border border-[var(--easypos-border)] bg-[var(--easypos-input-bg)] px-4 py-3 text-sm text-[var(--easypos-text)] outline-none md:col-span-2"
                />
                <button
                  type="button"
                  onClick={() => void handleCreateMerchant()}
                  className="rounded-xl bg-[var(--easypos-button-primary)] px-5 py-3 text-sm font-bold text-[var(--easypos-button-primary-text)] md:col-span-2 md:w-fit"
                >
                  Create Merchant
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "summary" && selectedMerchantId ? (
          <EasyPosSummaryTab
            products={products}
            summary={summary}
            dailySalesChart={dailySalesChart}
          />
        ) : null}

        {activeTab === "manage" && selectedMerchantId ? (
          <EasyPosManageTab
            products={products}
            productForm={productForm}
            setProductForm={setProductForm}
            onAddProduct={handleAddProduct}
            onProductChange={handleProductChange}
            stockAdjustments={stockAdjustments}
            setStockAdjustments={setStockAdjustments}
          onStockIn={handleStockIn}
          onDamage={handleDamage}
          onRemoveProduct={handleRemoveProduct}
          onUploadProductImage={handleUploadProductImage}
        />
      ) : null}

        {activeTab === "sales" && selectedMerchantId ? (
          <EasyPosSalesTab
            sales={sales}
            onOpenReceipt={(sale) => handleOpenReceipt(sale, "sales")}
          />
        ) : null}

        {activeTab === "pos" && selectedMerchantId ? (
          <EasyPosPosTab
            products={products}
            cart={cart}
            cartTotal={summary.cartTotal}
            onAddToCart={handleAddToCart}
            onCartQuantity={handleCartQuantity}
            onCheckout={handleCheckout}
          />
        ) : null}

        {activeTab === "offline_checkout_state" && selectedMerchantId ? (
          <EasyPosOfflineCheckoutTab
            offlineCheckouts={offlineCheckouts}
            merchants={merchants}
          />
        ) : null}

        {activeTab === "settings" && selectedMerchantId ? (
        <EasyPosSettingsPage
          merchants={merchants}
          selectedMerchantId={selectedMerchantId}
          merchantName={
            merchants.find((merchant) => merchant.id === selectedMerchantId)?.name ||
            "Unknown Merchant"
          }
          merchantRole={
            merchants.find((merchant) => merchant.id === selectedMerchantId)?.role || "member"
          }
          merchantForm={merchantForm}
          createMerchantForm={createMerchantForm}
          merchantMembers={merchantMembers}
          memberUsername={memberUsername}
          setMerchantForm={setMerchantForm}
          setCreateMerchantForm={setCreateMerchantForm}
          setMemberUsername={setMemberUsername}
          settings={settings}
          setSettings={setSettings}
          onSelectMerchant={(merchantId) => void handleSelectMerchant(merchantId)}
          onCreateMerchant={() => void handleCreateMerchant()}
          onAddMember={() => void handleAddMerchantMember()}
          onRemoveMember={(member) => void handleRemoveMerchantMember(member)}
          onRemoveMerchant={() => void handleRemoveMerchant()}
          onBack={() => setActiveTab(lastMainTab)}
          onSave={handleSaveMerchant}
          onExit={handleExit}
        />
      ) : null}

        {activeTab === "receipt" && activeReceipt ? (
        <EasyPosReceiptPage
          merchant={merchantForm}
          sale={activeReceipt}
          onBack={() => {
            setActiveReceipt(null);
            handleSetMainTab(receiptReturnTab);
          }}
          onDownload={() => handleDownloadReceipt(activeReceipt)}
        />
      ) : null}
      </div>
      </div>
    </div>
  );
}
