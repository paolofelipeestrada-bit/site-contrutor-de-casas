import { ROOM_INFO } from "../catalog";
import type { Brief, LayoutStrategy, RoomType, Style, VarandaPosicao } from "../types";

/**
 * Motor de aprendizado do CasaAI.
 *
 * Aprende com três sinais, sem precisar treinar um modelo:
 *  1. Edições de área ("aumentar a suíte em 2 m²", arrastar parede) → ajusta o fator de área de cada tipo de cômodo.
 *  2. Avaliações 👍/👎 → atualiza uma distribuição Beta por estratégia de layout (Thompson sampling leve).
 *  3. Briefings aprovados → viram exemplos (few-shot) e dicas enviadas à IA nas próximas interpretações.
 *
 * Tudo é função pura sobre um estado serializável, então pode morar no navegador hoje
 * e num banco de dados (aprendizado coletivo) amanhã sem mudar a lógica.
 */

export interface LearningEvent {
  at: number;
  kind: "geracao" | "edicao" | "like" | "dislike" | "reset";
  detail: string;
}

export interface LearningState {
  version: 1;
  generations: number;
  edits: number;
  ratings: { up: number; down: number };
  areaFactor: Partial<Record<RoomType, { value: number; n: number }>>;
  strategy: Record<string, { a: number; b: number }>;
  prefs: {
    integrada: { sim: number; nao: number };
    varanda: Partial<Record<VarandaPosicao, number>>;
    estilo: Partial<Record<Style, number>>;
    /** quantas vezes cada opção (Equilibrada, Área social, Privacidade) foi escolhida */
    perfil?: Partial<Record<string, number>>;
  };
  examples: { texto: string; brief: Brief; at: number }[];
  log: LearningEvent[];
}

