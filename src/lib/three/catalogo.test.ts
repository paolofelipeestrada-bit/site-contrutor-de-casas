import { describe, expect, it } from "vitest";
import { MODELOS } from "../../components/casa3d/Modelos";
import { DEFAULT_FORM } from "../brief/form";
import { interpretLocally } from "../brief/localParser";
import { plansFromBrief } from "../pipeline";
import { STYLES } from "../types";
import { CATALOGO, escolherModelo, MODELOS_NOVOS } from "./catalogo";
import { mobiliaAutomatica } from "./mobilia";

/** Tipos que já existiam antes do catálogo (o modelo padrão deles continua desenhado em Moveis.tsx). */
const ANTIGOS = new Set([
  "sofa",
  "poltrona",
  "mesaCentro",
  "rack",
  "tv",
  "mesa",
  "mesaRedonda",
  "cadeira",
  "bancada",
  "armarioSuperior",
  "pia",
  "fogao",
  "geladeira",
  "ilha",
  "cama",
  "criadoMudo",
  "guardaRoupa",
  "escrivaninha",
  "cadeiraEscritorio",
  "estante",
  "vaso",
  "lavatorio",
  "espelho",
  "box",
  "maquina",
  "tanque",
  "armario",
  "carro",
  "sofaExterno",
]);

describe("catálogo de móveis 3D", () => {
  it("tem mais de 100 modelos novos, com ids únicos", () => {
    expect(MODELOS_NOVOS).toBeGreaterThanOrEqual(100);
    expect(new Set(CATALOGO.map((m) => m.id)).size).toBe(CATALOGO.length);
  });

  it("todo modelo do catálogo tem desenho 3D (e todo desenho está no catálogo)", () => {
    for (const m of CATALOGO) {
      const temDesenho = !!MODELOS[m.id] || (m.padrao && ANTIGOS.has(m.tipo));
      expect(temDesenho, m.id).toBe(true);
    }
    for (const id of Object.keys(MODELOS))
      expect(
        CATALOGO.some((m) => m.id === id),
        id,
      ).toBe(true);
  });

  it("a escolha respeita o estilo da casa", () => {
    for (const estilo of STYLES)
      for (const tipo of new Set(CATALOGO.map((m) => m.tipo)))
        for (let i = 0; i < 10; i++) {
          const m = CATALOGO.find((x) => x.id === escolherModelo(tipo, estilo, `casa-${i}`))!;
          const haDoEstilo = CATALOGO.some((x) => x.tipo === tipo && (x.estilos.length === 0 || x.estilos.includes(estilo)));
          if (haDoEstilo) expect(m.estilos.length === 0 || m.estilos.includes(estilo), `${m.id} em casa ${estilo}`).toBe(true);
        }
  });

  describe("na casa", () => {
    const brief = interpretLocally(
      { ...DEFAULT_FORM, largura: 15, profundidade: 30, area: 200 },
      "casa de 200 m², 3 quartos e 1 suíte, escritório, garagem, varanda nos fundos, lavabo",
    );
    const plan = plansFromBrief(brief)[0];

    it("a mesma planta sempre recebe os mesmos modelos", () => {
      const a = mobiliaAutomatica(plan, brief).map((m) => m.modelo);
      const b = mobiliaAutomatica(plan, brief).map((m) => m.modelo);
      expect(a).toEqual(b);
    });

    it("'outra combinação' troca os modelos sem mudar as posições", () => {
      const base = mobiliaAutomatica(plan, brief);
      const sofas = new Set<string>();
      const todos = new Set<string>();
      for (let v = 0; v < 20; v++) {
        const outra = mobiliaAutomatica(plan, brief, { variacao: v });
        expect(outra.map((m) => [m.tipo, m.x, m.y])).toEqual(base.map((m) => [m.tipo, m.x, m.y]));
        outra.forEach((m) => todos.add(m.modelo));
        sofas.add(outra.find((m) => m.tipo === "sofa")!.modelo);
      }
      expect(sofas.size).toBeGreaterThanOrEqual(3);
      expect(todos.size).toBeGreaterThanOrEqual(60);
    });

    it("cadeiras iguais na casa toda; pia e fogão com o mesmo armário da bancada", () => {
      for (let v = 0; v < 10; v++) {
        const ms = mobiliaAutomatica(plan, brief, { variacao: v });
        expect(new Set(ms.filter((m) => m.tipo === "cadeira").map((m) => m.modelo)).size).toBeLessThanOrEqual(1);
        const bancadas = new Set(ms.filter((m) => m.tipo === "bancada").map((m) => m.modelo));
        for (const m of ms.filter((x) => x.tipo === "pia" || x.tipo === "fogao")) if (bancadas.size) expect(bancadas.has(m.base!)).toBe(true);
      }
    });

    it("casa decorada: tapetes, plantas, quadros e complementos aparecem", () => {
      const tipos = new Set(mobiliaAutomatica(plan, brief).map((m) => m.tipo));
      for (const t of ["tapete", "planta", "quadro", "coifa", "toalheiro"] as const) expect(tipos.has(t), t).toBe(true);
    });
  });
});
