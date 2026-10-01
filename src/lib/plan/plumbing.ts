import type { Brief, PlacedRoom, Plan, Rect } from "../types";
import { fixturesOf, type Fixture } from "./furniture";
import { clamp, clampInto, manhattan, pathLength, type Pt } from "./geometry";

/**
 * ESQUEMA HIDRÁULICO (água fria + esgoto) — regras simplificadas (NBR 5626 / NBR 8160).
 * Para mudar o critério, edite só este objeto.
 */
export const HIDRAULICA = {
  consumoPorPessoa: 150, // litros por dia
  diasDeReserva: 2,
  moradoresPadrao: 4,
  reservatorios: [500, 750, 1000, 1500, 2000, 3000, 5000], // litros (tamanhos comerciais)
  /** Diâmetro (mm) do esgoto de cada aparelho até a caixa sifonada ou a saída. */
  esgoto: { vaso: 100, lavatorio: 40, chuveiro: 40, pia: 50, tanque: 40, maquina: 50 } as Record<string, number>,
  /** Saída das caixas sifonadas e ramais até as caixas externas. */
  ramal: 50,
  /** Coletor externo até a rede pública. */
  coletor: 100,
  aguaFria: 25, // mm, ramais
  barrilete: 32, // mm, saída da caixa d'água
  afastamentoCaixas: 0.6, // m da parede externa
  perdas: 1.1, // +10% de tubo para cortes e conexões
};

const COM_AGUA: Fixture[] = ["vaso", "lavatorio", "chuveiro", "pia", "tanque", "maquina"];

export type Linha = "fria" | "esgoto";
export interface Trecho {
  tipo: Linha;
  diametro: number;
  pts: Pt[];
}
export interface Caixa extends Pt {
  tipo: "CI" | "CG" | "CS";
  label: string;
}

export interface ProjetoHidraulico {
  hidrometro: Pt;
  reservatorio: Pt & { litros: number };
  ligacaoRede: Pt;
  aparelhos: { kind: Fixture; roomId: string; x: number; y: number }[];
  caixas: Caixa[];
  trechos: Trecho[];
  materiais: { item: string; qtd: number; unidade: string }[];
}

/** Lado externo mais próximo de um ponto e o ponto correspondente na parede. */
function saidaParaFora(p: Pt, room: PlacedRoom, fp: Rect): { parede: Pt; fora: Pt } {
  const off = HIDRAULICA.afastamentoCaixas;
  const opcoes = (room.exterior.length ? room.exterior : (["top", "bottom", "left", "right"] as const)).map((side) => {
    // sem parede externa: o tubo segue por baixo do piso até a borda mais próxima da casa
    const ref = room.exterior.length ? room : fp;
    switch (side) {
      case "top":
        return { d: Math.abs(p.y - ref.y) + 2, parede: { x: p.x, y: fp.y }, fora: { x: p.x, y: fp.y - off } };
      case "bottom":
        return { d: Math.abs(ref.y + ref.h - p.y), parede: { x: p.x, y: fp.y + fp.h }, fora: { x: p.x, y: fp.y + fp.h + off } };
      case "left":
        return { d: Math.abs(p.x - ref.x), parede: { x: fp.x, y: p.y }, fora: { x: fp.x - off, y: p.y } };
      default:
        return { d: Math.abs(ref.x + ref.w - p.x), parede: { x: fp.x + fp.w, y: p.y }, fora: { x: fp.x + fp.w + off, y: p.y } };
    }
  });
  // a rua (frente) fica por último: evita caixas na fachada quando há outra opção
  return opcoes.sort((a, b) => a.d - b.d)[0];
}

