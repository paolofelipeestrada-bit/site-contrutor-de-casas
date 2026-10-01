import type { PlacedRoom, Plan, RoomType } from "../types";
import { fixturesOf } from "./furniture";
import { clampInto, manhattan, nearestChain, onDoor, pathLength, perimeterPoint, type Pt } from "./geometry";

/**
 * ESQUEMA ELÉTRICO — regras simplificadas da NBR 5410.
 * Para mudar o critério, edite só este objeto.
 */
export const ELETRICA = {
  tensao: 220, // V
  /** Iluminação: 100 VA nos primeiros 6 m² + 60 VA a cada 4 m² inteiros a mais. */
  luz: { base: 100, extra: 60 },
  /** Tomadas de uso geral: uma a cada X metros de perímetro (ou fração). */
  tugPasso: { molhada: 3.5, seca: 5 },
  /** Potência das tomadas: as 3 primeiras de áreas molhadas têm 600 VA, as demais 100 VA. */
  tugVA: { molhada: 600, padrao: 100 },
  /** Tomadas de uso específico (W). */
  tue: { chuveiro: 5500, maquina: 1000, portao: 300 },
  /** Carga máxima por circuito de iluminação ou tomadas (VA) — prática comum em 220 V. */
  limiteCircuito: 2200,
  disjuntores: [10, 16, 20, 25, 32, 40, 50, 63],
  /** [seção mm², corrente máxima A] — cobre, isolação PVC, embutido. */
  cabos: [
    [1.5, 15.5],
    [2.5, 21],
    [4, 28],
    [6, 36],
    [10, 50],
    [16, 68],
  ] as [number, number][],
};

const MOLHADAS: RoomType[] = ["cozinha", "lavanderia", "area_gourmet"];
const BANHOS: RoomType[] = ["banheiro", "banheiro_suite", "lavabo"];

export type ElecKind = "luz" | "interruptor" | "tug" | "tue" | "quadro";

export interface ElecPoint extends Pt {
  kind: ElecKind;
  roomId: string;
  circuito: number;
  va: number;
  label?: string;
}

export interface Circuito {
  id: number;
  nome: string;
  tipo: "Iluminação" | "Tomadas" | "Uso específico";
  va: number;
  corrente: number;
  disjuntor: number;
  cabo: number;
  pontos: number;
}

export interface ProjetoEletrico {
  quadro: Pt;
  pontos: ElecPoint[];
  circuitos: Circuito[];
  /** traçado de cada circuito (eletrodutos) */
  trechos: { circuito: number; tipo: Circuito["tipo"]; pts: Pt[] }[];
  /** ligação interruptor → ponto de luz */
  comandos: { a: Pt; b: Pt }[];
  totalVA: number;
  eletrodutoM: number;
}

export function luzVA(area: number): number {
  return area <= 6 ? ELETRICA.luz.base : ELETRICA.luz.base + Math.floor((area - 6) / 4) * ELETRICA.luz.extra;
}

function protecao(va: number, minCabo: number) {
  const corrente = va / ELETRICA.tensao;
  const disjuntor = ELETRICA.disjuntores.find((d) => d >= corrente) ?? ELETRICA.disjuntores.at(-1)!;
  const cabo = ELETRICA.cabos.find(([s, iz]) => s >= minCabo && iz >= disjuntor)?.[0] ?? 16;
  return { corrente: Number(corrente.toFixed(1)), disjuntor, cabo };
}

function tugCount(r: PlacedRoom): number {
  const area = r.w * r.h;
  const perim = 2 * (r.w + r.h);
  if (BANHOS.includes(r.tipo) || r.tipo === "closet" || r.tipo === "circulacao") return 1;
  if (r.tipo === "varanda") return 1;
  if (area <= 6) return 1;
  return Math.ceil(perim / (MOLHADAS.includes(r.tipo) ? ELETRICA.tugPasso.molhada : ELETRICA.tugPasso.seca));
}

