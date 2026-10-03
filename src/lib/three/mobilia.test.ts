import { describe, expect, it } from "vitest";
import { DEFAULT_FORM } from "../brief/form";
import { interpretLocally } from "../brief/localParser";
import { exemploInicial, planFromRooms } from "../builder";
import { plansFromBrief } from "../pipeline";
import type { Brief, Plan, Rect } from "../types";
import { ROOM_INFO } from "../catalog";
import { mobiliaAutomatica, regrasDoComodo, type Movel3D } from "./mobilia";

const PEDIDOS = [
  ["12x25, 3 quartos", 12, 25, 120, "Casa de 120 m², 3 quartos, 2 banheiros, garagem, sala integrada à cozinha, varanda nos fundos"],
  ["8x20 estreito", 8, 20, 70, "terreno 8 por 20, 70 m2, 2 quartos, 1 banheiro"],
  ["15x30 grande", 15, 30, 200, "casa de 200 m², 3 quartos e 1 suíte, escritório, garagem para 2 carros, varanda na frente, lavabo"],
  ["10x25 sem garagem", 10, 25, 90, "2 quartos, 1 suíte, cozinha separada, área gourmet, lavanderia, sem garagem"],
] as const;

function plantas(): [string, Plan, Brief][] {
  const out: [string, Plan, Brief][] = [];
  for (const [nome, L, D, A, txt] of PEDIDOS) {
    const brief = interpretLocally({ ...DEFAULT_FORM, largura: L, profundidade: D, area: A }, txt);
    plansFromBrief(brief)
      .slice(0, 4)
      .forEach((p, i) => out.push([`${nome} · variação ${i + 1}`, p, brief]));
  }
  const lote = { largura: 12, profundidade: 25 };
  out.push(["construir do zero", planFromRooms(exemploInicial(lote), lote)!, interpretLocally(DEFAULT_FORM, "")]);
  return out;
}

const sobrepoe = (a: Rect, b: Rect, f = 0.006) => a.x < b.x + b.w - f && b.x < a.x + a.w - f && a.y < b.y + b.h - f && b.y < a.y + a.h - f;
const dentro = (fora: Rect, a: Rect) =>
  a.x >= fora.x - 1e-3 && a.y >= fora.y - 1e-3 && a.x + a.w <= fora.x + fora.w + 1e-3 && a.y + a.h <= fora.y + fora.h + 1e-3;
/** podem ficar sob uma janela (baixos ou de vidro) */
const SOB_JANELA = new Set([
  "box",
  "pia",
  "bancada",
  "fogao",
  "lavatorio",
  "vaso",
  "rack",
  "escrivaninha",
  "sofaExterno",
  "tanque",
  "maquina",
  "cama",
  "criadoMudo",
  "sofa",
  "mesaCentro",
  "cadeiraEscritorio",
  "ilha",
]);

