import { Check, Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";

/** Componentes básicos de formulário. Estilo único: borda fina, sem sombras nem degradês. */

export function NumberField({
  id,
  label,
  value,
  unit,
  min,
  step = 1,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: number | null;
  unit: string;
  min: number;
  step?: number;
  placeholder?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label htmlFor={id} className="block min-w-0">
      <span className="text-xs text-muted">{label}</span>
      <span className="relative mt-1 block">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          placeholder={placeholder}
          value={value === null || !Number.isFinite(value) ? "" : value}
          onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
          className="tabular h-10 w-full rounded-lg border border-line bg-bg pl-3 pr-9 font-mono text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-primary"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{unit}</span>
      </span>
    </label>
  );
}

export function Stepper({ label, value, min = 0, max = 8, onChange }: { label: string; value: number; min?: number; max?: number; onChange: (v: number) => void }) {
  const btn = "grid size-8 place-items-center rounded-md text-muted transition hover:bg-white/5 hover:text-ink disabled:opacity-30";
  return (
    <div className="rounded-lg border border-line p-2.5">
      <p className="text-xs text-muted">{label}</p>
      <div className="mt-1 flex items-center justify-between">
        <button type="button" aria-label={`Diminuir ${label}`} onClick={() => onChange(Math.max(min, value - 1))} className={btn} disabled={value <= min}>
          <Minus className="size-4" />
        </button>
        <span className="tabular font-mono text-xl">{value}</span>
        <button type="button" aria-label={`Aumentar ${label}`} onClick={() => onChange(Math.min(max, value + 1))} className={btn} disabled={value >= max}>
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition ${
        active ? "border-ink bg-ink text-bg" : "border-line text-muted hover:border-white/25 hover:text-ink"
      }`}
    >
      {active && <Check className="size-3.5" />}
      {children}
    </button>
  );
}

export function StepTitle({ n, children }: { n: number; children: ReactNode }) {
  return (
    <h3 className="flex items-baseline gap-2.5 font-display text-base font-semibold">
      <span className="font-mono text-xs text-primary">0{n}</span>
      {children}
    </h3>
  );
}
