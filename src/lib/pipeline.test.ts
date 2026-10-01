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

describe("camadas técnicas, opções e relatório", async () => {
  const { electricalFor, luzVA } = await import("./plan/electrical");
  const { plumbingFor } = await import("./plan/plumbing");
  const { gerarOpcoes } = await import("./plan/profiles");
  const { verificacoes, explicarProjeto } = await import("./plan/report");
  const brief = interpretLocally(DEFAULT_FORM, EXEMPLO);
  const plan = plansFromBrief(brief)[0];

  it("elétrica: luz em todo cômodo, quadro, chuveiro com circuito próprio e proteção coerente", () => {
    const e = electricalFor(plan);
    for (const r of plan.rooms) expect(e.pontos.some((p) => p.kind === "luz" && p.roomId === r.id)).toBe(true);
    expect(e.pontos.filter((p) => p.kind === "quadro")).toHaveLength(1);
    const chuveiros = e.circuitos.filter((c) => c.nome.startsWith("Chuveiro"));
    expect(chuveiros.length).toBe(plan.rooms.filter((r) => r.tipo === "banheiro" || r.tipo === "banheiro_suite").length);
    for (const c of chuveiros) {
      expect(c.disjuntor).toBeGreaterThanOrEqual(c.corrente);
      expect(c.cabo).toBeGreaterThanOrEqual(4);
    }
    for (const c of e.circuitos.filter((x) => x.tipo !== "Uso específico")) expect(c.va).toBeLessThanOrEqual(2200);
    expect(e.pontos.every((p) => p.kind === "quadro" || p.circuito > 0)).toBe(true);
    expect(luzVA(6)).toBe(100);
    expect(luzVA(14)).toBe(220);
  });

  it("hidráulica: todo aparelho tem água e esgoto, caixa d'água pelo nº de moradores", () => {
    const h = plumbingFor(plan, { ...brief, regras: { moradores: 5 } });
    expect(h.reservatorio.litros).toBe(1500);
    expect(h.aparelhos.some((a) => a.kind === "vaso")).toBe(true);
    for (const a of h.aparelhos) {
      const toca = (tipo: string) => h.trechos.some((t) => t.tipo === tipo && t.pts.some((p) => Math.abs(p.x - a.x) < 1e-6 && Math.abs(p.y - a.y) < 1e-6));
      expect(toca("fria")).toBe(true);
      expect(toca("esgoto")).toBe(true);
    }
    expect(h.caixas.some((c) => c.tipo === "CG")).toBe(true);
    expect(h.materiais.find((m) => m.item.includes("100 mm"))?.qtd).toBeGreaterThan(0);
  });

  it("gera 3 opções diferentes e ordenadas por nota dentro de cada perfil", () => {
    const opcoes = gerarOpcoes(brief);
    expect(opcoes.map((o) => o.perfil.id)).toEqual(["equilibrada", "social", "privacidade"]);
    const sigs = opcoes.map((o) => o.plans[0].rooms.map((r) => `${r.x.toFixed(1)},${r.y.toFixed(1)},${r.w.toFixed(1)}`).join());
    expect(new Set(sigs).size).toBe(3);
    const salaSocial = opcoes[1].plans[0].rooms.find((r) => r.tipo === "sala")!;
    const salaEq = opcoes[0].plans[0].rooms.find((r) => r.tipo === "sala")!;
    expect(salaSocial.w * salaSocial.h).toBeGreaterThan(salaEq.w * salaEq.h);
  });

  it("recuos informados e acessibilidade mudam a planta", () => {
    const b2 = { ...brief, regras: { recuos: { frente: 6, laterais: 2 }, acessivel: true } };
    const p2 = plansFromBrief(b2)[0];
    expect(p2.footprint.y).toBeCloseTo(6);
    expect(p2.footprint.x).toBeGreaterThanOrEqual(2);
    const corredor = p2.rooms.find((r) => r.tipo === "circulacao")!;
    expect(Math.min(corredor.w, corredor.h)).toBeGreaterThan(1.1);
  });

  it("verificações e explicação descrevem a planta", () => {
    const checks = verificacoes(plan, brief);
    expect(checks.length).toBeGreaterThanOrEqual(6);
    expect(checks.find((c) => c.texto.startsWith("Garagem"))?.ok).toBe(true);
    const texto = explicarProjeto(plan, { ...brief, regras: { norte: "fundos" } }).join(" ");
    expect(texto).toMatch(/sala tem/);
    expect(texto).toMatch(/garagem tem/);
    expect(texto).toMatch(/norte/);
  });

  it("comando 'quero a suíte com 16 m²'", async () => {
    const { parseCommand } = await import("./plan/commands");
    expect(parseCommand("quero a suíte com 16 m²", plan.rooms)).toMatchObject({ kind: "set", area: 16 });
  });
});

