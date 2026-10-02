import { CASA3D } from "./model";
import type { Brief, Opening, PlacedRoom, Plan, Rect, Side } from "../types";

/**
 * MOBÍLIA AUTOMÁTICA (geometria pura, sem Three.js).
 *
 * Planta 2D → Modelo 3D → Móveis 3D. Os móveis saem do TIPO de cada cômodo da planta e são encaixados por regras:
 * - ficam dentro do vão livre do cômodo (nunca atravessam parede);
 * - nunca entram na área de abertura/passagem das portas;
 * - móveis altos (guarda-roupa, geladeira, armário) não tapam janela;
 * - não se sobrepõem, e cada um guarda o espaço de uso na frente (abrir o guarda-roupa, sentar no vaso…);
 * - corredor (circulação) fica sempre vazio.
 * Se um móvel não couber respeitando tudo isso, ele simplesmente não é colocado.
 */

export type TipoMovel =
  | "sofa"
  | "poltrona"
  | "mesaCentro"
  | "rack"
  | "tv"
  | "mesa"
  | "mesaRedonda"
  | "cadeira"
  | "bancada"
  | "armarioSuperior"
  | "pia"
  | "fogao"
  | "geladeira"
  | "ilha"
  | "cama"
  | "criadoMudo"
  | "guardaRoupa"
  | "escrivaninha"
  | "cadeiraEscritorio"
  | "estante"
  | "vaso"
  | "lavatorio"
  | "espelho"
  | "box"
  | "maquina"
  | "tanque"
  | "armario"
  | "carro"
  | "sofaExterno";

export interface Movel3D {
  id: string;
  tipo: TipoMovel;
  comodo: string;
  /** centro na planta (m) */
  x: number;
  y: number;
  /** largura (de lado a lado, olhando de frente), profundidade (de trás para a frente) e altura, em metros */
  largura: number;
  profundidade: number;
  altura: number;
  /** altura do chão até a base (armário superior, TV, espelho) */
  elevacao: number;
  /** direção para onde a frente do móvel aponta, em radianos na planta (0 = +x, π/2 = +y, para os fundos) */
  rotacao: number;
  /** retângulo ocupado no chão (planta) */
  caixa: Rect;
  /** detalhe paramétrico: casal/solteiro, lugares… */
  variante?: string;
}

/** Medidas-padrão dos móveis (m). Para mudar o tamanho de um móvel em toda casa, edite aqui. */
export const MOVEIS = {
  camaCasal: { l: 1.38, p: 1.88, a: 0.95 },
  camaQueen: { l: 1.58, p: 1.98, a: 0.95 },
  camaSolteiro: { l: 0.88, p: 1.88, a: 0.95 },
  criado: { l: 0.45, p: 0.4, a: 0.55 },
  guardaRoupa: { p: 0.55, a: 2.1, min: 1.0, max: 2.4 }, // portas de correr
  escrivaninha: { l: 1.0, p: 0.5, a: 0.75 },
  cadeira: { l: 0.44, p: 0.46, a: 0.85 },
  sofa: { p: 0.9, a: 0.85, min: 1.5, max: 2.3 },
  poltrona: { l: 0.8, p: 0.8, a: 0.8 },
  mesaCentro: { l: 1.0, p: 0.55, a: 0.4 },
  rack: { p: 0.4, a: 0.5, min: 1.0, max: 1.8 },
  tv: { a: 0.72, p: 0.07, elev: 0.6 },
  bancada: { p: 0.6, a: 0.9 },
  armarioSuperior: { p: 0.35, a: 0.7, elev: 1.5 },
  geladeira: { l: 0.7, p: 0.7, a: 1.85 },
  fogao: { l: 0.6 },
  pia: { l: 0.8 },
  ilha: { p: 0.9, a: 0.9 },
  vaso: { l: 0.38, p: 0.65, a: 0.75 },
  lavatorio: { l: 0.6, p: 0.45, a: 0.85 },
  espelho: { a: 0.8, p: 0.03, elev: 1.15 },
  box: { l: 0.9, p: 0.9, a: 1.95 },
  maquina: { l: 0.6, p: 0.62, a: 0.85 },
  tanque: { l: 0.55, p: 0.5, a: 0.85 },
  armario: { l: 0.6, p: 0.4, a: 1.9 },
  estante: { l: 0.8, p: 0.35, a: 1.8 },
  mesaRedonda: { d: 0.9, a: 0.75 },
  sofaExterno: { l: 1.8, p: 0.8, a: 0.75 },
  carro: { a: 1.45 },
  /** espaço livre na frente de cada móvel para usá-lo */
  uso: { cama: 0.6, ladoCama: 0.5, guardaRoupa: 0.5, vaso: 0.5, lavatorio: 0.55, bancada: 0.9, sofa: 0.35, maquina: 0.6, portaCarro: 0.55 },
};

// ───────────────────────── Geometria auxiliar ─────────────────────────