describe("mobília 3D automática", () => {
  const casos = plantas();
  const faltas: string[] = [];

  for (const [nome, plan, brief] of casos) {
    describe(nome, () => {
      const moveis = mobiliaAutomatica(plan, brief);
      const porComodo = (id: string) => moveis.filter((m) => m.comodo === id);

      it("cada móvel fica dentro do vão livre do próprio cômodo (não atravessa parede)", () => {
        for (const m of moveis) {
          const room = plan.rooms.find((r) => r.id === m.comodo)!;
          expect(dentro(regrasDoComodo(room, plan).vao, m.caixa), `${m.tipo} em ${room.nome}`).toBe(true);
        }
      });

      it("nenhum móvel no chão entra na área das portas e passagens", () => {
        for (const m of moveis.filter((x) => x.elevacao < 2)) {
          const room = plan.rooms.find((r) => r.id === m.comodo)!;
          // o carro pode chegar a 40 cm de uma porta que abre para o outro cômodo (a folha não passa pela garagem)
          const regras = regrasDoComodo(room, plan);
          for (const p of m.tipo === "carro" ? regras.portasCurtas : regras.portas)
            expect(sobrepoe(p, m.caixa), `${m.tipo} bloqueia porta em ${room.nome}`).toBe(false);
        }
      });

      it("móveis não se sobrepõem (considerando a altura: TV sobre o rack e armário sobre a bancada podem)", () => {
        for (const r of plan.rooms) {
          const ms = porComodo(r.id).filter((m) => m.tipo !== "tapete"); // o tapete fica por baixo
          for (let i = 0; i < ms.length; i++)
            for (let j = i + 1; j < ms.length; j++) {
              const a = ms[i];
              const b = ms[j];
              const zA = [a.elevacao, a.elevacao + a.altura];
              const zB = [b.elevacao, b.elevacao + b.altura];
              const zJunto = zA[0] < zB[1] - 1e-3 && zB[0] < zA[1] - 1e-3;
              expect(zJunto && sobrepoe(a.caixa, b.caixa), `${a.tipo} × ${b.tipo} em ${r.nome}`).toBe(false);
            }
        }
      });

      it("corredor sem móveis", () => {
        for (const r of plan.rooms.filter((x) => x.tipo === "circulacao")) expect(porComodo(r.id)).toHaveLength(0);
      });

      it("móveis altos não tapam janelas", () => {
        for (const m of moveis.filter((x) => !SOB_JANELA.has(x.tipo))) {
          const room = plan.rooms.find((r) => r.id === m.comodo)!;
          const { vao, janelas } = regrasDoComodo(room, plan);
          for (const j of janelas) {
            const vert = j.lado === "left" || j.lado === "right";
            const encosta =
              j.lado === "top"
                ? Math.abs(m.caixa.y - vao.y) < 0.05
                : j.lado === "bottom"
                  ? Math.abs(m.caixa.y + m.caixa.h - (vao.y + vao.h)) < 0.05
                  : j.lado === "left"
                    ? Math.abs(m.caixa.x - vao.x) < 0.05
                    : Math.abs(m.caixa.x + m.caixa.w - (vao.x + vao.w)) < 0.05;
            const [a, b] = vert ? [m.caixa.y, m.caixa.y + m.caixa.h] : [m.caixa.x, m.caixa.x + m.caixa.w];
            const cobre = encosta && a < j.b - 1e-3 && j.a < b - 1e-3 && m.elevacao + m.altura > j.peitoril && m.elevacao < j.peitoril + 1.2;
            expect(cobre, `${m.tipo} tapa a janela de ${room.nome}`).toBe(false);
          }
        }
      });

      it("os móveis certos para cada tipo de cômodo", () => {
        const esperado: Record<string, string[]> = {
          quarto: ["cama", "guardaRoupa"],
          suite: ["cama", "guardaRoupa"],
          sala: ["sofa", "tv"],
          cozinha: ["pia", "fogao", "geladeira"],
          banheiro: ["vaso", "lavatorio"],
          banheiro_suite: ["vaso", "lavatorio"],
          lavabo: ["vaso", "lavatorio"],
          lavanderia: ["tanque", "maquina"],
          garagem: ["carro"],
        };
        for (const r of plan.rooms) {
          const tipos = new Set(porComodo(r.id).map((m) => m.tipo));
          // cômodo abaixo da largura mínima já é apontado pela própria planta: não entra na conta
          if (Math.min(r.w, r.h) < ROOM_INFO[r.tipo].minWidth - 0.05) continue;
          // box "quando aplicável": banheiro com pelo menos 3 m²
          const exige = [...(esperado[r.tipo] ?? []), ...(r.tipo.startsWith("banheiro") && r.w * r.h >= 3 ? ["box"] : [])];
          for (const t of exige) if (!tipos.has(t as Movel3D["tipo"])) faltas.push(`${nome}: ${r.nome} (${r.w.toFixed(2)}×${r.h.toFixed(2)}) sem ${t}`);
          // móveis só do próprio tipo de cômodo
          if (r.tipo === "garagem") expect([...tipos].every((t) => t === "carro")).toBe(true);
          if (r.tipo.startsWith("banheiro") || r.tipo === "lavabo")
            expect([...tipos].every((t) => ["vaso", "lavatorio", "espelho", "box", "toalheiro", "cesto", "planta", "quadro"].includes(t))).toBe(true);
        }
      });

      it("sofá virado para a TV e cama com as medidas reais", () => {
        for (const r of plan.rooms.filter((x) => x.tipo === "sala")) {
          const sofa = porComodo(r.id).find((m) => m.tipo === "sofa");
          const rack = porComodo(r.id).find((m) => m.tipo === "rack");
          if (sofa && rack) expect(Math.abs(Math.cos(sofa.rotacao - rack.rotacao) + 1)).toBeLessThan(1e-6);
        }
        for (const c of moveis.filter((m) => m.tipo === "cama")) expect([0.88, 1.38, 1.58]).toContain(c.largura);
      });
    });
  }

  it("cobertura: quase todos os cômodos recebem os móveis principais", () => {
    const total = casos.reduce(
      (s, [, p]) =>
        s +
        p.rooms.filter((r) => ["quarto", "suite", "sala", "cozinha", "banheiro", "banheiro_suite", "lavabo", "lavanderia", "garagem"].includes(r.tipo)).length,
      0,
    );
    if (faltas.length && process.env.MOBILIA_LOG) require("fs").writeFileSync(process.env.MOBILIA_LOG, faltas.join("\n"));
    // nenhum móvel é forçado: quando não cabe com folga ele fica de fora, mas isso deve ser raro
    expect(faltas.length / total).toBeLessThan(0.08);
  });
});
