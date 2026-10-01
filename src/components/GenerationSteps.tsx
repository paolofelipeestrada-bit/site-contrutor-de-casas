import { Check } from "lucide-react";
import type { Phase } from "../hooks/useStudio";

const STEPS: { phase: Phase; label: string; detail: string }[] = [
  { phase: "interpretando", label: "Lendo o pedido", detail: "texto e formulário viram dados" },
  { phase: "estruturando", label: "Montando o programa", detail: "cômodos, áreas-alvo e medidas mínimas" },
  { phase: "distribuindo", label: "Calculando opções", detail: "várias distribuições, cada uma com nota" },
  { phase: "desenhando", label: "Desenhando", detail: "paredes, portas, janelas e cotas" },
];
const ORDER: Phase[] = ["idle", "interpretando", "estruturando", "distribuindo", "desenhando", "pronto"];

export function GenerationSteps({ phase }: { phase: Phase }) {
  const current = ORDER.indexOf(phase);
  return (
    <div className="grid h-full place-items-center p-6">
      <ol className="w-full max-w-sm space-y-3">
        {STEPS.map((s) => {
          const idx = ORDER.indexOf(s.phase);
          const done = current > idx;
          const active = current === idx;
          return (
            <li key={s.phase} className={`flex items-center gap-3 ${done || active ? "" : "opacity-40"}`}>
              <span className={`grid size-7 shrink-0 place-items-center rounded-full border text-xs ${done ? "border-ok text-ok" : active ? "border-primary text-primary" : "border-line text-muted"}`}>
                {done ? <Check className="size-3.5" /> : active ? <span className="size-2 animate-pulse rounded-full bg-primary" /> : null}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{s.label}</span>
                <span className="block text-xs text-muted">{s.detail}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
