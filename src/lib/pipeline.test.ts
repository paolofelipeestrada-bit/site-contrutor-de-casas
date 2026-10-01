import { describe, expect, it } from "vitest";
import { DEFAULT_FORM } from "./brief/form";
import { interpretLocally, parseText } from "./brief/localParser";
import { buildProgram } from "./layout/program";
import { sharedEdge } from "./layout/layout";
import { dragToAreas } from "./layout/slicing";
import { createLearningState, learnedHints, recordAreaEdit, recordRating, strategyBonus } from "./learning/engine";
import { plansFromBrief, relayout } from "./pipeline";

const EXEMPLO = `Casa de 120 m²
12 × 25 m
3 quartos
2 banheiros
1 garagem
estilo moderno
sala integrada à cozinha
varanda nos fundos
quartos mais reservados`;

describe("interpretação local", () => {
  it("extrai os dados do exemplo", () => {
    const p = parseText(EXEMPLO);
    expect(p.largura).toBe(12);
    expect(p.profundidade).toBe(25);
    expect(p.area).toBe(120);
    expect(p.quartos).toBe(3);
    expect(p.banheiros).toBe(2);
    expect(p.extras.garagem).toBe(true);
    expect(p.varandaPosicao).toBe("fundos");
    expect(p.integrada).toBe(true);
    expect(p.reservados).toBe(true);
    expect(p.estilo).toBe("moderno");
  });

  it("monta o brief: 3 quartos → 2 quartos + 1 suíte, 1 banho social", () => {
    const brief = interpretLocally(DEFAULT_FORM, EXEMPLO);
    const tipos = brief.ambientes.map((a) => a.tipo);
    expect(tipos.filter((t) => t === "suite")).toHaveLength(1);
    expect(tipos.filter((t) => t === "quarto")).toHaveLength(2);
    expect(tipos.filter((t) => t === "banheiro")).toHaveLength(1);
    expect(tipos).toContain("garagem");
    expect(tipos).toContain("varanda");
    expect(brief.carro).not.toBeNull();
  });

  it("entende SUV, escritório e '3 quartos e 1 suíte'", () => {
    const brief = interpretLocally(DEFAULT_FORM, "terreno 10x30, 3 quartos e 1 suíte, home office, garagem para SUV");
    expect(brief.ambientes.filter((a) => a.tipo === "suite")).toHaveLength(1);
    expect(brief.ambientes.filter((a) => a.tipo === "quarto")).toHaveLength(3);
    expect(brief.ambientes.some((a) => a.tipo === "escritorio")).toBe(true);
    expect(brief.carro?.comprimento).toBeCloseTo(4.7);
  });
});

describe("algoritmo de planta", () => {
  const brief = interpretLocally(DEFAULT_FORM, EXEMPLO);

  it("o programa cria o banheiro da suíte e a garagem cabe o carro", () => {
    const program = buildProgram(brief);
    const suite = program.rooms.find((r) => r.tipo === "suite")!;
    expect(program.rooms.find((r) => r.tipo === "banheiro_suite")?.attachTo).toBe(suite.id);
    const g = program.rooms.find((r) => r.tipo === "garagem")!;
    expect(g.fixed!.h).toBeGreaterThanOrEqual(brief.carro!.comprimento + 1);
  });

  const plans = plansFromBrief(brief);
  const best = plans[0];

  it("gera várias opções ordenadas pela pontuação", () => {
    expect(plans.length).toBeGreaterThan(2);
    for (let i = 1; i < plans.length; i++) expect(plans[i - 1].score).toBeGreaterThanOrEqual(plans[i].score);
  });

  it("a planta cabe no terreno respeitando os recuos", () => {
    const { footprint: fp, setbacks: sb, lot } = best;
    expect(fp.x).toBeGreaterThanOrEqual(sb.left - 1e-6);
    expect(fp.x + fp.w).toBeLessThanOrEqual(lot.width - sb.right + 1e-6);
    expect(fp.y + fp.h).toBeLessThanOrEqual(lot.depth - sb.back + 1e-6);
  });

  it("cômodos não se sobrepõem e preenchem a projeção", () => {
    const sum = best.rooms.reduce((s, r) => s + r.w * r.h, 0);
    expect(sum).toBeCloseTo(best.footprint.w * best.footprint.h, 3);
    for (const a of best.rooms)
      for (const b of best.rooms) {
        if (a === b) continue;
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        expect(ox > 1e-6 && oy > 1e-6).toBe(false);
      }
  });

  it("garagem na rua com espaço para o carro, sala integrada à cozinha", () => {
    const g = best.rooms.find((r) => r.tipo === "garagem")!;
    expect(g.exterior).toContain("top");
    expect(g.h).toBeGreaterThanOrEqual(brief.carro!.comprimento + 0.9);
    const sala = best.rooms.find((r) => r.tipo === "sala")!;
    const coz = best.rooms.find((r) => r.tipo === "cozinha")!;
    expect(sharedEdge(sala, coz)).not.toBeNull();
    expect(best.openings.some((o) => o.kind === "entrance")).toBe(true);
  });

  it("todo cômodo tem acesso", () => {
    expect(best.issues.filter((i) => i.includes("sem porta"))).toEqual([]);
  });

  it("arrastar parede conserva a área total e o recálculo respeita", () => {
    const h = best.handles[0];
    const current = Object.fromEntries(best.rooms.map((r) => [r.id, r.w * r.h]));
    const next = dragToAreas(h, h.pos + 0.5, current);
    const before = [...h.before, ...h.after].reduce((s, id) => s + (current[id] ?? 0), 0);
    const after = [...h.before, ...h.after].reduce((s, id) => s + (next[id] ?? current[id] ?? 0), 0);
    expect(after).toBeCloseTo(before, 6);
    const edited = relayout(brief, best.strategy, undefined, next);
    expect(edited.rooms.length).toBe(best.rooms.length);
  });
});

