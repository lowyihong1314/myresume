import { rootAdminUsername } from "../config";
import { json, normalizeText, parseJsonBody } from "../http";
import type { Env, UserRow } from "../types";
import {
  clearSessionCookie,
  generateSessionToken,
  getCurrentUser,
  isRootAdmin,
  makeSessionCookie,
  refreshUserTokenQuota,
  serializeUser,
  sessionExpiryIso,
  sha256,
} from "../users/session";

export async function handleRegister(request: Request, env: Env) {
  const body = await parseJsonBody(request);
  const username = normalizeText(body?.username);
  const password = normalizeText(body?.password);

  if (!username || !password) {
    return json(
      { ok: false, message: "Username and password are required." },
      { status: 400 },
    );
  }

  if (password.length < 6) {
    return json(
      { ok: false, message: "Password must be at least 6 characters." },
      { status: 400 },
    );
  }

  const passwordHash = await sha256(password);

  try {
    await env.my_db
      .prepare(
        "INSERT INTO users (username, password_hash, display_name, token_balance, token_refreshed_at, default_max_token, max_product) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(username, passwordHash, username, 5000, new Date().toISOString(), 5000, 100)
      .run();
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";

    if (message.includes("unique")) {
      return json(
        { ok: false, message: "Username already exists." },
        { status: 409 },
      );
    }

    return json(
      { ok: false, message: "Failed to register account." },
      { status: 500 },
    );
  }

  return json({
    ok: true,
    message: `Welcome, ${username}. Your account has been created.`,
  });
}

export async function handleLogin(request: Request, env: Env) {
  const body = await parseJsonBody(request);
  const username = normalizeText(body?.username);
  const password = normalizeText(body?.password);

  if (!username || !password) {
    return json(
      { ok: false, message: "Username and password are required." },
      { status: 400 },
    );
  }

  const passwordHash = await sha256(password);
  const user = await env.my_db
    .prepare(
      "SELECT id, username, display_name, email, phone, avatar_image_id, avatar_image_url, token_balance, token_refreshed_at, default_max_token, max_product, session_token, session_expires_at, created_at FROM users WHERE username = ? AND password_hash = ?",
    )
    .bind(username, passwordHash)
    .first<UserRow>();

  if (!user) {
    return json(
      { ok: false, message: "Invalid username or password." },
      { status: 401 },
    );
  }

  const token = generateSessionToken();
  const refreshedUser = await refreshUserTokenQuota(env.my_db, user);
  await env.my_db
    .prepare(
      "UPDATE users SET session_token = ?, session_expires_at = ? WHERE id = ?",
    )
    .bind(token, sessionExpiryIso(), user.id)
    .run();

  return json(
    {
      ok: true,
      message: `Welcome back, ${refreshedUser.display_name || refreshedUser.username}.`,
      user: serializeUser(refreshedUser),
    },
    {
      headers: {
        "Set-Cookie": makeSessionCookie(token),
      },
    },
  );
}

export async function handleMe(request: Request, env: Env) {
  const user = await getCurrentUser(request, env.my_db);

  if (!user) {
    return json(
      { ok: false, message: "Not authenticated." },
      { status: 401 },
    );
  }

  return json({
    ok: true,
    user: serializeUser(user),
    admin: {
      is_root_admin: isRootAdmin(user),
      username: rootAdminUsername,
    },
    tools: [
      { id: "qr", label: "QR Generator", status: "available" },
      { id: "barcode", label: "Barcode Generator", status: "available" },
      { id: "heic", label: "HEIC to JPG", status: "available" },
      { id: "more", label: "More tools", status: "coming-soon" },
    ],
  });
}

export async function handleLogout(request: Request, env: Env) {
  const user = await getCurrentUser(request, env.my_db);

  if (user) {
    await env.my_db
      .prepare(
        "UPDATE users SET session_token = NULL, session_expires_at = NULL WHERE id = ?",
      )
      .bind(user.id)
      .run();
  }

  return json(
    { ok: true, message: "Logged out." },
    {
      headers: {
        "Set-Cookie": clearSessionCookie(),
      },
    },
  );
}
