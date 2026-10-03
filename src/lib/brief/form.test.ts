import { describe, expect, it } from "vitest";
import { areaDoTerreno, areaSugerida, DEFAULT_FORM } from "./form";

describe("tamanho automático", () => {
  it("largura × fundo dá a área do terreno", () => {
    expect(areaDoTerreno(12, 25)).toBe(300);
    expect(areaDoTerreno(10.5, 20)).toBe(210);
    expect(areaDoTerreno(NaN, 20)).toBeNull();
    expect(areaDoTerreno(0, 20)).toBeNull();
  });

  it("sugere a área da casa a partir do terreno (e bate com o padrão do formulário)", () => {
    expect(areaSugerida(DEFAULT_FORM.largura, DEFAULT_FORM.profundidade)).toBe(DEFAULT_FORM.area);
    expect(areaSugerida(10, 20)).toBe(80);
    expect(areaSugerida(5, 8)).toBe(35); // mínimo
    expect(areaSugerida(50, 80)).toBe(600); // máximo
  });
});
