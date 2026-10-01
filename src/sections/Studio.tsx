import { Reveal, RevealItem } from "../components/Reveal";
import { BriefForm } from "../components/BriefForm";
import { PlanStudio } from "../components/PlanStudio";
import { useStudio } from "../hooks/useStudio";

export function Studio() {
  const studio = useStudio();
  return (
    <section id="briefing" className="border-y border-line bg-surface/40 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <Reveal className="mb-8 max-w-2xl">
          <RevealItem as="p" className="eyebrow">
            Briefing
          </RevealItem>
          <RevealItem as="h2" className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            Conte como é a casa
          </RevealItem>
          <RevealItem as="p" className="mt-3 text-muted">
            Preencha o básico e escreva do seu jeito. Você recebe 3 opções calculadas para comparar, escolher e editar.
          </RevealItem>
        </Reveal>
        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          <BriefForm studio={studio} />
          <PlanStudio studio={studio} />
        </div>
      </div>
    </section>
  );
}
