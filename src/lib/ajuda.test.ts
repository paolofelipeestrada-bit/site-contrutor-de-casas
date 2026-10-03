import { describe, expect, it } from "vitest";
import { buscarResposta, normalizar, POR_ID, RESPOSTAS, SECOES } from "./ajuda";

describe("mascote: respostas prontas", () => {
  it("toda seção aponta para perguntas que existem", () => {
    for (const s of Object.values(SECOES)) for (const id of s.perguntas) expect(POR_ID[id], id).toBeDefined();
    expect(new Set(RESPOSTAS.map((r) => r.id)).size).toBe(RESPOSTAS.length);
  });

  it("palavras-chave já estão normalizadas (sem acento, minúsculas)", () => {
    for (const r of RESPOSTAS) for (const p of r.palavras) expect(normalizar(p), `${r.id}: ${p}`).toBe(p);
  });

  it("entende perguntas digitadas do jeito de cada um", () => {
    const casos: [string, string][] = [
      ["Como faço pra começar?", "comecar"],
      ["quanto custa construir essa casa", "custo"],
      ["como eu vejo a casa em 3D?", "tresd"],
      ["dá pra mudar uma parede?", "editar"],
      ["onde ficam as tomadas", "eletrica"],
      ["e o esgoto?", "hidraulica"],
      ["preciso de um engenheiro?", "arquiteto"],
      ["os móveis aparecem sozinhos?", "moveis"],
      ["quero desenhar do zero", "zero"],
    ];
    for (const [pergunta, id] of casos) expect(buscarResposta(pergunta)?.resposta.id, pergunta).toBe(id);
  });

  it("não inventa resposta para o que não sabe", () => {
    expect(buscarResposta("qual a capital da França")).toBeNull();
    expect(buscarResposta("via láctea")).toBeNull(); // "ia" dentro de outra palavra não conta
  });
});
