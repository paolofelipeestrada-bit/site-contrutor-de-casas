import type { Brief } from "../types";
import type { FormValues } from "./form";
import { interpretLocally } from "./localParser";
import { BriefSchema } from "./schema";

export type BriefSource = "claude" | "local";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Garante que o JSON vindo da IA respeita os limites do sistema antes de chegar ao algoritmo. */
export function sanitizeBrief(raw: Brief, fallback: Brief): Brief {
  const ambientes = raw.ambientes
    .filter((a) => a.tipo !== "banheiro_suite" && a.tipo !== "circulacao")
    .slice(0, 16)
    .map((a) => ({ ...a, area: a.area == null ? null : clamp(a.area, 1.5, 80) }));
  const hasGarage = ambientes.some((a) => a.tipo === "garagem");
  const suites = ambientes.filter((a) => a.tipo === "suite").length;
  const quartos = ambientes.filter((a) => a.tipo === "quarto").length;
  const social = ambientes.filter((a) => a.tipo === "banheiro").length;
  const observacoes = [...raw.observacoes].slice(0, 5);
  if (quartos > 0 && social === 0) {
    ambientes.push({ tipo: "banheiro", area: null, nome: "Banho social" });
    observacoes.push("Adicionei um banho social para atender os quartos.");
  }
  if (!ambientes.some((a) => a.tipo === "sala")) ambientes.unshift({ tipo: "sala", area: null, nome: "Sala" });
  if (!ambientes.some((a) => a.tipo === "cozinha")) ambientes.splice(1, 0, { tipo: "cozinha", area: null, nome: null });
  return {
    terreno: {
      largura: clamp(raw.terreno.largura || fallback.terreno.largura, 5, 60),
      profundidade: clamp(raw.terreno.profundidade || fallback.terreno.profundidade, 8, 100),
    },
    casa: { area: clamp(raw.casa.area || fallback.casa.area, 35, 600) },
    estilo: raw.estilo,
    ambientes: suites > 4 ? ambientes.filter((a, i, arr) => a.tipo !== "suite" || arr.slice(0, i).filter((b) => b.tipo === "suite").length < 4) : ambientes,
    preferencias: raw.preferencias,
    carro: hasGarage
      ? {
          comprimento: clamp(raw.carro?.comprimento ?? fallback.carro?.comprimento ?? 4.5, 3, 6.5),
          largura: clamp(raw.carro?.largura ?? fallback.carro?.largura ?? 1.8, 1.4, 2.4),
          vagas: clamp(Math.round(raw.carro?.vagas ?? 1), 1, 3),
        }
      : null,
    observacoes,
  };
}

export interface InterpretOptions {
  hints?: string[];
  exemplos?: { texto: string; brief: unknown }[];
  signal?: AbortSignal;
}

/** Texto → IA → dados estruturados. Cai para o interpretador local se a API não estiver disponível. */
export async function interpret(form: FormValues, opts: InterpretOptions = {}): Promise<{ brief: Brief; fonte: BriefSource; aviso?: string }> {
  const local = interpretLocally(form);
  try {
    const { descricao, ...formSemTexto } = form;
    const res = await fetch("/api/interpret", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ texto: descricao, form: formSemTexto, hints: opts.hints, exemplos: opts.exemplos }),
      signal: opts.signal ?? AbortSignal.timeout(45_000),
    });
    if (!res.ok) {
      const aviso = res.status === 501 ? undefined : `IA indisponível (${res.status}); usei o interpretador local.`;
      return { brief: local, fonte: "local", aviso };
    }
    const data = await res.json();
    const parsed = BriefSchema.safeParse(data.brief);
    if (!parsed.success) return { brief: local, fonte: "local", aviso: "Resposta da IA fora do formato; usei o interpretador local." };
    return { brief: { ...sanitizeBrief(parsed.data as Brief, local), regras: local.regras }, fonte: "claude" };
  } catch {
    return { brief: local, fonte: "local" };
  }
}
