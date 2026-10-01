import { ROOM_INFO } from "../catalog";
import { strategyBonus, type LearningState } from "../learning/engine";
import type { Brief, LayoutStrategy, Opening, PlacedRoom, Plan, Program, Rect, RoomSpec, RoomType, Side } from "../types";
import { leaf, leaves, resetSplitIds, slice, split, type SNode } from "./slicing";

const EPS = 1e-6;
/** Largura do corredor (m). Com acessibilidade, 1,20 m. */
const CORRIDOR = 1.0;
export const corridorWidth = (brief: Brief) => (brief.regras?.acessivel ? 1.2 : CORRIDOR);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Recuos: os informados nas opções avançadas, ou a regra automática abaixo. */
export function setbacksFor(lotW: number, lotD: number, regras?: Brief["regras"]) {
  const auto = autoSetbacks(lotW, lotD);
  const r = regras?.recuos;
  if (!r) return auto;
  return {
    front: r.frente ?? auto.front,
    back: r.fundos ?? auto.back,
    left: r.laterais ?? auto.left,
    right: r.laterais ?? auto.right,
  };
}

function autoSetbacks(lotW: number, lotD: number) {
  const front = lotD > 22 ? 4 : lotD >= 15 ? 3 : 2;
  const back = lotD >= 15 ? 2 : 1.5;
  let left = 0;
  let right = 0;
  if (lotW >= 11) {
    left = 1.5;
    right = 1.5;
  } else if (lotW >= 8) {
    left = 1.5;
  }
  return { front, back, left, right };
}

// ───────────────────────── Montagem das árvores (estratégias) ─────────────────────────

/** Cômodo grande da zona íntima (quarto, suíte, escritório) com seus anexos. */
interface Unit {
  main: RoomSpec;
  extras: RoomSpec[];
  area: number;
  rank: number;
}

const RANK: Partial<Record<RoomType, number>> = { escritorio: 0, quarto: 2, suite: 3 };
const isSmall = (r: RoomSpec) => r.tipo === "banheiro" || r.tipo === "lavabo" || (r.tipo === "closet" && !r.attachTo);

function privateRooms(rooms: RoomSpec[]) {
  const attached = new Set(rooms.filter((r) => r.attachTo).map((r) => r.id));
  const priv = rooms.filter((r) => r.zone === "private" && !attached.has(r.id));
  const units: Unit[] = priv
    .filter((r) => !isSmall(r))
    .map((r) => {
      const extras = rooms.filter((x) => x.attachTo === r.id);
      return { main: r, extras, area: r.area + extras.reduce((s, e) => s + e.area, 0), rank: RANK[r.tipo] ?? 2 };
    });
  const smalls = priv.filter(isSmall);
  return { units, smalls };
}

/**
 * Empilha a zona íntima em uma coluna (da frente para os fundos), com o corredor de um lado.
 * Áreas molhadas viram uma "faixa hidráulica": banho da suíte + banho social lado a lado,
 * parede com parede (economiza tubulação), com o banho social do lado do corredor.
 */
function column(units: Unit[], smalls: RoomSpec[], corridorSide: "left" | "right"): SNode | null {
  const items: SNode[] = [];
  const pending = [...smalls];
  const row = (wet: RoomSpec[]) => {
    // quem precisa do corredor fica do lado dele
    const sorted = [...wet].sort((a, b) => Number(!!b.attachTo) - Number(!!a.attachTo));
    return split("x", corridorSide === "right" ? sorted.map((r) => leaf(r.id)) : sorted.reverse().map((r) => leaf(r.id)));
  };
  for (const u of [...units].sort((a, b) => a.rank - b.rank)) {
    if (u.extras.length > 0) {
      const wet = [...u.extras];
      if (pending.length) wet.push(pending.shift()!);
      items.push(row(wet)!);
    }
    items.push(leaf(u.main.id));
  }
  // banhos que sobraram: em dupla, ou sozinhos, logo no início do corredor
  while (pending.length) {
    const pair = pending.splice(0, 2);
    items.unshift(pair.length === 2 ? split("x", pair.map((r) => leaf(r.id)))! : leaf(pair[0].id));
  }
  return split("y", items);
}

