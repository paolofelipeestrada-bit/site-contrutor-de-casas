import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { DUR, EASE } from "../lib/motion";
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
      <div className="w-full max-w-sm">
        <div
          className="mb-6 h-1 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={STEPS.length}
          aria-valuenow={Math.max(0, current - 1)}
        >
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(Math.max(0, current - 0.5) / STEPS.length) * 100}%` }}
            transition={{ duration: DUR.lento, ease: EASE }}
          />
        </div>
        <ol className="space-y-3">
          {STEPS.map((s) => {
            const idx = ORDER.indexOf(s.phase);
            const done = current > idx;
            const active = current === idx;
            return (
              <motion.li
                key={s.phase}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: done || active ? 1 : 0.4, x: 0 }}
                transition={{ duration: DUR.base, ease: EASE }}
                className="flex items-center gap-3"
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full border text-xs ${done ? "border-ok text-ok" : active ? "border-primary text-primary" : "border-line text-muted"}`}
                >
                  {done ? <Check className="size-3.5" /> : active ? <span className="size-2 animate-pulse rounded-full bg-primary" /> : null}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{s.label}</span>
                  <span className="block text-xs text-muted">{s.detail}</span>
                </span>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
