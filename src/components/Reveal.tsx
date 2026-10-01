import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp, stagger } from "../lib/motion";

/** Revela o conteúdo quando entra na tela (uma vez). Filhos com <RevealItem> entram em sequência. */
export function Reveal({ children, className, as = "div", each }: { children: ReactNode; className?: string; as?: "div" | "ol" | "ul" | "section"; each?: number }) {
  const Comp = motion[as];
  return (
    <Comp className={className} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger(each)}>
      {children}
    </Comp>
  );
}

export function RevealItem({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "li" | "p" | "h2" | "h3" }) {
  const Comp = motion[as];
  return (
    <Comp className={className} variants={fadeUp}>
      {children}
    </Comp>
  );
}
