import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { DUR, EASE, fadeUp, stagger } from "../lib/motion";
import type { Studio } from "../hooks/useStudio";
import { PlanViewer } from "./PlanViewer";

const fmt = (v: number) => v.toFixed(1).replace(".", ",");

/** As 3 opções lado a lado: a pessoa compara e escolhe — a IA não decide sozinha. */
export function OptionCards({ studio }: { studio: Studio }) {
  const { result } = studio;
  if (!result) return null;
  return (
    <motion.div className="grid gap-3 sm:grid-cols-3" initial="hidden" animate="show" variants={stagger(0.1)}>
      {result.opcoes.map((o, i) => {
        const p = o.plans[0];
        const ativa = i === result.escolha;
        const area = (t: string) => p.rooms.filter((r) => r.tipo === t).reduce((s, r) => s + r.w * r.h, 0);
        return (
          <motion.article
            key={o.perfil.id}
            variants={fadeUp}
            whileHover={{ y: -3 }}
            className={`relative flex min-w-0 gap-3 rounded-xl border p-3 transition-colors sm:flex-col ${ativa ? "border-transparent bg-card" : "border-line bg-surface hover:border-white/20"}`}
          >
            {/* moldura laranja desliza até a opção escolhida */}
            {ativa && (
              <motion.span
                layoutId="opcao-ativa"
                className="pointer-events-none absolute inset-0 rounded-xl border-2 border-primary"
                transition={{ duration: DUR.base, ease: EASE }}
              />
            )}
            <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-[#141518] sm:h-32 sm:w-full">
              <PlanViewer plan={p} brief={result.brief} selectedId={null} onSelect={() => {}} editMode={false} animate={false} thumbnail />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-base font-semibold">{o.perfil.nome}</h3>
                <span className="tabular font-mono text-sm text-ink">
                  {o.notas[0]}
                  <span className="text-muted">/100</span>
                </span>
              </div>
              <p className="text-xs leading-snug text-muted">{o.perfil.resumo}</p>
              <p className="tabular font-mono text-[11px] text-muted">
                Sala {fmt(area("sala"))} m² · Suíte {fmt(area("suite"))} m² · {fmt(p.builtArea)} m²
              </p>
              <button
                type="button"
                onClick={() => studio.escolher(i)}
                disabled={ativa}
                className={`mt-auto inline-flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition ${
                  ativa ? "bg-primary text-bg" : "border border-line text-ink hover:border-primary hover:text-primary"
                }`}
              >
                {ativa ? (
                  <>
                    <Check className="size-4" /> Escolhida
                  </>
                ) : (
                  "Escolher esta"
                )}
              </button>
            </div>
          </motion.article>
        );
      })}
    </motion.div>
  );
}
