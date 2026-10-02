import { describe, expect, it } from "vitest";
import { CONTROLE, girar, PREFS_PADRAO, radPorPixel, suavizar } from "./controle";

const graus = (rad: number) => (rad * 180) / Math.PI;

describe("controle da câmera (modo andar)", () => {
  it("sensibilidade central de 0,0025 e um pouco maior que a anterior", () => {
    expect(CONTROLE.mouseSensitivity).toBe(0.0025);
    expect(radPorPixel("travado")).toBeGreaterThan(0.0022); // antes: 0,0022 com cursor travado
    expect(radPorPixel("arrasto")).toBeGreaterThan(0.0035); // antes: 0,0035 arrastando
    expect(radPorPixel("toque")).toBeGreaterThan(0.0055); // antes: 0,0055 no dedo
  });

  it("não fica exagerada: atravessar uma tela de notebook gira entre 180° e 330°, e 1 px gira menos de 0,25°", () => {
    for (const fonte of ["travado", "arrasto"] as const) {
      const volta = graus(radPorPixel(fonte) * 1366);
      expect(volta).toBeGreaterThan(180);
      expect(volta).toBeLessThan(330);
      expect(graus(radPorPixel(fonte))).toBeLessThan(0.25);
    }
    // no celular, arrastar a largura da tela (390 px) gira ~134°: dá para olhar para trás com dois gestos
    expect(graus(radPorPixel("toque") * 390)).toBeGreaterThan(90);
    expect(graus(radPorPixel("toque") * 390)).toBeLessThan(180);
  });

  it("olhar para cima/baixo tem limite (nunca vira de cabeça para baixo)", () => {
    let o = { yaw: 0, pitch: 0 };
    for (let i = 0; i < 100; i++) o = girar(o, 0, -100, "travado");
    expect(o.pitch).toBeCloseTo(CONTROLE.limiteVertical);
    for (let i = 0; i < 200; i++) o = girar(o, 0, 100, "travado");
    expect(o.pitch).toBeCloseTo(-CONTROLE.limiteVertical);
    expect(CONTROLE.limiteVertical).toBeLessThan(Math.PI / 2);
  });

  it("descarta saltos bruscos do mouse", () => {
    const o = girar({ yaw: 0, pitch: 0 }, 5000, 0, "travado");
    expect(Math.abs(o.yaw)).toBeCloseTo(CONTROLE.maxDeltaPx * CONTROLE.mouseSensitivity);
  });

  it("preferências: sensibilidade multiplica e inverter vertical troca o sentido", () => {
    const a = girar({ yaw: 0, pitch: 0 }, 10, 10, "travado", { ...PREFS_PADRAO, sensibilidade: 2 });
    expect(a.yaw).toBeCloseTo(-20 * CONTROLE.mouseSensitivity);
    const b = girar({ yaw: 0, pitch: 0 }, 0, 10, "travado", { ...PREFS_PADRAO, inverterY: true });
    expect(b.pitch).toBeGreaterThan(0);
  });

  it("suavização leve: segue o mouse sem atraso perceptível (≥ 90% em 100 ms) e independe dos FPS", () => {
    const alvo = { yaw: 1, pitch: 0.5 };
    let o = { yaw: 0, pitch: 0 };
    for (let i = 0; i < 6; i++) o = suavizar(o, alvo, 1 / 60); // 100 ms a 60 fps
    expect(o.yaw).toBeGreaterThan(0.9);
    let p = { yaw: 0, pitch: 0 };
    for (let i = 0; i < 3; i++) p = suavizar(p, alvo, 1 / 30); // 100 ms a 30 fps
    expect(Math.abs(p.yaw - o.yaw)).toBeLessThan(0.01);
    // um único quadro já anda mais de um terço: não "arrasta"
    expect(suavizar({ yaw: 0, pitch: 0 }, alvo, 1 / 60).yaw).toBeGreaterThan(0.35);
    expect(suavizar({ yaw: 0, pitch: 0 }, alvo, 1 / 60, { ...PREFS_PADRAO, suavizacao: "desligada" }).yaw).toBe(1);
  });
});
