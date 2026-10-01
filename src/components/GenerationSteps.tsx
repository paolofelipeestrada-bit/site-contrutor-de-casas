import { motion } from "framer-motion";
import { Brain, Braces, Check, LayoutGrid, PenTool, Type } from "lucide-react";
import type { Phase } from "../hooks/useStudio";

const STEPS: { phase: Phase; label: string; detail: string; icon: typeof Brain }[] = [
  { phase: "interpretando", label: "Lendo seu texto", detail: "a IA entende o que você quer", icon: Type },
  { phase: "estruturando", label: "Dados estruturados", detail: "terreno, ambientes e áreas em JSON", icon: Braces },
  { phase: "distribuindo", label: "Algoritmo de planta", detail: "testa várias distribuições e pontua", icon: LayoutGrid },
  { phase: "desenhando", label: "Desenhando", detail: "paredes, portas, janelas e móveis", icon: PenTool },
];

const ORDER: Phase[] = ["idle", "interpretando", "estruturando", "distribuindo", "desenhando", "pronto"];

export function GenerationSteps({ phase }: { phase: Phase }) {
  const current = ORDER.indexOf(phase);
  return (
    <div className="relative z-10 grid h-full place-items-center p-4">
      <div className="w-full max-w-sm">
        <div className="relative mx-auto mb-7 size-24">
          <motion.span className="absolute inset-0 rounded-full border-2 border-primary/40" animate={{ scale: [1, 1.5], opacity: [0.7, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
          <motion.span className="absolute inset-0 rounded-full border-2 border-sky/40" animate={{ scale: [1, 1.5], opacity: [0.7, 0] }} transition={{ duration: 1.6, repeat: Infinity, delay: 0.8 }} />
          <div className="absolute inset-2 grid place-items-center rounded-full bg-gradient-to-br from-primary via-pink to-grape shadow-[0_0_50px_rgba(255,122,61,0.55)]">
            <Brain className="size-9 text-bg" />
          </div>
        </div>
        <ol className="space-y-2.5">
          {STEPS.map((s, i) => {
            const idx = ORDER.indexOf(s.phase);
            const done = current > idx;
            const active = current === idx;
            const Icon = s.icon;
            return (
              <motion.li
                key={s.phase}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: done || active ? 1 : 0.4, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${active ? "border-primary/50 bg-primary/10" : "border-line bg-white/[0.02]"}`}
              >
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${done ? "bg-lime/20 text-lime" : active ? "bg-primary/20 text-primary" : "bg-white/5 text-muted"}`}>
                  {done ? <Check className="size-4" /> : <Icon className={`size-4 ${active ? "animate-pulse" : ""}`} />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{s.label}</span>
                  <span className="block truncate text-xs text-muted">{s.detail}</span>
                </span>
                {active && (
                  <span className="ml-auto flex gap-1">
                    {[0, 1, 2].map((d) => (
                      <motion.span key={d} className="size-1.5 rounded-full bg-primary" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }} />
                    ))}
                  </span>
                )}
              </motion.li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