/** Divide as unidades em colunas equilibrando área; banhos sociais vão para a coluna que tem suíte. */
function partition(units: Unit[], smalls: RoomSpec[], cols: number): { units: Unit[]; smalls: RoomSpec[] }[] {
  const out = Array.from({ length: cols }, () => ({ units: [] as Unit[], smalls: [] as RoomSpec[], load: 0 }));
  for (const u of [...units].sort((a, b) => b.area - a.area)) {
    const c = out.reduce((m, x) => (x.load < m.load ? x : m), out[0]);
    c.units.push(u);
    c.load += u.area;
  }
  for (const sm of smalls) {
    const withSuite = out.find((c) => c.units.some((u) => u.extras.length > 0) && c.smalls.length === 0);
    const c = withSuite ?? out.reduce((m, x) => (x.load < m.load ? x : m), out[0]);
    c.smalls.push(sm);
    c.load += sm.area;
  }
  return out;
}

function buildTree(rooms: RoomSpec[], brief: Brief, s: LayoutStrategy, corridorId: string): SNode {
  resetSplitIds();
  const one = (t: RoomType) => rooms.find((r) => r.tipo === t);
  const G = one("garagem");
  const sala = one("sala")!;
  const jantar = one("jantar");
  const cozinha = one("cozinha")!;
  const lav = one("lavanderia");
  const varandas = rooms.filter((r) => r.tipo === "varanda");
  const gourmet = rooms.filter((r) => r.tipo === "area_gourmet");
  const varandaFrente = brief.preferencias.varandaPosicao === "frente" ? varandas : [];
  const backOutdoor = [...(brief.preferencias.varandaPosicao === "frente" ? [] : varandas), ...gourmet];
  const { units, smalls } = privateRooms(rooms);
  const lavabo = rooms.find((r) => r.tipo === "lavabo");
  const privSmalls = smalls.filter((r) => r.tipo !== "lavabo");
  const order = <T,>(arr: T[]) => (s.mirror ? [...arr].reverse() : arr);
  const W = s.width;
  const corridor = leaf(corridorId);

  const backBand = (extra: SNode | null = null) => split("x", order([extra, ...backOutdoor.map((r) => leaf(r.id))]));
  const service = split("x", order([lav && leaf(lav.id), lavabo && leaf(lavabo.id)]));

  const privateBlock = (width: number, corridorFirst: boolean) => {
    if (width >= 6.2 && units.length >= 2) {
      const [a, b] = partition(units, privSmalls, 2);
      const [l, r] = s.mirror ? [b, a] : [a, b];
      return split("x", [column(l.units, l.smalls, "right"), corridor, column(r.units, r.smalls, "left")]);
    }
    const side = corridorFirst ? "left" : "right";
    const col = column(units, privSmalls, side);
    return split("x", corridorFirst ? [corridor, col] : [col, corridor]);
  };

  if (s.kind === "faixas" && s.variant === 0) {
    // social na frente (garagem + sala + cozinha), íntimo atrás com corredor central, varanda nos fundos
    const salaBlock = split("y", [...varandaFrente.map((v) => leaf(v.id)), leaf(sala.id), jantar && leaf(jantar.id)]);
    const kitchenBlock = split("y", [leaf(cozinha.id), service]);
    const frontBand = split("x", order([G && leaf(G.id), salaBlock, kitchenBlock]));
    return split("y", [frontBand, privateBlock(W, !s.mirror), backBand()])!;
  }

  if (s.kind === "faixas" && s.variant === 2) {
    // linear (terrenos estreitos): garagem + sala na frente, faixa de cozinha, íntimo atrás
    const salaBlock = split("y", [...varandaFrente.map((v) => leaf(v.id)), leaf(sala.id)]);
    const frontBand = split("x", order([G && leaf(G.id), salaBlock]));
    const kitchenBand = split("x", order([jantar && leaf(jantar.id), leaf(cozinha.id), service]));
    return split("y", [frontBand, kitchenBand, privateBlock(W, !s.mirror), backBand()])!;
  }

  if (s.kind === "faixas") {
    // social nos fundos, integrado à varanda; garagem e quartos na frente
    const gW = G?.fixed?.w ?? 0;
    const frontBand = split("x", order([G && split("y", [leaf(G.id), lav && leaf(lav.id)]), privateBlock(W - gW, !s.mirror)]));
    const kitchen = split("y", [leaf(cozinha.id), split("x", [!G && lav && leaf(lav.id), lavabo && leaf(lavabo.id)])]);
    const socialBand = split("x", order([split("y", [...varandaFrente.map((v) => leaf(v.id)), leaf(sala.id)]), jantar && leaf(jantar.id), kitchen]));
    return split("y", [frontBand, socialBand, backBand()])!;
  }

  // lateral: coluna social (garagem na frente) ao lado da coluna íntima, com o corredor entre as duas
  const kitchenRow = s.variant === 0 ? split("x", order([leaf(cozinha.id), service])) : split("y", [leaf(cozinha.id), service]);
  const socialCol = split("y", [G && leaf(G.id), ...varandaFrente.map((v) => leaf(v.id)), leaf(sala.id), jantar && leaf(jantar.id), kitchenRow]);
  const roomsCol = column(units, privSmalls, s.mirror ? "right" : "left");
  const privateCol = s.mirror ? split("x", [roomsCol, corridor]) : split("x", [corridor, roomsCol]);
  const main = s.mirror ? split("x", [privateCol, socialCol]) : split("x", [socialCol, privateCol]);
  return split("y", [main, backBand()])!;
}

