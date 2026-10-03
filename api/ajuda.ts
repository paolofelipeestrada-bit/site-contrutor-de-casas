// Função serverless (Vercel / qualquer runtime com Request/Response padrão): perguntas ao mascote Faísca.
import { handleAjuda } from "../server/ajuda";

export function POST(request: Request): Promise<Response> {
  return handleAjuda(request);
}
