import { buildProgram } from "./layout/program";
import { generatePlans, layoutWith } from "./layout/layout";
import type { LearningState } from "./learning/engine";
import type { Brief, LayoutStrategy, Plan } from "./types";

/** Dados estruturados → algoritmo de planta → opções de planta 2D (melhor primeiro). */
export function plansFromBrief(brief: Brief, learning?: LearningState, overrides: Record<string, number> = {}): Plan[] {
  const program = buildProgram(brief, learning, overrides);
  return generatePlans(program, brief, { learning, locked: new Set(Object.keys(overrides)) });
}

/** Recalcula a planta mantendo a mesma estratégia (usado no modo editar). */
export function relayout(brief: Brief, strategy: LayoutStrategy, learning: LearningState | undefined, overrides: Record<string, number>): Plan {
  const program = buildProgram(brief, learning, overrides);
  return layoutWith(program, brief, strategy, { learning, locked: new Set(Object.keys(overrides)) });
}
