import { rootAdminUsername } from "../config";
import { json, normalizeText, parseJsonBody } from "../http";
import type { AdminUserRow, Env } from "../types";
import { requireRootAdmin, sha256 } from "../users/session";

export async function handleAdminUsers(request: Request, env: Env) {
  const adminCheck = await requireRootAdmin(request, env.my_db);

  if (adminCheck.error) {
    return adminCheck.error;
  }

  const results = await env.my_db
    .prepare(
      "SELECT id, username, display_name, email, phone, token_balance, token_refreshed_at, default_max_token, max_product, created_at FROM users ORDER BY created_at DESC",
    )
    .all<AdminUserRow>();

  return json({
    ok: true,
    users: (results.results || []).map((user) => ({
      ...user,
      token_balance: Number(user.token_balance || 0),
      default_max_token: Number(user.default_max_token || 5000),
      max_product: Number(user.max_product || 100),
      protected: user.username === rootAdminUsername,
    })),
  });
}

export async function handleAdminDeleteUser(request: Request, env: Env) {
  const adminCheck = await requireRootAdmin(request, env.my_db);

  if (adminCheck.error) {
    return adminCheck.error;
  }

  const body = await parseJsonBody(request);
  const username = normalizeText(body?.username);

  if (!username) {
    return json(
      { ok: false, message: "Username is required." },
      { status: 400 },
    );
  }

  if (username === rootAdminUsername) {
    return json(
      { ok: false, message: "The yukang account is protected." },
      { status: 403 },
    );
  }

  const existingUser = await env.my_db
    .prepare("SELECT id, default_max_token FROM users WHERE username = ?")
    .bind(username)
    .first<{ id: number; default_max_token: number | null }>();

  if (!existingUser) {
    return json(
      { ok: false, message: "User not found." },
      { status: 404 },
    );
  }

  await env.my_db
    .prepare("DELETE FROM users WHERE username = ?")
    .bind(username)
    .run();

  return json({
    ok: true,
    message: `User ${username} removed.`,
  });
}

export async function handleAdminResetPassword(request: Request, env: Env) {
  const adminCheck = await requireRootAdmin(request, env.my_db);

  if (adminCheck.error) {
    return adminCheck.error;
  }

  const body = await parseJsonBody(request);
  const username = normalizeText(body?.username);
  const password = normalizeText(body?.password);

  if (!username || !password) {
    return json(
      { ok: false, message: "Username and password are required." },
      { status: 400 },
    );
  }

  if (username === rootAdminUsername) {
    return json(
      { ok: false, message: "The yukang account is protected." },
      { status: 403 },
    );
  }

  if (password.length < 6) {
    return json(
      { ok: false, message: "Password must be at least 6 characters." },
      { status: 400 },
    );
  }

  const existingUser = await env.my_db
    .prepare("SELECT id, default_max_token FROM users WHERE username = ?")
    .bind(username)
    .first<{ id: number; default_max_token: number | null }>();

  if (!existingUser) {
    return json(
      { ok: false, message: "User not found." },
      { status: 404 },
    );
  }

  await env.my_db
    .prepare(
      "UPDATE users SET password_hash = ?, session_token = NULL, session_expires_at = NULL WHERE username = ?",
    )
    .bind(await sha256(password), username)
    .run();

  return json({
    ok: true,
    message: `Password reset for ${username}.`,
  });
}

export async function handleAdminRefreshUserTokens(request: Request, env: Env) {
  const adminCheck = await requireRootAdmin(request, env.my_db);

  if (adminCheck.error) {
    return adminCheck.error;
  }

  const body = await parseJsonBody(request);
  const username = normalizeText(body?.username);

  if (!username) {
    return json(
      { ok: false, message: "Username is required." },
      { status: 400 },
    );
  }

  const existingUser = await env.my_db
    .prepare("SELECT id, default_max_token FROM users WHERE username = ?")
    .bind(username)
    .first<{ id: number; default_max_token: number | null }>();

  if (!existingUser) {
    return json(
      { ok: false, message: "User not found." },
      { status: 404 },
    );
  }

  const refreshedAt = new Date().toISOString();
  const defaultMaxToken = Number(existingUser.default_max_token || 5000);

  await env.my_db
    .prepare(
      "UPDATE users SET token_balance = ?, token_refreshed_at = ? WHERE username = ?",
    )
    .bind(defaultMaxToken, refreshedAt, username)
    .run();

  return json({
    ok: true,
    message: `Token quota refreshed for ${username}.`,
    token_balance: defaultMaxToken,
    token_refreshed_at: refreshedAt,
  });
}

export async function handleAdminUpdateUserMaxProduct(request: Request, env: Env) {
  const adminCheck = await requireRootAdmin(request, env.my_db);

  if (adminCheck.error) {
    return adminCheck.error;
  }

  const body = await parseJsonBody(request);
  const username = normalizeText(body?.username);
  const maxProduct = Number(body?.max_product);

  if (!username || Number.isNaN(maxProduct) || maxProduct < 0) {
    return json(
      { ok: false, message: "username and valid max_product are required." },
      { status: 400 },
    );
  }

  const existingUser = await env.my_db
    .prepare("SELECT id FROM users WHERE username = ?")
    .bind(username)
    .first<{ id: number }>();

  if (!existingUser) {
    return json(
      { ok: false, message: "User not found." },
      { status: 404 },
    );
  }

  await env.my_db
    .prepare("UPDATE users SET max_product = ? WHERE username = ?")
    .bind(Math.floor(maxProduct), username)
    .run();

  return json({
    ok: true,
    message: `Max product updated for ${username}.`,
    max_product: Math.floor(maxProduct),
  });
}

export async function handleAdminUpdateUserDefaultMaxToken(request: Request, env: Env) {
  const adminCheck = await requireRootAdmin(request, env.my_db);

  if (adminCheck.error) {
    return adminCheck.error;
  }

  const body = await parseJsonBody(request);
  const username = normalizeText(body?.username);
  const defaultMaxToken = Number(body?.default_max_token);

  if (!username || Number.isNaN(defaultMaxToken) || defaultMaxToken < 0) {
    return json(
      { ok: false, message: "username and valid default_max_token are required." },
      { status: 400 },
    );
  }

  const existingUser = await env.my_db
    .prepare("SELECT id FROM users WHERE username = ?")
    .bind(username)
    .first<{ id: number }>();

  if (!existingUser) {
    return json(
      { ok: false, message: "User not found." },
      { status: 404 },
    );
  }

  await env.my_db
    .prepare("UPDATE users SET default_max_token = ? WHERE username = ?")
    .bind(Math.floor(defaultMaxToken), username)
    .run();

  return json({
    ok: true,
    message: `Default max token updated for ${username}.`,
    default_max_token: Math.floor(defaultMaxToken),
  });
}
