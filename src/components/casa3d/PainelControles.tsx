import { motion } from "framer-motion";
import { RotateCcw, X } from "lucide-react";
import { EASE } from "../../lib/motion";
import { PREFS_PADRAO, radPorPixel, SENS_MAX, SENS_MIN, type PrefsControle, type Suavizacao } from "../../lib/three/controle";

const SUAVE: [Suavizacao, string][] = [
  ["desligada", "Desligada"],
  ["leve", "Leve"],
  ["media", "Média"],
];

const fmt = (v: number, d = 2) => v.toFixed(d).replace(".", ",");

/** Painel "Controles": sensibilidade do mouse, suavização e eixo vertical. Fica salvo neste navegador. */
export function PainelControles({ prefs, onChange, onFechar }: { prefs: PrefsControle; onChange: (p: PrefsControle) => void; onFechar: () => void }) {
  const graus = (radPorPixel("arrasto", prefs) * 1000 * 180) / Math.PI;
  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="absolute right-3 top-16 z-30 w-[min(20rem,calc(100%-1.5rem))] rounded-xl bg-bg/95 p-4 shadow-2xl backdrop-blur sm:right-5"
      aria-label="Controles da câmera"
    >
      <div className="flex items-center justify-between">
        <p className="font-display text-base font-semibold">Controles da câmera</p>
        <button
          type="button"
          onClick={onFechar}
          className="grid size-7 place-items-center rounded-md text-muted hover:bg-white/10 hover:text-ink"
          aria-label="Fechar controles"
        >
          <X className="size-4" />
        </button>
      </div>

      <label className="mt-4 block text-sm" htmlFor="sens-mouse">
        <span className="flex items-baseline justify-between">
          <span>Sensibilidade do mouse</span>
          <span className="tabular font-mono text-xs text-ink">{fmt(prefs.sensibilidade)}×</span>
        </span>
        <input
          id="sens-mouse"
          type="range"
          min={SENS_MIN}
          max={SENS_MAX}
          step={0.05}
          value={prefs.sensibilidade}
          onChange={(e) => onChange({ ...prefs, sensibilidade: Number(e.target.value) })}
          className="mt-2 w-full accent-[#C9573F]"
        />
        <span className="flex justify-between text-[11px] text-muted">
          <span>mais lenta</span>
          <span>mais rápida</span>
        </span>
      </label>
      <p className="tabular mt-1 font-mono text-[11px] text-muted">
        {fmt(radPorPixel("travado", prefs) * 1000, 2)} mrad/px · arrastar 1000 px gira {Math.round(graus)}°
      </p>

      <p className="mt-4 text-sm">Suavização</p>
      <div className="mt-1.5 flex rounded-lg border border-line p-0.5 text-sm" role="radiogroup" aria-label="Suavização da câmera">
        {SUAVE.map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={prefs.suavizacao === k}
            onClick={() => onChange({ ...prefs, suavizacao: k })}
            className={`flex-1 rounded-md px-2 py-1.5 font-medium transition-colors ${prefs.suavizacao === k ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={prefs.inverterY}
          onChange={(e) => onChange({ ...prefs, inverterY: e.target.checked })}
          className="size-4 accent-[#C9573F]"
        />
        Inverter o eixo vertical
      </label>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <p className="text-[11px] leading-snug text-muted">Vale para olhar no modo Andar e para girar a casa por fora. Fica salvo neste navegador.</p>
        <button
          type="button"
          onClick={() => onChange({ ...PREFS_PADRAO })}
          className="ml-3 inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-muted hover:bg-white/10 hover:text-ink"
        >
          <RotateCcw className="size-3.5" /> Padrão
        </button>
      </div>
    </motion.section>
  );
}
