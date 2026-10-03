import type { Norte, Style, VarandaPosicao } from "../types";

/** Valores do formulário guiado (o briefing "clicável"). */
export interface FormValues {
  largura: number;
  profundidade: number;
  area: number;
  quartos: number;
  suites: number;
  banheiros: number;
  extras: {
    garagem: boolean;
    escritorio: boolean;
    varanda: boolean;
    lavanderia: boolean;
    lavabo: boolean;
    areaGourmet: boolean;
    closet: boolean;
  };
  varandaPosicao: VarandaPosicao;
  estilo: Style;
  carro: { comprimento: number; largura: number; vagas: number };
  descricao: string;
  /** Opções avançadas: null = regra automática */
  avancado: {
    recuoFrente: number | null;
    recuoFundos: number | null;
    recuoLaterais: number | null;
    norte: Norte | null;
    moradores: number;
    acessivel: boolean;
  };
}

export const DEFAULT_FORM: FormValues = {
  largura: 12,
  profundidade: 25,
  area: 120,
  quartos: 3,
  suites: 1,
  banheiros: 2,
  extras: {
    garagem: true,
    escritorio: false,
    varanda: true,
    lavanderia: true,
    lavabo: false,
    areaGourmet: false,
    closet: false,
  },
  varandaPosicao: "fundos",
  estilo: "moderno",
  carro: { comprimento: 4.5, largura: 1.8, vagas: 1 },
  avancado: { recuoFrente: null, recuoFundos: null, recuoLaterais: null, norte: null, moradores: 4, acessivel: false },
  descricao:
    "Quero uma sala integrada à cozinha, bastante luz natural, quartos mais reservados e uma varanda nos fundos para reunir a família.",
};

/**
 * Tamanho automático: largura × fundo dá a área do terreno, e a área da casa é sugerida
 * como uma fração dela (recuos, quintal e garagem descoberta ocupam o resto).
 * 0,4 → terreno de 12 × 25 m (300 m²) sugere uma casa de 120 m².
 */
export const OCUPACAO_SUGERIDA = 0.4;

export function areaDoTerreno(largura: number, profundidade: number): number | null {
  return Number.isFinite(largura) && Number.isFinite(profundidade) && largura > 0 && profundidade > 0 ? Math.round(largura * profundidade * 10) / 10 : null;
}

export function areaSugerida(largura: number, profundidade: number): number | null {
  const t = areaDoTerreno(largura, profundidade);
  return t === null ? null : Math.min(600, Math.max(35, Math.round(t * OCUPACAO_SUGERIDA)));
}