export function electricalFor(plan: Plan): ProjetoEletrico {
  const pontos: ElecPoint[] = [];
  const comandos: { a: Pt; b: Pt }[] = [];
  const fixtures = fixturesOf(plan.rooms, plan.openings);

  // Quadro de distribuição: ao lado da porta de entrada, por dentro
  const entrada = plan.openings.find((o) => o.kind === "entrance");
  const roomEntrada = plan.rooms.find((r) => r.id === entrada?.rooms[0]) ?? plan.rooms[0];
  const quadro = clampInto(entrada ? { x: Math.min(entrada.x1, entrada.x2) - 0.4, y: entrada.y1 + 0.15 } : { x: roomEntrada.x, y: roomEntrada.y }, roomEntrada, 0.15);

  for (const r of plan.rooms) {
    const area = r.w * r.h;
    // Pontos de luz no teto (corredor: um a cada ~3 m)
    const lights: Pt[] = [];
    if (r.tipo === "circulacao") {
      const long = Math.max(r.w, r.h);
      const n = Math.max(1, Math.round(long / 3));
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        lights.push(r.w > r.h ? { x: r.x + r.w * t, y: r.y + r.h / 2 } : { x: r.x + r.w / 2, y: r.y + r.h * t });
      }
    } else {
      lights.push({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
    }
    const vaEach = luzVA(area) / lights.length;
    for (const l of lights) pontos.push({ ...l, kind: "luz", roomId: r.id, circuito: 0, va: Math.round(vaEach) });

    // Interruptor: junto da primeira porta do cômodo, pelo lado de dentro
    const porta = plan.openings.find((o) => o.kind !== "window" && o.kind !== "garage_door" && o.rooms.includes(r.id));
    if (porta) {
      const horizontal = Math.abs(porta.y1 - porta.y2) < 1e-6;
      const fim = horizontal ? { x: Math.max(porta.x1, porta.x2) + 0.2, y: porta.y1 } : { x: porta.x1, y: Math.max(porta.y1, porta.y2) + 0.2 };
      const s = clampInto(fim, r, 0.12);
      pontos.push({ ...s, kind: "interruptor", roomId: r.id, circuito: 0, va: 0 });
      comandos.push({ a: s, b: lights[0] });
    }

    // Tomadas de uso geral distribuídas no perímetro, fora das portas
    const n = tugCount(r);
    const P = 2 * (r.w + r.h);
    const molhada = MOLHADAS.includes(r.tipo) || BANHOS.includes(r.tipo);
    const lavatorio = fixtures.find((f) => f.roomId === r.id && (f.kind === "lavatorio" || f.kind === "pia"));
    for (let i = 0; i < n; i++) {
      let s = (P / n) * (i + 0.5);
      if (i === 0 && lavatorio && BANHOS.includes(r.tipo)) {
        // banheiro: tomada ao lado do lavatório
        const p = clampInto({ x: lavatorio.x + 0.45, y: lavatorio.y }, r, 0.12);
        pontos.push({ ...p, kind: "tug", roomId: r.id, circuito: 0, va: ELETRICA.tugVA.molhada });
        continue;
      }
      let tries = 0;
      while (onDoor(perimeterPoint(r, s).wall, plan.openings) && tries++ < 20) s += 0.3;
      const { inner } = perimeterPoint(r, s);
      const va = molhada && i < 3 ? ELETRICA.tugVA.molhada : ELETRICA.tugVA.padrao;
      pontos.push({ ...inner, kind: "tug", roomId: r.id, circuito: 0, va });
    }
  }

  // Tomadas de uso específico
  for (const f of fixtures) {
    if (f.kind === "chuveiro") pontos.push({ x: f.x, y: f.y, kind: "tue", roomId: f.roomId, circuito: 0, va: ELETRICA.tue.chuveiro, label: "Chuveiro" });
    if (f.kind === "maquina") pontos.push({ x: f.x, y: f.y, kind: "tue", roomId: f.roomId, circuito: 0, va: ELETRICA.tue.maquina, label: "Máq. lavar" });
  }
  const portao = plan.openings.find((o) => o.kind === "garage_door");
  if (portao) {
    const g = plan.rooms.find((r) => r.id === portao.rooms[0])!;
    pontos.push({ ...clampInto({ x: Math.max(portao.x1, portao.x2), y: portao.y1 }, g, 0.15), kind: "tue", roomId: g.id, circuito: 0, va: ELETRICA.tue.portao, label: "Portão" });
  }

  // Agrupa em circuitos
  const circuitos: Circuito[] = [];
  const zoneOf = (id: string) => plan.rooms.find((r) => r.id === id)!;
  const add = (nome: string, tipo: Circuito["tipo"], pts: ElecPoint[], minCabo: number) => {
    let bucket: ElecPoint[] = [];
    const flush = () => {
      if (!bucket.length) return;
      const va = bucket.reduce((s, p) => s + p.va, 0);
      const id = circuitos.length + 1;
      const parte = circuitos.filter((c) => c.nome.startsWith(nome)).length;
      bucket.forEach((p) => (p.circuito = id));
      circuitos.push({ id, nome: parte ? `${nome} ${parte + 1}` : nome, tipo, va, ...protecao(va, minCabo), pontos: bucket.length });
      bucket = [];
    };
    for (const p of pts) {
      if (tipo !== "Uso específico" && bucket.reduce((s, q) => s + q.va, 0) + p.va > ELETRICA.limiteCircuito) flush();
      bucket.push(p);
    }
    flush();
  };
  const luzes = pontos.filter((p) => p.kind === "luz");
  add("Iluminação social", "Iluminação", luzes.filter((p) => zoneOf(p.roomId).zone !== "private"), 1.5);
  add("Iluminação íntima", "Iluminação", luzes.filter((p) => zoneOf(p.roomId).zone === "private"), 1.5);
  const tugs = pontos.filter((p) => p.kind === "tug");
  for (const tipo of MOLHADAS) {
    const room = plan.rooms.find((r) => r.tipo === tipo);
    if (room) add(`Tomadas ${room.nome.toLowerCase()}`, "Tomadas", tugs.filter((p) => p.roomId === room.id), 2.5);
  }
  const secas = tugs.filter((p) => !MOLHADAS.includes(zoneOf(p.roomId).tipo));
  add("Tomadas área social", "Tomadas", secas.filter((p) => zoneOf(p.roomId).zone !== "private"), 2.5);
  add("Tomadas área íntima", "Tomadas", secas.filter((p) => zoneOf(p.roomId).zone === "private"), 2.5);
  for (const p of pontos.filter((q) => q.kind === "tue")) {
    add(`${p.label} – ${zoneOf(p.roomId).nome}`, "Uso específico", [p], 2.5);
  }
  // interruptores seguem o circuito da luz do cômodo
  for (const s of pontos.filter((p) => p.kind === "interruptor")) {
    s.circuito = luzes.find((l) => l.roomId === s.roomId)?.circuito ?? 0;
  }
  pontos.push({ ...quadro, kind: "quadro", roomId: roomEntrada.id, circuito: 0, va: 0, label: "QD" });

  // Traçado: cada circuito sai do quadro e passa pelos pontos (vizinho mais próximo)
  const trechos = circuitos.map((c) => {
    const pts = nearestChain(quadro, pontos.filter((p) => p.circuito === c.id && p.kind !== "interruptor"));
    const path: Pt[] = [quadro];
    let cur: Pt = quadro;
    for (const p of pts) {
      path.push(...manhattan(cur, p).slice(1));
      cur = p;
    }
    return { circuito: c.id, tipo: c.tipo, pts: path };
  });
  const eletrodutoM = trechos.reduce((s, t) => s + pathLength(t.pts), 0) + comandos.reduce((s, c) => s + Math.abs(c.a.x - c.b.x) + Math.abs(c.a.y - c.b.y), 0);

  return {
    quadro,
    pontos,
    circuitos,
    trechos,
    comandos,
    totalVA: circuitos.reduce((s, c) => s + c.va, 0),
    eletrodutoM: Math.ceil(eletrodutoM * 1.15),
  };
}