describe("fiação editável e custo", async () => {
  const { electricalFor, EDICAO_VAZIA } = await import("./plan/electrical");
  const { plumbingFor } = await import("./plan/plumbing");
  const { orcamento, CUSTOS } = await import("./plan/cost");
  const brief = interpretLocally(DEFAULT_FORM, EXEMPLO);
  const plan = plansFromBrief(brief)[0];
  const base = electricalFor(plan);

  it("ids estáveis e edições aplicadas (mover, apagar, acrescentar, trocar circuito)", () => {
    expect(electricalFor(plan).pontos.map((p) => p.id)).toEqual(base.pontos.map((p) => p.id));
    const tug = base.pontos.find((p) => p.kind === "tug")!;
    const quarto = plan.rooms.find((r) => r.tipo === "quarto")!;
    const ed = {
      ...EDICAO_VAZIA,
      movidos: { [tug.id]: { x: 1, y: 2 } },
      removidos: [base.pontos.find((p) => p.kind === "luz")!.id],
      adicionados: [{ id: "manual-tue-1", kind: "tue" as const, roomId: quarto.id, x: quarto.x + 1, y: quarto.y + 1, label: "Ar/forno" }],
      circuito: { [tug.id]: "Circuito extra 99" },
    };
    const e = electricalFor(plan, ed);
    expect(e.pontos.find((p) => p.id === tug.id)).toMatchObject({ x: 1, y: 2 });
    expect(e.pontos.filter((p) => p.kind === "luz").length).toBe(base.pontos.filter((p) => p.kind === "luz").length - 1);
    const ar = e.pontos.find((p) => p.id === "manual-tue-1")!;
    expect(ar.va).toBe(1500);
    expect(e.circuitos.find((c) => c.id === ar.circuito)?.tipo).toBe("Uso específico");
    expect(e.circuitos.find((c) => c.nome === "Circuito extra 99")?.pontos).toBe(1);
  });

  it("orçamento: total = área equivalente × R$/m², etapas somam o total, materiais com preço", () => {
    const o = orcamento(plan, base, plumbingFor(plan, brief), "normal");
    expect(o.total).toBe(Math.round(o.areaEquivalente * CUSTOS.m2.normal));
    expect(Math.abs(o.etapas.reduce((s, x) => s + x.valor, 0) - o.total)).toBeLessThan(20);
    expect(o.eletrica.some((i) => i.item.startsWith("Cabo 4"))).toBe(true);
    expect(o.hidraulica.every((i) => i.total > 0)).toBe(true);
    expect(o.areaEquivalente).toBeLessThan(plan.builtArea);
    expect(orcamento(plan, base, plumbingFor(plan, brief), "alto").total).toBeGreaterThan(o.total);
  });
});

describe("construir do zero", async () => {
  const { planFromRooms, exemploInicial, sobrepostos } = await import("./builder");
  const { electricalFor } = await import("./plan/electrical");
  const { plumbingFor } = await import("./plan/plumbing");
  const { verificacoes } = await import("./plan/report");
  const lot = { largura: 12, profundidade: 25 };
  const rooms = exemploInicial(lot);

  it("o exemplo vira uma planta completa, sem sobreposição e com acesso a todos os cômodos", () => {
    expect(sobrepostos(rooms).size).toBe(0);
    const plan = planFromRooms(rooms, lot)!;
    expect(plan.builtArea).toBeCloseTo(rooms.reduce((s, r) => s + r.w * r.h, 0), 1);
    expect(plan.issues.filter((i) => i.includes("sem porta"))).toEqual([]);
    expect(plan.openings.some((o) => o.kind === "entrance")).toBe(true);
    expect(plan.openings.some((o) => o.kind === "garage_door")).toBe(true);
    expect(electricalFor(plan).circuitos.length).toBeGreaterThan(4);
    const b = { terreno: { largura: 12, profundidade: 25 } } as never;
    expect(plumbingFor(plan, { ...(b as object), regras: {} } as never).aparelhos.length).toBeGreaterThan(3);
    expect(verificacoes(plan, { carro: { comprimento: 4.5, largura: 1.8, vagas: 1 }, casa: { area: 120 }, regras: {} } as never).length).toBeGreaterThan(4);
  });

  it("detecta sobreposição", () => {
    const r2 = [...rooms, { ...rooms[0], id: "x", x: rooms[0].x + 1 }];
    expect(sobrepostos(r2).has("x")).toBe(true);
    expect(planFromRooms(r2, lot)!.issues.join()).toMatch(/sobrepostos/);
  });
});