// ───────────────────────── Geometria auxiliar ─────────────────────────

interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  len: number;
  vertical: boolean;
}

export function sharedEdge(a: Rect, b: Rect): Segment | null {
  const near = (p: number, q: number) => Math.abs(p - q) < 1e-4;
  if (near(a.x + a.w, b.x) || near(b.x + b.w, a.x)) {
    const x = near(a.x + a.w, b.x) ? b.x : a.x;
    const y1 = Math.max(a.y, b.y);
    const y2 = Math.min(a.y + a.h, b.y + b.h);
    if (y2 - y1 > 0.05) return { x1: x, y1, x2: x, y2, len: y2 - y1, vertical: true };
  }
  if (near(a.y + a.h, b.y) || near(b.y + b.h, a.y)) {
    const y = near(a.y + a.h, b.y) ? b.y : a.y;
    const x1 = Math.max(a.x, b.x);
    const x2 = Math.min(a.x + a.w, b.x + b.w);
    if (x2 - x1 > 0.05) return { x1, y1: y, x2, y2: y, len: x2 - x1, vertical: false };
  }
  return null;
}

function exteriorSides(r: Rect, fp: Rect): Side[] {
  const s: Side[] = [];
  if (Math.abs(r.y - fp.y) < 1e-4) s.push("top");
  if (Math.abs(r.y + r.h - (fp.y + fp.h)) < 1e-4) s.push("bottom");
  if (Math.abs(r.x - fp.x) < 1e-4) s.push("left");
  if (Math.abs(r.x + r.w - (fp.x + fp.w)) < 1e-4) s.push("right");
  return s;
}

function sideSegment(r: Rect, side: Side): Segment {
  switch (side) {
    case "top":
      return { x1: r.x, y1: r.y, x2: r.x + r.w, y2: r.y, len: r.w, vertical: false };
    case "bottom":
      return { x1: r.x, y1: r.y + r.h, x2: r.x + r.w, y2: r.y + r.h, len: r.w, vertical: false };
    case "left":
      return { x1: r.x, y1: r.y, x2: r.x, y2: r.y + r.h, len: r.h, vertical: true };
    case "right":
      return { x1: r.x + r.w, y1: r.y, x2: r.x + r.w, y2: r.y + r.h, len: r.h, vertical: true };
  }
}

