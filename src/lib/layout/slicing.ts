import type { Rect } from "../types";

/**
 * Árvore de cortes (slicing tree): cada nó divide seu retângulo ao longo de um eixo,
 * proporcionalmente à área dos filhos. As folhas são cômodos.
 * Isso garante que a planta sempre "fecha" (sem buracos nem sobreposição) e que
 * cada cômodo recebe área proporcional ao pedido.
 */
export type SNode =
  | { kind: "leaf"; roomId: string }
  | { kind: "split"; id: string; axis: "x" | "y"; children: SNode[] };

export const leaf = (roomId: string): SNode => ({ kind: "leaf", roomId });

let splitSeq = 0;
export function resetSplitIds() {
  splitSeq = 0;
}
/** Cria um corte; filhos vazios são descartados e cortes de um filho só são achatados. */
export function split(axis: "x" | "y", children: (SNode | null | undefined | false)[], id?: string): SNode | null {
  const valid = children.filter(Boolean) as SNode[];
  if (valid.length === 0) return null;
  if (valid.length === 1) return valid[0];
  return { kind: "split", id: id ?? `s${++splitSeq}`, axis, children: valid };
}

export function leaves(n: SNode): string[] {
  return n.kind === "leaf" ? [n.roomId] : n.children.flatMap(leaves);
}

export function nodeArea(n: SNode, weights: Record<string, number>): number {
  return n.kind === "leaf" ? (weights[n.roomId] ?? 0) : n.children.reduce((s, c) => s + nodeArea(c, weights), 0);
}

/** Parede interna arrastável (fronteira entre dois filhos de um corte). */
export interface SplitHandle {
  id: string;
  axis: "x" | "y";
  /** posição atual da parede no eixo do corte */
  pos: number;
  /** limites do segmento na direção perpendicular */
  from: number;
  to: number;
  /** início do filho anterior e fim do filho seguinte (limites do arraste) */
  lo: number;
  hi: number;
  before: string[];
  after: string[];
}

export interface SliceResult {
  rects: Record<string, Rect>;
  groups: Record<string, { group: string; axis: "x" | "y"; siblings: string[] }>;
  handles: SplitHandle[];
}

export function slice(root: SNode, rect: Rect, weights: Record<string, number>): SliceResult {
  const out: SliceResult = { rects: {}, groups: {}, handles: [] };
  const walk = (n: SNode, r: Rect, parent: { id: string; axis: "x" | "y"; siblings: string[] }) => {
    if (n.kind === "leaf") {
      out.rects[n.roomId] = r;
      out.groups[n.roomId] = { group: parent.id, axis: parent.axis, siblings: parent.siblings };
      return;
    }
    const siblings = leaves(n);
    const total = n.children.reduce((s, c) => s + nodeArea(c, weights), 0) || 1;
    let cursor = n.axis === "x" ? r.x : r.y;
    const span = n.axis === "x" ? r.w : r.h;
    const starts: number[] = [];
    n.children.forEach((c, i) => {
      const size = (nodeArea(c, weights) / total) * span;
      starts.push(cursor);
      const childRect = n.axis === "x" ? { x: cursor, y: r.y, w: size, h: r.h } : { x: r.x, y: cursor, w: r.w, h: size };
      walk(c, childRect, { id: n.id, axis: n.axis, siblings });
      cursor += size;
      if (i < n.children.length - 1) {
        out.handles.push({
          id: `${n.id}:${i}`,
          axis: n.axis,
          pos: cursor,
          from: n.axis === "x" ? r.y : r.x,
          to: n.axis === "x" ? r.y + r.h : r.x + r.w,
          lo: starts[i],
          hi: 0, // preenchido abaixo
          before: leaves(c),
          after: leaves(n.children[i + 1]),
        });
      }
    });
    // completa o limite superior de cada handle deste nó
    const end = (n.axis === "x" ? r.x + r.w : r.y + r.h);
    const mine = out.handles.filter((h) => h.id.startsWith(`${n.id}:`));
    mine.forEach((h, i) => {
      h.hi = i + 1 < mine.length ? mine[i + 1].pos : end;
    });
  };
  walk(root, rect, { id: "root", axis: "y", siblings: leaves(root) });
  return out;
}

/**
 * Converte o arraste de uma parede em novas áreas para os cômodos dos dois lados.
 * Os cômodos de cada lado são escalados proporcionalmente.
 */
export function dragToAreas(h: SplitHandle, newPos: number, current: Record<string, number>, minGap = 0.9): Record<string, number> {
  const pos = Math.min(h.hi - minGap, Math.max(h.lo + minGap, newPos));
  const fBefore = (pos - h.lo) / (h.pos - h.lo);
  const fAfter = (h.hi - pos) / (h.hi - h.pos);
  const next: Record<string, number> = {};
  for (const id of h.before) if (current[id] !== undefined) next[id] = current[id] * fBefore;
  for (const id of h.after) if (current[id] !== undefined) next[id] = current[id] * fAfter;
  return next;
}