export function plumbingFor(plan: Plan, brief: Brief): ProjetoHidraulico {
  const fp = plan.footprint;
  const aparelhos = fixturesOf(plan.rooms, plan.openings).filter((f) => COM_AGUA.includes(f.kind));
  const trechos: Trecho[] = [];
  const caixas: Caixa[] = [];

  // Caixa d'água sobre o núcleo molhado; hidrômetro na frente do terreno
  const moradores = brief.regras?.moradores ?? HIDRAULICA.moradoresPadrao;
  const necessario = moradores * HIDRAULICA.consumoPorPessoa * HIDRAULICA.diasDeReserva;
  const litros = HIDRAULICA.reservatorios.find((v) => v >= necessario) ?? HIDRAULICA.reservatorios.at(-1)!;
  const centro = aparelhos.length
    ? { x: aparelhos.reduce((s, a) => s + a.x, 0) / aparelhos.length, y: aparelhos.reduce((s, a) => s + a.y, 0) / aparelhos.length }
    : { x: fp.x + fp.w / 2, y: fp.y + fp.h / 2 };
  const reservatorio = { ...clampInto(centro, fp, 0.8), litros };
  const hidrometro = { x: clamp(fp.x + 0.4, 0.3, plan.lot.width - 0.3), y: 0.4 };
  trechos.push({ tipo: "fria", diametro: HIDRAULICA.aguaFria, pts: manhattan(hidrometro, reservatorio, "y") });

  const molhados = plan.rooms.filter((r) => aparelhos.some((a) => a.roomId === r.id));
  for (const room of molhados) {
    const doComodo = aparelhos.filter((a) => a.roomId === room.id);
    // Água fria: barrilete até a entrada do cômodo, depois um ramal por aparelho
    const entrada = clampInto(reservatorio, room, 0.25);
    trechos.push({ tipo: "fria", diametro: HIDRAULICA.barrilete, pts: manhattan(reservatorio, entrada, "x") });
    for (const a of doComodo) trechos.push({ tipo: "fria", diametro: HIDRAULICA.aguaFria, pts: manhattan(entrada, a, "y") });

    // Esgoto
    const banho = room.tipo === "banheiro" || room.tipo === "banheiro_suite" || room.tipo === "lavabo";
    const cozinha = room.tipo === "cozinha" || room.tipo === "area_gourmet";
    const sifonados = doComodo.filter((a) => a.kind !== "vaso" && a.kind !== "pia");
    const ref = sifonados[0] ?? doComodo[0];
    const { parede, fora } = saidaParaFora(ref, room, fp);
    if (sifonados.length) {
      const cs = clampInto({ x: (ref.x + parede.x) / 2, y: (ref.y + parede.y) / 2 }, room, 0.3);
      caixas.push({ ...cs, tipo: "CS", label: "CS" });
      for (const a of sifonados) trechos.push({ tipo: "esgoto", diametro: HIDRAULICA.esgoto[a.kind], pts: manhattan(a, cs, "x") });
      trechos.push({ tipo: "esgoto", diametro: HIDRAULICA.ramal, pts: manhattan(cs, fora, parede.x === fora.x ? "x" : "y") });
    }
    for (const a of doComodo.filter((x) => x.kind === "vaso" || x.kind === "pia")) {
      trechos.push({ tipo: "esgoto", diametro: HIDRAULICA.esgoto[a.kind], pts: manhattan(a, fora, parede.x === fora.x ? "x" : "y") });
    }
    if (!caixas.some((c) => c.tipo !== "CS" && Math.abs(c.x - fora.x) + Math.abs(c.y - fora.y) < 1.2)) {
      caixas.push({ ...fora, tipo: cozinha ? "CG" : "CI", label: cozinha ? "CG" : banho ? "CI" : "CI" });
    }
  }

  // Coletor externo: corre pelo lado com mais recuo até a rua
  const externas = caixas.filter((c) => c.tipo !== "CS");
  // lado do coletor: onde há mais caixas, desde que exista recuo para passar o tubo
  const pontua = (esq: boolean) =>
    externas.filter((c) => (esq ? c.x < fp.x + fp.w / 2 : c.x >= fp.x + fp.w / 2)).length + ((esq ? plan.setbacks.left : plan.setbacks.right) >= 0.8 ? 0 : -10);
  const ladoEsq = pontua(true) >= pontua(false);
  const folga = Math.max(0.3, Math.min(HIDRAULICA.afastamentoCaixas, (ladoEsq ? plan.setbacks.left : plan.setbacks.right) / 2));
  const xColetor = ladoEsq ? fp.x - folga : fp.x + fp.w + folga;
  const fundo = fp.y + fp.h + HIDRAULICA.afastamentoCaixas;
  for (const c of externas) {
    const doOutroLado = ladoEsq ? c.x > fp.x + fp.w : c.x < fp.x;
    const pts: Pt[] = doOutroLado ? [c, { x: c.x, y: fundo }, { x: xColetor, y: fundo }] : [c, { x: xColetor, y: c.y }];
    trechos.push({ tipo: "esgoto", diametro: HIDRAULICA.coletor, pts });
  }
  const ligacaoRede = { x: xColetor, y: 0.2 };
  if (externas.length) {
    const maisFundo = Math.max(...externas.map((c) => (ladoEsq ? (c.x > fp.x + fp.w ? fundo : c.y) : c.x < fp.x ? fundo : c.y)));
    trechos.push({ tipo: "esgoto", diametro: HIDRAULICA.coletor, pts: [{ x: xColetor, y: maisFundo }, ligacaoRede] });
  }

  // Lista de materiais
  const metros = (tipo: Linha, d: number) =>
    Math.ceil(trechos.filter((t) => t.tipo === tipo && t.diametro === d).reduce((s, t) => s + pathLength(t.pts), 0) * HIDRAULICA.perdas);
  const materiais: ProjetoHidraulico["materiais"] = [];
  for (const d of [HIDRAULICA.aguaFria, HIDRAULICA.barrilete]) {
    const m = metros("fria", d);
    if (m) materiais.push({ item: `Tubo PVC soldável ${d} mm (água fria)`, qtd: m, unidade: "m" });
  }
  for (const d of [40, 50, 100]) {
    const m = metros("esgoto", d);
    if (m) materiais.push({ item: `Tubo PVC esgoto ${d} mm`, qtd: m, unidade: "m" });
  }
  const conta = (t: Caixa["tipo"]) => caixas.filter((c) => c.tipo === t).length;
  if (conta("CS")) materiais.push({ item: "Caixa sifonada 150 mm", qtd: conta("CS"), unidade: "un" });
  if (conta("CI")) materiais.push({ item: "Caixa de inspeção 60×60 cm", qtd: conta("CI"), unidade: "un" });
  if (conta("CG")) materiais.push({ item: "Caixa de gordura", qtd: conta("CG"), unidade: "un" });
  materiais.push({ item: "Registro de gaveta (um por ambiente molhado)", qtd: molhados.length, unidade: "un" });
  materiais.push({ item: `Caixa d'água ${litros} L (${moradores} moradores)`, qtd: 1, unidade: "un" });

  return { hidrometro, reservatorio, ligacaoRede, aparelhos, caixas, trechos, materiais };
}