/** Recorta um trecho de `width` metros do segmento, começando em `t` (0…1 do espaço livre). */
function cut(seg: Segment, width: number, t: number): Omit<Opening, "kind" | "rooms"> {
  const w = Math.min(width, seg.len - 0.1);
  const start = (seg.len - w) * clamp(t, 0, 1);
  if (seg.vertical) return { x1: seg.x1, y1: seg.y1 + start, x2: seg.x1, y2: seg.y1 + start + w };
  return { x1: seg.x1 + start, y1: seg.y1, x2: seg.x1 + start + w, y2: seg.y1 };
}

// ───────────────────────── Aberturas (portas e janelas) ─────────────────────────

const ACCESS: Partial<Record<RoomType, RoomType[]>> = {
  quarto: ["circulacao", "sala", "jantar"],
  suite: ["circulacao", "sala", "jantar"],
  escritorio: ["circulacao", "sala", "jantar"],
  banheiro: ["circulacao", "sala", "jantar", "cozinha"],
  banheiro_suite: ["suite"],
  closet: ["suite", "banheiro_suite"],
  lavabo: ["sala", "jantar", "circulacao", "cozinha"],
  lavanderia: ["cozinha", "varanda", "area_gourmet", "garagem", "circulacao"],
  cozinha: ["sala", "jantar", "circulacao", "varanda", "area_gourmet"],
  jantar: ["sala", "cozinha", "circulacao"],
  garagem: ["sala", "circulacao", "cozinha", "lavanderia", "jantar"],
  varanda: ["sala", "jantar", "cozinha", "circulacao", "suite", "area_gourmet"],
  area_gourmet: ["varanda", "cozinha", "sala", "jantar", "circulacao"],
  circulacao: ["sala", "jantar", "cozinha"],
};

const WINDOW: Partial<Record<RoomType, number>> = {
  sala: 2.0, jantar: 1.5, cozinha: 1.2, quarto: 1.5, suite: 1.8, escritorio: 1.2,
  banheiro: 0.6, banheiro_suite: 0.6, lavabo: 0.5, lavanderia: 0.8,
};

