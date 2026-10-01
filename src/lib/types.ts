import type { SplitHandle } from "./layout/slicing";

// Tipos centrais do pipeline:
// Texto → IA → Brief (dados estruturados) → Programa (cômodos com áreas) → Layout (retângulos) → Planta 2D

export const ROOM_TYPES = [
  "sala",
  "cozinha",
  "jantar",
  "quarto",
  "suite",
  "banheiro",
  "banheiro_suite",
  "lavabo",
  "closet",
  "escritorio",
  "lavanderia",
  "garagem",
  "varanda",
  "area_gourmet",
  "circulacao",
] as const;

export type RoomType = (typeof ROOM_TYPES)[number];

export type Zone = "social" | "private" | "service" | "outdoor" | "garage" | "circulation";

export const STYLES = ["moderno", "minimalista", "rustico", "contemporaneo", "classico"] as const;
export type Style = (typeof STYLES)[number];

export type VarandaPosicao = "frente" | "fundos" | "lateral";

/** Para que lado fica o norte, olhando a planta com a rua embaixo. */
export type Norte = "frente" | "fundos" | "esquerda" | "direita";

/** Opções avançadas do briefing (todas opcionais; vazio = regra automática). */
export interface Regras {
  recuos?: { frente?: number; fundos?: number; laterais?: number };
  norte?: Norte;
  moradores?: number;
  /** corredores de 1,20 m e portas de 0,90 m */
  acessivel?: boolean;
}

/** Saída da etapa de interpretação (IA ou parser local). É o "contrato" do sistema. */
export interface Brief {
  terreno: { largura: number; profundidade: number };
  casa: { area: number };
  estilo: Style;
  ambientes: { tipo: RoomType; area?: number | null; nome?: string | null }[];
  preferencias: {
    salaCozinhaIntegradas: boolean;
    varandaPosicao: VarandaPosicao;
    quartosReservados: boolean;
    luzNatural: boolean;
  };
  carro: { comprimento: number; largura: number; vagas: number } | null;
  observacoes: string[];
  regras?: Regras;
}

/** Um cômodo do programa de necessidades, já com área-alvo definida. */
export interface RoomSpec {
  id: string;
  tipo: RoomType;
  nome: string;
  zone: Zone;
  area: number;
  minWidth: number;
  /** id do cômodo ao qual este deve ficar colado (ex.: banheiro da suíte → suíte). */
  attachTo?: string;
  /** dimensões fixas (ex.: garagem calculada pelo carro). */
  fixed?: { w: number; h: number };
}

export interface Program {
  rooms: RoomSpec[];
  houseArea: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Side = "top" | "bottom" | "left" | "right";

export interface Opening {
  kind: "door" | "window" | "garage_door" | "passage" | "slide" | "entrance";
  /** pontos do segmento na parede (em metros) */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** cômodos ligados pela abertura (1 = parede externa) */
  rooms: string[];
  /** cômodo para dentro do qual a porta abre (para desenhar o arco) */
  swingInto?: string;
}

export interface PlacedRoom extends Rect {
  id: string;
  tipo: RoomType;
  nome: string;
  zone: Zone;
  targetArea: number;
  /** grupo de empilhamento (coluna ou faixa) — usado para arrastar paredes. */
  group: string;
  /** direção do empilhamento dentro do grupo */
  axis: "x" | "y";
  exterior: Side[];
}

export interface LayoutStrategy {
  kind: "faixas" | "lateral";
  mirror: boolean;
  /** variação dentro da estratégia (ex.: cozinha na frente ou nos fundos) */
  variant: 0 | 1 | 2;
  /** largura usada da área edificável (m) */
  width: number;
}

export interface Plan {
  lot: { width: number; depth: number };
  footprint: Rect;
  setbacks: { front: number; back: number; left: number; right: number };
  rooms: PlacedRoom[];
  openings: Opening[];
  strategy: LayoutStrategy;
  score: number;
  issues: string[];
  builtArea: number;
  handles: SplitHandle[];
}
