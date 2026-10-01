import { motion } from "framer-motion";
import { BriefForm } from "../components/BriefForm";
import { PlanStudio } from "../components/PlanStudio";
import { useStudio } from "../hooks/useStudio";

export function Studio() {
  const studio = useStudio();
  return (
    <section id="briefing" className="relative border-y border-line bg-surface/70 py-16">
      <div className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade opacity-60" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8 max-w-2xl">
          <p className="font-semibold text-primary">Seu briefing</p>
          <h2 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Vamos imaginar sua casa?</h2>
          <p className="mt-3 text-muted">Não precisa conhecer arquitetura. Preencha o básico, escreva do seu jeito e veja a planta nascer.</p>
        </motion.div>
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <BriefForm studio={studio} />
          <PlanStudio studio={studio} />
        </div>
      </div>
    </section>
  );
}