function openingsFor(rooms: PlacedRoom[], brief: Brief, issues: string[]): Opening[] {
  const ops: Opening[] = [];
  const linked = new Set<string>();
  const key = (a: string, b: string) => [a, b].sort().join("|");
  const integrada = brief.preferencias.salaCozinhaIntegradas;

  const connect = (a: PlacedRoom, b: PlacedRoom, seg: Segment) => {
    linked.add(key(a.id, b.id));
    const pair = new Set([a.tipo, b.tipo]);
    const isPair = (x: RoomType, y: RoomType) => pair.has(x) && pair.has(y) && (x !== y || a.tipo === b.tipo);
    let kind: Opening["kind"] = "door";
    let width = brief.regras?.acessivel ? 0.9 : a.tipo.startsWith("banheiro") || a.tipo === "lavabo" || a.tipo === "closet" ? 0.7 : 0.8;
    let t = 0.08;
    if ((isPair("sala", "cozinha") && integrada) || isPair("sala", "jantar") || (isPair("jantar", "cozinha") && integrada)) {
      kind = "passage";
      width = seg.len * 0.75;
      t = 0.5;
    } else if (pair.has("circulacao") && (pair.has("sala") || pair.has("jantar") || pair.has("cozinha"))) {
      kind = "passage";
      width = Math.min(seg.len, 1.2);
      t = 0.5;
    } else if ((pair.has("varanda") || pair.has("area_gourmet")) && (pair.has("sala") || pair.has("jantar") || pair.has("cozinha") || pair.has("area_gourmet"))) {
      kind = "slide";
      width = Math.min(seg.len * 0.7, brief.preferencias.luzNatural ? 3.0 : 2.0);
      t = 0.5;
    }
    ops.push({ kind, ...cut(seg, width, t), rooms: [a.id, b.id], swingInto: a.id });
  };

  // 1ª passada: regras de acesso por tipo
  const reached = new Set<string>();
  for (const r of rooms) {
    const prefs = ACCESS[r.tipo];
    if (!prefs) continue;
    let done = false;
    for (const t of prefs) {
      const target = rooms
        .filter((o) => o.tipo === t && o.id !== r.id)
        .map((o) => ({ o, seg: sharedEdge(r, o) }))
        .filter((x) => x.seg && x.seg.len >= 0.8)
        .sort((p, q) => q.seg!.len - p.seg!.len)[0];
      if (target) {
        if (!linked.has(key(r.id, target.o.id))) connect(r, target.o, target.seg!);
        reached.add(r.id);
        done = true;
        break;
      }
    }
    if (!done) {
      // 2ª chance: qualquer vizinho social/circulação
      const any = rooms
        .filter((o) => o.id !== r.id && (o.zone === "social" || o.zone === "circulation" || o.zone === "outdoor"))
        .map((o) => ({ o, seg: sharedEdge(r, o) }))
        .filter((x) => x.seg && x.seg.len >= 0.8)[0];
      if (any) {
        if (!linked.has(key(r.id, any.o.id))) connect(r, any.o, any.seg!);
        reached.add(r.id);
      } else {
        issues.push(`${r.nome} ficou sem porta para um ambiente de acesso.`);
      }
    }
  }

  // Integração visual extra: sala ↔ varanda/cozinha mesmo que já tenham outra porta
  const sala = rooms.find((r) => r.tipo === "sala");
  if (sala) {
    for (const o of rooms) {
      if (o.id === sala.id || linked.has(key(sala.id, o.id))) continue;
      if (o.tipo === "varanda" || (o.tipo === "cozinha" && integrada) || o.tipo === "jantar") {
        const seg = sharedEdge(sala, o);
        if (seg && seg.len >= 1.2) connect(o, sala, seg);
      }
    }
  }

  // Entrada principal na fachada (lado "top" = rua)
  const entryCandidates = ["circulacao", "sala", "jantar", "varanda"] as RoomType[];
  let entry: Opening | null = null;
  for (const t of entryCandidates) {
    const r = rooms.find((x) => x.tipo === t && x.exterior.includes("top"));
    if (r) {
      entry = { kind: "entrance", ...cut(sideSegment(r, "top"), 0.9, t === "circulacao" ? 0.5 : 0.15), rooms: [r.id], swingInto: r.id };
      break;
    }
  }
  if (entry) ops.push(entry);
  else issues.push("Não encontrei uma parede na fachada para a porta de entrada.");

  // Portão da garagem
  const g = rooms.find((r) => r.tipo === "garagem");
  if (g) {
    if (g.exterior.includes("top")) {
      ops.push({ kind: "garage_door", ...cut(sideSegment(g, "top"), Math.max(2.4, g.w - 0.5), 0.5), rooms: [g.id] });
    } else {
      issues.push("A garagem não ficou voltada para a rua.");
    }
  }

  // Janelas nas paredes externas
  for (const r of rooms) {
    const w = WINDOW[r.tipo];
    if (!w) continue;
    const sides = g && r.id === g.id ? [] : r.exterior;
    if (sides.length === 0) continue;
    const best = sides
      .map((s) => ({ s, seg: sideSegment(r, s) }))
      .sort((a, b) => (b.s === "top" ? -0.5 : 0) + b.seg.len - ((a.s === "top" ? -0.5 : 0) + a.seg.len))[0];
    const big = brief.preferencias.luzNatural && (r.tipo === "sala" || r.tipo === "suite") ? 1.25 : 1;
    const hasEntry = entry && entry.rooms[0] === r.id && best.s === "top";
    ops.push({ kind: "window", ...cut(best.seg, Math.min(w * big, best.seg.len - 0.6), hasEntry ? 0.85 : 0.5), rooms: [r.id] });
  }
  return ops;
}

