import { motion } from "framer-motion";
import { EASE_DRAW } from "../lib/motion";

/**
 * Símbolo CasaAI (brand board): uma planta quadrada com a abertura de entrada embaixo
 * e o "ponto de inteligência" em argila. Geometria em módulo 128 × 128, traço 9.
 */
export const SIMBOLO_PATH = "M0 128 V0 H128 V128 H89.6 V64 H38.4 V128";

export function Symbol({ size = 32, ink = "#F4F1EA", animate = false }: { size?: number; ink?: string; animate?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="-8 -8 144 144" aria-hidden>
      <motion.path
        d={SIMBOLO_PATH}
        fill="none"
        stroke={ink}
        strokeWidth={9}
        strokeLinecap="square"
        initial={animate ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2.4, ease: EASE_DRAW }}
      />
      <motion.rect
        x={55}
        y={23}
        width={20.48}
        height={20.48}
        fill="#C9573F"
        initial={animate ? { scale: 0, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: animate ? 2.2 : 0, duration: 0.8 }}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />
    </svg>
  );
}

/** Assinatura: símbolo + "casaai" em Manrope minúscula. */
export function Logo({ size = 28, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Symbol size={size} animate={animate} />
      <span className="font-display font-medium tracking-tight text-ink" style={{ fontSize: size * 0.82 }}>
        casaai
      </span>
    </span>
  );
}
