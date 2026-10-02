import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { EASE, EASE_DRAW, INTRO_ATIVA, INTRO_DUR } from "../lib/motion";
import { SIMBOLO_PATH } from "./Logo";

/** Abertura: o símbolo da casa é desenhado no centro e a cortina sobe revelando o site. */
export function Intro() {
  const [visivel, setVisivel] = useState(INTRO_ATIVA);
  useEffect(() => {
    if (!visivel) return;
    const t = setTimeout(() => setVisivel(false), INTRO_DUR.traco * 1000 + 250);
    return () => clearTimeout(t);
  }, [visivel]);

  return (
    <AnimatePresence>
      {visivel && (
        <motion.div
          key="intro"
          aria-hidden
          className="fixed inset-0 z-[100] grid place-items-center bg-bg"
          exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
          initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
          transition={{ duration: INTRO_DUR.cortina, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.svg
            width={84}
            height={84}
            viewBox="-8 -8 144 144"
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: INTRO_DUR.cortina * 0.7, ease: EASE }}
          >
            <motion.path
              d={SIMBOLO_PATH}
              fill="none"
              stroke="#F4F1EA"
              strokeWidth={9}
              strokeLinecap="square"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: INTRO_DUR.traco * 0.85, ease: EASE_DRAW }}
            />
            <motion.rect
              x={55}
              y={23}
              width={20.48}
              height={20.48}
              fill="#C9573F"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: INTRO_DUR.traco * 0.75, duration: 0.5, ease: EASE }}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