interface Caixa {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
const EPS = 1e-3;
const daRect = (r: Rect): Caixa => ({ x0: r.x, y0: r.y, x1: r.x + r.w, y1: r.y + r.h });
const paraRect = (c: Caixa): Rect => ({ x: c.x0, y: c.y0, w: c.x1 - c.x0, h: c.y1 - c.y0 });
export const sobrepoe = (a: Caixa, b: Caixa, folga = 0.005) => a.x0 < b.x1 - folga && b.x0 < a.x1 - folga && a.y0 < b.y1 - folga && b.y0 < a.y1 - folga;
const dentro = (fora: Caixa, a: Caixa) => a.x0 >= fora.x0 - EPS && a.y0 >= fora.y0 - EPS && a.x1 <= fora.x1 + EPS && a.y1 <= fora.y1 + EPS;
const FRENTE: Record<Side, number> = { top: Math.PI / 2, bottom: -Math.PI / 2, left: 0, right: Math.PI };

/**
 * Sistema local apoiado numa parede de uma área retangular: "u" corre ao longo da parede, "v" entra na área.
 * Permite escrever "guarda-roupa encostado na parede, no canto" sem pensar em rotação.
 */
function quadro(A: Caixa, lado: Side) {
  const W = A.x1 - A.x0;
  const H = A.y1 - A.y0;
  const horizontal = lado === "top" || lado === "bottom";
  const len = horizontal ? W : H;
  const prof = horizontal ? H : W;
  const xy = (u: number, v: number): [number, number] => {
    switch (lado) {
      case "top":
        return [A.x0 + u, A.y0 + v];
      case "bottom":
        return [A.x0 + u, A.y1 - v];
      case "left":
        return [A.x0 + v, A.y0 + u];
      case "right":
        return [A.x1 - v, A.y0 + u];
    }
  };
  const caixa = (u: number, v: number, du: number, dv: number): Caixa => {
    const [ax, ay] = xy(u, v);
    const [bx, by] = xy(u + du, v + dv);
    return { x0: Math.min(ax, bx), y0: Math.min(ay, by), x1: Math.max(ax, bx), y1: Math.max(ay, by) };
  };
  /** direção de +u na planta (para virar uma poltrona de lado) */
  const anguloU = horizontal ? 0 : Math.PI / 2;
  return { lado, len, prof, xy, caixa, frente: FRENTE[lado], anguloU };
}
type Quadro = ReturnType<typeof quadro>;

/** Posições ao longo de uma parede: do centro para fora, ou dos cantos para dentro. */
function posicoes(len: number, w: number, pref: "centro" | "cantos", passo = 0.05): number[] {
  const max = len - w;
  if (max < -EPS) return [];
  const n = Math.floor(Math.max(0, max) / passo + EPS);
  const us = Array.from({ length: n + 1 }, (_, i) => i * passo);
  if (max - us[us.length - 1] > EPS) us.push(max);
  const c = max / 2;
  return pref === "centro" ? us.sort((a, b) => Math.abs(a - c) - Math.abs(b - c)) : us.sort((a, b) => Math.min(a, max - a) - Math.min(b, max - b));
}

// ───────────────────────── Contexto de um cômodo ─────────────────────────

interface Janela {
  lado: Side;
  /** trecho em coordenada absoluta ao longo do lado (x para top/bottom, y para left/right) */
  a: number;
  b: number;
  peitoril: number;
}

interface Ctx {
  room: PlacedRoom;
  /** vão livre do cômodo (já descontando meia parede e uma pequena folga) */
  A: Caixa;
  portas: Caixa[];
  janelas: Janela[];
  paredes: Record<Side, boolean>;
  moveis: Movel3D[];
  /** espaços de uso reservados (só valem para móveis no chão) */
  usos: Caixa[];
  n: number;
}

interface Item {
  q: Quadro;
  tipo: TipoMovel;
  u: number;
  v: number;
  /** ao longo de u, ao longo de v */
  du: number;
  dv: number;
  altura: number;
  elevacao?: number;
  /** vira a frente para a parede (ex.: sofá olhando a TV) */
  vira?: boolean;
  /** rotação própria (sobrepõe a do quadro) */
  rotacao?: number;
  /** espaços de uso na frente/lados, em coordenadas do quadro [u, v, du, dv] */
  usos?: [number, number, number, number][];
  /** encostado na parede do quadro: confere janelas */
  naParede?: boolean;
  /** vidro/peça baixa que pode ficar sob janela */
  ignoraJanela?: boolean;
  variante?: string;
}

const LADOS: Side[] = ["top", "right", "bottom", "left"];

/** Lado do cômodo em que está um segmento de abertura (ou null). */
function ladoDe(o: Opening, r: Rect): Side | null {
  const h = Math.abs(o.y1 - o.y2) < EPS;
  if (h && Math.abs(o.y1 - r.y) < EPS) return "top";
  if (h && Math.abs(o.y1 - (r.y + r.h)) < EPS) return "bottom";
  if (!h && Math.abs(o.x1 - r.x) < EPS) return "left";
  if (!h && Math.abs(o.x1 - (r.x + r.w)) < EPS) return "right";
  return null;
}

function contexto(room: PlacedRoom, plan: Plan): Ctx {
  const fechado = room.zone !== "outdoor";
  // lado com parede: cômodo fechado sempre; varanda só onde encosta num cômodo fechado
  const paredes = Object.fromEntries(
    LADOS.map((l) => {
      if (fechado) return [l, true];
      const vert = l === "left" || l === "right";
      const c = l === "top" ? room.y : l === "bottom" ? room.y + room.h : l === "left" ? room.x : room.x + room.w;
      const [a, b] = vert ? [room.y, room.y + room.h] : [room.x, room.x + room.w];
      let coberto = 0;
      for (const o of plan.rooms) {
        if (o.id === room.id || o.zone === "outdoor") continue;
        const bordas = vert ? [o.x, o.x + o.w] : [o.y, o.y + o.h];
        if (!bordas.some((e) => Math.abs(e - c) < EPS)) continue;
        coberto += Math.max(0, Math.min(b, vert ? o.y + o.h : o.x + o.w) - Math.max(a, vert ? o.y : o.x));
      }
      return [l, coberto > (b - a) / 2];
    }),
  ) as Record<Side, boolean>;

  const folga = (l: Side) => (paredes[l] ? CASA3D.parede.interna / 2 + 0.03 : 0.15);
  const A: Caixa = { x0: room.x + folga("left"), y0: room.y + folga("top"), x1: room.x + room.w - folga("right"), y1: room.y + room.h - folga("bottom") };

  // área de cada porta/passagem dentro do cômodo: folha abrindo + chegar até ela
  const portas: Caixa[] = [];
  const janelas: Janela[] = [];
  for (const o of plan.openings) {
    if (!o.rooms.includes(room.id)) continue;
    const lado = ladoDe(o, room);
    if (!lado) continue;
    const vert = lado === "left" || lado === "right";
    const a = Math.min(vert ? o.y1 : o.x1, vert ? o.y2 : o.x2);
    const b = Math.max(vert ? o.y1 : o.x1, vert ? o.y2 : o.x2);
    if (o.kind === "window") {
      const peit = ["banheiro", "banheiro_suite", "lavabo"].includes(room.tipo) ? CASA3D.janelaAlta.peitoril : CASA3D.janela.peitoril;
      janelas.push({ lado, a, b, peitoril: peit });
      continue;
    }
    const prof =
      o.kind === "garage_door" ? 0.3 : o.kind === "passage" || o.kind === "slide" ? 0.9 : o.swingInto === room.id || o.rooms.length === 1 ? b - a + 0.15 : 0.75;
    const q = quadro(daRect(room), lado);
    const u0 = (vert ? a - room.y : a - room.x) - 0.15;
    portas.push(q.caixa(u0, 0, b - a + 0.3, prof));
  }
  return { room, A, portas, janelas, paredes, moveis: [], usos: [], n: 0 };
}

/** Confere um item contra todas as regras do cômodo (e contra os outros itens do mesmo grupo). */
function valido(ctx: Ctx, it: Item, extras: { caixa: Caixa; z0: number; z1: number }[], usosExtras: Caixa[]): { caixa: Caixa; usos: Caixa[] } | null {
  const caixa = it.q.caixa(it.u, it.v, it.du, it.dv);
  const z0 = it.elevacao ?? 0;
  const z1 = z0 + it.altura;
  if (!dentro(ctx.A, caixa)) return null;
  if (z0 < 2.0 && ctx.portas.some((p) => sobrepoe(p, caixa))) return null;
  const ocupados = [...ctx.moveis.map((m) => ({ caixa: daRect(m.caixa), z0: m.elevacao, z1: m.elevacao + m.altura })), ...extras];
  if (ocupados.some((o) => sobrepoe(o.caixa, caixa) && o.z0 < z1 - EPS && z0 < o.z1 - EPS)) return null;
  const noChao = z0 < 1.0;
  if (noChao && [...ctx.usos, ...usosExtras].some((u) => sobrepoe(u, caixa))) return null;
  const usos = (it.usos ?? []).map(([u, v, du, dv]) => it.q.caixa(u, v, du, dv));
  for (const u of usos) {
    if (!dentro(ctx.A, u)) return null;
    if (ocupados.some((o) => o.z0 < 1.0 && sobrepoe(o.caixa, u))) return null;
  }
  // móvel alto encostado numa parede (inclusive a do lado, quando está no canto) não pode tapar janela
  if (!it.ignoraJanela) {
    for (const j of ctx.janelas) {
      if (!encosta(ctx.A, caixa, j.lado)) continue;
      const vert = j.lado === "left" || j.lado === "right";
      const a = vert ? caixa.y0 : caixa.x0;
      const b = vert ? caixa.y1 : caixa.x1;
      if (j.a < b - EPS && a < j.b - EPS && z1 > j.peitoril - 0.02 && z0 < j.peitoril + 1.2) return null;
    }
  }
  return { caixa, usos };
}

/** A caixa encosta no lado `lado` do vão livre? */
function encosta(A: Caixa, c: Caixa, lado: Side) {
  const d = 0.06;
  if (lado === "top") return c.y0 - A.y0 < d;
  if (lado === "bottom") return A.y1 - c.y1 < d;
  if (lado === "left") return c.x0 - A.x0 < d;
  return A.x1 - c.x1 < d;
}

/** Para desfazer tentativas (ex.: a cama ficou mas o guarda-roupa não coube → tenta a cama em outro lugar). */
const marcar = (ctx: Ctx) => ({ m: ctx.moveis.length, u: ctx.usos.length, n: ctx.n });
const voltar = (ctx: Ctx, s: ReturnType<typeof marcar>) => {
  ctx.moveis.length = s.m;
  ctx.usos.length = s.u;
  ctx.n = s.n;
};

/** Coloca um grupo de itens só se TODOS couberem (ex.: mesa + cadeiras). */
function colocar(ctx: Ctx, itens: Item[]): Movel3D[] | null {
  const extras: { caixa: Caixa; z0: number; z1: number }[] = [];
  const usosExtras: Caixa[] = [];
  const ok: { it: Item; caixa: Caixa; usos: Caixa[] }[] = [];
  for (const it of itens) {
    const r = valido(ctx, it, extras, usosExtras);
    if (!r) return null;
    // os usos deste item também não podem cair em cima dos itens já aceitos do grupo
    if (r.usos.some((u) => extras.some((e) => e.z0 < 1.0 && sobrepoe(e.caixa, u)))) return null;
    extras.push({ caixa: r.caixa, z0: it.elevacao ?? 0, z1: (it.elevacao ?? 0) + it.altura });
    usosExtras.push(...r.usos);
    ok.push({ it, ...r });
  }
  const novos = ok.map(({ it, caixa, usos }) => {
    ctx.usos.push(...usos);
    const [cx, cy] = it.q.xy(it.u + it.du / 2, it.v + it.dv / 2);
    // peça virada de lado (poltrona, cadeira na lateral da mesa): a largura dela corre ao longo de v
    const deLado = it.rotacao !== undefined && Math.abs(Math.cos(it.rotacao - it.q.frente)) < 0.5;
    const m: Movel3D = {
      id: `${ctx.room.id}-${it.tipo}-${ctx.n++}`,
      tipo: it.tipo,
      comodo: ctx.room.id,
      x: cx,
      y: cy,
      largura: deLado ? it.dv : it.du,
      profundidade: deLado ? it.du : it.dv,
      altura: it.altura,
      elevacao: it.elevacao ?? 0,
      rotacao: it.rotacao ?? it.q.frente + (it.vira ? Math.PI : 0),
      caixa: paraRect(caixa),
      variante: it.variante,
    };
    return m;
  });
  ctx.moveis.push(...novos);
  return novos;
}

/** Lados do vão livre ordenados: paredes de verdade, sem porta e sem janela primeiro, depois as mais longas. */
function ladosPreferidos(ctx: Ctx, area: Caixa = ctx.A, evitarJanela = true): Side[] {
  const tocaPorta = (l: Side) => ctx.portas.some((p) => sobrepoe(p, quadro(area, l).caixa(0, 0, quadro(area, l).len, 0.7)));
  const temJanela = (l: Side) => ctx.janelas.some((j) => j.lado === l);
  const len = (l: Side) => quadro(area, l).len;
  const nota = (l: Side) => (ctx.paredes[l] ? 0 : 100) + (tocaPorta(l) ? 10 : 0) + (evitarJanela && temJanela(l) ? 5 : 0) - len(l) / 10;
  return [...LADOS].sort((a, b) => nota(a) - nota(b));
}

// ───────────────────────── Cada tipo de cômodo ─────────────────────────

function quarto(ctx: Ctx, suite: boolean) {
  const M = MOVEIS;
  const curto = Math.min(ctx.A.x1 - ctx.A.x0, ctx.A.y1 - ctx.A.y0);
  const camas = suite ? [M.camaQueen, M.camaCasal] : curto >= 2.3 ? [M.camaCasal, M.camaSolteiro] : [M.camaSolteiro];
  type Uso = [number, number, number, number];
  // candidatos de cama, do mais desejável ao menos: maior, cabeceira em parede sem porta/janela, centrada com acesso dos dois lados
  const cands: Item[] = [];
  for (const c of camas) {
    const casal = c !== M.camaSolteiro;
    for (const acesso of casal ? ["dois", "um"] : ["um"]) {
      for (const lado of ladosPreferidos(ctx)) {
        if (!ctx.paredes[lado]) continue;
        const q = quadro(ctx.A, lado);
        const us = posicoes(q.len, c.l, acesso === "dois" ? "centro" : "cantos", 0.1).slice(0, 8);
        for (const u of us) {
          const esq: Uso = [u - M.uso.ladoCama, 0.45, M.uso.ladoCama, c.p - 0.45];
          const dir: Uso = [u + c.l, 0.45, M.uso.ladoCama, c.p - 0.45];
          const lados: Uso[] = acesso === "dois" ? [esq, dir] : [u > q.len - u - c.l ? esq : dir];
          cands.push({
            q,
            tipo: "cama",
            u,
            v: 0,
            du: c.l,
            dv: c.p,
            altura: c.a,
            naParede: true,
            variante: c === M.camaSolteiro ? "solteiro" : c === M.camaQueen ? "queen" : "casal",
            usos: [[u, c.p, c.l, M.uso.cama], ...lados],
          });
        }
      }
    }
  }
  const montar = (cama: Item, comGuardaRoupa: boolean) => {
    const s0 = marcar(ctx);
    if (!colocar(ctx, [cama])) return false;
    const lado = cama.q.lado;
    if (comGuardaRoupa && !guardaRoupa(ctx, [oposto(lado), ...LADOS.filter((l) => l !== lado && l !== oposto(lado)), lado])) {
      voltar(ctx, s0);
      return false;
    }
    for (const du of [cama.u - M.criado.l - 0.03, cama.u + cama.du + 0.03])
      colocar(ctx, [{ q: cama.q, tipo: "criadoMudo", u: du, v: 0, du: M.criado.l, dv: M.criado.p, altura: M.criado.a, naParede: true }]);
    return true;
  };
  // primeiro procura cama + guarda-roupa juntos; se o quarto não comporta os dois, fica a cama
  if (!cands.slice(0, 60).some((c) => montar(c, true))) cands.some((c) => montar(c, false)) || guardaRoupa(ctx, LADOS);
  // escrivaninha no quarto, de preferência sob a janela
  if (!suite && (ctx.A.x1 - ctx.A.x0) * (ctx.A.y1 - ctx.A.y0) >= 8.5) {
    const lados = [...LADOS].sort((a, b) => Number(!ctx.janelas.some((j) => j.lado === a)) - Number(!ctx.janelas.some((j) => j.lado === b)));
    escrivaninha(ctx, lados);
  }
}

function oposto(s: Side): Side {
  return s === "top" ? "bottom" : s === "bottom" ? "top" : s === "left" ? "right" : "left";
}

function guardaRoupa(ctx: Ctx, lados: Side[], max = MOVEIS.guardaRoupa.max) {
  const G = MOVEIS.guardaRoupa;
  for (let w = max; w >= G.min - EPS; w -= 0.2) {
    for (const lado of lados) {
      if (!ctx.paredes[lado]) continue;
      const q = quadro(ctx.A, lado);
      for (const u of posicoes(q.len, w, "cantos", 0.1)) {
        if (colocar(ctx, [{ q, tipo: "guardaRoupa", u, v: 0, du: w, dv: G.p, altura: G.a, naParede: true, usos: [[u, G.p, w, MOVEIS.uso.guardaRoupa]] }]))
          return true;
      }
    }
  }
  return false;
}

function escrivaninha(ctx: Ctx, lados: Side[]) {
  const E = MOVEIS.escrivaninha;
  for (const lado of lados) {
    if (!ctx.paredes[lado]) continue;
    const q = quadro(ctx.A, lado);
    for (const u of posicoes(q.len, E.l, "centro")) {
      const ok = colocar(ctx, [
        { q, tipo: "escrivaninha", u, v: 0, du: E.l, dv: E.p, altura: E.a, naParede: true, ignoraJanela: true },
        {
          q,
          tipo: "cadeiraEscritorio",
          u: u + (E.l - 0.5) / 2,
          v: E.p + 0.05,
          du: 0.5,
          dv: 0.5,
          altura: 0.95,
          vira: true,
          usos: [[u + (E.l - 0.5) / 2, E.p + 0.55, 0.5, 0.25]],
        },
      ]);
      if (ok) return true;
    }
  }
  return false;
}

function estar(ctx: Ctx, area: Caixa) {
  const M = MOVEIS;
  for (const lado of ladosPreferidos(ctx, area)) {
    // a TV fica numa parede de verdade
    if (!ctx.paredes[lado] || !bordaDaParede(ctx, area, lado)) continue;
    const q = quadro(area, lado);
    const encostavel = ctx.paredes[oposto(lado)] && bordaDaParede(ctx, area, oposto(lado));
    // distância TV → sofá: encostado na parede oposta (até 4 m) ou "solto" entre 2,0 e 2,8 m
    const vs = [...(encostavel && q.prof <= 4.0 ? [q.prof - M.sofa.p] : []), 2.6, 2.4, 2.2, 2.8, 2.0, 1.8].filter(
      (v) => v + M.sofa.p <= q.prof + EPS && v - M.rack.p >= 1.4,
    );
    for (const sofaL of [2.2, 1.9, 1.6].filter((l) => l <= q.len - 0.4)) {
      for (const rackL of [1.8, 1.5, 1.2, 1.0].filter((l) => l <= q.len - 0.2)) {
        for (const vSofa of vs) {
          for (const u of posicoes(q.len, sofaL, "centro", 0.1)) {
            const uRack = Math.max(0, Math.min(q.len - rackL, u + (sofaL - rackL) / 2));
            const tvL = Math.min(1.25, rackL - 0.1);
            const vMesa = (M.rack.p + vSofa) / 2 - M.mesaCentro.p / 2;
            const ok = colocar(ctx, [
              { q, tipo: "rack", u: uRack, v: 0, du: rackL, dv: M.rack.p, altura: M.rack.a, naParede: true, ignoraJanela: true },
              { q, tipo: "tv", u: uRack + (rackL - tvL) / 2, v: 0.12, du: tvL, dv: M.tv.p, altura: M.tv.a, elevacao: M.rack.a + 0.02, naParede: true },
              { q, tipo: "sofa", u, v: vSofa, du: sofaL, dv: M.sofa.p, altura: M.sofa.a, vira: true, usos: [[u, vSofa - M.uso.sofa, sofaL, M.uso.sofa]] },
              { q, tipo: "mesaCentro", u: u + (sofaL - M.mesaCentro.l) / 2, v: vMesa, du: M.mesaCentro.l, dv: M.mesaCentro.p, altura: M.mesaCentro.a },
            ]);
            if (!ok) continue;
            // poltrona ao lado da mesa de centro, virada para ela
            const P = M.poltrona;
            const vP = vMesa + M.mesaCentro.p / 2 - P.p / 2;
            colocar(ctx, [{ q, tipo: "poltrona", u: u - P.l - 0.35, v: vP, du: P.l, dv: P.p, altura: P.a, rotacao: q.anguloU }]) ||
              colocar(ctx, [{ q, tipo: "poltrona", u: u + sofaL + 0.35, v: vP, du: P.l, dv: P.p, altura: P.a, rotacao: q.anguloU + Math.PI }]);
            return true;
          }
        }
      }
    }
  }
  return false;
}

/** O lado `lado` da sub-área coincide com a parede do cômodo? */
function bordaDaParede(ctx: Ctx, area: Caixa, lado: Side) {
  const A = ctx.A;
  if (lado === "top") return Math.abs(area.y0 - A.y0) < EPS;
  if (lado === "bottom") return Math.abs(area.y1 - A.y1) < EPS;
  if (lado === "left") return Math.abs(area.x0 - A.x0) < EPS;
  return Math.abs(area.x1 - A.x1) < EPS;
}

function jantar(ctx: Ctx, area: Caixa) {
  const C = MOVEIS.cadeira;
  const W = area.x1 - area.x0;
  const H = area.y1 - area.y0;
  const mesas = [
    { l: 1.6, p: 0.9, lugares: 6 },
    { l: 1.2, p: 0.8, lugares: 4 },
    { l: 0.8, p: 0.8, lugares: 2 },
  ];
  for (const m of mesas) {
    for (const aoLongoX of W >= H ? [true, false] : [false, true]) {
      const q = quadro(area, aoLongoX ? "top" : "left");
      const porLado = m.lugares / 2;
      // mesa com cadeiras dos dois lados compridos, viradas para ela; 25 cm livres atrás das cadeiras
      const fundoCadeira = C.p + 0.25;
      for (const v0 of posicoes(q.prof - 2 * fundoCadeira + 0.16, m.p, "centro", 0.1).map((v) => v + fundoCadeira - 0.08)) {
        for (const u0 of posicoes(q.len, m.l, "centro", 0.1)) {
          const itens: Item[] = [{ q, tipo: "mesa", u: u0, v: v0, du: m.l, dv: m.p, altura: 0.75, variante: `${m.lugares} lugares` }];
          for (let i = 0; i < porLado; i++) {
            const uc = u0 + (m.l / porLado) * (i + 0.5) - C.l / 2;
            itens.push({ q, tipo: "cadeira", u: uc, v: v0 - C.p + 0.08, du: C.l, dv: C.p, altura: C.a, usos: [[uc, v0 - C.p - 0.17, C.l, 0.25]] });
            itens.push({
              q,
              tipo: "cadeira",
              u: uc,
              v: v0 + m.p - 0.08,
              du: C.l,
              dv: C.p,
              altura: C.a,
              vira: true,
              usos: [[uc, v0 + m.p - 0.08 + C.p, C.l, 0.25]],
            });
          }
          if (colocar(ctx, itens)) return true;
        }
      }
    }
  }
  return false;
}

function sala(ctx: Ctx, plan: Plan) {
  const nome = ctx.room.nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const temJantar = nome.includes("jantar") && !plan.rooms.some((r) => r.tipo === "jantar");
  const A = ctx.A;
  const W = A.x1 - A.x0;
  const H = A.y1 - A.y0;
  if (!temJantar || Math.max(W, H) < 5.2) {
    estar(ctx, A);
    if (temJantar) jantar(ctx, A);
    return;
  }
  // sala de estar e jantar: o jantar fica na ponta mais perto da cozinha
  const coz = plan.rooms.find((r) => r.tipo === "cozinha");
  const aoLongoX = W >= H;
  const L = aoLongoX ? W : H;
  const fatia = Math.min(3.2, L * 0.42);
  const centro = aoLongoX ? (A.x0 + A.x1) / 2 : (A.y0 + A.y1) / 2;
  const cozC = coz ? (aoLongoX ? coz.x + coz.w / 2 : coz.y + coz.h / 2) : Infinity;
  const jantarNoFim = cozC >= centro;
  const s0 = marcar(ctx);
  const corte = jantarNoFim ? (aoLongoX ? A.x1 : A.y1) - fatia : (aoLongoX ? A.x0 : A.y0) + fatia;
  const areaJantar: Caixa = aoLongoX ? (jantarNoFim ? { ...A, x0: corte } : { ...A, x1: corte }) : jantarNoFim ? { ...A, y0: corte } : { ...A, y1: corte };
  const areaEstar: Caixa = aoLongoX ? (jantarNoFim ? { ...A, x1: corte } : { ...A, x0: corte }) : jantarNoFim ? { ...A, y1: corte } : { ...A, y0: corte };
  if (estar(ctx, areaEstar)) {
    jantar(ctx, areaJantar);
    return;
  }
  // a divisão não comportou o estar: usa a sala inteira e encaixa a mesa no que sobrar
  voltar(ctx, s0);
  estar(ctx, A);
  jantar(ctx, A);
}

function cozinha(ctx: Ctx) {
  // 1º geladeira na mesma bancada; 2º geladeira em outra parede; 3º sem geladeira
  // tamanhos: padrão (pia 0,80 + fogão 0,60) e compacto (cuba 0,60 + cooktop 0,55) para cozinhas abertas
  for (const tam of [
    { pia: MOVEIS.pia.l, fogao: MOVEIS.fogao.l },
    { pia: 0.6, fogao: 0.55 },
  ])
    for (const modo of ["junto", "separada", "sem"] as const) if (bancadaCozinha(ctx, modo, tam)) return;
}

function bancadaCozinha(ctx: Ctx, modo: "junto" | "separada" | "sem", tam: { pia: number; fogao: number }): boolean {
  const M = { ...MOVEIS, pia: { l: tam.pia }, fogao: { l: tam.fogao } };
  const G = M.geladeira;
  for (const lado of ladosPreferidos(ctx, ctx.A, false)) {
    if (!ctx.paredes[lado]) continue;
    const q = quadro(ctx.A, lado);
    const trechos = trechosLivres(ctx, q, M.bancada.p + 0.3).sort((p, r) => r[1] - r[0] - (p[1] - p[0]));
    const jan = ctx.janelas.find((j) => j.lado === lado);
    const [j0, j1] = jan ? [absParaU(q, ctx.A, jan.a), absParaU(q, ctx.A, jan.b)].sort((x, y) => x - y) : [Infinity, -Infinity];
    for (const [a, b] of trechos) {
      const geladeiraAqui = modo === "junto";
      if (b - a < M.pia.l + M.fogao.l + (geladeiraAqui ? G.l + 0.05 : 0) - EPS) continue;
      for (const ponta of geladeiraAqui ? (["inicio", "fim"] as const) : ([null] as const)) {
        const r0 = ponta === "inicio" ? a + G.l + 0.05 : a;
        const r1 = ponta === "fim" ? b - G.l - 0.05 : b;
        // pia sob a janela (se houver), senão nas pontas ou no meio
        const sobJanela = j0 < r1 && j1 > r0 ? [Math.min(Math.max((j0 + j1) / 2 - M.pia.l / 2, r0), r1 - M.pia.l)] : [];
        const pias = [...sobJanela, r0 + (r1 - r0) * 0.5 - M.pia.l / 2, r0 + 0.3, r1 - M.pia.l - 0.3, r0, r1 - M.pia.l].filter(
          (u) => u >= r0 - EPS && u + M.pia.l <= r1 + EPS,
        );
        for (const uPia of pias) {
          const dir = r1 - (uPia + M.pia.l);
          const esq = uPia - r0;
          // fogão do lado com mais espaço, com bancada entre ele e a pia quando der
          const uFogao =
            dir >= M.fogao.l && dir >= esq
              ? r1 - M.fogao.l - (dir >= M.fogao.l + 0.45 ? 0.15 : 0)
              : esq >= M.fogao.l
                ? r0 + (esq >= M.fogao.l + 0.45 ? 0.15 : 0)
                : null;
          if (uFogao === null) continue;
          const itens: Item[] = [];
          if (ponta) itens.push({ q, tipo: "geladeira", u: ponta === "inicio" ? a : b - G.l, v: 0, du: G.l, dv: G.p, altura: G.a, naParede: true });
          itens.push({
            q,
            tipo: "pia",
            u: uPia,
            v: 0,
            du: M.pia.l,
            dv: M.bancada.p,
            altura: M.bancada.a,
            naParede: true,
            ignoraJanela: true,
            usos: [[uPia, M.bancada.p, M.pia.l, M.uso.bancada]],
          });
          itens.push({
            q,
            tipo: "fogao",
            u: uFogao,
            v: 0,
            du: M.fogao.l,
            dv: M.bancada.p,
            altura: M.bancada.a,
            naParede: true,
            ignoraJanela: true,
            usos: [[uFogao, M.bancada.p, M.fogao.l, M.uso.bancada]],
          });
          // bancadas (armários inferiores) preenchendo o resto do trecho
          for (const [s0, s1] of subtrai(
            [r0, r1],
            [
              [uPia, uPia + M.pia.l],
              [uFogao, uFogao + M.fogao.l],
            ],
          ))
            if (s1 - s0 >= 0.15)
              itens.push({ q, tipo: "bancada", u: s0, v: 0, du: s1 - s0, dv: M.bancada.p, altura: M.bancada.a, naParede: true, ignoraJanela: true });
          const s0 = marcar(ctx);
          if (!colocar(ctx, itens)) continue;
          // armários superiores sobre a bancada, menos sobre a janela e o fogão (coifa)
          for (const [s0, s1] of subtrai(
            [r0, r1],
            [
              [j0 - 0.05, j1 + 0.05],
              [uFogao, uFogao + M.fogao.l],
            ],
          ))
            if (s1 - s0 >= 0.4)
              colocar(ctx, [
                {
                  q,
                  tipo: "armarioSuperior",
                  u: s0,
                  v: 0,
                  du: s1 - s0,
                  dv: M.armarioSuperior.p,
                  altura: M.armarioSuperior.a,
                  elevacao: M.armarioSuperior.elev,
                  naParede: true,
                },
              ]);
          // ilha se sobrar um corredor de 1 m dos dois lados
          if (q.prof >= M.bancada.p + 1.0 + M.ilha.p + 1.0 && b - a >= 2.2) {
            const L = Math.min(2.0, b - a - 0.4);
            colocar(ctx, [{ q, tipo: "ilha", u: (a + b) / 2 - L / 2, v: M.bancada.p + 1.0, du: L, dv: M.ilha.p, altura: M.ilha.a }]);
          }
          if (modo === "separada")
            encostar(ctx, (q2, u) => [{ q: q2, tipo: "geladeira", u, v: 0, du: G.l, dv: G.p, altura: G.a, naParede: true, usos: [[u, G.p, G.l, 0.6]] }], G.l);
          if (modo === "separada" && !ctx.moveis.some((m) => m.tipo === "geladeira")) {
            // sem lugar para a geladeira: desfaz e deixa o próximo modo decidir
            voltar(ctx, s0);
            return false;
          }
          return true;
        }
      }
    }
  }
  return false;
}

/** Converte uma coordenada absoluta ao longo do lado em "u" do quadro. */
function absParaU(q: Quadro, A: Caixa, abs: number) {
  if (q.lado === "top" || q.lado === "bottom") return abs - A.x0;
  return abs - A.y0;
}

/** Trechos da parede (em u) que não encostam em área de porta até a profundidade `prof`. */
function trechosLivres(ctx: Ctx, q: Quadro, prof: number): [number, number][] {
  const faixa = q.caixa(0, 0, q.len, prof);
  const bloqueios = ctx.portas
    .filter((p) => sobrepoe(p, faixa))
    .map((p) => {
      const vert = q.lado === "left" || q.lado === "right";
      const a = absParaU(q, ctx.A, vert ? p.y0 : p.x0);
      const b = absParaU(q, ctx.A, vert ? p.y1 : p.x1);
      return [Math.min(a, b), Math.max(a, b)] as [number, number];
    });
  return subtrai([0, q.len], bloqueios);
}

function subtrai([a, b]: [number, number], cortes: [number, number][]): [number, number][] {
  let out: [number, number][] = [[a, b]];
  for (const [c0, c1] of cortes) {
    out = out.flatMap(([s0, s1]) => {
      if (c1 <= s0 || c0 >= s1) return [[s0, s1] as [number, number]];
      const r: [number, number][] = [];
      if (c0 > s0) r.push([s0, c0]);
      if (c1 < s1) r.push([c1, s1]);
      return r;
    });
  }
  return out.filter(([s0, s1]) => s1 - s0 > EPS);
}

function banheiro(ctx: Ctx) {
  const M = MOVEIS;
  const lavabo = ctx.room.tipo === "lavabo";
  const centroPortas = ctx.portas.map((p) => [(p.x0 + p.x1) / 2, (p.y0 + p.y1) / 2]);
  const longeDaPorta = (c: Caixa) => Math.min(...centroPortas.map(([x, y]) => Math.hypot((c.x0 + c.x1) / 2 - x, (c.y0 + c.y1) / 2 - y)), 99);

  // box num canto, o mais longe possível da porta (ou ocupando a largura toda num banheiro estreito)
  const boxes: Item[] = [];
  if (!lavabo) {
    for (const lado of LADOS) {
      const q = quadro(ctx.A, lado);
      for (const l of [M.box.l, q.len <= 1.45 ? q.len : 0, 0.8].filter((x) => x >= 0.75 && x <= q.len + EPS))
        for (const p of [M.box.p, 0.8].filter((x) => x <= q.prof - 0.6))
          for (const u of [0, q.len - l]) boxes.push({ q, tipo: "box", u, v: 0, du: l, dv: p, altura: M.box.a, naParede: true, ignoraJanela: true });
    }
    boxes.sort((a, b) => longeDaPorta(b.q.caixa(b.u, b.v, b.du, b.dv)) - longeDaPorta(a.q.caixa(a.u, a.v, a.du, a.dv)) + (b.du * b.dv - a.du * a.dv) * 0.5);
  }
  const vaso = () =>
    encostar(
      ctx,
      (q, u) => [
        {
          q,
          tipo: "vaso",
          u: u + 0.15,
          v: 0,
          du: M.vaso.l,
          dv: M.vaso.p,
          altura: M.vaso.a,
          naParede: true,
          ignoraJanela: true,
          // 15 cm livres de cada lado e espaço na frente para sentar
          usos: [
            [u, M.vaso.p, M.vaso.l + 0.3, M.uso.vaso],
            [u, 0, 0.15, M.vaso.p],
            [u + 0.15 + M.vaso.l, 0, 0.15, M.vaso.p],
          ],
        },
      ],
      M.vaso.l + 0.3,
    );
  const lavatorio = () =>
    [M.lavatorio, { l: 0.45, p: 0.35, a: 0.85, uso: 0.45 }].some((lav) =>
      encostar(
        ctx,
        (q, u) => [
          {
            q,
            tipo: "lavatorio",
            u,
            v: 0,
            du: lav.l,
            dv: lav.p,
            altura: lav.a,
            naParede: true,
            ignoraJanela: true,
            usos: [[u, lav.p, lav.l, "uso" in lav ? lav.uso : M.uso.lavatorio]],
          },
        ],
        lav.l,
        (q, u) => [{ q, tipo: "espelho", u: u + 0.02, v: 0, du: lav.l - 0.04, dv: M.espelho.p, altura: M.espelho.a, elevacao: M.espelho.elev, naParede: true }],
      ),
    );
  // procura a combinação box + vaso + lavatório; se nenhuma couber inteira, fica a que tiver mais peças
  let melhor: { n: number; box: Item | null } = { n: -1, box: null };
  for (const box of [...boxes.slice(0, 16), null]) {
    const s0 = marcar(ctx);
    if (box && !colocar(ctx, [box])) continue;
    // prioridade num banheiro apertado: vaso > box > lavatório
    const n = (box ? 1.05 : 0) + Number(vaso()) * 1.1 + Number(lavatorio());
    voltar(ctx, s0);
    if (n > melhor.n) melhor = { n, box };
    if (n >= (lavabo ? 2.1 : 3.15) - EPS) break;
  }
  if (melhor.box) colocar(ctx, [melhor.box]);
  vaso();
  lavatorio();
}

/** Procura uma parede e posição para um grupo; `extra` (opcional) é tentado logo depois, no mesmo lugar. */
function encostar(ctx: Ctx, montar: (q: Quadro, u: number) => Item[], largura: number, extra?: (q: Quadro, u: number) => Item[]) {
  for (const lado of ladosPreferidos(ctx)) {
    if (!ctx.paredes[lado]) continue;
    const q = quadro(ctx.A, lado);
    for (const u of posicoes(q.len, largura, "cantos")) {
      if (colocar(ctx, montar(q, u))) {
        if (extra) colocar(ctx, extra(q, u));
        return true;
      }
    }
  }
  return false;
}

function lavanderia(ctx: Ctx) {
  const M = MOVEIS;
  const juntos = encostar(
    ctx,
    (q, u) => [
      {
        q,
        tipo: "tanque",
        u,
        v: 0,
        du: M.tanque.l,
        dv: M.tanque.p,
        altura: M.tanque.a,
        naParede: true,
        ignoraJanela: true,
        usos: [[u, M.tanque.p, M.tanque.l, M.uso.maquina]],
      },
      {
        q,
        tipo: "maquina",
        u: u + M.tanque.l + 0.05,
        v: 0,
        du: M.maquina.l,
        dv: M.maquina.p,
        altura: M.maquina.a,
        naParede: true,
        ignoraJanela: true,
        usos: [[u + M.tanque.l + 0.05, M.maquina.p, M.maquina.l, M.uso.maquina]],
      },
    ],
    M.tanque.l + M.maquina.l + 0.05,
  );
  if (!juntos) {
    encostar(
      ctx,
      (q, u) => [
        {
          q,
          tipo: "tanque",
          u,
          v: 0,
          du: M.tanque.l,
          dv: M.tanque.p,
          altura: M.tanque.a,
          naParede: true,
          ignoraJanela: true,
          usos: [[u, M.tanque.p, M.tanque.l, M.uso.maquina]],
        },
      ],
      M.tanque.l,
    );
    encostar(
      ctx,
      (q, u) => [
        {
          q,
          tipo: "maquina",
          u,
          v: 0,
          du: M.maquina.l,
          dv: M.maquina.p,
          altura: M.maquina.a,
          naParede: true,
          ignoraJanela: true,
          usos: [[u, M.maquina.p, M.maquina.l, M.uso.maquina]],
        },
      ],
      M.maquina.l,
    );
  }
  encostar(
    ctx,
    (q, u) => [
      { q, tipo: "armario", u, v: 0, du: M.armario.l, dv: M.armario.p, altura: M.armario.a, naParede: true, usos: [[u, M.armario.p, M.armario.l, 0.5]] },
    ],
    M.armario.l,
  );
}

function escritorio(ctx: Ctx) {
  const lados = [...LADOS].sort((a, b) => Number(!ctx.janelas.some((j) => j.lado === a)) - Number(!ctx.janelas.some((j) => j.lado === b)));
  escrivaninha(ctx, lados);
  const E = MOVEIS.estante;
  encostar(ctx, (q, u) => [{ q, tipo: "estante", u, v: 0, du: E.l, dv: E.p, altura: E.a, naParede: true, usos: [[u, E.p, E.l, 0.5]] }], E.l);
}

function garagem(ctx: Ctx, brief: Brief | null) {
  const car = brief?.carro ?? { comprimento: 4.5, largura: 1.8, vagas: 1 };
  const vagas = Math.max(1, Math.round(car.vagas));
  // o portão fica na frente (lado da rua); o carro entra de frente
  const q = quadro(ctx.A, "top");
  const entre = vagas > 1 ? Math.max(0.6, Math.min(1.0, (q.len - vagas * car.largura) / (vagas + 1))) : 0;
  const total = vagas * car.largura + (vagas - 1) * entre;
  if (total > q.len + EPS) return;
  // posições: centrado primeiro; desliza para os lados/fundo se precisar liberar a área de uma porta
  for (const v of posicoes(q.prof - 0.35, car.comprimento, "cantos", 0.1)
    .map((x) => x + 0.35)
    .sort((a, b) => Math.abs(a - 0.45) - Math.abs(b - 0.45))) {
    for (const u0 of posicoes(q.len, total, "centro", 0.05)) {
      const itens: Item[] = [];
      for (let i = 0; i < vagas; i++) {
        const u = u0 + i * (car.largura + entre);
        itens.push({ q, tipo: "carro", u, v, du: car.largura, dv: car.comprimento, altura: MOVEIS.carro.a, variante: `${car.comprimento}x${car.largura}` });
      }
      if (colocar(ctx, itens)) return;
    }
  }
}

function varanda(ctx: Ctx) {
  const M = MOVEIS;
  const gourmet = ctx.room.tipo === "area_gourmet";
  if (gourmet) {
    encostar(
      ctx,
      (q, u) => [
        { q, tipo: "pia", u, v: 0, du: M.pia.l, dv: M.bancada.p, altura: M.bancada.a, naParede: true, ignoraJanela: true },
        {
          q,
          tipo: "bancada",
          u: u + M.pia.l,
          v: 0,
          du: 1.2,
          dv: M.bancada.p,
          altura: M.bancada.a,
          naParede: true,
          ignoraJanela: true,
          usos: [[u, M.bancada.p, M.pia.l + 1.2, 0.8]],
        },
      ],
      M.pia.l + 1.2,
    );
  }
  // sofá externo encostado na parede da casa
  for (const lado of ladosPreferidos(ctx)) {
    if (!ctx.paredes[lado]) continue;
    const q = quadro(ctx.A, lado);
    let ok = false;
    for (const u of posicoes(q.len, M.sofaExterno.l, "cantos", 0.1)) {
      if (
        colocar(ctx, [
          {
            q,
            tipo: "sofaExterno",
            u,
            v: 0,
            du: M.sofaExterno.l,
            dv: M.sofaExterno.p,
            altura: M.sofaExterno.a,
            naParede: true,
            ignoraJanela: true,
            usos: [[u, M.sofaExterno.p, M.sofaExterno.l, 0.4]],
          },
        ])
      ) {
        ok = true;
        break;
      }
    }
    if (ok) break;
  }
  // mesa redonda com 4 cadeiras onde couber
  const D = M.mesaRedonda.d;
  const C = M.cadeira;
  const q = quadro(ctx.A, "top");
  const lado = D + 2 * (C.p - 0.05);
  for (const v of posicoes(q.prof, lado, "centro", 0.1)) {
    for (const u of posicoes(q.len, lado, "centro", 0.1)) {
      const cu = u + lado / 2;
      const cv = v + lado / 2;
      const itens: Item[] = [
        { q, tipo: "mesaRedonda", u: cu - D / 2, v: cv - D / 2, du: D, dv: D, altura: M.mesaRedonda.a },
        { q, tipo: "cadeira", u: cu - C.l / 2, v: cv - D / 2 - C.p + 0.05, du: C.l, dv: C.p, altura: C.a },
        { q, tipo: "cadeira", u: cu - C.l / 2, v: cv + D / 2 - 0.05, du: C.l, dv: C.p, altura: C.a, vira: true },
        { q, tipo: "cadeira", u: cu - D / 2 - C.p + 0.05, v: cv - C.l / 2, du: C.p, dv: C.l, altura: C.a, rotacao: q.anguloU },
        { q, tipo: "cadeira", u: cu + D / 2 - 0.05, v: cv - C.l / 2, du: C.p, dv: C.l, altura: C.a, rotacao: q.anguloU + Math.PI },
      ];
      if (colocar(ctx, itens)) return;
    }
  }
}

function closet(ctx: Ctx) {
  guardaRoupa(ctx, ladosPreferidos(ctx), 2.4);
  guardaRoupa(ctx, ladosPreferidos(ctx), 2.4);
}

// ───────────────────────── Entrada principal ─────────────────────────

/** Gera a mobília de todos os cômodos a partir da planta (fonte de verdade). */
export function mobiliaAutomatica(plan: Plan, brief: Brief | null): Movel3D[] {
  const out: Movel3D[] = [];
  for (const room of plan.rooms) {
    if (room.tipo === "circulacao") continue; // corredor livre
    const ctx = contexto(room, plan);
    switch (room.tipo) {
      case "quarto":
        quarto(ctx, false);
        break;
      case "suite":
        quarto(ctx, true);
        break;
      case "sala":
        sala(ctx, plan);
        break;
      case "jantar":
        jantar(ctx, ctx.A);
        break;
      case "cozinha":
        cozinha(ctx);
        break;
      case "banheiro":
      case "banheiro_suite":
      case "lavabo":
        banheiro(ctx);
        break;
      case "lavanderia":
        lavanderia(ctx);
        break;
      case "escritorio":
        escritorio(ctx);
        break;
      case "closet":
        closet(ctx);
        break;
      case "garagem":
        garagem(ctx, brief);
        break;
      case "varanda":
      case "area_gourmet":
        varanda(ctx);
        break;
    }
    out.push(...ctx.moveis);
  }
  return out;
}

/** Móveis que bloqueiam a passagem no modo andar (os de chão; TV, espelho e armário superior não). */
export function obstaculosDosMoveis(moveis: Movel3D[]): Rect[] {
  return moveis.filter((m) => m.elevacao < 0.3 && m.altura > 0.3).map((m) => m.caixa);
}

/** Usado pelos testes: áreas de porta e vão livre de um cômodo. */
export function regrasDoComodo(room: PlacedRoom, plan: Plan) {
  const c = contexto(room, plan);
  return { vao: paraRect(c.A), portas: c.portas.map(paraRect), janelas: c.janelas };
}
