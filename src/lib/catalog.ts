import type { RoomType, Style, Zone } from "./types";

export interface RoomInfo {
  label: string;
  zone: Zone;
  /** área-base (m²) para uma casa de referência de ~120 m² — é o "prior" que o sistema aprende */
  baseArea: number;
  minArea: number;
  maxArea: number;
  /** menor dimensão aceitável (m) */
  minWidth: number;
}

export const ROOM_INFO: Record<RoomType, RoomInfo> = {
  sala: { label: "Sala", zone: "social", baseArea: 22, minArea: 10, maxArea: 60, minWidth: 2.8 },
  cozinha: { label: "Cozinha", zone: "social", baseArea: 12, minArea: 5, maxArea: 30, minWidth: 1.8 },
  jantar: { label: "Jantar", zone: "social", baseArea: 10, minArea: 6, maxArea: 25, minWidth: 2.4 },
  quarto: { label: "Quarto", zone: "private", baseArea: 10.5, minArea: 7.5, maxArea: 20, minWidth: 2.5 },
  suite: { label: "Suíte", zone: "private", baseArea: 14, minArea: 9, maxArea: 30, minWidth: 2.8 },
  banheiro: { label: "Banho", zone: "private", baseArea: 4, minArea: 2.4, maxArea: 9, minWidth: 1.2 },
  banheiro_suite: { label: "Banho suíte", zone: "private", baseArea: 4.5, minArea: 2.6, maxArea: 10, minWidth: 1.3 },
  lavabo: { label: "Lavabo", zone: "social", baseArea: 2.2, minArea: 1.5, maxArea: 4, minWidth: 1.0 },
  closet: { label: "Closet", zone: "private", baseArea: 4, minArea: 2.5, maxArea: 10, minWidth: 1.4 },
  escritorio: { label: "Escritório", zone: "private", baseArea: 8, minArea: 5, maxArea: 16, minWidth: 2.2 },
  lavanderia: { label: "Lavanderia", zone: "service", baseArea: 5, minArea: 2.5, maxArea: 10, minWidth: 1.4 },
  garagem: { label: "Garagem", zone: "garage", baseArea: 16, minArea: 11, maxArea: 45, minWidth: 2.6 },
  varanda: { label: "Varanda", zone: "outdoor", baseArea: 12, minArea: 5, maxArea: 35, minWidth: 1.8 },
  area_gourmet: { label: "Área gourmet", zone: "outdoor", baseArea: 14, minArea: 8, maxArea: 35, minWidth: 2.6 },
  circulacao: { label: "Circulação", zone: "circulation", baseArea: 0, minArea: 0, maxArea: 999, minWidth: 0.9 },
};

export const STYLE_INFO: Record<Style, { label: string; socialBoost: number; note: string }> = {
  moderno: { label: "Moderno", socialBoost: 1.08, note: "ambientes integrados e grandes aberturas" },
  minimalista: { label: "Minimalista", socialBoost: 1.0, note: "menos paredes, áreas enxutas" },
  rustico: { label: "Rústico", socialBoost: 1.0, note: "varanda generosa e cozinha valorizada" },
  contemporaneo: { label: "Contemporâneo", socialBoost: 1.05, note: "equilíbrio entre social e íntimo" },
  classico: { label: "Clássico", socialBoost: 0.95, note: "ambientes mais compartimentados" },
};

/** Cores dos ambientes na planta: tons neutros, só o setor social leva o acento. */
export const ZONE_COLORS: Record<Zone, { fill: string; stroke: string; text: string }> = {
  social: { fill: "rgba(201,87,63,0.13)", stroke: "#C9573F", text: "#F2D3C9" },
  private: { fill: "rgba(244,241,234,0.07)", stroke: "#DDD0BC", text: "#F4F1EA" },
  service: { fill: "rgba(70,101,107,0.22)", stroke: "#46656B", text: "#DDD0BC" },
  outdoor: { fill: "rgba(169,183,165,0.10)", stroke: "#A9B7A5", text: "#DCE4D9" },
  garage: { fill: "rgba(244,241,234,0.02)", stroke: "#6B7874", text: "#C9CFCB" },
  circulation: { fill: "rgba(244,241,234,0.0)", stroke: "#4A5753", text: "#8E9A96" },
};

export const ZONE_LABELS: Record<Zone, string> = {
  social: "Social",
  private: "Íntimo",
  service: "Serviço",
  outdoor: "Externo",
  garage: "Garagem",
  circulation: "Circulação",
};
