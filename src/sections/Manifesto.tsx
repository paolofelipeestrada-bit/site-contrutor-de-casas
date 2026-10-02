import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { MaskText } from "../components/MaskText";
import { Reveal, RevealItem } from "../components/Reveal";
import { EASE, PARALLAX } from "../lib/motion";

/** Princípios da marca (brand board) + fotografia "Matéria + gesto". */
const PRINCIPIOS = [
  ["01", "Precisão acolhedora", "Geometria técnica equilibrada por tons naturais, linguagem direta e bastante respiro."],
  ["02", "Tecnologia invisível", "A IA aparece no resultado e na fluidez da experiência, nunca como espetáculo visual."],
  ["03", "Casa possível", "Reduzimos a complexidade para aproximar as decisões de projeto da vida cotidiana."],
];

export function Manifesto() {
  // a foto desliza mais devagar que a página dentro da moldura (janela para a maquete)
  const fig = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: fig, offset: ["start end", "end start"] });
  const yFoto = useTransform(scrollYProgress, [0, 1], [-PARALLAX.foto, PARALLAX.foto]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        {/* a figura inteira dispara a animação: a foto revela de baixo para cima e desacelera um leve zoom */}
        <motion.figure
          ref={fig}
          className="relative overflow-hidden rounded-2xl border border-line"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div
            className="overflow-hidden"
            variants={{ hidden: { clipPath: "inset(100% 0% 0% 0%)" }, show: { clipPath: "inset(0% 0% 0% 0%)", transition: { duration: 1.8, ease: EASE } } }}
          >
            <motion.img
              src="/images/oficina-maquete.jpg"
              alt="Mãos de um arquiteto ajustando a maquete de uma casa térrea com pátio, numa mesa iluminada por luz natural"
              className="aspect-[5/4] w-full max-w-full object-cover"
              style={{ y: yFoto }}
              // escala final > 1 para sobrar foto enquanto ela desliza (sem bordas vazias)
              variants={{ hidden: { scale: 1.3 }, show: { scale: 1.16, transition: { duration: 3.2, ease: EASE } } }}
            />
          </motion.div>
          <figcaption className="flex justify-between border-t border-line bg-surface px-4 py-3 font-mono text-[11px] text-muted">
            <span>Matéria + gesto</span>
            <span>Luz natural, escala humana, arquitetura habitada.</span>
          </figcaption>
        </motion.figure>
        <Reveal each={0.25}>
          <RevealItem as="p" className="eyebrow">
            Ideias que viram espaço
          </RevealItem>
          <MaskText as="h2" className="mt-3 font-display text-4xl font-medium leading-tight sm:text-5xl">
            Uma planta boa começa pela sua rotina.
          </MaskText>
          <div className="mt-10 space-y-7">
            {PRINCIPIOS.map(([n, t, d]) => (
              <RevealItem key={n} className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-line pt-5">
                <span className="font-mono text-xs text-primary">{n}</span>
                <span>
                  <span className="block font-display text-xl font-medium">{t}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted">{d}</span>
                </span>
              </RevealItem>
            ))}
          </div>
          <RevealItem as="p" className="mt-10 font-display text-2xl leading-snug">
            <span className="text-primary">“</span>Menos dúvida. Mais espaço para decidir bem.
          </RevealItem>
        </Reveal>
      </div>
    </section>
  );
}
