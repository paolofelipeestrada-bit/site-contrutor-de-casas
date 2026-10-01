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
  /** identificador estável (mesma planta → mesmo id), usado pelas edições do usuário */
  id: string;
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

/** Ajustes feitos pela pessoa na fiação. Aplicados antes de montar os circuitos. */
export interface EdicaoEletrica {
  movidos: Record<string, Pt>;
  removidos: string[];
  adicionados: { id: string; kind: Exclude<ElecKind, "quadro">; roomId: string; x: number; y: number; label?: string }[];
  /** id do ponto → nome do circuito para onde a pessoa o mandou */
  circuito: Record<string, string>;
}

export const EDICAO_VAZIA: EdicaoEletrica = { movidos: {}, removidos: [], adicionados: [], circuito: {} };

/** Potência de um ponto adicionado à mão. */
function vaManual(kind: ElecKind, room: PlacedRoom, label?: string): number {
  if (kind === "luz") return ELETRICA.luz.base;
  if (kind === "tug") return MOLHADAS.includes(room.tipo) || BANHOS.includes(room.tipo) ? ELETRICA.tugVA.molhada : ELETRICA.tugVA.padrao;
  if (kind === "tue") return label === "Chuveiro" ? ELETRICA.tue.chuveiro : 1500; // ar-condicionado, forno etc.
  return 0;
}

