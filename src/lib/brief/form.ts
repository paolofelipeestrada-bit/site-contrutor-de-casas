import type { Style, VarandaPosicao } from "../types";

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
  descricao:
    "Quero uma sala integrada à cozinha, bastante luz natural, quartos mais reservados e uma varanda nos fundos para reunir a família.",
};
