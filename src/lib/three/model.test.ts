import { describe, expect, it } from "vitest";
import { DEFAULT_FORM } from "../brief/form";
import { interpretLocally } from "../brief/localParser";
import { exemploInicial, planFromRooms } from "../builder";
import { plansFromBrief, relayout } from "../pipeline";
import type { Brief, Plan } from "../types";
import { CASA3D, planTo3D, type Model3D } from "./model";

const PEDIDOS = {
  "12×25, 3 quartos, garagem, varanda nos fundos":
    "Casa de 120 m², terreno 12 x 25, 3 quartos, 2 banheiros, garagem, sala integrada à cozinha, varanda nos fundos",
  "8×20 estreito, 2 quartos": "terreno 8 por 20, 70 m2, 2 quartos, 1 banheiro",
  "15×30, 4 quartos, escritório, varanda na frente":
    "terreno 15x30, casa de 200 m², 3 quartos e 1 suíte, escritório, garagem para 2 carros, varanda na frente, lavabo",
};

function casos(): [string, Plan, Brief][] {
  const out: [string, Plan, Brief][] = Object.entries(PEDIDOS).map(([nome, txt]) => {
    const brief = interpretLocally(DEFAULT_FORM, txt);
    return [nome, plansFromBrief(brief)[0], brief];
  });
  const lote = { largura: 12, profundidade: 25 };
  const salas = exemploInicial(lote);
  const p = planFromRooms(salas, lote)!;
  out.push(["construir do zero (exemplo)", p, interpretLocally(DEFAULT_FORM, "")]);
  return out;
}

/** Parede que atravessa o vão de uma abertura abaixo da altura do vão = abertura bloqueada. */
function bloqueia(m: Model3D, a: { x1: number; y1: number; x2: number; y2: number }, base: number, topo: number) {
  const vertical = Math.abs(a.x1 - a.x2) < 1e-3;
  const [lo, hi] = vertical ? [Math.min(a.y1, a.y2), Math.max(a.y1, a.y2)] : [Math.min(a.x1, a.x2), Math.max(a.x1, a.x2)];
  return m.paredes.some((p) => {
    const pv = Math.abs(p.x1 - p.x2) < 1e-3;
    if (pv !== vertical) return false;
    if (vertical ? Math.abs(p.x1 - a.x1) > 1e-3 : Math.abs(p.y1 - a.y1) > 1e-3) return false;
    const [pa, pb] = vertical ? [Math.min(p.y1, p.y2), Math.max(p.y1, p.y2)] : [Math.min(p.x1, p.x2), Math.max(p.x1, p.x2)];
    const sobrepoe = Math.min(pb, hi) - Math.max(pa, lo) > 0.02;
    return sobrepoe && p.base < topo - 0.01 && p.topo > base + 0.01;
  });
}