export function electricalFor(plan: Plan, ed: EdicaoEletrica = EDICAO_VAZIA): ProjetoEletrico {
  const pontos: ElecPoint[] = [];
  const seq: Record<string, number> = {};
  const nextId = (kind: string, roomId: string) => {
    const k = `${kind}-${roomId}`;
    seq[k] = (seq[k] ?? 0) + 1;
    return `${k}-${seq[k]}`;
  };
  const comandos: { a: Pt; b: Pt }[] = [];
  const fixtures = fixturesOf(plan.rooms, plan.openings);

  // Quadro de distribuição: ao lado da porta de entrada, por dentro
  const entrada = plan.openings.find((o) => o.kind === "entrance");
  const roomEntrada = plan.rooms.find((r) => r.id === entrada?.rooms[0]) ?? plan.rooms[0];
  const quadro = ed.movidos.quadro ?? clampInto(entrada ? { x: Math.min(entrada.x1, entrada.x2) - 0.4, y: entrada.y1 + 0.15 } : { x: roomEntrada.x, y: roomEntrada.y }, roomEntrada, 0.15);

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
    for (const l of lights) pontos.push({ ...l, id: nextId("luz", r.id), kind: "luz", roomId: r.id, circuito: 0, va: Math.round(vaEach) });

    // Interruptor: junto da primeira porta do cômodo, pelo lado de dentro
    const porta = plan.openings.find((o) => o.kind !== "window" && o.kind !== "garage_door" && o.rooms.includes(r.id));
    if (porta) {
      const horizontal = Math.abs(porta.y1 - porta.y2) < 1e-6;
      const fim = horizontal ? { x: Math.max(porta.x1, porta.x2) + 0.2, y: porta.y1 } : { x: porta.x1, y: Math.max(porta.y1, porta.y2) + 0.2 };
      const s = clampInto(fim, r, 0.12);
      pontos.push({ ...s, id: nextId("interruptor", r.id), kind: "interruptor", roomId: r.id, circuito: 0, va: 0 });
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
        pontos.push({ ...p, id: nextId("tug", r.id), kind: "tug", roomId: r.id, circuito: 0, va: ELETRICA.tugVA.molhada });
        continue;
      }
      let tries = 0;
      while (onDoor(perimeterPoint(r, s).wall, plan.openings) && tries++ < 20) s += 0.3;
      const { inner } = perimeterPoint(r, s);
      const va = molhada && i < 3 ? ELETRICA.tugVA.molhada : ELETRICA.tugVA.padrao;
      pontos.push({ ...inner, id: nextId("tug", r.id), kind: "tug", roomId: r.id, circuito: 0, va });
    }
  }

  // Tomadas de uso específico
  for (const f of fixtures) {
    if (f.kind === "chuveiro") pontos.push({ x: f.x, y: f.y, id: nextId("tue", f.roomId), kind: "tue", roomId: f.roomId, circuito: 0, va: ELETRICA.tue.chuveiro, label: "Chuveiro" });
    if (f.kind === "maquina") pontos.push({ x: f.x, y: f.y, id: nextId("tue", f.roomId), kind: "tue", roomId: f.roomId, circuito: 0, va: ELETRICA.tue.maquina, label: "Máq. lavar" });
  }
  const portao = plan.openings.find((o) => o.kind === "garage_door");
  if (portao) {
    const g = plan.rooms.find((r) => r.id === portao.rooms[0])!;
    pontos.push({ ...clampInto({ x: Math.max(portao.x1, portao.x2), y: portao.y1 }, g, 0.15), id: nextId("tue", g.id), kind: "tue", roomId: g.id, circuito: 0, va: ELETRICA.tue.portao, label: "Portão" });
  }

  // Edições da pessoa: apagar, mover e acrescentar pontos
  const roomOf = (id: string) => plan.rooms.find((r) => r.id === id) ?? plan.rooms[0];
  for (let i = pontos.length - 1; i >= 0; i--) if (ed.removidos.includes(pontos[i].id)) pontos.splice(i, 1);
  for (const p of pontos) if (ed.movidos[p.id]) Object.assign(p, ed.movidos[p.id]);
  for (const a of ed.adicionados) {
    if (ed.removidos.includes(a.id)) continue;
    const pos = ed.movidos[a.id] ?? a;
    pontos.push({ ...a, ...pos, circuito: 0, va: vaManual(a.kind, roomOf(a.roomId), a.label) });
  }
  for (const s of pontos.filter((p) => p.kind === "interruptor")) {
    const temLuz = pontos.some((p) => p.kind === "luz" && p.roomId === s.roomId);
    const luz = pontos.find((p) => p.kind === "luz" && p.roomId === s.roomId);
    if (temLuz && luz) comandos.push({ a: s, b: luz });
  }

  // Agrupa em circuitos: nome padrão por regra, ou o circuito escolhido pela pessoa
  const nomePadrao = (p: ElecPoint): string => {
    const r = roomOf(p.roomId);
    if (p.kind === "luz") return r.zone === "private" ? "Iluminação íntima" : "Iluminação social";
    if (p.kind === "tue") return `${p.label ?? "Uso específico"} – ${r.nome}`;
    if (MOLHADAS.includes(r.tipo)) return `Tomadas ${r.nome.toLowerCase()}`;
    return r.zone === "private" ? "Tomadas área íntima" : "Tomadas área social";
  };
  const circuitos: Circuito[] = [];
  const grupos = new Map<string, ElecPoint[]>();
  for (const p of pontos.filter((q) => q.kind !== "interruptor")) {
    const nome = ed.circuito[p.id] ?? nomePadrao(p);
    grupos.set(nome, [...(grupos.get(nome) ?? []), p]);
  }
  const ordem = (pts: ElecPoint[]) => (pts.every((p) => p.kind === "luz") ? 0 : pts.every((p) => p.kind === "tue") ? 2 : 1);
  const lista = [...grupos].sort((a, b) => ordem(a[1]) - ordem(b[1]));
  for (const [nome, pts] of lista) {
    const tipo: Circuito["tipo"] = ordem(pts) === 0 ? "Iluminação" : ordem(pts) === 2 ? "Uso específico" : "Tomadas";
    const minCabo = tipo === "Iluminação" ? 1.5 : 2.5;
    let bucket: ElecPoint[] = [];
    let parte = 0;
    const flush = () => {
      if (!bucket.length) return;
      const va = bucket.reduce((s, p) => s + p.va, 0);
      const id = circuitos.length + 1;
      bucket.forEach((p) => (p.circuito = id));
      circuitos.push({ id, nome: parte ? `${nome} (${parte + 1})` : nome, tipo, va, ...protecao(va, minCabo), pontos: bucket.length });
      parte++;
      bucket = [];
    };
    for (const p of pts) {
      // circuito de uso específico: um aparelho por circuito, a menos que a pessoa junte
      const limite = tipo === "Uso específico" && !ed.circuito[p.id] ? 0 : ELETRICA.limiteCircuito;
      if (bucket.length && bucket.reduce((s, q) => s + q.va, 0) + p.va > limite) flush();
      bucket.push(p);
    }
    flush();
  }
  const luzes = pontos.filter((p) => p.kind === "luz");
  // interruptores seguem o circuito da luz do cômodo
  for (const s of pontos.filter((p) => p.kind === "interruptor")) {
    s.circuito = luzes.find((l) => l.roomId === s.roomId)?.circuito ?? 0;
  }
  pontos.push({ ...quadro, id: "quadro", kind: "quadro", roomId: roomEntrada.id, circuito: 0, va: 0, label: "QD" });

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
