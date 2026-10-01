import { motion } from "framer-motion";
import { CountUp } from "../components/CountUp";
import { HeroArt } from "../components/HeroArt";
import { fadeUp, stagger, transition } from "../lib/motion";
import { SITE } from "../config";

export function Hero() {
  return (
    <section id="inicio" className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-8 lg:pt-16">
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
        <motion.div initial="hidden" animate="show" variants={stagger(0.1, 0.05)}>
          <motion.p variants={fadeUp} className="eyebrow">
            Planta baixa 2D · elétrica · hidráulica
          </motion.p>
          <h1 className="mt-5 font-display text-5xl font-extrabold leading-[0.98] tracking-tight sm:text-6xl">
            {/* cada linha sobe por trás de uma máscara, como um letreiro */}
            {[["Descreva a casa."], ["O sistema calcula", true], ["a planta."]].map(([t, accent]) => (
              <span key={t as string} className="block overflow-hidden pb-1">
                <motion.span
                  className={`block ${accent ? "text-primary" : ""}`}
                  variants={{ hidden: { y: "105%" }, show: { y: 0, transition: transition(0, 0.7) } }}
                >
                  {t}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            A IA lê o seu pedido e o transforma em dados. Um algoritmo distribui os cômodos respeitando recuos, larguras mínimas e o tamanho do seu carro, e
            confere tudo antes de mostrar.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#briefing" className="inline-flex h-12 items-center rounded-lg bg-primary px-6 font-display font-semibold text-bg hover:bg-primary-2">
              Criar meu projeto
            </a>
            <a href="#como-funciona" className="inline-flex h-12 items-center rounded-lg border border-line px-5 text-sm font-medium hover:border-white/30">
              Como funciona
            </a>
          </motion.div>
          <motion.dl variants={fadeUp} className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-6">
            {[
              ["3", "opções calculadas para escolher"],
              ["7", "verificações automáticas por planta"],
              ["1:1", "móveis e carro em escala real"],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="tabular font-mono text-2xl text-ink">
                  <CountUp value={n} />
                </dt>
                <dd className="mt-1 text-xs leading-snug text-muted">{l}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>
        {SITE.heroImage ? (
          <img src={SITE.heroImage} alt={SITE.heroImageAlt} className="w-full max-w-full rounded-2xl border border-line object-cover" />
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={transition(0.35, 0.8)}>
            <HeroArt />
          </motion.div>
        )}
      </div>
    </section>
  );
}
