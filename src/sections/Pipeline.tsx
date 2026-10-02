const STEPS = [
  ["Você descreve", "Formulário + texto livre: terreno, cômodos, carro, estilo e jeito de viver."],
  ["A IA interpreta", "Transforma o pedido em dados estruturados (JSON). Ela não desenha nada."],
  ["O algoritmo calcula", "Testa várias distribuições respeitando recuos e larguras mínimas e dá uma nota a cada uma."],
  ["Você escolhe e edita", "Compara 3 opções, escolhe uma, arrasta paredes ou pede “quero a suíte com 16 m²”."],
];

const CHECKS = [
  "Todo cômodo tem porta de acesso",
  "Larguras mínimas por tipo de cômodo",
  "Quartos e sala com janela para fora",
  "Recuos do terreno respeitados",
  "Garagem comporta o carro informado",
  "Áreas molhadas agrupadas",
  "Área construída próxima da pedida",
];

import { motion, useScroll, useSpring } from "framer-motion";
import { useRef } from "react";
import { MaskText } from "../components/MaskText";
import { Reveal, RevealItem } from "../components/Reveal";

export function Pipeline() {
  // a linha argila percorre as 4 etapas conforme elas passam pela tela
  const passos = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: passos, offset: ["start 85%", "end 45%"] });
  const linha = useSpring(scrollYProgress, { stiffness: 80, damping: 24 });

  return (
    <section id="como-funciona" className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
      <Reveal className="max-w-2xl">
        <RevealItem as="p" className="eyebrow">
          Como funciona
        </RevealItem>
        <MaskText as="h2" className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          A IA entende o pedido. A geometria decide a planta.
        </MaskText>
        <RevealItem as="p" className="mt-4 text-muted">
          Geradores de imagem inventam plantas que não fecham as contas. Aqui cada medida sai de um cálculo que pode ser conferido, e por isso a planta pode ser
          editada sem perder a coerência.
        </RevealItem>
      </Reveal>

      <div ref={passos} className="relative mt-10">
        <Reveal as="ol" each={0.22} className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([t, d], i) => (
            <RevealItem as="li" key={t} className="group bg-bg p-5 transition-colors duration-700 hover:bg-surface">
              <span className="inline-block font-mono text-xs text-primary transition-transform duration-700 group-hover:translate-x-1">0{i + 1}</span>
              <h3 className="mt-3 font-display text-lg font-semibold">{t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{d}</p>
            </RevealItem>
          ))}
        </Reveal>
        <motion.div aria-hidden className="pointer-events-none absolute inset-x-4 top-0 h-0.5 origin-left rounded-full bg-primary" style={{ scaleX: linha }} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="font-display text-xl font-semibold">O que é verificado em toda planta</h3>
          <Reveal as="ul" each={0.12} className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {CHECKS.map((c) => (
              <RevealItem as="li" key={c} className="flex gap-2">
                <span className="text-ok">✓</span>
                {c}
              </RevealItem>
            ))}
          </Reveal>
        </div>
        <div>
          <h3 className="font-display text-xl font-semibold">Aprende com o uso</h3>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Quando você aumenta a suíte, escolhe a opção “Área social” ou rejeita um layout, o sistema guarda essa preferência. As próximas plantas já começam
            com as áreas e a distribuição que você costuma aprovar, e a IA recebe essas preferências como contexto.
          </p>
        </div>
      </div>
    </section>
  );
}