// ───────────────────────── Pontuação ─────────────────────────

export function scorePlan(plan: Omit<Plan, "score">, brief: Brief, Dmax: number, learning?: LearningState, explain?: string[]): number {
  let total = 100;
  const pen = (v: number, why: string) => {
    total -= v;
    if (explain && v) explain.push(`-${v.toFixed(1)} ${why}`);
  };
  const rooms = plan.rooms;
  for (const r of rooms) {
    const info = ROOM_INFO[r.tipo];
    const area = r.w * r.h;
    const short = Math.min(r.w, r.h);
    const long = Math.max(r.w, r.h);
    if (r.tipo === "circulacao") {
      if (short > 1.4) pen((short - 1.4) * 6, `${r.nome} largo demais`);
      continue;
    }
    if (r.tipo === "garagem") continue;
    const devWeight = r.zone === "outdoor" ? 4 : 12;
    pen(Math.min(10, (Math.abs(area - r.targetArea) / r.targetArea) * devWeight), `${r.nome}: área diferente do alvo`);
    if (short < info.minWidth - 0.02) pen((info.minWidth - short) * 25, `${r.nome}: abaixo da largura mínima`);
    const ar = long / Math.max(short, 0.1);
    const arMax = r.zone === "outdoor" ? 5.5 : r.tipo === "sala" ? 2.4 : 2.1;
    if (ar > arMax) pen(Math.min(15, (ar - arMax) * 7), `${r.nome}: proporção alongada`);
    if (r.exterior.length === 0) {
      if (r.tipo === "quarto" || r.tipo === "suite" || r.tipo === "sala") pen(15, `${r.nome} sem janela para fora`);
      else if (r.tipo === "cozinha" || r.tipo === "escritorio") pen(6, `${r.nome} sem janela para fora`);
      else if (r.zone === "outdoor") pen(12, `${r.nome} sem lado aberto`);
      else pen(1.5, `${r.nome} sem ventilação direta`);
    }
  }
  const g = rooms.find((r) => r.tipo === "garagem");
  if (g && brief.carro) {
    const need = { w: g.targetArea / (brief.carro.comprimento + 1.0), h: brief.carro.comprimento + 1.0 };
    if (g.w < need.w - 0.05 || g.h < need.h - 0.05) pen(25, "garagem menor que o carro");
    if (!g.exterior.includes("top")) pen(25, "garagem sem acesso à rua");
    if (g.w * g.h > g.targetArea * 1.6) pen(6, "garagem superdimensionada");
  }
  if (plan.footprint.h > Dmax + EPS) pen(40, "não cabe no terreno");
  pen(plan.issues.filter((i) => i.includes("sem porta")).length * 20, "cômodos sem acesso");

  const by = (t: RoomType) => rooms.filter((r) => r.tipo === t);
  const sala = by("sala")[0];
  const cozinha = by("cozinha")[0];
  if (brief.preferencias.salaCozinhaIntegradas && sala && cozinha && !sharedEdge(sala, cozinha)) pen(10, "sala e cozinha não se tocam");
  if (brief.preferencias.quartosReservados) {
    for (const q of [...by("quarto"), ...by("suite")]) {
      if (q.exterior.includes("top")) pen(4, `${q.nome} voltado para a rua`);
      if (sala && sharedEdge(q, sala)) pen(2, `${q.nome} colado na sala`);
      if (cozinha && sharedEdge(q, cozinha)) pen(2, `${q.nome} colado na cozinha`);
    }
  }
  for (const v of by("varanda")) {
    const social = [sala, cozinha, ...by("jantar")].filter(Boolean);
    if (!social.some((s) => sharedEdge(v, s!))) pen(8, "varanda longe da área social");
    if (brief.preferencias.varandaPosicao === "fundos" && !v.exterior.includes("bottom")) pen(8, "varanda não está nos fundos");
  }
  if (learning) pen(-strategyBonus(learning, plan.strategy) * 8, "aprendizado");
  return clamp(total, 0, 100);
}