describe("aprendizado", () => {
  it("edições puxam o fator de área e viram dicas", () => {
    let s = createLearningState();
    s = recordAreaEdit(s, "suite", 14, 18);
    s = recordAreaEdit(s, "suite", 15, 18);
    expect(s.areaFactor.suite!.value).toBeGreaterThan(1.1);
    expect(learnedHints(s).join(" ")).toMatch(/suíte.*maior/i);
    const brief = interpretLocally(DEFAULT_FORM);
    const plain = buildProgram(brief).rooms.find((r) => r.tipo === "suite")!.area;
    const learned = buildProgram(brief, s).rooms.find((r) => r.tipo === "suite")!.area;
    expect(learned).toBeGreaterThan(plain);
  });

  it("avaliações mudam a preferência por estratégia", () => {
    let s = createLearningState();
    const brief = interpretLocally(DEFAULT_FORM);
    const strat = { kind: "lateral" as const, mirror: false, variant: 0 as const, width: 9 };
    for (let i = 0; i < 4; i++) s = recordRating(s, true, strat, brief, "x");
    expect(strategyBonus(s, strat)).toBeGreaterThan(0.2);
    expect(strategyBonus(s, { ...strat, kind: "faixas" })).toBe(0);
    expect(s.examples.length).toBeGreaterThan(0);
  });
});

describe("comandos do modo editar", async () => {
  const { parseCommand } = await import("./plan/commands");
  const brief = interpretLocally(DEFAULT_FORM);
  const plan = plansFromBrief(brief)[0];
  it("entende redimensionar, adicionar, remover e espelhar", () => {
    const c = parseCommand("Aumentar a suíte em 2 m²", plan.rooms);
    expect(c).toMatchObject({ kind: "resize", delta: 2 });
    expect(plan.rooms.find((r) => r.id === (c as { roomId: string }).roomId)?.tipo).toBe("suite");
    expect(parseCommand("diminuir quarto 2 em 1,5 m2", plan.rooms)).toMatchObject({ kind: "resize", delta: -1.5, roomId: "quarto-2" });
    expect(parseCommand("adicionar escritório", plan.rooms)).toEqual({ kind: "add", tipo: "escritorio" });
    expect(parseCommand("remover a varanda", plan.rooms)).toEqual({ kind: "remove", tipo: "varanda" });
    expect(parseCommand("espelhar", plan.rooms)).toEqual({ kind: "mirror" });
    expect(parseCommand("blá", plan.rooms).kind).toBe("unknown");
  });
});

describe("robustez em vários briefings", () => {
  const casos = [
    "terreno 10x30, casa de 90 m2, 2 quartos, 1 banheiro, sem garagem",
    "lote 15 x 30, 200 m², 4 quartos sendo 2 suítes, 3 banheiros, garagem para 2 carros, escritório, área gourmet, lavabo",
    "terreno 8 por 20, 70 m2, 2 quartos, 1 banheiro, garagem, varanda na frente",
    "casa de 150 m2 em terreno 20x25, 3 quartos, 2 banheiros, cozinha fechada, varanda lateral, estilo rústico",
  ];
  for (const texto of casos) {
    it(texto, () => {
      const brief = interpretLocally(DEFAULT_FORM, texto);
      const plans = plansFromBrief(brief);
      const best = plans[0];
      expect(plans.length).toBeGreaterThan(0);
      const sum = best.rooms.reduce((s, r) => s + r.w * r.h, 0);
      expect(sum).toBeCloseTo(best.footprint.w * best.footprint.h, 2);
      expect(best.issues.filter((i) => i.includes("sem porta"))).toEqual([]);
      expect(best.score).toBeGreaterThan(30);
    });
  }
});