describe("planta 2D → modelo 3D", () => {
  for (const [nome, plan, brief] of casos()) {
    describe(nome, () => {
      const m = planTo3D(plan, brief);

      it("cada cômodo da planta vira um cômodo 3D com as mesmas medidas (nada inventado)", () => {
        expect(m.comodos.map((r) => r.id).sort()).toEqual(plan.rooms.map((r) => r.id).sort());
        for (const r of plan.rooms) {
          const c = m.comodos.find((x) => x.id === r.id)!;
          expect(c.x).toBe(r.x);
          expect(c.y).toBe(r.y);
          expect(c.largura).toBe(r.w);
          expect(c.profundidade).toBe(r.h);
          expect(c.altura).toBe(CASA3D.peDireito);
          // vão livre = medida de eixo menos meia parede de cada lado (no máximo 15 cm a menos)
          expect(r.w - c.livre.largura).toBeLessThanOrEqual(CASA3D.parede.externa + 1e-9);
        }
      });

      it("toda abertura da planta aparece (portas e janelas) e nenhuma parede tapa o vão", () => {
        const portas = plan.openings.filter((o) => o.kind !== "window").length;
        const janelas = plan.openings.filter((o) => o.kind === "window").length;
        expect(m.portas).toHaveLength(portas);
        expect(m.janelas).toHaveLength(janelas);
        for (const d of m.portas) expect(bloqueia(m, d, 0, d.altura)).toBe(false);
        for (const j of m.janelas) expect(bloqueia(m, j, j.peitoril, j.peitoril + j.altura)).toBe(false);
        for (const j of m.janelas) expect(j.peitoril + j.altura).toBeLessThan(CASA3D.peDireito);
      });

      it("portas na posição exata da planta, com 2,10 m de altura", () => {
        for (const d of m.portas.filter((p) => p.tipo === "giro" || p.tipo === "entrada")) {
          const o = plan.openings.find((x) => x.x1 === d.x1 && x.y1 === d.y1 && x.x2 === d.x2 && x.y2 === d.y2);
          expect(o).toBeDefined();
          expect(d.altura).toBe(CASA3D.porta.altura);
          expect(d.naParede).toBe(true);
        }
      });

      it("as paredes ficam nas bordas dos cômodos fechados e cobrem todo o contorno da casa", () => {
        const fechados = plan.rooms.filter((r) => r.zone !== "outdoor");
        // cada lado de cada cômodo fechado tem parede (cheia, verga ou peitoril) ao longo de todo o comprimento
        for (const r of fechados) {
          for (const [vertical, c, a, b] of [
            [false, r.y, r.x, r.x + r.w],
            [false, r.y + r.h, r.x, r.x + r.w],
            [true, r.x, r.y, r.y + r.h],
            [true, r.x + r.w, r.y, r.y + r.h],
          ] as const) {
            const cobertos = m.paredes
              .filter((p) => p.parte !== "platibanda" && Math.abs(p.x1 - p.x2) < 1e-3 === vertical && Math.abs((vertical ? p.x1 : p.y1) - c) < 1e-3)
              .filter((p) => p.topo === CASA3D.peDireito)
              .map((p) => (vertical ? [Math.min(p.y1, p.y2), Math.max(p.y1, p.y2)] : [Math.min(p.x1, p.x2), Math.max(p.x1, p.x2)]));
            let falta = 0;
            for (let t = a + 0.01; t < b; t += 0.05) if (!cobertos.some(([p, q]) => t >= p - 1e-6 && t <= q + 1e-6)) falta += 0.05;
            expect(falta, `${r.nome}: lado ${vertical ? "x" : "y"}=${c.toFixed(2)} sem parede`).toBeLessThan(0.06);
          }
        }
      });

      it("cobertura: laje sobre todos os cômodos; telhado só quando a casa é retangular", () => {
        expect(m.cobertura.lajes).toHaveLength(plan.rooms.length);
        const t = planTo3D(plan, brief, "telhado");
        if (t.cobertura.tipo === "telhado") {
          expect(t.cobertura.telhado!.largura).toBeCloseTo(plan.footprint.w + 2 * CASA3D.telhado.beiral);
          expect(t.cobertura.telhado!.cumeeira).toBeGreaterThan(CASA3D.peDireito);
        }
      });

      it("o ponto de partida fica fora da casa, na frente, olhando para ela", () => {
        expect(m.inicio.y).toBeLessThan(plan.footprint.y);
        expect(m.inicio.olhando.y).toBe(1);
        expect(m.obstaculos.every((o) => !(m.inicio.x > o.x && m.inicio.x < o.x + o.w && m.inicio.y > o.y && m.inicio.y < o.y + o.h))).toBe(true);
      });
    });
  }

  it("consistência: aumentar a suíte na planta aumenta a suíte no 3D", () => {
    const brief = interpretLocally(DEFAULT_FORM, PEDIDOS["12×25, 3 quartos, garagem, varanda nos fundos"]);
    const antes = plansFromBrief(brief)[0];
    const suite = antes.rooms.find((r) => r.tipo === "suite")!;
    const depois = relayout(brief, antes.strategy, undefined, { [suite.id]: suite.w * suite.h + 2 });
    const a3 = planTo3D(antes, brief).comodos.find((r) => r.id === suite.id)!;
    const d3 = planTo3D(depois, brief).comodos.find((r) => r.id === suite.id)!;
    const d2 = depois.rooms.find((r) => r.id === suite.id)!;
    expect(d3.area).toBeGreaterThan(a3.area + 1);
    expect(d3.largura).toBe(d2.w);
    expect(d3.profundidade).toBe(d2.h);
  });
});
