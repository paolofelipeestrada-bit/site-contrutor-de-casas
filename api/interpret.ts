// Função serverless (Vercel / qualquer runtime com Request/Response padrão).
import { handleInterpret } from "../server/interpret";

export function POST(request: Request): Promise<Response> {
  return handleInterpret(request);
}