export function createLearningState(): LearningState {
  return {
    version: 1,
    generations: 0,
    edits: 0,
    ratings: { up: 0, down: 0 },
    areaFactor: {},
    strategy: {},
    prefs: { integrada: { sim: 0, nao: 0 }, varanda: {}, estilo: {} },
    examples: [],
    log: [],
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function pushLog(state: LearningState, kind: LearningEvent["kind"], detail: string): LearningEvent[] {
  return [{ at: Date.now(), kind, detail }, ...state.log].slice(0, 40);
}

export function strategyKey(s: LayoutStrategy): string {
  return s.kind;
}

/** Fator aprendido sobre a área-base de um tipo de cômodo (1 = padrão). */
export function areaFactor(state: LearningState, tipo: RoomType): number {
  return state.areaFactor[tipo]?.value ?? 1;
}

/** Bônus de pontuação que o histórico dá a uma estratégia de layout (−1…1). */
export function strategyBonus(state: LearningState, s: LayoutStrategy): number {
  const p = state.strategy[strategyKey(s)];
  if (!p) return 0;
  const mean = p.a / (p.a + p.b);
  const confidence = 1 - 1 / Math.sqrt(p.a + p.b);
  return (mean - 0.5) * 2 * confidence;
}

export function recordGeneration(state: LearningState, brief: Brief): LearningState {
  return {
    ...state,
    generations: state.generations + 1,
    log: pushLog(state, "geracao", `${brief.casa.area} m² · ${brief.ambientes.length} ambientes · ${brief.estilo}`),
  };
}

/**
 * A pessoa mudou a área de um cômodo de `from` para `to`.
 * Movemos o fator do tipo na direção da escolha com taxa de aprendizado decrescente (média móvel).
 */
export function recordAreaEdit(state: LearningState, tipo: RoomType, from: number, to: number): LearningState {
  if (from <= 0 || to <= 0 || tipo === "circulacao") return state;
  const cur = state.areaFactor[tipo] ?? { value: 1, n: 0 };
  const lr = Math.max(0.2, 1 / (cur.n + 2));
  const target = clamp(cur.value * (to / from), 0.6, 1.8);
  const value = clamp(cur.value + (target - cur.value) * lr, 0.6, 1.8);
  const sinal = to > from ? "+" : "−";
  return {
    ...state,
    edits: state.edits + 1,
    areaFactor: { ...state.areaFactor, [tipo]: { value: Number(value.toFixed(4)), n: cur.n + 1 } },
    log: pushLog(state, "edicao", `${ROOM_INFO[tipo].label}: ${from.toFixed(1)} → ${to.toFixed(1)} m² (${sinal}${Math.abs(to - from).toFixed(1)})`),
  };
}

export function recordRating(state: LearningState, up: boolean, strategy: LayoutStrategy, brief: Brief, texto: string): LearningState {
  const key = strategyKey(strategy);
  const cur = state.strategy[key] ?? { a: 1, b: 1 };
  const next: LearningState = {
    ...state,
    ratings: { up: state.ratings.up + (up ? 1 : 0), down: state.ratings.down + (up ? 0 : 1) },
    strategy: { ...state.strategy, [key]: up ? { a: cur.a + 1, b: cur.b } : { a: cur.a, b: cur.b + 1 } },
    log: pushLog(state, up ? "like" : "dislike", `${up ? "Gostou" : "Não gostou"} do layout "${STRATEGY_LABEL[strategy.kind]}"`),
  };
  if (!up) return next;
  const p = brief.preferencias;
  return {
    ...next,
    prefs: {
      integrada: {
        sim: next.prefs.integrada.sim + (p.salaCozinhaIntegradas ? 1 : 0),
        nao: next.prefs.integrada.nao + (p.salaCozinhaIntegradas ? 0 : 1),
      },
      varanda: { ...next.prefs.varanda, [p.varandaPosicao]: (next.prefs.varanda[p.varandaPosicao] ?? 0) + 1 },
      estilo: { ...next.prefs.estilo, [brief.estilo]: (next.prefs.estilo[brief.estilo] ?? 0) + 1 },
    },
    examples: [{ texto, brief, at: Date.now() }, ...next.examples].slice(0, 5),
  };
}

/** O usuário clicou em "Escolher esta" numa das 3 opções. */
export function recordChoice(state: LearningState, perfilId: string, nome: string): LearningState {
  const perfil = { ...(state.prefs.perfil ?? {}) };
  perfil[perfilId] = (perfil[perfilId] ?? 0) + 1;
  return { ...state, prefs: { ...state.prefs, perfil }, log: pushLog(state, "like", `Escolheu a opção "${nome}"`) };
}

/** Perfil mais escolhido (para já abrir nele), se houver preferência clara. */
export function preferredProfile(state: LearningState): string | null {
  const top = Object.entries(state.prefs.perfil ?? {}).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0];
  return top && (top[1] ?? 0) >= 2 ? top[0] : null;
}

export const STRATEGY_LABEL: Record<LayoutStrategy["kind"], string> = {
  faixas: "social na frente, íntimo atrás",
  lateral: "social e íntimo lado a lado",
};

/** Dicas em linguagem natural — enviadas à IA e exibidas na tela "O que a IA aprendeu". */
export function learnedHints(state: LearningState): string[] {
  const hints: string[] = [];
  for (const [tipo, f] of Object.entries(state.areaFactor) as [RoomType, { value: number; n: number }][]) {
    const pct = Math.round((f.value - 1) * 100);
    if (Math.abs(pct) >= 5) {
      hints.push(`Prefere ${ROOM_INFO[tipo].label.toLowerCase()} cerca de ${Math.abs(pct)}% ${pct > 0 ? "maior" : "menor"} que o padrão.`);
    }
  }
  const { sim, nao } = state.prefs.integrada;
  if (sim + nao >= 2) hints.push(sim >= nao ? "Costuma aprovar sala e cozinha integradas." : "Costuma preferir cozinha separada da sala.");
  const varanda = Object.entries(state.prefs.varanda).sort((a, b) => b[1] - a[1])[0];
  if (varanda && varanda[1] >= 2) hints.push(`Gosta de varanda ${varanda[0] === "fundos" ? "nos fundos" : varanda[0] === "frente" ? "na frente" : "na lateral"}.`);
  const perfilTop = preferredProfile(state);
  if (perfilTop) hints.push(`Costuma escolher a opção "${perfilTop === "social" ? "Área social" : perfilTop === "privacidade" ? "Privacidade" : "Equilibrada"}".`);
  const estilo = Object.entries(state.prefs.estilo).sort((a, b) => b[1] - a[1])[0];
  if (estilo && estilo[1] >= 2) hints.push(`Estilo mais aprovado: ${estilo[0]}.`);
  for (const [key, p] of Object.entries(state.strategy)) {
    const mean = p.a / (p.a + p.b);
    if (p.a + p.b >= 4 && Math.abs(mean - 0.5) > 0.15) {
      hints.push(`${mean > 0.5 ? "Aprova" : "Rejeita"} com frequência o layout "${STRATEGY_LABEL[key as LayoutStrategy["kind"]] ?? key}".`);
    }
  }
  return hints;
}

const STORAGE_KEY = "casaai.learning.v1";

export function loadLearning(): LearningState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createLearningState();
    const parsed = JSON.parse(raw) as LearningState;
    return parsed.version === 1 ? { ...createLearningState(), ...parsed } : createLearningState();
  } catch {
    return createLearningState();
  }
}

export function saveLearning(state: LearningState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* modo privado / armazenamento cheio: o aprendizado continua só na sessão */
  }
}
