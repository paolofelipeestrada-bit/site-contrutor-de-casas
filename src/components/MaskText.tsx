import { motion } from "framer-motion";
import { DUR, EASE } from "../lib/motion";

type Tag = "h1" | "h2" | "h3" | "p";

/**
 * Texto que sobe palavra por palavra por trás de uma máscara quando entra na tela — o mesmo gesto do título do topo.
 * Use no lugar de um título comum: <MaskText as="h2" className="...">Frase do título</MaskText>
 */
export function MaskText({
  children,
  as = "h2",
  className,
  delay = 0,
  each = 0.06,
}: {
  children: string;
  as?: Tag;
  className?: string;
  delay?: number;
  each?: number;
}) {
  const Comp = motion[as];
  const palavras = children.split(" ");
  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: each, delayChildren: delay } } }}
      aria-label={children}
    >
      {palavras.map((p, i) => (
        // pb/-mb: a máscara não corta acentos e letras com perna (g, p, ç)
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.12em] align-top -mb-[0.12em]">
          <motion.span className="inline-block" variants={{ hidden: { y: "105%" }, show: { y: 0, transition: { duration: DUR.lento, ease: EASE } } }}>
            {p}
            {i < palavras.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </Comp>
  );
}
