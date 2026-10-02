import { motion, useMotionValue, useSpring } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Botão "magnético": acompanha levemente o cursor e volta com mola ao sair.
 * força = fração da distância ao centro que o botão percorre (0,25 = um quarto).
 * Em telas de toque não faz nada além do leve afundar ao tocar.
 */
export function Magnetic({ children, forca = 0.25, className }: { children: ReactNode; forca?: number; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 180, damping: 18, mass: 0.6 });
  return (
    <motion.span
      className={`inline-flex ${className ?? ""}`}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.96 }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * forca);
        y.set((e.clientY - (r.top + r.height / 2)) * forca);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}
