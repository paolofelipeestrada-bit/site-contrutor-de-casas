import { ROOM_INFO } from "../catalog";
import { setbacksFor, sharedEdge } from "../layout/layout";
import type { Brief, Norte, PlacedRoom, Plan, Side } from "../types";

/**
 * Verificações automáticas e explicação do projeto.
 * Tudo aqui é calculado a partir da geometria — nada é inventado pela IA.
 */

const fmt = (v: number, d = 1) => v.toFixed(d).replace(".", ",");
const area = (r: PlacedRoom) => r.w * r.h;
const WET = ["banheiro", "banheiro_suite", "lavabo", "cozinha", "lavanderia", "area_gourmet"];

export interface Check {
  ok: boolean;
  texto: string;
}

export function verificacoes(plan: Plan, brief: Brief): Check[] {
  const rooms = plan.rooms.filter((r) => r.tipo !== "circulacao");
  const estreitos = rooms.filter((r) => Math.min(r.w, r.h) < ROOM_INFO[r.tipo].minWidth - 0.05);
  const permanencia = rooms.filter((r) => ["quarto", "suite", "sala", "escritorio"].includes(r.tipo));
  const semJanela = permanencia.filter((r) => r.exterior.length === 0);
  const semPorta = plan.issues.filter((i) => i.includes("sem porta"));
  const sb = setbacksFor(plan.lot.width, plan.lot.depth, brief.regras);
  const fp = plan.footprint;
  const respeitaRecuos =
    fp.x >= sb.left - 1e-6 && fp.x + fp.w <= plan.lot.width - sb.right + 1e-6 && fp.y >= sb.front - 1e-6 && fp.y + fp.h <= plan.lot.depth - sb.back + 1e-6;
  const checks: Check[] = [
    { ok: semPorta.length === 0, texto: semPorta.length ? `${semPorta.length} cômodo(s) sem porta de acesso` : "Todos os cômodos têm porta de acesso" },
    { ok: estreitos.length === 0, texto: estreitos.length ? `Abaixo da largura mínima: ${estreitos.map((r) => r.nome).join(", ")}` : "Larguras mínimas respeitadas em todos os cômodos" },
    { ok: semJanela.length === 0, texto: semJanela.length ? `Sem janela para fora: ${semJanela.map((r) => r.nome).join(", ")}` : "Quartos, sala e escritório com janela para fora" },
    {
      ok: respeitaRecuos,
      texto: `Recuos respeitados: frente ${fmt(sb.front)} m, fundos ${fmt(sb.back)} m, laterais ${fmt(sb.left)} / ${fmt(sb.right)} m`,
    },
  ];
  const g = plan.rooms.find((r) => r.tipo === "garagem");
  if (g && brief.carro) {
    const ok = g.h >= brief.carro.comprimento + 0.9 && g.w >= brief.carro.largura * brief.carro.vagas + 0.8 * (brief.carro.vagas + 1) - 0.05;
    checks.push({
      ok,
      texto: `Garagem ${fmt(g.w, 2)} × ${fmt(g.h, 2)} m para ${brief.carro.vagas} carro(s) de ${fmt(brief.carro.comprimento)} × ${fmt(brief.carro.largura)} m com folga para abrir as portas`,
    });
  }
  const molhados = plan.rooms.filter((r) => WET.includes(r.tipo));
  const agrupados = molhados.some((a) => molhados.some((b) => a !== b && sharedEdge(a, b)));
  if (molhados.length > 1) checks.push({ ok: agrupados, texto: agrupados ? "Áreas molhadas agrupadas (parede hidráulica compartilhada)" : "Áreas molhadas espalhadas: mais tubulação" });
  const desvio = Math.abs(plan.builtArea - brief.casa.area) / brief.casa.area;
  checks.push({ ok: desvio <= 0.2, texto: `Área construída ${fmt(plan.builtArea)} m² para ${fmt(brief.casa.area, 0)} m² pedidos (${desvio <= 0.2 ? "dentro" : "fora"} de ±20%)` });
  return checks;
}

/** Lado da casa (na planta) que fica para o norte → nomes de lado do retângulo. */
const NORTE_LADO: Record<Norte, Side> = { frente: "top", fundos: "bottom", esquerda: "left", direita: "right" };

export function explicarProjeto(plan: Plan, brief: Brief): string[] {
  const out: string[] = [];
  const one = (t: string) => plan.rooms.find((r) => r.tipo === t);
  const sala = one("sala");
  const coz = one("cozinha");
  if (sala) {
    const integrada = coz && sharedEdge(sala, coz) && plan.openings.some((o) => o.kind === "passage" && o.rooms.includes(sala.id) && o.rooms.includes(coz.id));
    out.push(`A sala tem ${fmt(area(sala))} m² (${fmt(sala.w, 2)} × ${fmt(sala.h, 2)} m)${integrada ? " e é integrada à cozinha, sem porta entre as duas" : coz ? " e é separada da cozinha por porta" : ""}.`);
  }
  for (const s of plan.rooms.filter((r) => r.tipo === "suite")) {
    const onde = s.exterior.includes("bottom") ? "nos fundos, longe da rua" : s.exterior.includes("top") ? "na frente, voltada para a rua" : "na lateral";
    const socialVizinho = [sala, coz].some((x) => x && sharedEdge(s, x));
    out.push(`A ${s.nome.toLowerCase()} (${fmt(area(s))} m²) fica ${onde}${socialVizinho ? ", encostada na área social" : ", sem parede com a sala ou a cozinha"}.`);
  }
  const molhados = plan.rooms.filter((r) => WET.includes(r.tipo));
  const pares = molhados.flatMap((a, i) => molhados.slice(i + 1).filter((b) => sharedEdge(a, b)).map((b) => `${a.nome} + ${b.nome}`));
  if (pares.length) out.push(`Áreas molhadas que dividem parede (menos tubo e menos furos): ${pares.join("; ")}.`);
  const g = plan.rooms.find((r) => r.tipo === "garagem");
  if (g && brief.carro) {
    const folgaLado = (g.w - brief.carro.largura * brief.carro.vagas) / (brief.carro.vagas + 1);
    out.push(`A garagem tem ${fmt(g.w, 2)} × ${fmt(g.h, 2)} m: o carro de ${fmt(brief.carro.comprimento)} m cabe com ${fmt(g.h - brief.carro.comprimento, 2)} m na frente e ${fmt(folgaLado, 2)} m de cada lado para abrir as portas.`);
  }
  const perm = plan.rooms.filter((r) => ["quarto", "suite", "sala", "escritorio", "cozinha"].includes(r.tipo));
  out.push(`${perm.filter((r) => r.exterior.length).length} de ${perm.length} ambientes de permanência têm janela para fora.`);
  const circ = plan.rooms.filter((r) => r.tipo === "circulacao").reduce((s, r) => s + area(r), 0);
  out.push(`Corredores ocupam ${fmt((circ / plan.builtArea) * 100, 0)}% da área construída.`);
  const norte = brief.regras?.norte;
  if (norte) {
    const lado = NORTE_LADO[norte];
    const sol = plan.rooms.filter((r) => r.exterior.includes(lado) && r.zone !== "circulation" && r.zone !== "garage");
    out.push(
      sol.length
        ? `Fachada norte (mais sol no inverno, no hemisfério sul): ${sol.map((r) => r.nome).join(", ")}.`
        : "Nenhum ambiente de permanência tem janela para o norte; considere espelhar a planta.",
    );
  }
  return out;
}
