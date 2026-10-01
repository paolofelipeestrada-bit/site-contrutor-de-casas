import type { Transition, Variants } from "framer-motion";

/**
 * Sistema de animação do CasaAI — todos os tempos e curvas ficam aqui.
 * Regra: movimento curto (8–16 px), curva "desacelerando" e uma ordem clara
 * (estrutura → conteúdo → detalhes), como alguém desenhando na prancheta.
 */
export const EASE = [0.22, 1, 0.36, 1] as const; // saída suave
export const EASE_DRAW = [0.65, 0, 0.35, 1] as const; // traço de caneta

export const DUR = {
  rapido: 0.2,
  base: 0.45,
  lento: 0.8,
  traco: 0.9, // uma parede sendo desenhada
};

/** Atraso entre itens de uma sequência (cômodos, cards, linhas de tabela). */
export const STAGGER = { curto: 0.04, base: 0.08, longo: 0.14 };

/** Ordem do desenho da planta (segundos a partir do início). */
export const PLANTA = {
  contorno: 0,
  paredes: 0.15,
  pisos: 0.75,
  rotulos: 1.0,
  aberturas: 1.25,
  moveis: 1.45,
};

export const transition = (delay = 0, duration = DUR.base): Transition => ({ duration, delay, ease: EASE });

/** Entrada padrão de blocos: sobe 12 px e aparece. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: transition() },
};

/** Container que revela os filhos em sequência. */
export const stagger = (each = STAGGER.base, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: each, delayChildren } },
});

/** Ponto técnico (tomada, aparelho, caixa) surgindo no lugar. */
export const pop = (delay: number): { initial: object; animate: object; transition: Transition } => ({
  initial: { opacity: 0, scale: 0.4 },
  animate: { opacity: 1, scale: 1 },
  transition: { delay, duration: 0.3, ease: EASE },
});
