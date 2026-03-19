import { ensureEasyPosTables } from "./easypos/schema";
import { EasyPosRealtimeRoom } from "./easypos/realtime";
import { json } from "./http";
import { handleApiRequest } from "./router";
import type { Env } from "./types";
import { ensureUsersTable } from "./users/schema";

export default {
  async fetch(request: Request, env: Env) {
    try {
      const url = new URL(request.url);
      await ensureUsersTable(env.my_db);
      await ensureEasyPosTables(env.my_db);

      const apiResponse = await handleApiRequest(request, env, url);
      if (apiResponse) {
        return apiResponse;
      }

      const res = await env.ASSETS.fetch(request);

      if (res.status === 404) {
        return env.ASSETS.fetch(new Request(`${url.origin}/index.html`));
      }

      return res;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected worker error.";

      return json({ ok: false, message }, { status: 500 });
    }
  },
};

export { EasyPosRealtimeRoom };
