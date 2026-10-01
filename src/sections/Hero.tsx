import { motion } from "framer-motion";
import { CountUp } from "../components/CountUp";
import { HeroArt } from "../components/HeroArt";
import { SITE } from "../config";
import { fadeUp, stagger, transition } from "../lib/motion";

const LINHAS: [string, boolean][] = [
  ["A casa começa", false],
  ["com uma ideia", false],
  ["clara.", true],
];

export function Hero() {
  return (
    <section id="inicio" className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-8 lg:pt-20">
      <div className="grid items-center gap-14 lg:grid-cols-[1fr_1fr]">
        <motion.div initial="hidden" animate="show" variants={stagger(0.22, 0.3)}>
          <motion.p variants={fadeUp} className="eyebrow">
            Arquitetura residencial com IA
          </motion.p>
          <h1 className="mt-6 font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">
            {/* cada linha sobe por trás de uma máscara, devagar, como um letreiro */}
            {LINHAS.map(([t, accent]) => (
              <span key={t} className="block overflow-hidden pb-2">
                <motion.span className={`block ${accent ? "text-primary" : ""}`} variants={{ hidden: { y: "110%" }, show: { y: 0, transition: transition(0, 1.4) } }}>
                  {t}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p variants={fadeUp} className="mt-7 max-w-xl text-lg leading-relaxed text-muted">
            casaai transforma necessidades reais em plantas residenciais inteligentes, legíveis e prontas para evoluir com cada família.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-3">
            <a href="#briefing" className="inline-flex h-12 items-center rounded-lg bg-primary px-6 font-display font-semibold text-ink transition-colors hover:bg-primary-2">
              Planeje com clareza →
            </a>
            <a href="#construir" className="inline-flex h-12 items-center rounded-lg border border-line px-5 text-sm font-medium transition-colors hover:border-ink/40">
              Construir do zero
            </a>
          </motion.div>
          <motion.dl variants={fadeUp} className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-6">
            {[
              ["3", "opções calculadas para escolher"],
              ["7", "verificações automáticas por planta"],
              ["4", "camadas: planta, elétrica, água e custo"],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="tabular font-display text-3xl font-semibold text-ink">
                  <CountUp value={n} duration={2.2} />
                </dt>
                <dd className="mt-1 text-xs leading-snug text-muted">{l}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={transition(0.8, 1.6)}>
          {SITE.heroImage ? <img src={SITE.heroImage} alt={SITE.heroImageAlt} className="w-full max-w-full rounded-2xl border border-line object-cover" /> : <HeroArt />}
        </motion.div>
      </div>
    </section>
  );
}
