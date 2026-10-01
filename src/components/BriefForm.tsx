import { ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { STYLE_INFO } from "../lib/catalog";
import type { FormValues } from "../lib/brief/form";
import { STYLES, type Norte } from "../lib/types";
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

const EXEMPLOS = [
  "Casa de 120 m², 3 quartos sendo 1 suíte, sala integrada à cozinha, varanda nos fundos e quartos reservados.",
  "Trabalho em casa: quero um home office silencioso, cozinha americana e garagem para uma SUV.",
  "Casa rústica para a família: cozinha grande, área gourmet com churrasqueira e muita luz natural.",
];

const NORTE: [Norte | null, string][] = [
  [null, "Não sei"],
  ["frente", "Frente"],
  ["fundos", "Fundos"],
  ["esquerda", "Esquerda"],
  ["direita", "Direita"],
];

export function BriefForm({ studio }: { studio: Studio }) {
  const { form, setForm, phase, generate } = studio;
  const [avancado, setAvancado] = useState(false);
  const busy = phase !== "idle" && phase !== "pronto";
  const set = <K extends keyof FormValues>(k: K, v: FormValues[K]) => setForm({ ...form, [k]: v });
  const setAv = <K extends keyof FormValues["avancado"]>(k: K, v: FormValues["avancado"][K]) => setForm({ ...form, avancado: { ...form.avancado, [k]: v } });
  const nullable = (v: number) => (Number.isFinite(v) ? v : null);

  return (
    <form
      className="panel min-w-0 space-y-7 rounded-2xl p-5 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy) generate();
      }}
    >
      <fieldset className="space-y-3">
        <StepTitle n={1}>Terreno e tamanho</StepTitle>
        <div className="grid grid-cols-3 gap-2.5">
          <NumberField id="largura" label="Largura" unit="m" min={5} value={form.largura} onChange={(v) => set("largura", v)} />
          <NumberField id="profundidade" label="Fundo" unit="m" min={8} value={form.profundidade} onChange={(v) => set("profundidade", v)} />
          <NumberField id="area" label="Área" unit="m²" min={35} value={form.area} onChange={(v) => set("area", v)} />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <StepTitle n={2}>Ambientes</StepTitle>
        <div className="grid grid-cols-3 gap-2.5">
          <Stepper label="Quartos" value={form.quartos} min={1} max={6} onChange={(v) => setForm({ ...form, quartos: v, suites: Math.min(form.suites, v) })} />
          <Stepper
            label="Sendo suítes"
            value={form.suites}
            min={0}
            max={Math.min(4, form.quartos)}
            onChange={(v) => setForm({ ...form, suites: v, banheiros: Math.max(form.banheiros, v + (form.quartos > v ? 1 : 0)) })}
          />
          <Stepper label="Banheiros" value={form.banheiros} min={1} max={6} onChange={(v) => set("banheiros", v)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EXTRAS.map((x) => (
            <Chip key={x.key} active={form.extras[x.key]} onClick={() => set("extras", { ...form.extras, [x.key]: !form.extras[x.key] })}>
              {x.label}
            </Chip>
          ))}
        </div>
        {form.extras.varanda && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-muted">Varanda na</span>
            {(["frente", "fundos", "lateral"] as const).map((p) => (
              <Chip key={p} active={form.varandaPosicao === p} onClick={() => set("varandaPosicao", p)}>
                {p === "fundos" ? "Fundos" : p === "frente" ? "Frente" : "Lateral"}
              </Chip>
            ))}
          </div>
        )}
        {form.extras.garagem && (
          <div className="rounded-lg border border-line p-3">
            <p className="text-sm font-medium">Medidas do carro</p>
            <p className="text-xs text-muted">A garagem é calculada para o carro caber com 0,8 m de folga para abrir as portas.</p>
            <div className="mt-2.5 grid grid-cols-3 gap-2.5">
              <NumberField id="carL" label="Comprimento" unit="m" min={3} step={0.1} value={form.carro.comprimento} onChange={(v) => set("carro", { ...form.carro, comprimento: v })} />
              <NumberField id="carW" label="Largura" unit="m" min={1.4} step={0.1} value={form.carro.largura} onChange={(v) => set("carro", { ...form.carro, largura: v })} />
              <NumberField id="vagas" label="Vagas" unit="un" min={1} value={form.carro.vagas} onChange={(v) => set("carro", { ...form.carro, vagas: Math.max(1, Math.min(3, Math.round(v || 1))) })} />
            </div>
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-3">
        <StepTitle n={3}>Estilo e jeito de viver</StepTitle>
        <div className="flex flex-wrap gap-1.5">
          {STYLES.map((s) => (
            <Chip key={s} active={form.estilo === s} onClick={() => set("estilo", s)}>
              {STYLE_INFO[s].label}
            </Chip>
          ))}
        </div>
        <label htmlFor="descricao" className="block text-sm font-medium">
          Descreva com suas palavras
        </label>
        <textarea
          id="descricao"
          value={form.descricao}
          onChange={(e) => set("descricao", e.target.value)}
          rows={4}
          className="w-full resize-y rounded-lg border border-line bg-bg p-3 text-sm leading-relaxed text-ink outline-none transition placeholder:text-muted/60 focus:border-primary"
          placeholder="Ex.: quero a suíte nos fundos, cozinha americana e garagem para 2 carros…"
        />
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
          <span className="text-muted">Exemplos:</span>
          {EXEMPLOS.map((t, i) => (
            <button key={i} type="button" onClick={() => set("descricao", t)} className="text-muted underline decoration-line underline-offset-4 hover:text-ink">
              {["Família", "Home office", "Rústica"][i]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-line">
        <button type="button" onClick={() => setAvancado(!avancado)} aria-expanded={avancado} className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium">
          Opções avançadas
          <ChevronDown className={`size-4 text-muted transition ${avancado ? "rotate-180" : ""}`} />
        </button>
        {avancado && (
          <div className="space-y-4 border-t border-line p-3">
            <div>
              <p className="text-xs text-muted">Recuos da prefeitura (em branco = regra automática)</p>
              <div className="mt-1.5 grid grid-cols-3 gap-2.5">
                <NumberField id="recuoFrente" label="Frente" unit="m" min={0} step={0.5} placeholder="auto" value={form.avancado.recuoFrente} onChange={(v) => setAv("recuoFrente", nullable(v))} />
                <NumberField id="recuoFundos" label="Fundos" unit="m" min={0} step={0.5} placeholder="auto" value={form.avancado.recuoFundos} onChange={(v) => setAv("recuoFundos", nullable(v))} />
                <NumberField id="recuoLaterais" label="Laterais" unit="m" min={0} step={0.5} placeholder="auto" value={form.avancado.recuoLaterais} onChange={(v) => setAv("recuoLaterais", nullable(v))} />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted">Para que lado fica o norte? (rua embaixo da planta)</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {NORTE.map(([v, l]) => (
                  <Chip key={l} active={form.avancado.norte === v} onClick={() => setAv("norte", v)}>
                    {l}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 items-end gap-2.5">
              <NumberField id="moradores" label="Moradores" unit="pess." min={1} value={form.avancado.moradores} onChange={(v) => setAv("moradores", Math.max(1, Math.round(v || 1)))} />
              <label htmlFor="acessivel" className="flex h-10 items-center gap-2 text-sm">
                <input id="acessivel" type="checkbox" checked={form.avancado.acessivel} onChange={(e) => setAv("acessivel", e.target.checked)} className="size-4 accent-[#e07a3f]" />
                Acessibilidade
              </label>
            </div>
            <p className="text-xs text-muted">Acessibilidade usa corredores de 1,20 m e portas de 0,90 m. Moradores definem o tamanho da caixa d'água.</p>
          </div>
        )}
      </fieldset>

      <div>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-display text-base font-semibold text-bg transition hover:bg-primary-2 disabled:opacity-70"
        >
          {busy && <Loader2 className="size-5 animate-spin" />}
          {busy ? "Calculando…" : "Gerar 3 opções de planta"}
        </button>
        <p className="mt-2.5 text-center text-xs text-muted">Estudo preliminar. Valide medidas, estrutura e legislação com um arquiteto.</p>
      </div>
    </form>
  );
}
