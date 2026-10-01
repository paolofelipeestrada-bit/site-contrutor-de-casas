import { BriefForm } from "../components/BriefForm";
import { PlanStudio } from "../components/PlanStudio";
import { useStudio } from "../hooks/useStudio";

export function Studio() {
  const studio = useStudio();
  return (
    <section id="briefing" className="border-y border-line bg-surface/40 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="eyebrow">Briefing</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Conte como é a casa</h2>
          <p className="mt-3 text-muted">Preencha o básico e escreva do seu jeito. Você recebe 3 opções calculadas para comparar, escolher e editar.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          <BriefForm studio={studio} />
          <PlanStudio studio={studio} />
        </div>
      </div>
    </section>
  );
}
