import { corsHeaders } from "./config";
import {
  handleAdminDeleteUser,
  handleAdminRefreshUserTokens,
  handleAdminResetPassword,
  handleAdminUpdateUserDefaultMaxToken,
  handleAdminUpdateUserMaxProduct,
  handleAdminUsers,
} from "./handlers/admin";
import {
  handleLogin,
  handleLogout,
  handleMe,
  handleRegister,
} from "./handlers/auth";
import {
  handleEasyPosDashboardGet,
  handleEasyPosCheckout,
  handleEasyPosDamage,
  handleEasyPosMerchantDelete,
  handleEasyPosMerchantMemberAdd,
  handleEasyPosMerchantMemberRemove,
  handleEasyPosMerchantMembersGet,
  handleEasyPosMerchantCreate,
  handleEasyPosMerchantUpdate,
  handleEasyPosMerchantsGet,
  handleEasyPosProductDelete,
  handleEasyPosProductImageUpload,
  handleEasyPosProductUpsert,
  handleEasyPosPublicReceiptGet,
  handleEasyPosRealtimeConnect,
  handleEasyPosSettingsUpdate,
  handleEasyPosStockIn,
  handleEasyPosStateGet,
} from "./handlers/easypos";
import { handleProfileImageUpload, handleProfileUpdate } from "./handlers/profile";
import { json } from "./http";
import type { Env } from "./types";
import { consumeUserTokenForPost } from "./users/session";

export async function handleApiRequest(
  request: Request,
  env: Env,
  url: URL,
) {
  if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (url.pathname === "/api") {
    return json({ ok: true });
  }

  const isPost = request.method === "POST";
  const tokenExemptPostPaths = new Set([
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/logout",
  ]);

  if (isPost && url.pathname.startsWith("/api/") && !tokenExemptPostPaths.has(url.pathname)) {
    const tokenCheck = await consumeUserTokenForPost(request, env.my_db);
    if (tokenCheck.error) {
      return tokenCheck.error;
    }
  }

  if (url.pathname === "/api/auth/register" && request.method === "POST") {
    return handleRegister(request, env);
  }

  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    return handleLogin(request, env);
  }

  if (url.pathname === "/api/auth/me" && request.method === "GET") {
    return handleMe(request, env);
  }

  if (url.pathname === "/api/auth/logout" && request.method === "POST") {
    return handleLogout(request, env);
  }

  if (url.pathname === "/api/profile" && request.method === "POST") {
    return handleProfileUpdate(request, env);
  }

  if (url.pathname === "/api/profile/image" && request.method === "POST") {
    return handleProfileImageUpload(request, env);
  }

  if (url.pathname === "/api/easypos/state" && request.method === "GET") {
    return handleEasyPosStateGet(request, env);
  }

  if (url.pathname === "/api/easypos/state" && request.method === "POST") {
    return json(
      {
        ok: false,
        message: "POST /api/easypos/state has been retired. Use EasyPOS resource endpoints instead.",
      },
      { status: 410 },
    );
  }

  if (url.pathname === "/api/easypos/merchants" && request.method === "GET") {
    return handleEasyPosMerchantsGet(request, env);
  }

  if (url.pathname === "/api/easypos/merchants" && request.method === "POST") {
    return handleEasyPosMerchantCreate(request, env);
  }

  if (url.pathname === "/api/easypos/merchant/update" && request.method === "POST") {
    return handleEasyPosMerchantUpdate(request, env);
  }

  if (url.pathname === "/api/easypos/merchant/delete" && request.method === "POST") {
    return handleEasyPosMerchantDelete(request, env);
  }

  if (url.pathname === "/api/easypos/merchant/members" && request.method === "GET") {
    return handleEasyPosMerchantMembersGet(request, env);
  }

  if (url.pathname === "/api/easypos/merchant/members/add" && request.method === "POST") {
    return handleEasyPosMerchantMemberAdd(request, env);
  }

  if (url.pathname === "/api/easypos/merchant/members/remove" && request.method === "POST") {
    return handleEasyPosMerchantMemberRemove(request, env);
  }

  if (url.pathname === "/api/easypos/settings/update" && request.method === "POST") {
    return handleEasyPosSettingsUpdate(request, env);
  }

  if (url.pathname === "/api/easypos/dashboard" && request.method === "GET") {
    return handleEasyPosDashboardGet(request, env);
  }

  if (url.pathname === "/api/easypos/realtime" && request.method === "GET") {
    return handleEasyPosRealtimeConnect(request, env);
  }

  if (url.pathname === "/easypos/receipt" && request.method === "GET") {
    return handleEasyPosPublicReceiptGet(request, env);
  }

  if (url.pathname === "/api/easypos/product/upsert" && request.method === "POST") {
    return handleEasyPosProductUpsert(request, env);
  }

  if (url.pathname === "/api/easypos/product/delete" && request.method === "POST") {
    return handleEasyPosProductDelete(request, env);
  }

  if (url.pathname === "/api/easypos/product/image" && request.method === "POST") {
    return handleEasyPosProductImageUpload(request, env);
  }

  if (url.pathname === "/api/easypos/stock-in" && request.method === "POST") {
    return handleEasyPosStockIn(request, env);
  }

  if (url.pathname === "/api/easypos/damage" && request.method === "POST") {
    return handleEasyPosDamage(request, env);
  }

  if (url.pathname === "/api/easypos/checkout" && request.method === "POST") {
    return handleEasyPosCheckout(request, env);
  }

  if (url.pathname === "/api/admin/users" && request.method === "GET") {
    return handleAdminUsers(request, env);
  }

  if (url.pathname === "/api/admin/users/delete" && request.method === "POST") {
    return handleAdminDeleteUser(request, env);
  }

  if (
    url.pathname === "/api/admin/users/reset-password" &&
    request.method === "POST"
  ) {
    return handleAdminResetPassword(request, env);
  }

  if (
    url.pathname === "/api/admin/users/refresh-tokens" &&
    request.method === "POST"
  ) {
    return handleAdminRefreshUserTokens(request, env);
  }

  if (
    url.pathname === "/api/admin/users/max-product" &&
    request.method === "POST"
  ) {
    return handleAdminUpdateUserMaxProduct(request, env);
  }

  if (
    url.pathname === "/api/admin/users/default-max-token" &&
    request.method === "POST"
  ) {
    return handleAdminUpdateUserDefaultMaxToken(request, env);
  }

  if (url.pathname.startsWith("/api/")) {
    return json(
      { ok: false, message: "API route not found." },
      { status: 404 },
    );
  }

  return null;
}
