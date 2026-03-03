// worker/src/index.ts
export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);

    // 1️⃣ API
    if (url.pathname === "/api/reboot") {
      return new Response(
        JSON.stringify({
          ok: true,
          profile: {
            name: "LOW YI HONG",
            aliases: ["yukang", "宇康", "阿康"],
            role: "Full Stack Developer",
            website: "https://yihong1031.com",
            github: "https://github.com/lowyihong1314",
            phone: "+6011-3660-0057",
          },
        }),
        {
          headers: { "content-type": "application/json; charset=utf-8" },
        },
      );
    }

    if (url.pathname.startsWith("/api")) {
      return new Response(
        JSON.stringify({ ok: true, endpoints: ["/api/reboot"] }),
        {
          headers: { "content-type": "application/json; charset=utf-8" },
        },
      );
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
