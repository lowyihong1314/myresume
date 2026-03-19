import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadEasyPosDashboard } from "../data/easyposApi.ts";
import { qr_generator } from "../tools/qr_generator";
import { barcode_generator } from "../tools/barcode_generator";
import { heic_to_jpg } from "../tools/heic_to_jpg";

const toolActions = {
  qr: qr_generator,
  barcode: barcode_generator,
  heic: heic_to_jpg,
};

async function fetchJson(path, options = {}) {
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

function Field({ label, value, onChange, placeholder, type = "text", readOnly = false }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className="rounded-xl border border-white/10 bg-[rgba(15,23,42,0.9)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--color-accent)]"
      />
    </label>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const realtimeSocketRef = useRef(null);
  const profileImageInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [salesSummary, setSalesSummary] = useState({
    dailyTotal: 0,
    dailyCount: 0,
    dailyItems: 0,
    recentSales: [],
    todayInventoryEvents: 0,
  });
  const [easyPosMerchants, setEasyPosMerchants] = useState([]);
  const [activeMerchantId, setActiveMerchantId] = useState(null);
  const [easyPosRealtimeStatus, setEasyPosRealtimeStatus] = useState("offline");
  const [tools, setTools] = useState([]);
  const [isRootAdmin, setIsRootAdmin] = useState(false);
  const [managedUsers, setManagedUsers] = useState([]);
  const [maxProductDrafts, setMaxProductDrafts] = useState({});
  const [defaultMaxTokenDrafts, setDefaultMaxTokenDrafts] = useState({});
  const [resetPasswordDrafts, setResetPasswordDrafts] = useState({});
  const [form, setForm] = useState({
    username: "",
    display_name: "",
    email: "",
    phone: "",
    token_balance: 0,
    token_refreshed_at: "",
    default_max_token: 5000,
    currentPassword: "",
    password: "",
  });

  useEffect(() => {
    let alive = true;

    async function loadProfile() {
      try {
        const payload = await fetchJson("/api/auth/me", { method: "GET" });
        if (!alive) return;

        setForm((current) => ({
          ...current,
          username: payload.user.username || "",
          display_name: payload.user.display_name || "",
          email: payload.user.email || "",
          phone: payload.user.phone || "",
          avatar_image_url: payload.user.avatar_image_url || "",
          token_balance: Number(payload.user.token_balance || 0),
          token_refreshed_at: payload.user.token_refreshed_at || "",
          default_max_token: Number(payload.user.default_max_token || 5000),
          currentPassword: "",
          password: "",
        }));
        setTools(payload.tools || []);
        setIsRootAdmin(Boolean(payload.admin?.is_root_admin));
        setError("");
      } catch (loadError) {
        if (!alive) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load profile.");
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    loadEasyPosDashboard()
      .then((payload) => {
        setEasyPosMerchants(payload.merchants || []);
        setActiveMerchantId(payload.activeMerchantId || null);
        setSalesSummary(
          payload.summary || {
            dailyTotal: 0,
            dailyCount: 0,
            dailyItems: 0,
            recentSales: [],
            todayInventoryEvents: 0,
          },
        );
      })
      .catch(() => {
        setEasyPosMerchants([]);
        setActiveMerchantId(null);
      });
  }, []);

  async function handleSelectEasyPosMerchant(merchantId) {
    const payload = await loadEasyPosDashboard(merchantId);
    setEasyPosMerchants(payload.merchants || []);
    setActiveMerchantId(payload.activeMerchantId || merchantId);
    setSalesSummary(
      payload.summary || {
        dailyTotal: 0,
        dailyCount: 0,
        dailyItems: 0,
        recentSales: [],
        todayInventoryEvents: 0,
      },
    );
  }

  useEffect(() => {
    if (!activeMerchantId || loading || error === "Not authenticated.") {
      setEasyPosRealtimeStatus("offline");
      return;
    }

    let cancelled = false;
    let reconnectTimer = null;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/easypos/realtime?merchant_id=${activeMerchantId}`;

    const connect = () => {
      if (cancelled) {
        return;
      }

      setEasyPosRealtimeStatus("reconnecting");
      const socket = new WebSocket(wsUrl);
      realtimeSocketRef.current = socket;

      socket.onopen = () => {
        setEasyPosRealtimeStatus("live");
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (
            payload.type === "realtime.connected" ||
            payload.type === "pong" ||
            payload.type === "error" ||
            payload.merchantId !== activeMerchantId
          ) {
            return;
          }

          void handleSelectEasyPosMerchant(activeMerchantId);
        } catch {
          // ignore malformed realtime payloads
        }
      };

      socket.onclose = () => {
        if (cancelled) {
          return;
        }

        setEasyPosRealtimeStatus("reconnecting");
        reconnectTimer = window.setTimeout(() => {
          connect();
        }, 1500);
      };

      socket.onerror = () => {
        setEasyPosRealtimeStatus("reconnecting");
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
      setEasyPosRealtimeStatus("offline");
    };
  }, [activeMerchantId, loading, error]);

  async function loadManagedUsers() {
    const payload = await fetchJson("/api/admin/users", { method: "GET" });
    setManagedUsers(payload.users || []);
    setMaxProductDrafts(
      Object.fromEntries(
        (payload.users || []).map((user) => [user.username, String(user.max_product ?? 100)]),
      ),
    );
    setDefaultMaxTokenDrafts(
      Object.fromEntries(
        (payload.users || []).map((user) => [
          user.username,
          String(user.default_max_token ?? 5000),
        ]),
      ),
    );
  }

  useEffect(() => {
    if (!isRootAdmin) {
      setManagedUsers([]);
      return;
    }

    loadManagedUsers().catch((loadError) => {
      setAdminError(
        loadError instanceof Error ? loadError.message : "Failed to load users.",
      );
    });
  }, [isRootAdmin]);

  async function handleSave(event) {
    event.preventDefault();
    setSaveMessage("");

    try {
      const payload = await fetchJson("/api/profile", {
        method: "POST",
        body: JSON.stringify({
          display_name: form.display_name,
          email: form.email,
          phone: form.phone,
          currentPassword: form.currentPassword,
          password: form.password,
        }),
      });

      setForm((current) => ({
        ...current,
        display_name: payload.user.display_name || "",
        email: payload.user.email || "",
        phone: payload.user.phone || "",
        avatar_image_url: payload.user.avatar_image_url || current.avatar_image_url || "",
        token_balance: Number(payload.user.token_balance || current.token_balance || 0),
        token_refreshed_at: payload.user.token_refreshed_at || current.token_refreshed_at || "",
        default_max_token: Number(payload.user.default_max_token || current.default_max_token || 5000),
        currentPassword: "",
        password: "",
      }));
      setSaveMessage(payload.message || "Profile updated.");
      setError("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update profile.");
    }
  }

  const tokenProgressPercent =
    form.default_max_token > 0
      ? Math.max(0, Math.min(100, (Number(form.token_balance || 0) / Number(form.default_max_token || 1)) * 100))
      : 0;

  async function handleProfileImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSaveMessage("");
    setError("");
    setImageUploading(true);

    try {
      const body = new FormData();
      body.set("image", file);

      const response = await fetch("/api/profile/image", {
        method: "POST",
        body,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Failed to upload profile image.");
      }

      setForm((current) => ({
        ...current,
        avatar_image_url: payload.user?.avatar_image_url || current.avatar_image_url,
      }));
      setSaveMessage(payload.message || "Profile image uploaded.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Failed to upload profile image.",
      );
    } finally {
      setImageUploading(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  }

  async function handleLogout() {
    await fetchJson("/api/auth/logout", { method: "POST" });
    navigate("/");
  }

  async function handleDeleteUser(username) {
    setAdminMessage("");
    setAdminError("");

    try {
      const payload = await fetchJson("/api/admin/users/delete", {
        method: "POST",
        body: JSON.stringify({ username }),
      });
      setAdminMessage(payload.message || "User removed.");
      await loadManagedUsers();
    } catch (adminActionError) {
      setAdminError(
        adminActionError instanceof Error
          ? adminActionError.message
          : "Failed to remove user.",
      );
    }
  }

  async function handleResetPassword(username) {
    setAdminMessage("");
    setAdminError("");

    const password = resetPasswordDrafts[username] || "";
    if (!password || password.length < 6) {
      setAdminError("New password must be at least 6 characters.");
      return;
    }

    try {
      const payload = await fetchJson("/api/admin/users/reset-password", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setAdminMessage(payload.message || "Password reset complete.");
      setResetPasswordDrafts((current) => ({ ...current, [username]: "" }));
      await loadManagedUsers();
    } catch (adminActionError) {
      setAdminError(
        adminActionError instanceof Error
          ? adminActionError.message
          : "Failed to reset password.",
      );
    }
  }

  async function handleRefreshUserTokens(username) {
    setAdminMessage("");
    setAdminError("");

    try {
      const payload = await fetchJson("/api/admin/users/refresh-tokens", {
        method: "POST",
        body: JSON.stringify({ username }),
      });
      setAdminMessage(payload.message || "User tokens refreshed.");
      await loadManagedUsers();
    } catch (adminActionError) {
      setAdminError(
        adminActionError instanceof Error
          ? adminActionError.message
          : "Failed to refresh user tokens.",
      );
    }
  }

  async function handleUpdateUserMaxProduct(username) {
    setAdminMessage("");
    setAdminError("");

    const maxProduct = Number(maxProductDrafts[username]);
    if (Number.isNaN(maxProduct) || maxProduct < 0) {
      setAdminError("Max product must be 0 or higher.");
      return;
    }

    try {
      const payload = await fetchJson("/api/admin/users/max-product", {
        method: "POST",
        body: JSON.stringify({
          username,
          max_product: Math.floor(maxProduct),
        }),
      });
      setAdminMessage(payload.message || "Max product updated.");
      await loadManagedUsers();
    } catch (adminActionError) {
      setAdminError(
        adminActionError instanceof Error
          ? adminActionError.message
          : "Failed to update max product.",
      );
    }
  }

  async function handleUpdateUserDefaultMaxToken(username) {
    setAdminMessage("");
    setAdminError("");

    const defaultMaxToken = Number(defaultMaxTokenDrafts[username]);
    if (Number.isNaN(defaultMaxToken) || defaultMaxToken < 0) {
      setAdminError("Default max token must be 0 or higher.");
      return;
    }

    try {
      const payload = await fetchJson("/api/admin/users/default-max-token", {
        method: "POST",
        body: JSON.stringify({
          username,
          default_max_token: Math.floor(defaultMaxToken),
        }),
      });
      setAdminMessage(payload.message || "Default max token updated.");
      await loadManagedUsers();
    } catch (adminActionError) {
      setAdminError(
        adminActionError instanceof Error
          ? adminActionError.message
          : "Failed to update default max token.",
      );
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-dark)] text-white">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-[var(--color-text-secondary)]">
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  if (error === "Not authenticated.") {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#12233f_0%,#0a0f1c_55%)] px-6 py-16 text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Access Required
          </p>
          <h1 className="mt-4 text-3xl font-bold">Login first to enter your backend.</h1>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            Your session cookie is missing or expired.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-6 rounded-xl bg-[var(--color-accent)] px-5 py-3 font-bold text-[var(--color-bg-dark)]"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#143053_0%,#0a0f1c_60%)] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="mb-8 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-[rgba(10,15,28,0.72)] p-6 backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-accent)]">
              Backend
            </p>
            <h1 className="mt-3 text-3xl font-bold lg:text-4xl">
              Welcome, {form.display_name || form.username}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)]">
              Manage your account profile here, then launch more tools from the dashboard.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="min-w-[280px] rounded-xl border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    Token Progress
                  </p>
                  <p className="text-sm font-bold text-white">
                    {form.token_balance ?? 0} / {form.default_max_token ?? 5000}
                  </p>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-primary),#fbbf24)]"
                    style={{ width: `${tokenProgressPercent}%` }}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  Token Refreshed
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {form.token_refreshed_at
                    ? new Date(form.token_refreshed_at).toLocaleString()
                    : "Never"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
            >
              Home
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-[var(--color-bg-dark)]"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[28px] border border-[rgba(255,132,0,0.22)] bg-[linear-gradient(180deg,rgba(255,132,0,0.12),rgba(255,255,255,0.03))] p-6 lg:col-span-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">
              EasyPOS
            </p>
            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Daily Sales</h2>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  Merchant-level EasyPOS summary, separate from the generic tools list.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[rgba(10,15,28,0.52)] px-3 py-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      easyPosRealtimeStatus === "live"
                        ? "bg-emerald-400"
                        : easyPosRealtimeStatus === "reconnecting"
                          ? "bg-amber-400"
                          : "bg-slate-400"
                    }`}
                  />
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                    {easyPosRealtimeStatus === "live"
                      ? "Live"
                      : easyPosRealtimeStatus === "reconnecting"
                        ? "Reconnecting"
                        : "Offline"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/easypos")}
                  className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-[var(--color-bg-dark)]"
                >
                  Open EasyPOS
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {easyPosMerchants.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                  No EasyPOS merchant yet.
                </div>
              ) : (
                easyPosMerchants.map((merchant) => (
                  <button
                    key={merchant.id}
                    type="button"
                    onClick={() => handleSelectEasyPosMerchant(merchant.id)}
                    className={`rounded-xl px-4 py-3 text-sm font-bold ${
                      activeMerchantId === merchant.id
                        ? "bg-[var(--color-primary)] text-[var(--color-bg-dark)]"
                        : "border border-white/10 bg-white/5 text-white"
                    }`}
                  >
                    {merchant.name}
                  </button>
                ))
              )}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-[rgba(10,15,28,0.52)] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  Revenue
                </p>
                <p className="mt-3 text-2xl font-bold text-white">
                  RM {salesSummary.dailyTotal.toFixed(2)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[rgba(10,15,28,0.52)] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  Sales Count
                </p>
                <p className="mt-3 text-2xl font-bold text-white">{salesSummary.dailyCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[rgba(10,15,28,0.52)] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  Items Sold
                </p>
                <p className="mt-3 text-2xl font-bold text-white">{salesSummary.dailyItems}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[rgba(10,15,28,0.52)] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  Stock Events
                </p>
                <p className="mt-3 text-2xl font-bold text-white">
                  {salesSummary.todayInventoryEvents}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-bold text-white">Today&apos;s sales</p>
              <div className="mt-3 flex flex-col gap-3">
                {salesSummary.recentSales.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-[var(--color-text-secondary)]">
                    No sales recorded for today yet.
                  </div>
                ) : (
                  salesSummary.recentSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="rounded-2xl border border-white/10 bg-[rgba(10,15,28,0.52)] px-4 py-4"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-bold text-white">{sale.id}</p>
                          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                            {new Date(sale.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-6 text-sm">
                          <span className="text-[var(--color-text-secondary)]">
                            {sale.itemCount} item(s)
                          </span>
                          <span className="font-bold text-[var(--color-primary)]">
                            RM {sale.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Profile Settings
            </p>
            <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSave}>
              <div className="md:col-span-2 rounded-2xl border border-white/10 bg-[rgba(15,23,42,0.55)] p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="h-24 w-24 overflow-hidden rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.06)]">
                    {form.avatar_image_url ? (
                      <img
                        src={form.avatar_image_url}
                        alt={`${form.display_name || form.username} avatar`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[var(--color-text-muted)]">
                        {(form.display_name || form.username || "U").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                      User Image
                    </p>
                    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                      Upload a profile image to Cloudflare Images. The latest uploaded image becomes your account avatar.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <input
                        ref={profileImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => profileImageInputRef.current?.click()}
                        disabled={imageUploading}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {imageUploading ? "Uploading..." : "Upload User Image"}
                      </button>
                      {form.avatar_image_url ? (
                        <a
                          href={form.avatar_image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-[var(--color-accent)]"
                        >
                          Open current image
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
              <Field
                label="Username"
                value={form.username}
                onChange={() => {}}
                placeholder="Username"
                readOnly
              />
              <div className="rounded-xl border border-white/10 bg-[rgba(15,23,42,0.55)] px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                  Account Note
                </p>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  Username is fixed. You can change display name, email, phone, and password.
                </p>
              </div>
              <Field
                label="Display Name"
                value={form.display_name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, display_name: event.target.value }))
                }
                placeholder="How your name should appear"
              />
              <Field
                label="Email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="name@example.com"
              />
              <Field
                label="Phone"
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
                placeholder="+60..."
              />
              <div className="rounded-xl border border-dashed border-white/10 bg-[rgba(15,23,42,0.55)] px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                  Password Update
                </p>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  Leave both password fields empty if you only want to update contact info.
                </p>
              </div>
              <Field
                label="Current Password"
                type="password"
                value={form.currentPassword}
                onChange={(event) =>
                  setForm((current) => ({ ...current, currentPassword: event.target.value }))
                }
                placeholder="Required to change password"
              />
              <Field
                label="New Password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="At least 6 characters"
              />

              <div className="md:col-span-2 flex flex-col gap-3 pt-2">
                {error ? (
                  <div className="rounded-xl border border-[rgba(239,68,68,0.24)] bg-[rgba(239,68,68,0.12)] px-4 py-3 text-sm text-[var(--color-error)]">
                    {error}
                  </div>
                ) : null}
                {saveMessage ? (
                  <div className="rounded-xl border border-[rgba(34,197,94,0.24)] bg-[rgba(34,197,94,0.12)] px-4 py-3 text-sm text-[var(--color-success)]">
                    {saveMessage}
                  </div>
                ) : null}
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[var(--color-accent)] px-5 py-3 font-bold text-[var(--color-bg-dark)] md:w-fit"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(34,211,238,0.12),rgba(255,255,255,0.03))] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Tools
            </p>
            <h2 className="mt-3 text-2xl font-bold">More tools live here.</h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              This dashboard is the new entry point for utility tools after login.
            </p>

            <div className="mt-6 grid gap-4">
              {tools.map((tool) => {
                const action = toolActions[tool.id];
                const available = typeof action === "function";

                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => available && action()}
                    disabled={!available}
                    className="rounded-2xl border border-white/10 bg-[rgba(10,15,28,0.62)] p-4 text-left transition hover:border-[rgba(34,211,238,0.42)] disabled:cursor-default disabled:opacity-70"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-base font-bold text-white">{tool.label}</p>
                        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                          {available
                            ? "Open tool"
                            : "Reserved slot for the next wave of internal tools."}
                        </p>
                      </div>
                      <span className="rounded-full bg-[rgba(34,211,238,0.16)] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-accent)]">
                        {tool.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {isRootAdmin ? (
          <section className="mt-6 rounded-[28px] border border-[rgba(255,132,0,0.22)] bg-[linear-gradient(180deg,rgba(255,132,0,0.12),rgba(255,255,255,0.03))] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">
              Users Management
            </p>
            <h2 className="mt-3 text-2xl font-bold">Protected admin surface for yukang.</h2>
            <p className="mt-2 max-w-3xl text-sm text-[var(--color-text-secondary)]">
              You can remove accounts or force-reset passwords for other users. The
              `yukang` account is protected from deletion and password reset, but can refresh any user's token quota.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-[rgba(10,15,28,0.62)] p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Account List</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    Token, product quota, and password reset are managed directly on each account card.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAdminError("");
                    setAdminMessage("");
                    loadManagedUsers().catch((loadError) => {
                      setAdminError(
                        loadError instanceof Error
                          ? loadError.message
                          : "Failed to load users.",
                      );
                    });
                  }}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-accent)]"
                >
                  Refresh
                </button>
              </div>

              <div className="mt-5 flex flex-col gap-4">
                  {managedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(15,23,42,0.72))] p-5"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-base font-bold text-white">{user.username}</p>
                            {user.protected ? (
                              <span className="rounded-full bg-[rgba(255,132,0,0.18)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                                protected
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                            {user.display_name || "No display name"} · {user.email || "No email"} ·{" "}
                            {user.phone || "No phone"}
                          </p>
                          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                            Tokens: {user.token_balance ?? 0} · Refreshed:{" "}
                            {user.token_refreshed_at
                              ? new Date(user.token_refreshed_at).toLocaleString()
                              : "Never"}
                          </p>
                          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,180px)_auto] md:items-end">
                            <label className="flex flex-col gap-2">
                              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                                Default Max Token
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={
                                  defaultMaxTokenDrafts[user.username] ??
                                  String(user.default_max_token ?? 5000)
                                }
                                onChange={(event) =>
                                  setDefaultMaxTokenDrafts((current) => ({
                                    ...current,
                                    [user.username]: event.target.value,
                                  }))
                                }
                                className="w-36 rounded-xl border border-white/10 bg-[rgba(15,23,42,0.9)] px-4 py-3 text-sm text-white outline-none"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => handleUpdateUserDefaultMaxToken(user.username)}
                              className="rounded-xl border border-white/10 bg-[rgba(168,85,247,0.16)] px-4 py-3 text-sm font-bold text-fuchsia-300"
                            >
                              Save Default Token
                            </button>
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,160px)_auto] md:items-end">
                            <label className="flex flex-col gap-2">
                              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                                Max Product
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={maxProductDrafts[user.username] ?? String(user.max_product ?? 100)}
                                onChange={(event) =>
                                  setMaxProductDrafts((current) => ({
                                    ...current,
                                    [user.username]: event.target.value,
                                  }))
                                }
                                className="w-32 rounded-xl border border-white/10 bg-[rgba(15,23,42,0.9)] px-4 py-3 text-sm text-white outline-none"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => handleUpdateUserMaxProduct(user.username)}
                              className="rounded-xl border border-white/10 bg-[rgba(59,130,246,0.16)] px-4 py-3 text-sm font-bold text-sky-300"
                            >
                              Save Max Product
                            </button>
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,220px)_auto] md:items-end">
                            <label className="flex flex-col gap-2">
                              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                                Reset Password
                              </span>
                              <input
                                type="password"
                                value={resetPasswordDrafts[user.username] ?? ""}
                                onChange={(event) =>
                                  setResetPasswordDrafts((current) => ({
                                    ...current,
                                    [user.username]: event.target.value,
                                  }))
                                }
                                placeholder={user.protected ? "Protected account" : "At least 6 characters"}
                                disabled={user.protected}
                                className="rounded-xl border border-white/10 bg-[rgba(15,23,42,0.9)] px-4 py-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
                              />
                            </label>
                            <button
                              type="button"
                              disabled={user.protected}
                              onClick={() => handleResetPassword(user.username)}
                              className="rounded-xl border border-white/10 bg-[rgba(255,132,0,0.16)] px-4 py-3 text-sm font-bold text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Reset Password
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 xl:w-[220px] xl:justify-end">
                          <button
                            type="button"
                            onClick={() => handleRefreshUserTokens(user.username)}
                            className="rounded-xl border border-white/10 bg-[rgba(34,197,94,0.16)] px-4 py-3 text-sm font-bold text-[var(--color-success)]"
                          >
                            Refresh Tokens
                          </button>
                          <button
                            type="button"
                            disabled={user.protected}
                            onClick={() => handleDeleteUser(user.username)}
                            className="rounded-xl bg-[rgba(239,68,68,0.16)] px-4 py-3 text-sm font-bold text-[var(--color-error)] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Remove Account
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {adminError ? (
                <div className="rounded-xl border border-[rgba(239,68,68,0.24)] bg-[rgba(239,68,68,0.12)] px-4 py-3 text-sm text-[var(--color-error)]">
                  {adminError}
                </div>
              ) : null}
              {adminMessage ? (
                <div className="rounded-xl border border-[rgba(34,197,94,0.24)] bg-[rgba(34,197,94,0.12)] px-4 py-3 text-sm text-[var(--color-success)]">
                  {adminMessage}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
