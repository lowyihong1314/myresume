import type { EasyPosRealtimeEvent, Env } from "../types";

export class EasyPosRealtimeRoom {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/broadcast") {
      const payload = (await request.json()) as EasyPosRealtimeEvent;
      this.broadcast(payload);
      return new Response(JSON.stringify({ ok: true }), {
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      });
    }

    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];

      this.state.acceptWebSocket(server);
      server.send(
        JSON.stringify({
          type: "realtime.connected",
          connectedAt: new Date().toISOString(),
        }),
      );

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    return new Response("Not found.", { status: 404 });
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    try {
      const text =
        typeof message === "string" ? message : new TextDecoder().decode(message);
      const payload = JSON.parse(text) as { type?: string };
      if (payload.type === "ping") {
        ws.send(
          JSON.stringify({
            type: "pong",
            at: new Date().toISOString(),
          }),
        );
      }
    } catch {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid realtime message.",
        }),
      );
    }
  }

  webSocketClose(ws: WebSocket, code: number, reason: string) {
    try {
      ws.close(code, reason);
    } catch {
      // noop
    }
  }

  webSocketError(ws: WebSocket) {
    try {
      ws.close(1011, "WebSocket error");
    } catch {
      // noop
    }
  }

  private broadcast(payload: EasyPosRealtimeEvent) {
    const message = JSON.stringify(payload);

    for (const socket of this.state.getWebSockets()) {
      try {
        socket.send(message);
      } catch {
        try {
          socket.close(1011, "Broadcast failed");
        } catch {
          // noop
        }
      }
    }
  }
}
