import {
  hasOwn,
  json,
  normalizeNullableText,
  normalizeText,
  parseJsonBody,
} from "../http";
import type { Env, UserRow } from "../types";
import { getCurrentUser, serializeUser, sha256 } from "../users/session";

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

export async function handleProfileUpdate(request: Request, env: Env) {
  const user = await getCurrentUser(request, env.my_db);

  if (!user) {
    return json(
      { ok: false, message: "Not authenticated." },
      { status: 401 },
    );
  }

  const body = await parseJsonBody(request);
  const updates: string[] = [];
  const values: Array<string | null> = [];

  if (hasOwn(body, "display_name")) {
    updates.push("display_name = ?");
    values.push(normalizeNullableText(body?.display_name));
  }

  if (hasOwn(body, "email")) {
    updates.push("email = ?");
    values.push(normalizeNullableText(body?.email));
  }

  if (hasOwn(body, "phone")) {
    updates.push("phone = ?");
    values.push(normalizeNullableText(body?.phone));
  }

  const newPassword = normalizeText(body?.password);
  if (newPassword) {
    const currentPassword = normalizeText(body?.currentPassword);

    if (!currentPassword) {
      return json(
        {
          ok: false,
          message: "Current password is required to set a new password.",
        },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return json(
        { ok: false, message: "New password must be at least 6 characters." },
        { status: 400 },
      );
    }

    const currentPasswordHash = await sha256(currentPassword);
    const passwordCheck = await env.my_db
      .prepare("SELECT id FROM users WHERE id = ? AND password_hash = ?")
      .bind(user.id, currentPasswordHash)
      .first<{ id: number }>();

    if (!passwordCheck) {
      return json(
        { ok: false, message: "Current password is incorrect." },
        { status: 401 },
      );
    }

    updates.push("password_hash = ?");
    values.push(await sha256(newPassword));
  }

  if (!updates.length) {
    return json(
      { ok: false, message: "No profile changes submitted." },
      { status: 400 },
    );
  }

  values.push(String(user.id));
  await env.my_db
    .prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  const refreshedUser = await env.my_db
    .prepare(
      "SELECT id, username, display_name, email, phone, avatar_image_id, avatar_image_url, token_balance, token_refreshed_at, default_max_token, max_product, session_token, session_expires_at, created_at FROM users WHERE id = ?",
    )
    .bind(user.id)
    .first<UserRow>();

  return json({
    ok: true,
    message: "Profile updated.",
    user: refreshedUser ? serializeUser(refreshedUser) : serializeUser(user),
  });
}

export async function handleProfileImageUpload(request: Request, env: Env) {
  const user = await getCurrentUser(request, env.my_db);

  if (!user) {
    return json(
      { ok: false, message: "Not authenticated." },
      { status: 401 },
    );
  }

  const configError = requireCloudflareImages(env);
  if (configError) {
    return configError;
  }

  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    return json(
      { ok: false, message: "Image file is required." },
      { status: 400 },
    );
  }

  if (!image.type.startsWith("image/")) {
    return json(
      { ok: false, message: "Only image uploads are allowed." },
      { status: 400 },
    );
  }

  const uploadBody = new FormData();
  uploadBody.set("file", image, image.name || `avatar-${user.id}.png`);
  uploadBody.set("metadata", JSON.stringify({ userId: user.id, scope: "profile-avatar" }));
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
        message: payload.errors?.[0]?.message || "Failed to upload image to Cloudflare Images.",
      },
      { status: 502 },
    );
  }

  const imageId = payload.result.id;
  const imageUrl = `https://imagedelivery.net/${env.CLOUDFLARE_IMAGES_DELIVERY_HASH}/${imageId}/public`;

  await env.my_db
    .prepare("UPDATE users SET avatar_image_id = ?, avatar_image_url = ? WHERE id = ?")
    .bind(imageId, imageUrl, user.id)
    .run();

  const refreshedUser = await env.my_db
    .prepare(
      "SELECT id, username, display_name, email, phone, avatar_image_id, avatar_image_url, token_balance, token_refreshed_at, default_max_token, max_product, session_token, session_expires_at, created_at FROM users WHERE id = ?",
    )
    .bind(user.id)
    .first<UserRow>();

  return json({
    ok: true,
    message: "Profile image uploaded.",
    user: refreshedUser ? serializeUser(refreshedUser) : serializeUser(user),
  });
}
