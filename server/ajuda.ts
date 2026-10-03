import Anthropic from "@anthropic-ai/sdk";

/** Pergunta livre feita ao mascote (Faísca). O histórico é curto: só as últimas trocas da conversa. */
export interface AjudaRequest {
  pergunta: string;
  /** seção do site em que a pessoa está (inicio, briefing, planta, construir…) */
  secao?: string;
  historico?: { de: "pessoa" | "faisca"; texto: string }[];
}

// Prompt fixo (vai para o cache): o que o site faz e onde fica cada coisa.
const SYSTEM = `Você é o Faísca, o mascote assistente do CasaAI: um site que transforma o pedido de uma pessoa leiga em plantas de casa térrea.
Responda em português do Brasil, com no máximo 3 frases curtas, tom simpático e animado, sem jargão. Pode usar um emoji no máximo.
Explique só o que o site faz. Se não souber ou se a pergunta não for sobre o site ou sobre planejar uma casa, diga isso com gentileza e sugira o que a pessoa pode fazer no site.
Nunca invente preço do serviço, prazos, funções ou números que não estejam abaixo.

Como o site funciona:
- Seção "Gerar planta" (#briefing): a pessoa informa largura e fundo do terreno (o terreno em m² aparece calculado e a área da casa é preenchida sozinha com 40% do terreno, mas pode ser digitada), escolhe quartos, suítes, banheiros, extras (garagem, varanda, lavanderia, escritório, lavabo, área gourmet, closet), o estilo, e escreve com suas palavras. Em "Opções avançadas" ficam recuos, lado do norte, número de moradores e acessibilidade. O botão "Gerar 3 opções de planta" calcula 3 opções com nota.
- A IA só interpreta o pedido; as medidas, recuos e ligações entre cômodos são calculados por regras geométricas e verificados automaticamente.
- Abas da planta: Planta (Modo editar: arrastar as linhas laranja, clicar num cômodo para renomear ou mudar a área; "Outra variação"; desfazer com Ctrl+Z), Elétrica (pontos de luz, interruptores, tomadas, circuitos, disjuntores e cabos pela NBR 5410 simplificada; botão "Editar fiação" para mover, acrescentar ou apagar pontos), Hidráulica (água fria, esgoto, caixa d'água pelo número de moradores, lista de material), Custo (estimativa da obra por etapa e material, referência média nacional, ajustar à região), Aprendizado (o site aprende com as escolhas e avaliações).
- Botão "Entrar na casa 3D": a casa é montada em 3D com as mesmas medidas da planta, já mobiliada. Modos: Ver exterior, Por dentro e Andar (WASD ou setas no computador, joystick no celular). "Variar" troca os modelos dos móveis, "Mobília" liga e desliga, "Medidas" mostra as medidas dos cômodos, cobertura laje ou telhado moderno. Uma vistoria completa automaticamente os cômodos que ficaram vazios.
- Seção "Construir do zero" (#construir): a pessoa desenha cômodo por cômodo numa grade, com elétrica, hidráulica e 3D também.
- Tudo é estudo preliminar: o projeto final precisa de arquiteto ou engenheiro.`;

export async function responderAjuda(req: AjudaRequest, client = new Anthropic()): Promise<string> {
  const historico: Anthropic.Beta.BetaMessageParam[] = (req.historico ?? [])
    .slice(-6)
    .map((m) => ({ role: m.de === "pessoa" ? "user" : "assistant", content: m.texto.slice(0, 600) }));
  // a conversa precisa começar com a pessoa
  while (historico.length && historico[0].role !== "user") historico.shift();
  const onde = req.secao ? `(A pessoa está na seção "${req.secao.slice(0, 40)}" do site.)\n` : "";

  const response = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 2000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [...historico, { role: "user", content: `${onde}${req.pergunta.slice(0, 600)}` }],
  });

  if (response.stop_reason === "refusal") throw new Error("recusa");
  const texto = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  if (!texto) throw new Error("resposta vazia");
  return texto;
}

/** Handler Web padrão (Request → Response), usado pela Vercel e pelo servidor de desenvolvimento. */
export async function handleAjuda(request: Request): Promise<Response> {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY não configurada" }, { status: 501 });
  }
  let body: AjudaRequest;
  try {
    body = (await request.json()) as AjudaRequest;
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (typeof body?.pergunta !== "string" || !body.pergunta.trim()) {
    return Response.json({ error: "Campo 'pergunta' é obrigatório" }, { status: 400 });
  }
  try {
    return Response.json({ resposta: await responderAjuda(body) });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "Muitas perguntas, tente em instantes" }, { status: 429 });
    }
    if (error instanceof Anthropic.APIError) {
      return Response.json({ error: `Erro da API (${error.status})` }, { status: 502 });
    }
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
