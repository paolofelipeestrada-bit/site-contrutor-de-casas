import type { Brief, Norte, Opening, PlacedRoom, Plan, Rect, RoomType, Zone } from "../types";

/**
 * PLANTA 2D → MODELO 3D (geometria pura, sem Three.js).
 *
 * A planta (Plan) é a fonte de verdade: aqui só extrudamos o que ela já tem — cômodos, paredes nas bordas dos
 * cômodos, portas e janelas nas posições calculadas pelo motor de planta. Nada é inventado ou decidido por IA.
 *
 * Coordenadas: as mesmas da planta, em metros. x cresce para a direita; y cresce da rua (y = 0, frente) para os
 * fundos. A altura é "z" (0 = piso). O visualizador converte para o espaço do Three.js.
 * As paredes ficam centradas no eixo da linha do cômodo (como na planta 2D): a medida do cômodo é de eixo a eixo.
 */

/** Todos os números da construção 3D. Para mudar pé-direito, espessura de parede, portas ou janelas, edite aqui. */
export const CASA3D = {
  peDireito: 2.8,
  parede: { interna: 0.15, externa: 0.15 },
  porta: { altura: 2.1, folha: 0.04 },
  /** vão sem porta (sala ↔ cozinha integradas, corredor ↔ sala) */
  passagem: { altura: 2.1 },
  portao: { altura: 2.3 },
  janela: { peitoril: 1.0, altura: 1.2 },
  /** banheiros e lavabo: janela alta (basculante), para privacidade */
  janelaAlta: { peitoril: 1.6, altura: 0.6 },
  laje: { espessura: 0.12, platibanda: 0.5 },
  telhado: { inclinacao: 0.25, beiral: 0.6, espessura: 0.06 },
  /** pilares nos cantos livres de varanda e área gourmet (sustentam a cobertura) */
  pilar: 0.15,
  /** altura dos olhos no modo andar */
  olhos: 1.6,
};

export type Config3D = typeof CASA3D;
export type Cobertura = "laje" | "telhado";

const TIPOS_JANELA_ALTA = new Set<RoomType>(["banheiro", "banheiro_suite", "lavabo"]);
const EPS = 1e-3;

export type Piso = "madeira" | "ceramica" | "concreto" | "externo";

export interface Room3D {
  id: string;
  nome: string;
  tipo: RoomType;
  zona: Zone;
  /** canto da frente-esquerda, em metros (mesmo da planta) */
  x: number;
  y: number;
  /** largura (eixo x) e profundidade (eixo y) de eixo a eixo — exatamente as da planta 2D */
  largura: number;
  profundidade: number;
  altura: number;
  area: number;
  /** vão livre entre as faces das paredes */
  livre: { largura: number; profundidade: number };
  fechado: boolean;
  piso: Piso;
}

/** Um bloco de parede: segmento no eixo (x1,y1)→(x2,y2), da altura `base` até `topo`. */
export interface Wall3D {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  comprimento: number;
  espessura: number;
  base: number;
  topo: number;
  externa: boolean;
  /** parte da parede acima/abaixo de uma abertura */
  parte: "cheia" | "verga" | "peitoril" | "platibanda";
}

export type TipoPorta = "giro" | "entrada" | "correr" | "portao" | "passagem";

export interface Door3D {
  id: string;
  tipo: TipoPorta;
  /** dobradiça em (x1,y1); a folha fechada vai até (x2,y2) */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  largura: number;
  altura: number;
  espessura: number;
  /** direção (na planta) para onde a folha abre */
  abre: { x: number; y: number };
  comodos: string[];
  /** false = a planta pôs a porta num lado aberto (ex.: varanda), sem parede para recortar */
  naParede: boolean;
}

export interface Window3D {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  largura: number;
  peitoril: number;
  altura: number;
  espessura: number;
  comodo: string;
  /** direção (na planta) para fora da casa */
  fora: { x: number; y: number };
}

export interface Pilar {
  x: number;
  y: number;
  lado: number;
  altura: number;
}

/** Telhado de 4 águas sobre o retângulo da casa (com beiral). */
export interface Telhado {
  x: number;
  y: number;
  largura: number;
  profundidade: number;
  /** altura do beiral (início do telhado) e da cumeeira */
  base: number;
  cumeeira: number;
  /** cumeeira paralela a x (casa mais larga que funda) ou a y */
  eixo: "x" | "y";
}

