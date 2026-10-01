import { motion } from "framer-motion";
import { CircleAlert, CircleCheck, MessageSquareText } from "lucide-react";
import { useMemo, useState } from "react";
import { explainPlan } from "../lib/layout/layout";
import { explicarProjeto, verificacoes } from "../lib/plan/report";
import type { Studio } from "../hooks/useStudio";
import { fadeUp, stagger } from "../lib/motion";

/** Verificações automáticas + "Explique meu projeto". */
export function ProjectReport({ studio }: { studio: Studio }) {
  const { plan, result } = studio;
  const [explicar, setExplicar] = useState(false);
  const checks = useMemo(() => (plan && result ? verificacoes(plan, result.brief) : []), [plan, result]);
  const texto = useMemo(() => (plan && result ? explicarProjeto(plan, result.brief) : []), [plan, result]);
  const nota = useMemo(() => (plan && result ? explainPlan(plan, result.brief, studio.learning) : []), [plan, result, studio.learning]);
  if (!plan || !result) return null;
  const ok = checks.filter((c) => c.ok).length;

  return (
    <div id="verificacoes" className="grid gap-4 lg:grid-cols-2">
      <div className="min-w-0 rounded-xl border border-line p-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="eyebrow">Verificações automáticas</p>
          <p className="tabular font-mono text-xs text-muted">
            {ok}/{checks.length} ok
          </p>
        </div>
        <motion.ul className="mt-3 space-y-2 text-sm" initial="hidden" animate="show" variants={stagger(0.07, 0.2)}>
          {checks.map((c) => (
            <motion.li key={c.texto} variants={fadeUp} className="flex gap-2">
              {c.ok ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-ok" /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-warn" />}
              <span className={c.ok ? "text-ink" : "text-warn"}>{c.texto}</span>
            </motion.li>
          ))}
        </motion.ul>
        {nota.length > 0 && (
          <details className="mt-3 text-xs text-muted">
            <summary className="cursor-pointer select-none">Como a nota foi calculada</summary>
            <ul className="mt-2 space-y-0.5 font-mono">
              <li>100 pontos, menos:</li>
              {nota.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </details>
        )}
      </div>

      <div className="min-w-0 rounded-xl border border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="eyebrow">Explique meu projeto</p>
          {!explicar && (
            <button
              type="button"
              onClick={() => setExplicar(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-semibold hover:border-primary hover:text-primary"
            >
              <MessageSquareText className="size-3.5" /> Explicar
            </button>
          )}
        </div>
        {explicar ? (
          <motion.ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink" initial="hidden" animate="show" variants={stagger(0.12)}>
            {texto.map((t) => (
              <motion.li key={t} variants={fadeUp} className="border-l-2 border-line pl-3">
                {t}
              </motion.li>
            ))}
          </motion.ul>
        ) : (
          <p className="mt-3 text-sm text-muted">Por que cada cômodo ficou onde ficou, com as medidas calculadas desta planta.</p>
        )}
      </div>
    </div>
  );
}
