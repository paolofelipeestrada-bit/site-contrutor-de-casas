import { sharedEdge } from "../layout/layout";
import type { LearningState } from "../learning/engine";
import { plansFromBrief } from "../pipeline";
import type { Brief, PlacedRoom, Plan, RoomType } from "../types";

/**
 * As 3 opções mostradas ao usuário. Cada perfil muda as áreas-alvo e soma um bônus
 * à nota geométrica. Para criar um perfil novo, adicione um item nesta lista.
 */
export interface Perfil {
  id: "equilibrada" | "social" | "privacidade";
  nome: string;
  resumo: string;
  multiplicadores: Partial<Record<RoomType, number>>;
  bonus: (plan: Plan) => number;
}

const by = (plan: Plan, ...tipos: RoomType[]) => plan.rooms.filter((r) => tipos.includes(r.tipo));
const touches = (a: PlacedRoom | undefined, b: PlacedRoom | undefined) => !!(a && b && sharedEdge(a, b));

export const PERFIS: Perfil[] = [
  {
    id: "equilibrada",
    nome: "Equilibrada",
    resumo: "Melhor nota geral: circulação curta, áreas próximas do pedido.",
    multiplicadores: {},
    bonus: () => 0,
  },
  {
    id: "social",
    nome: "Área social",
    resumo: "Sala, cozinha e varanda maiores e ligadas entre si.",
    multiplicadores: { sala: 1.25, cozinha: 1.1, jantar: 1.15, varanda: 1.3, area_gourmet: 1.2, quarto: 0.92 },
    bonus: (p) => {
      const [sala] = by(p, "sala");
      const [coz] = by(p, "cozinha");
      const [varanda] = by(p, "varanda", "area_gourmet");
      return (touches(sala, coz) ? 4 : 0) + (touches(sala, varanda) || touches(coz, varanda) ? 6 : 0);
    },
  },
  {
    id: "privacidade",
    nome: "Privacidade",
    resumo: "Quartos longe da rua e da sala, suíte maior.",
    multiplicadores: { suite: 1.15, closet: 1.2, sala: 0.95 },
    bonus: (p) => {
      const social = by(p, "sala", "cozinha", "jantar");
      let b = 0;
      for (const q of by(p, "quarto", "suite")) {
        if (!q.exterior.includes("top")) b += 2;
        if (!social.some((s) => touches(q, s))) b += 2;
      }
      for (const s of by(p, "suite")) if (s.exterior.includes("bottom")) b += 3;
      return b;
    },
  },
];

export interface Opcao {
  perfil: Perfil;
  plans: Plan[];
  /** nota geométrica de cada variação (o bônus do perfil só ordena, não aparece) */
  notas: number[];
}

const assinatura = (p: Plan) => p.rooms.map((r) => `${r.id}:${r.x.toFixed(1)},${r.y.toFixed(1)}`).join(";");

/** Até quantos pontos abaixo da melhor variação aceitamos para mostrar um arranjo diferente. */
const TOLERANCIA_DIFERENCA = 12;

/**
 * Gera as 3 opções, cada uma com suas variações.
 * Sempre que possível, cada opção mostra um ARRANJO diferente (estratégia de layout),
 * para a comparação valer a pena.
 */
export function gerarOpcoes(brief: Brief, learning?: LearningState): Opcao[] {
  const vistas = new Set<string>();
  const arranjos = new Set<string>();
  return PERFIS.map((perfil) => {
    const ranked = plansFromBrief(brief, learning, {}, perfil.multiplicadores)
      .map((plan) => ({ plan, ordem: plan.score + perfil.bonus(plan) }))
      .sort((a, b) => b.ordem - a.ordem);
    const arranjo = (p: Plan) => `${p.strategy.kind}-${p.strategy.variant}`;
    let escolhido = ranked.findIndex((r) => !arranjos.has(arranjo(r.plan)) && r.ordem >= ranked[0].ordem - TOLERANCIA_DIFERENCA);
    if (escolhido < 0) escolhido = ranked.findIndex((r) => !vistas.has(assinatura(r.plan)));
    if (escolhido > 0) ranked.unshift(...ranked.splice(escolhido, 1));
    vistas.add(assinatura(ranked[0].plan));
    arranjos.add(arranjo(ranked[0].plan));
    return { perfil, plans: ranked.map((r) => r.plan), notas: ranked.map((r) => r.plan.score) };
  });
}