export interface Model3D {
  config: Config3D;
  lote: { largura: number; profundidade: number };
  casa: Rect;
  comodos: Room3D[];
  paredes: Wall3D[];
  portas: Door3D[];
  janelas: Window3D[];
  pilares: Pilar[];
  cobertura: { tipo: Cobertura; lajes: Rect[]; telhado: Telhado | null; forros: Rect[] };
  /** onde a pessoa começa no modo andar: na calçada, olhando para a entrada */
  inicio: { x: number; y: number; olhando: { x: number; y: number } };
  norte: { x: number; y: number } | null;
  /** caixas que bloqueiam a passagem no modo andar (na planta, em metros) */
  obstaculos: Rect[];
  avisos: string[];
}

// ───────────────────────── Paredes a partir das bordas dos cômodos ─────────────────────────

interface Aresta {
  vertical: boolean;
  /** coordenada fixa da linha (x se vertical, y se horizontal) */
  c: number;
  a: number;
  b: number;
  sala: string;
}

interface Trecho {
  vertical: boolean;
  c: number;
  a: number;
  b: number;
  externa: boolean;
}

const r3 = (v: number) => Math.round(v * 1000) / 1000;

function arestas(r: Rect, id: string): Aresta[] {
  return [
    { vertical: false, c: r.y, a: r.x, b: r.x + r.w, sala: id },
    { vertical: false, c: r.y + r.h, a: r.x, b: r.x + r.w, sala: id },
    { vertical: true, c: r.x, a: r.y, b: r.y + r.h, sala: id },
    { vertical: true, c: r.x + r.w, a: r.y, b: r.y + r.h, sala: id },
  ];
}

/**
 * Junta as bordas dos cômodos linha por linha. Um trecho com dois cômodos dos dois lados vira parede interna;
 * com um só (o outro lado é a rua, o quintal ou uma varanda aberta) vira parede externa.
 */
export function trechosDeParede(bordas: Aresta[]): Trecho[] {
  const linhas = new Map<string, Aresta[]>();
  for (const e of bordas) {
    const k = `${e.vertical ? "v" : "h"}:${r3(e.c)}`;
    (linhas.get(k) ?? linhas.set(k, []).get(k)!).push(e);
  }
  const out: Trecho[] = [];
  for (const es of linhas.values()) {
    const { vertical, c } = es[0];
    const pts = [...new Set(es.flatMap((e) => [r3(e.a), r3(e.b)]))].sort((p, q) => p - q);
    let atual: Trecho | null = null;
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i];
      const q = pts[i + 1];
      if (q - p < EPS) continue;
      const n = es.filter((e) => e.a <= p + EPS && e.b >= q - EPS).length;
      if (n === 0) {
        if (atual) out.push(atual);
        atual = null;
        continue;
      }
      const externa = n === 1;
      if (atual && atual.externa === externa && Math.abs(atual.b - p) < EPS) atual.b = q;
      else {
        if (atual) out.push(atual);
        atual = { vertical, c, a: p, b: q, externa };
      }
    }
    if (atual) out.push(atual);
  }
  return out;
}

function sobreLinha(o: Opening, t: Trecho): [number, number] | null {
  const vertical = Math.abs(o.x1 - o.x2) < EPS;
  if (vertical !== t.vertical) return null;
  const c = vertical ? o.x1 : o.y1;
  if (Math.abs(c - t.c) > EPS) return null;
  const a = Math.max(Math.min(vertical ? o.y1 : o.x1, vertical ? o.y2 : o.x2), t.a);
  const b = Math.min(Math.max(vertical ? o.y1 : o.x1, vertical ? o.y2 : o.x2), t.b);
  return b - a > EPS ? [a, b] : null;
}

/** Até que altura vai o vão de cada abertura e onde começa (peitoril). */
function vao(o: Opening, rooms: PlacedRoom[], cfg: Config3D): { base: number; topo: number } {
  const lim = (h: number) => Math.min(h, cfg.peDireito - 0.1);
  switch (o.kind) {
    case "window": {
      const r = rooms.find((x) => x.id === o.rooms[0]);
      const j = r && TIPOS_JANELA_ALTA.has(r.tipo) ? cfg.janelaAlta : cfg.janela;
      return { base: j.peitoril, topo: lim(j.peitoril + j.altura) };
    }
    case "garage_door":
      return { base: 0, topo: lim(cfg.portao.altura) };
    case "passage":
      return { base: 0, topo: lim(cfg.passagem.altura) };
    default:
      return { base: 0, topo: lim(cfg.porta.altura) };
  }
}

