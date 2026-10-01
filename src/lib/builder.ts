import { ROOM_INFO } from "./catalog";
import { openingsFor, scorePlan, sharedEdge } from "./layout/layout";
import type { Brief, PlacedRoom, Plan, Regras, RoomType, Side } from "./types";

/**
 * MODO "CONSTRUIR DO ZERO": a pessoa desenha os cômodos; aqui eles viram uma planta completa
 * (portas, janelas, nota, verificações) — e por isso elétrica, hidráulica e custo funcionam igual.
 */

export interface BuilderRoom {
  id: string;
  tipo: RoomType;
  nome: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BuilderLot {
  largura: number;
  profundidade: number;
}

/** Grade de desenho: 10 cm. */
export const GRADE = 0.1;
export const snap = (v: number) => Math.round(v / GRADE) * GRADE;
export const round2 = (v: number) => Math.round(v * 100) / 100;

/** Lado de um cômodo que não encosta em nenhum outro: parede externa (pode ter janela). */
function exteriores(r: BuilderRoom, todos: BuilderRoom[]): Side[] {
  const lados: Side[] = ["top", "bottom", "left", "right"];
  return lados.filter((lado) => {
    const len = lado === "top" || lado === "bottom" ? r.w : r.h;
    let coberto = 0;
    for (const o of todos) {
      if (o.id === r.id) continue;
      const seg = sharedEdge(r, o);
      if (!seg) continue;
      const naLinha =
        lado === "top" ? !seg.vertical && Math.abs(seg.y1 - r.y) < 1e-4 : lado === "bottom" ? !seg.vertical && Math.abs(seg.y1 - (r.y + r.h)) < 1e-4 : lado === "left" ? seg.vertical && Math.abs(seg.x1 - r.x) < 1e-4 : seg.vertical && Math.abs(seg.x1 - (r.x + r.w)) < 1e-4;
      if (naLinha) coberto += seg.len;
    }
    return len - coberto > 0.4;
  });
}

export function sobrepostos(rooms: BuilderRoom[]): Set<string> {
  const out = new Set<string>();
  for (const a of rooms)
    for (const b of rooms) {
      if (a.id >= b.id) continue;
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ox > 0.01 && oy > 0.01) {
        out.add(a.id);
        out.add(b.id);
      }
    }
  return out;
}

export function briefFromRooms(rooms: BuilderRoom[], lot: BuilderLot, regras: Regras = {}): Brief {
  const area = rooms.reduce((s, r) => s + r.w * r.h, 0);
  return {
    terreno: { largura: lot.largura, profundidade: lot.profundidade },
    casa: { area: Math.max(35, Math.round(area)) },
    estilo: "moderno",
    ambientes: rooms.map((r) => ({ tipo: r.tipo, area: r.w * r.h, nome: r.nome })),
    preferencias: { salaCozinhaIntegradas: true, varandaPosicao: "fundos", quartosReservados: true, luzNatural: true },
    carro: rooms.some((r) => r.tipo === "garagem") ? { comprimento: 4.5, largura: 1.8, vagas: 1 } : null,
    observacoes: [],
    regras,
  };
}

export function planFromRooms(rooms: BuilderRoom[], lot: BuilderLot, regras: Regras = {}): Plan | null {
  if (rooms.length === 0) return null;
  const brief = briefFromRooms(rooms, lot, regras);
  const minX = Math.min(...rooms.map((r) => r.x));
  const minY = Math.min(...rooms.map((r) => r.y));
  const maxX = Math.max(...rooms.map((r) => r.x + r.w));
  const maxY = Math.max(...rooms.map((r) => r.y + r.h));
  const footprint = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  const placed: PlacedRoom[] = rooms.map((r) => ({
    ...r,
    zone: ROOM_INFO[r.tipo].zone,
    targetArea: r.w * r.h,
    group: "livre",
    axis: "y",
    exterior: exteriores(r, rooms),
  }));
  const issues: string[] = [];
  const sob = sobrepostos(rooms);
  if (sob.size) issues.push(`Cômodos sobrepostos: ${rooms.filter((r) => sob.has(r.id)).map((r) => r.nome).join(", ")}.`);
  if (minX < -1e-6 || minY < -1e-6 || maxX > lot.largura + 1e-6 || maxY > lot.profundidade + 1e-6) issues.push("Há cômodos fora do terreno.");
  for (const r of placed) {
    const min = ROOM_INFO[r.tipo].minWidth;
    if (r.tipo !== "circulacao" && Math.min(r.w, r.h) < min - 0.05) issues.push(`${r.nome} ficou estreito (${Math.min(r.w, r.h).toFixed(2)} m; mínimo recomendado ${min} m).`);
  }
  const openings = openingsFor(placed, brief, issues);
  const setbacks = { front: minY, back: lot.profundidade - maxY, left: minX, right: lot.largura - maxX };
  const builtArea = Number(rooms.reduce((s, r) => s + r.w * r.h, 0).toFixed(1));
  const partial = {
    lot: { width: lot.largura, depth: lot.profundidade },
    footprint,
    setbacks,
    rooms: placed,
    openings,
    strategy: { kind: "faixas" as const, mirror: false, variant: 0 as const, width: footprint.w },
    issues,
    builtArea,
    handles: [],
  };
  return { ...partial, score: Math.round(scorePlan(partial, brief, lot.profundidade)) };
}

/** Casa de exemplo para começar (9 × 14 m), já com garagem na frente. */
export function exemploInicial(lot: BuilderLot): BuilderRoom[] {
  const x0 = Math.max(0, round2((lot.largura - 9) / 2));
  const y0 = Math.min(4, Math.max(0, lot.profundidade - 14));
  const R = (id: string, tipo: RoomType, nome: string, x: number, y: number, w: number, h: number): BuilderRoom => ({ id, tipo, nome, x: round2(x0 + x), y: round2(y0 + y), w, h });
  return [
    R("g1", "garagem", "Garagem", 0, 0, 3.4, 5.5),
    R("s1", "sala", "Sala", 3.4, 0, 5.6, 5.5),
    R("h1", "circulacao", "Corredor", 3.4, 5.5, 1.2, 6.5),
    R("q1", "quarto", "Quarto", 0, 5.5, 3.4, 3.3),
    R("c1", "cozinha", "Cozinha", 4.6, 5.5, 4.4, 3.0),
    R("b1", "banheiro", "Banho", 0, 8.8, 3.4, 1.8),
    R("st", "suite", "Suíte", 4.6, 8.5, 4.4, 3.5),
    R("l1", "lavanderia", "Lavanderia", 0, 10.6, 3.4, 1.4),
    R("v1", "varanda", "Varanda", 0, 12, 9, 2),
  ];
}