// ───────────────────────── Motor principal ─────────────────────────

export interface LayoutOptions {
  learning?: LearningState;
  /** ids cujas áreas foram fixadas pelo usuário — o relaxamento não mexe nelas */
  locked?: Set<string>;
}

export function layoutWith(program: Program, brief: Brief, strategy: LayoutStrategy, opts: LayoutOptions = {}): Plan {
  const lot = { width: brief.terreno.largura, depth: brief.terreno.profundidade };
  const sb = setbacksFor(lot.width, lot.depth, brief.regras);
  const Dmax = lot.depth - sb.front - sb.back;
  const W = strategy.width;
  const corridorId = "circulacao-1";
  const privateArea = program.rooms.filter((r) => r.zone === "private").reduce((s, r) => s + r.area, 0);
  const corridorSpec: RoomSpec = {
    id: corridorId,
    tipo: "circulacao",
    nome: "Circulação",
    zone: "circulation",
    area: Math.max(3, (privateArea / 3.6) * corridorWidth(brief)),
    minWidth: 0.9,
  };
  const specs = [...program.rooms, corridorSpec];
  let tree = buildTree(specs, brief, strategy, corridorId);
  // rede de segurança: nenhum cômodo pode ficar de fora da árvore
  const placed = new Set(leaves(tree));
  const missing = specs.filter((r) => !placed.has(r.id));
  if (missing.length) tree = split("y", [tree, split("x", missing.map((r) => leaf(r.id)))])!;
  const weights: Record<string, number> = Object.fromEntries(specs.map((r) => [r.id, r.area]));
  const locked = opts.locked ?? new Set<string>();
  const issues: string[] = [];

  const rectFor = () => {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    return { x: sb.left, y: sb.front, w: W, h: total / W };
  };

  let res = slice(tree, rectFor(), weights);
  for (let iter = 0; iter < 12; iter++) {
    let changed = false;
    for (const r of specs) {
      const rr = res.rects[r.id];
      if (!rr) continue;
      const axis = res.groups[r.id].axis;
      const controlled = axis === "x" ? rr.w : rr.h;
      if (r.tipo === "circulacao") {
        const long = Math.max(rr.w, rr.h);
        const target = long * corridorWidth(brief);
        if (Math.abs(target - weights[r.id]) > 0.05) {
          weights[r.id] = target;
          changed = true;
        }
        continue;
      }
      if (locked.has(r.id) && !r.fixed) continue;
      let need = r.minWidth;
      if (r.fixed) {
        need = axis === "x" ? r.fixed.w : r.fixed.h;
        // a outra dimensão é decidida pelo grupo: se faltar, o grupo inteiro cresce
        const other = axis === "x" ? rr.h : rr.w;
        const needOther = axis === "x" ? r.fixed.h : r.fixed.w;
        if (other < needOther - 0.01) {
          const f = Math.min(needOther / other, 1.3);
          for (const id of res.groups[r.id].siblings) {
            if (id === r.id || id === corridorId || locked.has(id)) continue;
            const spec = specs.find((x) => x.id === id)!;
            weights[id] = Math.min(weights[id] * f, spec.area * 1.6);
          }
          weights[r.id] *= f;
          changed = true;
        }
      }
      if (controlled < need - 0.01) {
        const grown = weights[r.id] * Math.min(need / controlled, 1.35);
        weights[r.id] = Math.min(grown, r.area * (r.fixed ? 2.2 : 1.7));
        changed = true;
      }
    }
    // cabe no terreno? se não, encolhe o que for flexível
    const rect = rectFor();
    if (rect.h > Dmax) {
      const flex = specs.filter((r) => !r.fixed && !locked.has(r.id) && r.tipo !== "circulacao");
      const excess = (rect.h - Dmax) * W;
      const flexSum = flex.reduce((s, r) => s + weights[r.id], 0);
      const f = Math.max(0.7, 1 - excess / Math.max(flexSum, 1));
      for (const r of flex) weights[r.id] = Math.max(weights[r.id] * f, ROOM_INFO[r.tipo].minArea);
      changed = true;
    }
    res = slice(tree, rectFor(), weights);
    if (!changed) break;
  }

  const fp = rectFor();
  if (fp.h > Dmax + 0.01) {
    issues.push(`A área pedida não cabe em um pavimento respeitando os recuos (faltam ${((fp.h - Dmax) * W).toFixed(0)} m²).`);
  }
  const rooms: PlacedRoom[] = specs.map((r) => {
    const rect = res.rects[r.id];
    return {
      ...rect,
      id: r.id,
      tipo: r.tipo,
      nome: r.nome,
      zone: r.zone,
      targetArea: r.area,
      group: res.groups[r.id].group,
      axis: res.groups[r.id].axis,
      exterior: exteriorSides(rect, fp),
    };
  });
  for (const r of rooms) {
    const info = ROOM_INFO[r.tipo];
    if (r.tipo !== "circulacao" && Math.min(r.w, r.h) < info.minWidth - 0.05) {
      issues.push(`${r.nome} ficou estreito (${Math.min(r.w, r.h).toFixed(2)} m; mínimo recomendado ${info.minWidth} m).`);
    }
    if ((r.tipo === "quarto" || r.tipo === "suite") && r.exterior.length === 0) {
      issues.push(`${r.nome} não tem parede externa para janela.`);
    }
  }
  const openings = openingsFor(rooms, brief, issues);
  const partial = {
    lot,
    footprint: fp,
    setbacks: sb,
    rooms,
    openings,
    strategy,
    issues,
    builtArea: Number((fp.w * fp.h).toFixed(1)),
    handles: res.handles,
  };
  return { ...partial, score: Math.round(scorePlan(partial, brief, Dmax, opts.learning)) };
}

