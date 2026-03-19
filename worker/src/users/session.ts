import {
  rootAdminUsername,
  sessionCookieName,
  sessionMaxAge,
} from "../config";
import { json } from "../http";
import type { UserRow } from "../types";

export function parseCookies(cookieHeader: string | null) {
  const cookies = new Map<string, string>();

  if (!cookieHeader) {
    return cookies;
  }

  for (const segment of cookieHeader.split(";")) {
    const [name, ...rest] = segment.trim().split("=");
    if (!name) {
      continue;
    }

    cookies.set(name, rest.join("="));
  }

  return cookies;
}

export function makeSessionCookie(token: string) {
  return `${sessionCookieName}=${token}; Path=/; Max-Age=${sessionMaxAge}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearSessionCookie() {
  return `${sessionCookieName}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

export async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function generateSessionToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function sessionExpiryIso() {
  return new Date(Date.now() + sessionMaxAge * 1000).toISOString();
}

export function serializeUser(
  user: Pick<
    UserRow,
    | "username"
    | "display_name"
    | "email"
    | "phone"
    | "avatar_image_url"
    | "token_balance"
    | "token_refreshed_at"
    | "default_max_token"
    | "max_product"
    | "created_at"
  >,
) {
  return {
    username: user.username,
    display_name: user.display_name,
    email: user.email,
    phone: user.phone,
    avatar_image_url: user.avatar_image_url,
    token_balance: Number(user.token_balance || 0),
    token_refreshed_at: user.token_refreshed_at,
    default_max_token: Number(user.default_max_token || 5000),
    max_product: Number(user.max_product || 0),
    created_at: user.created_at,
  };
}

export function isRootAdmin(user: Pick<UserRow, "username"> | null) {
  return user?.username === rootAdminUsername;
}

export async function getCurrentUser(request: Request, db: D1Database) {
  const cookies = parseCookies(request.headers.get("cookie"));
  const sessionToken = cookies.get(sessionCookieName);

  if (!sessionToken) {
    return null;
  }

  const now = new Date().toISOString();
  const user = await db
    .prepare(
      "SELECT id, username, display_name, email, phone, avatar_image_id, avatar_image_url, token_balance, token_refreshed_at, default_max_token, max_product, session_token, session_expires_at, created_at FROM users WHERE session_token = ? AND (session_expires_at IS NULL OR session_expires_at > ?)",
    )
    .bind(sessionToken, now)
    .first<UserRow>();

  if (!user) {
    return null;
  }

  return refreshUserTokenQuota(db, user);
}

export async function refreshUserTokenQuota(
  db: D1Database,
  user: UserRow,
) {
  const refreshedAt = user.token_refreshed_at ? Date.parse(user.token_refreshed_at) : Number.NaN;
  const now = Date.now();

  if (!Number.isNaN(refreshedAt) && now - refreshedAt < 30 * 24 * 60 * 60 * 1000) {
    return {
      ...user,
      token_balance: Number(user.token_balance || 0),
    };
  }

  const nextRefreshedAt = new Date(now).toISOString();
  const defaultMaxToken = Number(user.default_max_token || 5000);

  await db
    .prepare(
      "UPDATE users SET token_balance = ?, token_refreshed_at = ? WHERE id = ?",
    )
    .bind(defaultMaxToken, nextRefreshedAt, user.id)
    .run();

  return {
    ...user,
    token_balance: defaultMaxToken,
    token_refreshed_at: nextRefreshedAt,
  };
}

export async function consumeUserTokenForPost(request: Request, db: D1Database) {
  const user = await getCurrentUser(request, db);

  if (!user) {
    return {
      error: json(
        { ok: false, message: "Not authenticated." },
        { status: 401 },
      ),
      user: null,
    };
  }

  if (Number(user.token_balance || 0) <= 0) {
    return {
      error: json(
        {
          ok: false,
          message: "Token quota exhausted.",
          token_balance: 0,
          token_refreshed_at: user.token_refreshed_at,
        },
        { status: 429 },
      ),
      user,
    };
  }

  const nextBalance = Number(user.token_balance || 0) - 1;

  await db
    .prepare("UPDATE users SET token_balance = ? WHERE id = ?")
    .bind(nextBalance, user.id)
    .run();

  return {
    error: null,
    user: {
      ...user,
      token_balance: nextBalance,
    },
  };
}

export async function requireRootAdmin(request: Request, db: D1Database) {
  const user = await getCurrentUser(request, db);

  if (!user) {
    return {
      error: json(
        { ok: false, message: "Not authenticated." },
        { status: 401 },
      ),
      user: null,
    };
  }

  if (!isRootAdmin(user)) {
    return {
      error: json(
        { ok: false, message: "Admin access required." },
        { status: 403 },
      ),
      user,
    };
  }

  return { error: null, user };
}
