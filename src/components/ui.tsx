import { motion } from "framer-motion";
import { Check, Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";

export function NumberField({
  id,
  label,
  value,
  unit,
  min,
  step = 1,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  unit: string;
  min: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label htmlFor={id} className="block min-w-0">
      <span className="text-xs font-medium text-muted">{label}</span>
      <span className="relative mt-1.5 block">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-11 w-full rounded-xl border border-line bg-bg/70 pl-3 pr-9 font-mono text-sm text-ink outline-none transition focus:border-primary/70 focus:ring-2 focus:ring-primary/25"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{unit}</span>
      </span>
    </label>
  );
}

export function Stepper({ label, value, min = 0, max = 8, onChange }: { label: string; value: number; min?: number; max?: number; onChange: (v: number) => void }) {
  return (
    <div className="rounded-2xl border border-line bg-bg/50 p-3">
      <p className="text-xs font-medium text-muted">{label}</p>
      <div className="mt-1.5 flex items-center justify-between">
        <button
          type="button"
          aria-label={`Diminuir ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-white/5 hover:text-ink disabled:opacity-30"
          disabled={value <= min}
        >
          <Minus className="size-4" />
        </button>
        <motion.span key={value} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-2xl font-bold">
          {value}
        </motion.span>
        <button
          type="button"
          aria-label={`Aumentar ${label}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-white/5 hover:text-ink disabled:opacity-30"
          disabled={value >= max}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function Chip({ active, onClick, children, color = "primary" }: { active: boolean; onClick: () => void; children: ReactNode; color?: "primary" | "sky" | "grape" | "lime" }) {
  const on: Record<string, string> = {
    primary: "border-primary/60 bg-primary/15 text-primary-2",
    sky: "border-sky/60 bg-sky/15 text-sky",
    grape: "border-grape/60 bg-grape/15 text-grape",
    lime: "border-lime/60 bg-lime/15 text-lime",
  };
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition ${
        active ? on[color] : "border-line bg-white/[0.02] text-muted hover:border-white/20 hover:text-ink"
      }`}
    >
      {active && <Check className="size-3.5" />}
      {children}
    </motion.button>
  );
}

export function StepTitle({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-primary to-pink font-display font-bold text-bg shadow-[0_0_24px_rgba(255,122,61,0.35)]">{n}</span>
      <h3 className="font-display text-lg font-semibold">{children}</h3>
    </div>
  );
}

export function Badge({ children, tone = "grape" }: { children: ReactNode; tone?: "grape" | "sky" | "lime" | "primary" | "sun" }) {
  const tones: Record<string, string> = {
    grape: "bg-grape/15 text-grape border-grape/30",
    sky: "bg-sky/15 text-sky border-sky/30",
    lime: "bg-lime/15 text-lime border-lime/30",
    primary: "bg-primary/15 text-primary-2 border-primary/30",
    sun: "bg-sun/15 text-sun border-sun/30",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${tones[tone]}`}>{children}</span>;
}