/** Gera todas as variações, pontua e devolve da melhor para a pior. */
export function generatePlans(program: Program, brief: Brief, opts: LayoutOptions = {}): Plan[] {
  const sb = setbacksFor(brief.terreno.largura, brief.terreno.profundidade, brief.regras);
  const Wavail = brief.terreno.largura - sb.left - sb.right;
  const totalArea = program.rooms.reduce((s, r) => s + r.area, 0) * 1.1;
  const widths = new Set<number>([Number(Wavail.toFixed(2))]);
  const compact = clamp(Math.sqrt(totalArea * 0.75), 7.5, Wavail);
  if (Wavail - compact > 1) widths.add(Number(compact.toFixed(2)));

  const plans: Plan[] = [];
  for (const width of widths) {
    for (const kind of ["faixas", "lateral"] as const) {
      for (const mirror of [false, true]) {
        for (const variant of [0, 1, 2] as const) {
          plans.push(layoutWith(program, brief, { kind, mirror, variant, width }, opts));
        }
      }
    }
  }
  // remove duplicatas geométricas (variante sem efeito)
  const seen = new Set<string>();
  return plans
    .sort((a, b) => b.score - a.score)
    .filter((p) => {
      const sig = p.rooms.map((r) => `${r.id}:${r.x.toFixed(2)},${r.y.toFixed(2)},${r.w.toFixed(2)}`).join(";");
      if (seen.has(sig)) return false;
      seen.add(sig);
      return true;
    });
}

/** Explica a nota de uma planta em frases curtas (penalidades relevantes). */
export function explainPlan(plan: Plan, brief: Brief, learning?: LearningState): string[] {
  const sb = setbacksFor(brief.terreno.largura, brief.terreno.profundidade, brief.regras);
  const why: string[] = [];
  scorePlan(plan, brief, brief.terreno.profundidade - sb.front - sb.back, learning, why);
  return why.filter((w) => !/^-0\.[0-4]/.test(w));
}
