import type { Opening, Rect } from "../types";

/** Ponto em metros, nas coordenadas do terreno (y = 0 na rua). */
export interface Pt {
  x: number;
  y: number;
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Caminho em "L" (só trechos horizontais e verticais), como tubos e eletrodutos de verdade. */
export function manhattan(a: Pt, b: Pt, firstAxis: "x" | "y" = "x"): Pt[] {
  const mid = firstAxis === "x" ? { x: b.x, y: a.y } : { x: a.x, y: b.y };
  return [a, mid, b];
}

export function pathLength(pts: Pt[]): number {
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y);
  return total;
}

/** Ponto dentro do retângulo, afastado `inset` metros das paredes. */
export function clampInto(p: Pt, r: Rect, inset = 0.2): Pt {
  return { x: clamp(p.x, r.x + inset, r.x + r.w - inset), y: clamp(p.y, r.y + inset, r.y + r.h - inset) };
}

/**
 * Anda pelo perímetro do cômodo (sentido horário a partir do canto de cima à esquerda).
 * Devolve o ponto na parede e o ponto deslocado `inset` para dentro.
 */
export function perimeterPoint(r: Rect, s: number, inset = 0.12): { wall: Pt; inner: Pt } {
  const P = 2 * (r.w + r.h);
  let d = ((s % P) + P) % P;
  if (d < r.w) return { wall: { x: r.x + d, y: r.y }, inner: { x: r.x + d, y: r.y + inset } };
  d -= r.w;
  if (d < r.h) return { wall: { x: r.x + r.w, y: r.y + d }, inner: { x: r.x + r.w - inset, y: r.y + d } };
  d -= r.h;
  if (d < r.w) return { wall: { x: r.x + r.w - d, y: r.y + r.h }, inner: { x: r.x + r.w - d, y: r.y + r.h - inset } };
  d -= r.w;
  return { wall: { x: r.x, y: r.y + r.h - d }, inner: { x: r.x + inset, y: r.y + r.h - d } };
}

/** O ponto da parede cai dentro de uma porta/passagem? (janelas não bloqueiam tomadas) */
export function onDoor(p: Pt, openings: Opening[], margin = 0.15): boolean {
  return openings.some((o) => {
    if (o.kind === "window") return false;
    const horizontal = Math.abs(o.y1 - o.y2) < 1e-6;
    if (horizontal) {
      return Math.abs(p.y - o.y1) < 1e-3 && p.x > Math.min(o.x1, o.x2) - margin && p.x < Math.max(o.x1, o.x2) + margin;
    }
    return Math.abs(p.x - o.x1) < 1e-3 && p.y > Math.min(o.y1, o.y2) - margin && p.y < Math.max(o.y1, o.y2) + margin;
  });
}

/** Ordena pontos pelo "vizinho mais próximo" a partir de `start` (para traçar circuitos). */
export function nearestChain<T extends Pt>(start: Pt, pts: T[]): T[] {
  const rest = [...pts];
  const out: T[] = [];
  let cur = start;
  while (rest.length) {
    let best = 0;
    for (let i = 1; i < rest.length; i++) {
      if (Math.abs(rest[i].x - cur.x) + Math.abs(rest[i].y - cur.y) < Math.abs(rest[best].x - cur.x) + Math.abs(rest[best].y - cur.y)) best = i;
    }
    const next = rest.splice(best, 1)[0];
    out.push(next);
    cur = next;
  }
  return out;
}
