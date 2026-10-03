import type { Rect } from "../types";
import type { Model3D } from "./model";

/**
 * ACESSO: dá para chegar a pé em cada cômodo?
 * Percorre a casa numa grade (como a pessoa do modo andar, com a mesma "largura" de corpo),
 * a partir da calçada, desviando de paredes, pilares e móveis.
 */
export const ACESSO = {
  /** metade da largura de uma pessoa (a mesma do modo andar) */
  raio: 0.22,
  /** tamanho da célula da grade (m) */
  passo: 0.1,
};

export interface Grade {
  x0: number;
  y0: number;
  nx: number;
  ny: number;
  passo: number;
  /** 1 = dá para chegar */
  alcancado: Uint8Array;
}

/** Células alcançáveis a partir do ponto de partida do modo andar (na calçada). */
export function alcance(model: Model3D, extras: Rect[] = [], raio = ACESSO.raio, passo = ACESSO.passo): Grade {
  const x0 = -1.5;
  const y0 = Math.min(-1.5, model.inicio.y - 0.5);
  const x1 = model.lote.largura + 1.5;
  const y1 = model.lote.profundidade + 1.5;
  const nx = Math.ceil((x1 - x0) / passo);
  const ny = Math.ceil((y1 - y0) / passo);
  const livre = new Uint8Array(nx * ny).fill(1);
  // marca como bloqueada toda célula cujo centro fica a menos de `raio` de um obstáculo
  for (const o of [...model.obstaculos, ...extras]) {
    const i0 = Math.max(0, Math.floor((o.x - raio - x0) / passo));
    const i1 = Math.min(nx - 1, Math.ceil((o.x + o.w + raio - x0) / passo));
    const j0 = Math.max(0, Math.floor((o.y - raio - y0) / passo));
    const j1 = Math.min(ny - 1, Math.ceil((o.y + o.h + raio - y0) / passo));
    for (let j = j0; j <= j1; j++) {
      const cy = y0 + (j + 0.5) * passo;
      if (cy <= o.y - raio || cy >= o.y + o.h + raio) continue;
      for (let i = i0; i <= i1; i++) {
        const cx = x0 + (i + 0.5) * passo;
        if (cx > o.x - raio && cx < o.x + o.w + raio) livre[j * nx + i] = 0;
      }
    }
  }
  const alcancado = new Uint8Array(nx * ny);
  const si = Math.floor((model.inicio.x - x0) / passo);
  const sj = Math.floor((model.inicio.y - y0) / passo);
  const fila: number[] = [];
  const entrar = (i: number, j: number) => {
    if (i < 0 || j < 0 || i >= nx || j >= ny) return;
    const k = j * nx + i;
    if (!livre[k] || alcancado[k]) return;
    alcancado[k] = 1;
    fila.push(k);
  };
  entrar(si, sj);
  for (let h = 0; h < fila.length; h++) {
    const k = fila[h];
    const i = k % nx;
    const j = (k - i) / nx;
    entrar(i + 1, j);
    entrar(i - 1, j);
    entrar(i, j + 1);
    entrar(i, j - 1);
  }
  return { x0, y0, nx, ny, passo, alcancado };
}

/** Quantas células alcançadas há dentro de um retângulo. */
export function alcancadasEm(g: Grade, r: Rect): number {
  let n = 0;
  const i0 = Math.max(0, Math.ceil((r.x - g.x0) / g.passo));
  const i1 = Math.min(g.nx - 1, Math.floor((r.x + r.w - g.x0) / g.passo) - 1);
  const j0 = Math.max(0, Math.ceil((r.y - g.y0) / g.passo));
  const j1 = Math.min(g.ny - 1, Math.floor((r.y + r.h - g.y0) / g.passo) - 1);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) n += g.alcancado[j * g.nx + i];
  return n;
}

/** Cômodos onde não dá para entrar a pé (com os obstáculos dados). */
export function comodosSemAcesso(model: Model3D, extras: Rect[] = []): string[] {
  const g = alcance(model, extras);
  return model.comodos.filter((c) => alcancadasEm(g, { x: c.x, y: c.y, w: c.largura, h: c.profundidade }) === 0).map((c) => c.id);
}
