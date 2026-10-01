import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { HeroArt } from "../components/HeroArt";

export function Hero() {
  return (
    <section id="inicio" className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-8 lg:pt-14">
      <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary-2"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Sua ideia vira planta 2D — com medidas reais
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="mt-6 font-display text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Descreva sua casa.
            <br />
            <span className="text-gradient">A IA entende.</span>
            <br />O algoritmo desenha.
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Conte o terreno, os ambientes e o seu jeito de viver. A IA transforma o texto em dados estruturados; nosso algoritmo distribui os cômodos respeitando dimensões, recuos e até o tamanho do seu carro. E a cada ajuste seu, o sistema aprende.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#briefing"
              className="group inline-flex h-14 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-pink px-7 font-display text-lg font-semibold text-bg shadow-[0_10px_40px_-8px_rgba(255,122,61,0.7)] transition hover:-translate-y-0.5"
            >
              <Sparkles className="size-5" /> Criar meu projeto
              <ArrowRight className="size-5 transition group-hover:translate-x-1" />
            </a>
            <a href="#como-funciona" className="inline-flex h-14 items-center rounded-full border border-line px-6 text-sm font-semibold text-ink transition hover:border-white/30">
              Como funciona
            </a>
          </motion.div>
          <motion.dl initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-10 grid max-w-md grid-cols-3 gap-4">
            {[
              ["8+", "layouts testados por pedido"],
              ["1:1", "móveis em tamanho real"],
              ["∞", "aprende com seus ajustes"],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="font-display text-3xl font-bold text-ink">{n}</dt>
                <dd className="text-xs leading-snug text-muted">{l}</dd>
              </div>
            ))}
          </motion.dl>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.8 }}>
          <HeroArt />
        </motion.div>
      </div>
    </section>
  );
}
