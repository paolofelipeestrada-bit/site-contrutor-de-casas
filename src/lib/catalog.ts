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

export const ZONE_COLORS: Record<Zone, { fill: string; stroke: string; text: string }> = {
  social: { fill: "rgba(255,122,61,0.16)", stroke: "#ff7a3d", text: "#ffd2bd" },
  private: { fill: "rgba(167,139,250,0.17)", stroke: "#a78bfa", text: "#ddd3ff" },
  service: { fill: "rgba(56,189,248,0.16)", stroke: "#38bdf8", text: "#c4ecff" },
  outdoor: { fill: "rgba(163,230,53,0.13)", stroke: "#a3e635", text: "#e3f8c0" },
  garage: { fill: "rgba(148,163,184,0.12)", stroke: "#94a3b8", text: "#dbe3ee" },
  circulation: { fill: "rgba(255,255,255,0.035)", stroke: "#475569", text: "#94a3b8" },
};

export const ZONE_LABELS: Record<Zone, string> = {
  social: "Social",
  private: "Íntimo",
  service: "Serviço",
  outdoor: "Externo",
  garage: "Garagem",
  circulation: "Circulação",
};
