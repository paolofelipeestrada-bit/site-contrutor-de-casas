import type { Plan } from "../types";
import type { ProjetoEletrico } from "./electrical";
import { pathLength } from "./geometry";
import type { ProjetoHidraulico } from "./plumbing";

/**
 * ESTIMATIVA DE CUSTO — valores de referência (R$, out/2026), ordem de grandeza.
 * Mude os preços para a sua cidade editando só este objeto.
 */
export const CUSTOS = {
  fonte: "Referência média nacional (CUB/SINAPI), out/2026. Ajuste aos preços da sua região.",
  /** Custo global por m² construído, por padrão de acabamento. */
  m2: { economico: 2300, normal: 2900, alto: 3900 },
  /** Varanda e garagem cobertas entram com este peso (área equivalente). */
  pesoAreaAberta: 0.5,
  /** Como o custo global se divide entre as etapas da obra (soma 1). */
  etapas: [
    ["Projetos, licenças e taxas", 0.05],
    ["Fundação", 0.08],
    ["Estrutura", 0.14],
    ["Alvenaria", 0.1],
    ["Cobertura", 0.09],
    ["Instalações elétricas", 0.06],
    ["Instalações hidráulicas e esgoto", 0.06],
    ["Esquadrias (portas e janelas)", 0.09],
    ["Pisos e revestimentos", 0.17],
    ["Pintura", 0.06],
    ["Louças, metais e acabamentos", 0.1],
  ] as [string, number][],
  /** Preços unitários de material (sem mão de obra). */
  material: {
    cabo: { 1.5: 2.2, 2.5: 3.4, 4: 5.4, 6: 8.1, 10: 13.5, 16: 21 } as Record<number, number>, // R$/m
    eletroduto: 3.6, // R$/m, corrugado 25 mm
    pontoLuz: 28, // caixa + soquete
    interruptor: 18,
    tomada: 21,
    tomadaTue: 35,
    disjuntor: { 10: 14, 16: 15, 20: 16, 25: 18, 32: 22, 40: 28, 50: 39, 63: 48 } as Record<number, number>,
    quadro: 190,
    tubo: { 25: 9.5, 32: 14, 40: 12, 50: 17, 100: 29 } as Record<number, number>, // R$/m
    caixaSifonada: 48,
    caixaInspecao: 190,
    caixaGordura: 240,
    registro: 65,
    caixaDagua: { 500: 360, 750: 470, 1000: 560, 1500: 860, 2000: 1100, 3000: 1650, 5000: 2600 } as Record<number, number>,
  },
  /** Mão de obra das instalações como fração do material. */
  maoDeObraInstalacoes: 0.9,
};

export type Padrao = keyof typeof CUSTOS.m2;
export const PADRAO_LABEL: Record<Padrao, string> = { economico: "Econômico", normal: "Normal", alto: "Alto" };

export interface ItemCusto {
  item: string;
  qtd: number;
  unidade: string;
  unitario: number;
  total: number;
}

export interface Orcamento {
  areaEquivalente: number;
  porM2: number;
  total: number;
  etapas: { nome: string; valor: number; fracao: number }[];
  eletrica: ItemCusto[];
  hidraulica: ItemCusto[];
  materialEletrica: number;
  materialHidraulica: number;
  faixa: [number, number];
}

const item = (nome: string, qtd: number, unidade: string, unitario: number): ItemCusto => ({
  item: nome,
  qtd,
  unidade,
  unitario,
  total: Math.round(qtd * unitario),
});

export function orcamento(plan: Plan, e: ProjetoEletrico, h: ProjetoHidraulico, padrao: Padrao): Orcamento {
  const M = CUSTOS.material;
  const aberta = plan.rooms.filter((r) => r.tipo === "varanda" || r.tipo === "garagem" || r.tipo === "area_gourmet").reduce((s, r) => s + r.w * r.h, 0);
  const areaEquivalente = Number((plan.builtArea - aberta * (1 - CUSTOS.pesoAreaAberta)).toFixed(1));
  const porM2 = CUSTOS.m2[padrao];
  const total = Math.round(areaEquivalente * porM2);

  // Elétrica: cabos por circuito (fase + neutro + terra) ao longo do traçado
  const cabos = new Map<number, number>();
  for (const t of e.trechos) {
    const c = e.circuitos.find((k) => k.id === t.circuito);
    if (!c) continue;
    cabos.set(c.cabo, (cabos.get(c.cabo) ?? 0) + pathLength(t.pts) * 3 * 1.15);
  }
  const conta = (k: string) => e.pontos.filter((p) => p.kind === k).length;
  const disj = new Map<number, number>();
  for (const c of e.circuitos) disj.set(c.disjuntor, (disj.get(c.disjuntor) ?? 0) + 1);
  const eletrica: ItemCusto[] = [
    ...[...cabos].sort((a, b) => a[0] - b[0]).map(([s, m]) => item(`Cabo ${String(s).replace(".", ",")} mm²`, Math.ceil(m), "m", M.cabo[s] ?? M.cabo[16])),
    item("Eletroduto corrugado 25 mm", e.eletrodutoM, "m", M.eletroduto),
    item("Ponto de luz (caixa + soquete)", conta("luz"), "un", M.pontoLuz),
    item("Interruptor", conta("interruptor"), "un", M.interruptor),
    item("Tomada de uso geral", conta("tug"), "un", M.tomada),
    item("Tomada de uso específico", conta("tue"), "un", M.tomadaTue),
    ...[...disj].sort((a, b) => a[0] - b[0]).map(([a, n]) => item(`Disjuntor ${a} A`, n, "un", M.disjuntor[a] ?? 50)),
    item("Quadro de distribuição", 1, "un", M.quadro),
  ].filter((i) => i.qtd > 0);

  const hidraulica: ItemCusto[] = h.materiais
    .map((m) => {
      const d = Number(m.item.match(/(\d+) mm/)?.[1]);
      if (m.item.startsWith("Tubo")) return item(m.item, m.qtd, m.unidade, M.tubo[d] ?? 20);
      if (m.item.startsWith("Caixa sifonada")) return item(m.item, m.qtd, m.unidade, M.caixaSifonada);
      if (m.item.startsWith("Caixa de inspeção")) return item(m.item, m.qtd, m.unidade, M.caixaInspecao);
      if (m.item.startsWith("Caixa de gordura")) return item(m.item, m.qtd, m.unidade, M.caixaGordura);
      if (m.item.startsWith("Registro")) return item(m.item, m.qtd, m.unidade, M.registro);
      if (m.item.startsWith("Caixa d'água")) return item(m.item, m.qtd, m.unidade, M.caixaDagua[h.reservatorio.litros] ?? 600);
      return item(m.item, m.qtd, m.unidade, 0);
    })
    .filter((i) => i.unitario > 0);

  const soma = (l: ItemCusto[]) => l.reduce((s, i) => s + i.total, 0);
  return {
    areaEquivalente,
    porM2,
    total,
    etapas: CUSTOS.etapas.map(([nome, fracao]) => ({ nome, fracao, valor: Math.round(total * fracao) })),
    eletrica,
    hidraulica,
    materialEletrica: soma(eletrica),
    materialHidraulica: soma(hidraulica),
    faixa: [Math.round(total * 0.85), Math.round(total * 1.2)],
  };
}

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
