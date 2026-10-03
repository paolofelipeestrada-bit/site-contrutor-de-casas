import type { Plugin, ViteDevServer } from "vite";
import { loadEnv } from "vite";

/** Rotas de API do `npm run dev`, com os mesmos handlers da produção (pasta api/). */
const ROTAS: Record<string, () => string> = {
  "/api/interpret": () => "/server/interpret.ts",
  "/api/ajuda": () => "/server/ajuda.ts",
};

/** Expõe POST /api/interpret e /api/ajuda no `npm run dev`, usando os mesmos handlers da produção. */
export function interpretApiPlugin(): Plugin {
  return {
    name: "casaai-interpret-api",
    configureServer(server: ViteDevServer) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      if (env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY) {
        process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
      }
      server.middlewares.use(async (req, res, next) => {
        const rota = Object.keys(ROTAS).find((r) => req.url?.startsWith(r));
        if (!rota) return next();
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const mod = await server.ssrLoadModule(ROTAS[rota]());
        const handler = (rota === "/api/ajuda" ? mod.handleAjuda : mod.handleInterpret) as (r: Request) => Promise<Response>;
        const response = await handler(
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
