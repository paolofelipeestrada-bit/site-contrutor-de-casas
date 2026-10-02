import { motion, useScroll, useSpring } from "framer-motion";
import { useRef } from "react";
import { MaskText } from "../components/MaskText";
import { Reveal, RevealItem } from "../components/Reveal";

const FASES: { n: number; titulo: string; texto: string; status: "Disponível" | "Prévia" | "Em breve" }[] = [
  {
    n: 1,
    titulo: "Planta 2D, edição e regeração",
    texto: "3 opções com nota, editor com desfazer, comandos em texto, modo construir do zero, verificações e explicação.",
    status: "Disponível",
  },
  {
    n: 2,
    titulo: "Elétrica",
    texto: "Pontos de luz, tomadas e circuitos pela NBR 5410 — e você pode mover, acrescentar ou trocar de circuito.",
    status: "Prévia",
  },
  { n: 3, titulo: "Hidráulica e esgoto", texto: "Água fria, caixa d'água pelo número de moradores, esgoto até a rede e lista de materiais.", status: "Prévia" },
  { n: 4, titulo: "3D navegável", texto: "Paredes extrudadas a partir da mesma planta, com aberturas e materiais.", status: "Em breve" },
  {
    n: 5,
    titulo: "Estimativa de custo",
    texto: "Custo por padrão de acabamento, divisão por etapa e materiais da elétrica e da hidráulica com preço.",
    status: "Prévia",
  },
];

const TONE = { Disponível: "border-ok/50 text-ok", Prévia: "border-primary/50 text-primary", "Em breve": "border-line text-muted" };

export function Roadmap() {
  // linha do tempo: a régua argila desce acompanhando a leitura das fases
  const lista = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: lista, offset: ["start 80%", "end 55%"] });
  const regua = useSpring(scrollYProgress, { stiffness: 80, damping: 24 });

  return (
    <section id="fases" className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
      <p className="eyebrow">Fases do produto</p>
      <MaskText as="h2" className="mt-2 font-display text-3xl font-bold sm:text-4xl">
        Da planta ao projeto completo
      </MaskText>
      <p className="mt-4 max-w-2xl text-muted">
        Cada cômodo já existe como dado (posição, medidas e função), então as camadas técnicas usam a mesma planta, sem redesenhar.
      </p>
      <div ref={lista} className="relative mt-8">
        <motion.div aria-hidden className="absolute -left-3 top-0 hidden h-full w-0.5 origin-top bg-primary sm:block" style={{ scaleY: regua }} />
        <Reveal as="ol" each={0.2} className="divide-y divide-line border-y border-line">
          {FASES.map((f) => (
            <RevealItem
              as="li"
              key={f.n}
              className="group grid gap-2 py-4 transition-[padding] duration-700 sm:grid-cols-[3rem_1fr_auto] sm:items-baseline sm:gap-6 sm:hover:pl-2"
            >
              <span className="font-mono text-sm text-muted">Fase {f.n}</span>
              <div className="min-w-0">
                <h3 className="font-display text-lg font-semibold">{f.titulo}</h3>
                <p className="text-sm text-muted">{f.texto}</p>
              </div>
              <span className={`w-fit rounded-md border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider ${TONE[f.status]}`}>{f.status}</span>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
