import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { BriefSchema } from "../src/lib/brief/schema";

export interface InterpretRequest {
  texto: string;
  form: unknown;
  /** Dicas aprendidas com o histórico do usuário (geradas pelo motor de aprendizado do cliente). */
  hints?: string[];
  /** Briefings que o usuário aprovou antes (few-shot). */
  exemplos?: { texto: string; brief: unknown }[];
}

const SYSTEM = `Você é o arquiteto-intérprete do CasaAI. Sua única tarefa é transformar o pedido de uma pessoa leiga em um briefing estruturado de casa térrea. Você NÃO desenha a planta: um algoritmo próprio fará isso a partir do seu JSON.

Regras:
- O formulário traz valores escolhidos pela pessoa. O texto livre pode complementar ou corrigir; quando o texto contradiz o formulário de forma explícita, siga o texto e registre isso em "observacoes".
- Cada suíte é um item "suite". NÃO crie "banheiro_suite": o sistema cria o banheiro de cada suíte sozinho. Banheiros sociais são "banheiro" (total de banheiros = suítes + banheiros sociais).
- Se houver quartos simples, garanta ao menos um "banheiro" social.
- Use "area": null quando a pessoa não pediu uma área específica. Só preencha área quando ela for citada ou claramente implícita ("suíte grande" → cerca de 20% acima do normal).
- Sala e cozinha integradas viram um item "sala" (nome "Sala de estar e jantar") + um item "cozinha"; o algoritmo cuida da integração.
- "carro" só existe se houver garagem; use medidas do carro informado (SUV ≈ 4,7 × 1,9 m; picape ≈ 5,4 × 1,95 m).
- Observações: frases curtas em português explicando decisões e suposições (no máximo 5).
- Respeite as dicas de preferências aprendidas, a menos que o pedido atual diga o contrário.`;

export async function interpretWithClaude(req: InterpretRequest, client = new Anthropic()) {
  const hints = (req.hints ?? []).slice(0, 8).map((h) => `- ${h.slice(0, 200)}`).join("\n");
  const exemplos = (req.exemplos ?? [])
    .slice(0, 3)
    .map((e, i) => `Exemplo aprovado ${i + 1}:\nPedido: ${e.texto.slice(0, 400)}\nBriefing: ${JSON.stringify(e.brief).slice(0, 1500)}`)
    .join("\n\n");

  const content = [
    hints && `Preferências aprendidas desta pessoa:\n${hints}`,
    exemplos,
    `Formulário:\n${JSON.stringify(req.form).slice(0, 2000)}`,
    `Texto livre da pessoa:\n"""${req.texto.slice(0, 2000)}"""`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(BriefSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("A IA não retornou um briefing válido.");
  }
  return response.parsed_output;
}

/** Handler Web padrão (Request → Response), usado pela Vercel e pelo servidor de desenvolvimento. */
export async function handleInterpret(request: Request): Promise<Response> {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY não configurada" }, { status: 501 });
  }
  let body: InterpretRequest;
  try {
    body = (await request.json()) as InterpretRequest;
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (typeof body?.texto !== "string") {
    return Response.json({ error: "Campo 'texto' é obrigatório" }, { status: 400 });
  }
  try {
    const brief = await interpretWithClaude(body);
    return Response.json({ brief, fonte: "claude" });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "Muitas requisições, tente em instantes" }, { status: 429 });
    }
    if (error instanceof Anthropic.APIError) {
      return Response.json({ error: `Erro da API (${error.status})` }, { status: 502 });
    }
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