function seg(t: Trecho, a: number, b: number) {
  return t.vertical ? { x1: t.c, y1: a, x2: t.c, y2: b } : { x1: a, y1: t.c, x2: b, y2: t.c };
}

// ───────────────────────── Conversão principal ─────────────────────────

const PISO: Partial<Record<RoomType, Piso>> = {
  cozinha: "ceramica",
  banheiro: "ceramica",
  banheiro_suite: "ceramica",
  lavabo: "ceramica",
  lavanderia: "ceramica",
  garagem: "concreto",
  varanda: "externo",
  area_gourmet: "externo",
};

const NORTE: Record<Norte, { x: number; y: number }> = {
  frente: { x: 0, y: -1 },
  fundos: { x: 0, y: 1 },
  esquerda: { x: -1, y: 0 },
  direita: { x: 1, y: 0 },
};

export function planTo3D(plan: Plan, brief: Brief | null, cobertura: Cobertura = "laje", cfg: Config3D = CASA3D): Model3D {
  const avisos: string[] = [];
  const fechados = plan.rooms.filter((r) => r.zone !== "outdoor");
  const esp = (externa: boolean) => (externa ? cfg.parede.externa : cfg.parede.interna);

  // 1. Paredes: bordas dos cômodos fechados (varanda e área gourmet são abertas)
  const trechos = trechosDeParede(fechados.flatMap((r) => arestas(r, r.id)));
  const paredes: Wall3D[] = [];
  let n = 0;
  const add = (t: Trecho, a: number, b: number, base: number, topo: number, parte: Wall3D["parte"]) => {
    if (b - a < EPS || topo - base < EPS) return;
    paredes.push({ id: `p${n++}`, ...seg(t, a, b), comprimento: b - a, espessura: esp(t.externa), base, topo, externa: t.externa, parte });
  };
  const usadas = new Set<Opening>();
  for (const t of trechos) {
    const meia = esp(t.externa) / 2;
    // estende meia espessura nas pontas para fechar os cantos
    const a0 = t.a - meia;
    const b0 = t.b + meia;
    const cortes = plan.openings
      .map((o) => ({ o, iv: sobreLinha(o, t) }))
      .filter((x): x is { o: Opening; iv: [number, number] } => !!x.iv)
      .sort((p, q) => p.iv[0] - q.iv[0]);
    let cursor = a0;
    for (const { o, iv } of cortes) {
      usadas.add(o);
      const v = vao(o, plan.rooms, cfg);
      add(t, cursor, iv[0], 0, cfg.peDireito, "cheia");
      if (v.base > 0) add(t, iv[0], iv[1], 0, v.base, "peitoril");
      add(t, iv[0], iv[1], v.topo, cfg.peDireito, "verga");
      cursor = iv[1];
    }
    add(t, cursor, b0, 0, cfg.peDireito, "cheia");
  }

  // 2. Portas e janelas: exatamente as aberturas da planta
  const portas: Door3D[] = [];
  const janelas: Window3D[] = [];
  const espDaAbertura = (o: Opening) => {
    const t = trechos.find((t) => sobreLinha(o, t));
    return t ? esp(t.externa) : cfg.parede.externa;
  };
  plan.openings.forEach((o, i) => {
    const largura = Math.hypot(o.x2 - o.x1, o.y2 - o.y1);
    const horizontal = Math.abs(o.y1 - o.y2) < EPS;
    const v = vao(o, plan.rooms, cfg);
    if (o.kind === "window") {
      const r = plan.rooms.find((x) => x.id === o.rooms[0]);
      const fora = r ? (horizontal ? { x: 0, y: r.y + r.h / 2 > o.y1 ? -1 : 1 } : { x: r.x + r.w / 2 > o.x1 ? -1 : 1, y: 0 }) : { x: 0, y: -1 };
      janelas.push({
        id: `j${i}`,
        x1: o.x1,
        y1: o.y1,
        x2: o.x2,
        y2: o.y2,
        largura,
        peitoril: v.base,
        altura: v.topo - v.base,
        espessura: espDaAbertura(o),
        comodo: o.rooms[0],
        fora,
      });
      return;
    }
    const tipo: TipoPorta =
      o.kind === "door" ? "giro" : o.kind === "entrance" ? "entrada" : o.kind === "slide" ? "correr" : o.kind === "garage_door" ? "portao" : "passagem";
    const alvo = plan.rooms.find((r) => r.id === o.swingInto) ?? plan.rooms.find((r) => r.id === o.rooms[0]);
    let abre = { x: 0, y: 1 };
    if (alvo) abre = horizontal ? { x: 0, y: alvo.y + alvo.h / 2 > o.y1 ? 1 : -1 } : { x: alvo.x + alvo.w / 2 > o.x1 ? 1 : -1, y: 0 };
    const naParede = usadas.has(o);
    if (!naParede)
      avisos.push(`A ${tipo === "entrada" ? "entrada" : "porta"} de ${alvo?.nome ?? "um cômodo"} fica num lado aberto (sem parede): aparece só a soleira.`);
    portas.push({
      id: `d${i}`,
      tipo,
      x1: o.x1,
      y1: o.y1,
      x2: o.x2,
      y2: o.y2,
      largura,
      altura: v.topo,
      espessura: espDaAbertura(o),
      abre,
      comodos: o.rooms,
      naParede,
    });
  });

  // 3. Cômodos e pisos
  const paredeNoLado = (r: PlacedRoom, lado: "top" | "bottom" | "left" | "right") => {
    if (r.zone !== "outdoor") return true;
    const vertical = lado === "left" || lado === "right";
    const c = lado === "top" ? r.y : lado === "bottom" ? r.y + r.h : lado === "left" ? r.x : r.x + r.w;
    const [a, b] = vertical ? [r.y, r.y + r.h] : [r.x, r.x + r.w];
    const coberto = trechos
      .filter((t) => t.vertical === vertical && Math.abs(t.c - c) < EPS)
      .reduce((s, t) => s + Math.max(0, Math.min(b, t.b) - Math.max(a, t.a)), 0);
    return coberto > (b - a) / 2;
  };
  const comodos: Room3D[] = plan.rooms.map((r) => {
    const m = (l: "top" | "bottom" | "left" | "right") => (paredeNoLado(r, l) ? esp(r.exterior.includes(l)) / 2 : 0);
    return {
      id: r.id,
      nome: r.nome,
      tipo: r.tipo,
      zona: r.zone,
      x: r.x,
      y: r.y,
      largura: r.w,
      profundidade: r.h,
      altura: cfg.peDireito,
      area: r.w * r.h,
      livre: { largura: r.w - m("left") - m("right"), profundidade: r.h - m("top") - m("bottom") },
      fechado: r.zone !== "outdoor",
      piso: PISO[r.tipo] ?? "madeira",
    };
  });

  // 4. Pilares nos cantos de varanda/área gourmet que não encostam em parede
  const pilares: Pilar[] = [];
  const naParede = (x: number, y: number) =>
    trechos.some((t) =>
      t.vertical ? Math.abs(x - t.c) < EPS && y >= t.a - EPS && y <= t.b + EPS : Math.abs(y - t.c) < EPS && x >= t.a - EPS && x <= t.b + EPS,
    );
  for (const r of plan.rooms.filter((r) => r.zone === "outdoor")) {
    const s = cfg.pilar;
    for (const [x, y, dx, dy] of [
      [r.x, r.y, 1, 1],
      [r.x + r.w, r.y, -1, 1],
      [r.x, r.y + r.h, 1, -1],
      [r.x + r.w, r.y + r.h, -1, -1],
    ] as const) {
      if (naParede(x, y)) continue;
      const px = x + (dx * s) / 2;
      const py = y + (dy * s) / 2;
      if (!pilares.some((p) => Math.abs(p.x - px) < 0.2 && Math.abs(p.y - py) < 0.2)) pilares.push({ x: px, y: py, lado: s, altura: cfg.peDireito });
    }
  }

  // 5. Cobertura: laje plana com platibanda, ou telhado de 4 águas quando a casa é um retângulo cheio
  const fp = plan.footprint;
  const areaCoberta = plan.rooms.reduce((s, r) => s + r.w * r.h, 0);
  const retangular = Math.abs(areaCoberta - fp.w * fp.h) < 0.02 * fp.w * fp.h;
  let tipo = cobertura;
  if (tipo === "telhado" && !retangular) {
    tipo = "laje";
    avisos.push("O telhado de 4 águas precisa de uma casa retangular sem recortes; mostrando laje.");
  }
  const lajes: Rect[] = plan.rooms.map((r) => ({ x: r.x, y: r.y, w: r.w, h: r.h }));
  let telhado: Telhado | null = null;
  if (tipo === "laje") {
    // platibanda: contorno de todos os cômodos cobertos (inclui varanda)
    const contorno = trechosDeParede(plan.rooms.flatMap((r) => arestas(r, r.id))).filter((t) => t.externa);
    for (const t of contorno) {
      const meia = cfg.parede.externa / 2;
      add({ ...t, externa: true }, t.a - meia, t.b + meia, cfg.peDireito, cfg.peDireito + cfg.laje.espessura + cfg.laje.platibanda, "platibanda");
    }
  } else {
    const b = cfg.telhado.beiral;
    const eixo = fp.w >= fp.h ? "x" : "y";
    const vaoMenor = Math.min(fp.w, fp.h) + 2 * b;
    telhado = {
      x: fp.x - b,
      y: fp.y - b,
      largura: fp.w + 2 * b,
      profundidade: fp.h + 2 * b,
      base: cfg.peDireito,
      cumeeira: cfg.peDireito + (vaoMenor / 2) * cfg.telhado.inclinacao,
      eixo,
    };
  }

  // 6. Ponto de partida: na calçada, em frente à entrada
  const entrada = portas.find((p) => p.tipo === "entrada");
  const cx = entrada ? (entrada.x1 + entrada.x2) / 2 : fp.x + fp.w / 2;
  const inicio = { x: cx, y: Math.max(-1.2, (entrada ? entrada.y1 : fp.y) - 1.8), olhando: { x: 0, y: 1 } };

  // 7. Obstáculos do modo andar: tudo que fica na altura do corpo (paredes cheias, peitoris, pilares)
  const obstaculos: Rect[] = [];
  for (const p of paredes) {
    if (p.base > 1.2 || p.topo < 0.3) continue;
    const m = p.espessura / 2;
    obstaculos.push({
      x: Math.min(p.x1, p.x2) - (p.x1 === p.x2 ? m : 0),
      y: Math.min(p.y1, p.y2) - (p.y1 === p.y2 ? m : 0),
      w: Math.abs(p.x2 - p.x1) + (p.x1 === p.x2 ? 2 * m : 0),
      h: Math.abs(p.y2 - p.y1) + (p.y1 === p.y2 ? 2 * m : 0),
    });
  }
  for (const p of pilares) obstaculos.push({ x: p.x - p.lado / 2, y: p.y - p.lado / 2, w: p.lado, h: p.lado });

  const norte = brief?.regras?.norte ? NORTE[brief.regras.norte] : null;

  return {
    config: cfg,
    lote: { largura: plan.lot.width, profundidade: plan.lot.depth },
    casa: { ...fp },
    comodos,
    paredes,
    portas,
    janelas,
    pilares,
    cobertura: { tipo, lajes, telhado, forros: tipo === "telhado" ? lajes : [] },
    inicio,
    norte,
    obstaculos,
    avisos,
  };
}

/** Rótulo de medidas de um cômodo, igual ao da planta 2D. */
export function medidasDoComodo(r: Room3D): { titulo: string; dimensoes: string; area: string; peDireito: string; livre: string } {
  const f = (v: number, d = 2) => v.toFixed(d).replace(".", ",");
  return {
    titulo: r.nome.toUpperCase(),
    dimensoes: `${f(r.largura)} m × ${f(r.profundidade)} m`,
    area: `${f(r.area, 1)} m²`,
    peDireito: r.fechado ? `${f(r.altura)} m` : `${f(r.altura)} m (coberta)`,
    livre: `${f(r.livre.largura)} × ${f(r.livre.profundidade)} m entre as faces das paredes`,
  };
}

/** Em qual cômodo está um ponto da planta (para o modo andar mostrar "você está em…"). */
export function comodoEm(m: Model3D, x: number, y: number): Room3D | null {
  return m.comodos.find((r) => x >= r.x && x <= r.x + r.largura && y >= r.y && y <= r.y + r.profundidade) ?? null;
}
