export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);

    // 1️⃣ API
    if (url.pathname.startsWith("/api")) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      });
    }

    // 2️⃣ 静态资源
    const res = await env.ASSETS.fetch(request);

    // 3️⃣ SPA fallback（/about /contact 等）
    if (res.status === 404) {
      return env.ASSETS.fetch(
        new Request(`${url.origin}/index.html`)
      );
    }

    return res;
  },
};

// npm run deploy 