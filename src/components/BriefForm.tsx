import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { STYLE_INFO } from "../lib/catalog";
import type { FormValues } from "../lib/brief/form";
import { STYLES } from "../lib/types";
import type { Studio } from "../hooks/useStudio";
import { Chip, NumberField, StepTitle, Stepper } from "./ui";

const EXTRAS: { key: keyof FormValues["extras"]; label: string }[] = [
  { key: "garagem", label: "Garagem" },
  { key: "varanda", label: "Varanda" },
  { key: "lavanderia", label: "Lavanderia" },
  { key: "escritorio", label: "Escritório" },
  { key: "lavabo", label: "Lavabo" },
  { key: "areaGourmet", label: "Área gourmet" },
  { key: "closet", label: "Closet" },
];

const IDEIAS = [
  "Casa de 120 m², 3 quartos sendo 1 suíte, sala integrada à cozinha, varanda nos fundos e quartos reservados.",
  "Trabalho de casa: quero um home office silencioso, cozinha americana e garagem para uma SUV.",
  "Casa rústica para a família: cozinha grande, área gourmet com churrasqueira e muita luz natural.",
];

export function BriefForm({ studio }: { studio: Studio }) {
  const { form, setForm, phase, generate } = studio;
  const busy = phase !== "idle" && phase !== "pronto";
  const set = <K extends keyof FormValues>(k: K, v: FormValues[K]) => setForm({ ...form, [k]: v });
  const ambientes = 2 + form.quartos + form.banheiros + Object.values(form.extras).filter(Boolean).length;

  return (
    <form
      className="glass min-w-0 rounded-3xl p-5 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy) generate();
      }}
    >
      <StepTitle n={1}>Terreno e tamanho</StepTitle>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <NumberField id="largura" label="Largura" unit="m" min={5} value={form.largura} onChange={(v) => set("largura", v)} />
        <NumberField id="profundidade" label="Fundo" unit="m" min={8} value={form.profundidade} onChange={(v) => set("profundidade", v)} />
        <NumberField id="area" label="Área" unit="m²" min={35} value={form.area} onChange={(v) => set("area", v)} />
      </div>

      <div className="mt-7">
        <StepTitle n={2}>Ambientes</StepTitle>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <Stepper label="Quartos" value={form.quartos} min={1} max={6} onChange={(v) => setForm({ ...form, quartos: v, suites: Math.min(form.suites, v) })} />
        <Stepper label="Sendo suítes" value={form.suites} min={0} max={Math.min(4, form.quartos)} onChange={(v) => setForm({ ...form, suites: v, banheiros: Math.max(form.banheiros, v + (form.quartos > v ? 1 : 0)) })} />
        <Stepper label="Banheiros" value={form.banheiros} min={1} max={6} onChange={(v) => set("banheiros", v)} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {EXTRAS.map((x) => (
          <Chip key={x.key} active={form.extras[x.key]} onClick={() => set("extras", { ...form.extras, [x.key]: !form.extras[x.key] })}>
            {x.label}
          </Chip>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {form.extras.varanda && (
          <motion.div key="varanda" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-medium text-muted">Varanda na</span>
              {(["frente", "fundos", "lateral"] as const).map((p) => (
                <Chip key={p} color="lime" active={form.varandaPosicao === p} onClick={() => set("varandaPosicao", p)}>
                  {p === "fundos" ? "Fundos" : p === "frente" ? "Frente" : "Lateral"}
                </Chip>
              ))}
            </div>
          </motion.div>
        )}
        {form.extras.garagem && (
          <motion.div key="carro" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-4 rounded-2xl border border-line bg-bg/40 p-3">
              <p className="text-sm font-medium">Medidas do seu carro</p>
              <p className="text-xs text-muted">A garagem é desenhada para o carro caber de verdade, com folga para abrir as portas.</p>
              <div className="mt-3 grid grid-cols-3 gap-2.5">
                <NumberField id="carL" label="Compr." unit="m" min={3} step={0.1} value={form.carro.comprimento} onChange={(v) => set("carro", { ...form.carro, comprimento: v })} />
                <NumberField id="carW" label="Largura" unit="m" min={1.4} step={0.1} value={form.carro.largura} onChange={(v) => set("carro", { ...form.carro, largura: v })} />
                <NumberField id="vagas" label="Vagas" unit="un" min={1} value={form.carro.vagas} onChange={(v) => set("carro", { ...form.carro, vagas: Math.max(1, Math.min(3, Math.round(v))) })} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-7">
        <StepTitle n={3}>Estilo e jeito de viver</StepTitle>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {STYLES.map((s) => (
          <Chip key={s} color="grape" active={form.estilo === s} onClick={() => set("estilo", s)}>
            {STYLE_INFO[s].label}
          </Chip>
        ))}
      </div>

      <label htmlFor="descricao" className="mt-5 block text-sm font-medium">
        Descreva com suas palavras
        <span className="ml-2 text-xs font-normal text-muted">a IA lê e completa o briefing</span>
      </label>
      <textarea
        id="descricao"
        value={form.descricao}
        onChange={(e) => set("descricao", e.target.value)}
        minLength={5}
        rows={4}
        className="mt-2 w-full resize-y rounded-2xl border border-line bg-bg/70 p-3 text-sm leading-relaxed text-ink outline-none transition placeholder:text-muted/60 focus:border-primary/70 focus:ring-2 focus:ring-primary/25"
        placeholder="Ex.: quero a suíte nos fundos, cozinha americana e uma garagem para 2 carros…"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {IDEIAS.map((t, i) => (
          <button
            key={i}
            type="button"
            onClick={() => set("descricao", t)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-white/15 px-2.5 py-1 text-[11px] text-muted transition hover:border-sky/50 hover:text-sky"
          >
            <Wand2 className="size-3" /> Ideia {i + 1}
          </button>
        ))}
      </div>

      <motion.button
        type="submit"
        disabled={busy}
        whileHover={busy ? undefined : { y: -2 }}
        whileTap={busy ? undefined : { scale: 0.98 }}
        className="relative mt-6 inline-flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-primary via-pink to-grape bg-[length:200%_100%] font-display text-lg font-semibold text-bg shadow-[0_10px_40px_-10px_rgba(255,122,61,0.7)] transition disabled:opacity-80"
        style={{ animation: "var(--animate-gradient)" }}
      >
        {busy ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
        {busy ? "Criando sua planta…" : "Gerar projeto 2D"}
      </motion.button>
      <p className="mt-3 text-center text-xs text-muted">
        Cerca de {ambientes} ambientes · estudo conceitual — valide medidas e estrutura com um arquiteto.
      </p>
    </form>
  );
}
