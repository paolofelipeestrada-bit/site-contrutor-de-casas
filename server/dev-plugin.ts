import type { Plugin, ViteDevServer } from "vite";
import { loadEnv } from "vite";

/** Expõe POST /api/interpret no `npm run dev`, usando o mesmo handler da produção (api/interpret.ts). */
export function interpretApiPlugin(): Plugin {
  return {
    name: "casaai-interpret-api",
    configureServer(server: ViteDevServer) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      if (env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY) {
        process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
      }
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/interpret")) return next();
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const mod = (await server.ssrLoadModule("/server/interpret.ts")) as typeof import("./interpret");
        const response = await mod.handleInterpret(
          new Request(`http://localhost${req.url}`, {
            method: req.method,
            headers: { "content-type": "application/json" },
            body: req.method === "POST" ? Buffer.concat(chunks) : undefined,
          }),
        );
        res.statusCode = response.status;
        res.setHeader("content-type", response.headers.get("content-type") ?? "application/json");
        res.end(await response.text());
      });
    },
  };
}
