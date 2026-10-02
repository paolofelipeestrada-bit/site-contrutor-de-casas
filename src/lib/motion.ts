import type { Transition, Variants } from "framer-motion";

/**
 * Sistema de animação do CasaAI — todos os tempos e curvas ficam aqui.
 * Regra: movimento lento e contínuo (como o desenho do topo), curto (até 28 px), curva "desacelerando" e uma ordem clara
 * (estrutura → conteúdo → detalhes), como alguém desenhando na prancheta.
 */
export const EASE = [0.22, 1, 0.36, 1] as const; // saída suave
export const EASE_DRAW = [0.65, 0, 0.35, 1] as const; // traço de caneta

export const DUR = {
  rapido: 0.35,
  base: 0.9,
  lento: 1.4,
  traco: 1.6, // uma parede sendo desenhada
};

/** Atraso entre itens de uma sequência (cômodos, cards, linhas de tabela). */
export const STAGGER = { curto: 0.08, base: 0.16, longo: 0.28 };

/** Ordem do desenho da planta (segundos a partir do início). */
export const PLANTA = {
  contorno: 0,
  paredes: 0.4,
  pisos: 1.6,
  rotulos: 2.2,
  aberturas: 2.7,
  moveis: 3.2,
};

export const transition = (delay = 0, duration = DUR.base): Transition => ({ duration, delay, ease: EASE });

/** Entrada padrão de blocos: sobe 12 px e aparece. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
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
  transition: { delay, duration: 0.6, ease: EASE },
});

/** Rolagem suave (Lenis): quanto maior "lerp", mais rápido a página alcança a roda do mouse. */
export const ROLAGEM = { lerp: 0.085, wheelMultiplier: 0.9, offsetAncora: -72 };

/** Profundidade ao rolar (px que cada camada desloca enquanto a seção passa pela tela). */
export const PARALLAX = { texto: -90, arte: 70, foto: 48 };

/**
 * Abertura: o símbolo se desenha e a cortina sobe. Só aparece na primeira visita da sessão
 * e nunca para quem pediu menos movimento. Quando não aparece, INTRO vale 0 e nada atrasa.
 */
export const INTRO_DUR = { traco: 1.3, cortina: 1.0 };

function deveMostrarIntro(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    if (sessionStorage.getItem("casaai-intro")) return false;
    sessionStorage.setItem("casaai-intro", "1");
  } catch {
    // sem armazenamento (aba privada): mostra a abertura mesmo assim
  }
  return true;
}

export const INTRO_ATIVA = deveMostrarIntro();
/** Atraso (s) para as animações do topo começarem quando a cortina já está subindo. */
export const INTRO = INTRO_ATIVA ? INTRO_DUR.traco + 0.35 : 0;
