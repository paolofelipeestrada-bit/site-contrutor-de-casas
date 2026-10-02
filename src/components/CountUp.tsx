import { animate, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { EASE } from "../lib/motion";

/** Número que conta até o valor quando aparece na tela. Texto não numérico aparece direto. */
export function CountUp({ value, duration = 1.1, delay = 0 }: { value: string; duration?: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const target = Number(value);
  const [shown, setShown] = useState(Number.isFinite(target) ? "0" : value);
  useEffect(() => {
    if (!inView || !Number.isFinite(target)) return;
    const ctrl = animate(0, target, { duration, delay, ease: EASE, onUpdate: (v) => setShown(String(Math.round(v))) });
    return () => ctrl.stop();
  }, [inView, target, duration, delay]);
  return <span ref={ref}>{shown}</span>;
}
