import { AnimatePresence, motion } from "framer-motion";
import { FlipHorizontal2, Minus, MousePointer2, Pencil, Plus, RotateCcw, Send, Shuffle, ThumbsDown, ThumbsUp, Ruler } from "lucide-react";
import { useMemo, useState } from "react";
import { ROOM_INFO } from "../lib/catalog";
import { DUR, EASE, transition } from "../lib/motion";
import { STRATEGY_LABEL, learnedHints } from "../lib/learning/engine";
import { electricalFor } from "../lib/plan/electrical";
import { plumbingFor } from "../lib/plan/plumbing";
import type { Studio } from "../hooks/useStudio";
import { GenerationSteps } from "./GenerationSteps";
import { OptionCards } from "./OptionCards";
import { PlanViewer, type Layer } from "./PlanViewer";
import { ProjectReport } from "./ProjectReport";
import { ElectricalOverlay, ElectricalPanel, PlumbingOverlay, PlumbingPanel } from "./TechLayers";

type Tab = Layer | "dados" | "aprendizado";

const TABS: [Tab, string][] = [
  ["arquitetura", "Planta"],
  ["eletrica", "Elétrica"],
  ["hidraulica", "Hidráulica"],
  ["dados", "Dados"],
  ["aprendizado", "Aprendizado"],
];

const fmt = (v: number, d = 1) => v.toFixed(d).replace(".", ",");

export function PlanStudio({ studio }: { studio: Studio }) {
  const { phase, plan, result, opcao } = studio;
  const [tab, setTab] = useState<Tab>("arquitetura");
  const [zoom, setZoom] = useState<"casa" | "terreno">("casa");
  const generating = phase === "interpretando" || phase === "estruturando" || phase === "distribuindo";
  const eletrica = useMemo(() => (plan ? electricalFor(plan) : null), [plan]);
  const hidraulica = useMemo(() => (plan && result ? plumbingFor(plan, result.brief) : null), [plan, result]);
  const isLayer = tab === "arquitetura" || tab === "eletrica" || tab === "hidraulica";

  return (
    <section id="planta" aria-live="polite" className="panel min-w-0 space-y-5 rounded-2xl p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-semibold">{plan ? "Sua planta" : "A planta aparece aqui"}</h2>
          <p className="mt-1 text-sm text-muted">
            {plan && opcao
              ? `${opcao.perfil.nome} · ${STRATEGY_LABEL[plan.strategy.kind]} · variação ${result!.index + 1} de ${opcao.plans.length}`
              : "Preencha o briefing ao lado e clique em Gerar."}
          </p>
        </div>
        {plan && (
          <div className="flex items-center gap-3 text-right">
            <div>
              <p className="tabular font-mono text-2xl leading-none">{studio.nota}</p>
              <p className="text-[11px] text-muted">nota /100</p>
            </div>
            <span className="rounded-md border border-line px-2 py-1 font-mono text-[11px] text-muted">
              {result!.fonte === "claude" ? "Leitura: IA Claude" : "Leitura: regras locais"}
            </span>
          </div>
        )}
      </header>

      {result && !generating && <OptionCards studio={studio} />}

      {plan && (
        <p className="flex items-start gap-2 rounded-lg border border-line bg-card px-3 py-2 text-sm">
          <Ruler className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            <b className="font-semibold">Projeto calculado com regras geométricas.</b>{" "}
            <span className="text-muted">A IA só interpreta o pedido; medidas, recuos e ligações entre ambientes são verificados automaticamente.</span>{" "}
            <a href="#verificacoes" className="text-primary underline-offset-2 hover:underline">
              Ver verificações
            </a>
          </span>
        </p>
      )}

      {result && (
        <nav className="flex gap-1 overflow-x-auto border-b border-line text-sm" aria-label="Camadas do projeto">
          {TABS.map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              aria-current={tab === k}
              className={`relative shrink-0 px-3 py-2 font-medium transition-colors ${tab === k ? "text-ink" : "text-muted hover:text-ink"}`}
            >
              {label}
              {tab === k && (
                <motion.span layoutId="aba-ativa" className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" transition={{ duration: DUR.base, ease: EASE }} />
              )}
            </button>
          ))}
        </nav>
      )}

      <div className="relative overflow-hidden rounded-xl border border-line bg-[#141518]">
        <div className="bg-grid absolute inset-0" />
        <div className="relative aspect-[4/5] w-full sm:aspect-[5/6] lg:aspect-[4/4.3]">
          {generating ? (
            <GenerationSteps phase={phase} />
          ) : !plan ? (
            <EmptyState />
          ) : isLayer ? (
            <div className="absolute inset-0 p-2 sm:p-3">
              <PlanViewer
                plan={plan}
                brief={result!.brief}
                selectedId={studio.selectedId}
                onSelect={studio.setSelectedId}
                editMode={studio.editMode}
                animate={studio.animate && tab === "arquitetura"}
                onDrag={studio.onDrag}
                zoom={zoom}
                layer={tab as Layer}
                overlay={
                  tab === "eletrica" && eletrica
                    ? (fy) => <ElectricalOverlay e={eletrica} fy={fy} />
                    : tab === "hidraulica" && hidraulica
                      ? (fy) => <PlumbingOverlay h={hidraulica} fy={fy} />
                      : undefined
                }
              />
              <div className="absolute right-3 top-3 flex rounded-lg border border-line bg-bg/90 p-0.5 text-[11px] font-semibold">
                {(["casa", "terreno"] as const).map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZoom(z)}
                    className={`rounded-md px-2.5 py-1 ${zoom === z ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}
                  >
                    {z === "casa" ? "Casa" : "Terreno"}
                  </button>
                ))}
              </div>
              {studio.editMode && tab === "arquitetura" && (
                <p className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-bg/90 px-2.5 py-1 text-[11px] text-ink">
                  <MousePointer2 className="size-3 text-primary" /> Arraste as linhas laranja ou clique num cômodo
                </p>
              )}
            </div>
          ) : tab === "dados" ? (
            <DataPanel studio={studio} />
          ) : (
            <LearningPanel studio={studio} />
          )}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {plan && !generating && (
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={transition(0, DUR.rapido + 0.1)}
          >
            {tab === "arquitetura" && (
              <div className="space-y-5">
                <Toolbar studio={studio} />
                <ProjectReport studio={studio} />
              </div>
            )}
            {tab === "eletrica" && eletrica && <ElectricalPanel e={eletrica} />}
            {tab === "hidraulica" && hidraulica && <PlumbingPanel h={hidraulica} />}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="grid h-full place-items-center p-6 text-center">
      <div className="max-w-xs">
        <svg viewBox="0 0 120 90" className="mx-auto w-36" aria-hidden>
          <rect x="10" y="10" width="100" height="70" fill="none" stroke="#55544f" strokeWidth="2" strokeDasharray="5 4" />
          <path d="M10 45h55M65 10v70M65 55h45" stroke="#55544f" strokeWidth="1.5" strokeDasharray="5 4" />
        </svg>
        <p className="mt-4 font-display text-lg font-semibold">Nenhuma planta ainda</p>
        <p className="mt-1 text-sm text-muted">Você vai receber 3 opções calculadas, com nota e verificações, para escolher e editar.</p>
      </div>
    </div>
  );
}

function Toolbar({ studio }: { studio: Studio }) {
  const { plan, editMode, setEditMode, rated, message } = studio;
  const [cmd, setCmd] = useState("");
  const [areaInput, setAreaInput] = useState("");
  const selected = plan!.rooms.find((r) => r.id === studio.selectedId);
  const edited = Object.keys(studio.overrides).length > 0;
  const btn = "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setEditMode(!editMode)}
          className={`${btn} ${editMode ? "border-primary bg-primary text-bg" : "border-line hover:border-white/25"}`}
        >
          <Pencil className="size-4" /> {editMode ? "Editando" : "Modo editar"}
        </button>
        <button type="button" onClick={studio.nextOption} className={`${btn} border-line hover:border-white/25`}>
          <Shuffle className="size-4" /> Outra variação
        </button>
        <button type="button" onClick={studio.mirror} className={`${btn} border-line hover:border-white/25`}>
          <FlipHorizontal2 className="size-4" /> Espelhar
        </button>
        {edited && (
          <button type="button" onClick={studio.resetEdits} className={`${btn} border-line hover:border-white/25`}>
            <RotateCcw className="size-4" /> Desfazer edições
          </button>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-xs text-muted">Gostou?</span>
          {([true, false] as const).map((up) => (
            <button
              key={String(up)}
              type="button"
              aria-label={up ? "Gostei" : "Não gostei"}
              onClick={() => studio.rate(up)}
              className={`grid size-9 place-items-center rounded-lg border transition ${rated === (up ? "up" : "down") ? "border-primary text-primary" : "border-line text-muted hover:text-ink"}`}
            >
              {up ? <ThumbsUp className="size-4" /> : <ThumbsDown className="size-4" />}
            </button>
          ))}
        </div>
      </div>

      {editMode && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (cmd.trim()) {
              studio.runCommand(cmd);
              setCmd("");
            }
          }}
          className="flex items-center gap-2 rounded-lg border border-line bg-card p-1.5 pl-3"
        >
          <input
            id="comando"
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            placeholder="Ex.: quero a suíte com 16 m² · adicionar escritório · espelhar"
            aria-label="Comando de edição"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/70"
          />
          <button type="submit" className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-bg" aria-label="Aplicar comando">
            <Send className="size-4" />
          </button>
        </form>
      )}

      <AnimatePresence mode="wait">
        {message && (
          <motion.p key={message} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-muted">
            {message}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={transition(0, DUR.rapido + 0.1)}
            className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-card p-4"
          >
            <div className="min-w-0">
              <p className="eyebrow">{ROOM_INFO[selected.tipo].label}</p>
              <p className="font-display text-xl font-semibold">{selected.nome}</p>
              <p className="tabular font-mono text-sm">
                {fmt(selected.w, 2)} × {fmt(selected.h, 2)} m · {fmt(selected.w * selected.h, 2)} m²
              </p>
              <p className="text-xs text-muted">Largura mínima recomendada: {fmt(ROOM_INFO[selected.tipo].minWidth, 2)} m</p>
            </div>
            {selected.tipo !== "circulacao" && (
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => studio.setRoomArea(selected.id, selected.w * selected.h - 1)}
                  className={`${btn} border-line`}
                  aria-label="Diminuir 1 m²"
                >
                  <Minus className="size-4" /> 1 m²
                </button>
                <button
                  type="button"
                  onClick={() => studio.setRoomArea(selected.id, selected.w * selected.h + 1)}
                  className={`${btn} border-line`}
                  aria-label="Aumentar 1 m²"
                >
                  <Plus className="size-4" /> 1 m²
                </button>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const v = Number(areaInput.replace(",", "."));
                    if (v > 0) studio.setRoomArea(selected.id, v);
                    setAreaInput("");
                  }}
                  className="flex items-center gap-1"
                >
                  <label htmlFor="area-comodo" className="sr-only">
                    Nova área em m²
                  </label>
                  <input
                    id="area-comodo"
                    inputMode="decimal"
                    value={areaInput}
                    onChange={(e) => setAreaInput(e.target.value)}
                    placeholder="m²"
                    className="h-9 w-16 rounded-lg border border-line bg-bg px-2 text-right font-mono text-sm outline-none focus:border-primary"
                  />
                  <button type="submit" className={`${btn} border-line hover:border-primary`}>
                    Aplicar
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DataPanel({ studio }: { studio: Studio }) {
  return (
    <div className="absolute inset-0 overflow-auto p-4">
      <p className="mb-3 max-w-prose text-sm text-muted">
        Este JSON é o que a IA entendeu do seu pedido. O algoritmo usa só estes dados para calcular a planta, por isso o resultado pode ser conferido.
      </p>
      {studio.result!.aviso && <p className="mb-2 text-xs text-warn">{studio.result!.aviso}</p>}
      <pre className="whitespace-pre-wrap break-words rounded-lg border border-line bg-bg p-3 font-mono text-[11px] leading-relaxed text-ink/90">
        {JSON.stringify(studio.result!.brief, null, 2)}
      </pre>
    </div>
  );
}

function LearningPanel({ studio }: { studio: Studio }) {
  const { learning } = studio;
  const hints = learnedHints(learning);
  return (
    <div className="absolute inset-0 space-y-5 overflow-auto p-4">
      <dl className="grid grid-cols-3 gap-3">
        {(
          [
            ["plantas geradas", learning.generations],
            ["ajustes feitos", learning.edits],
            ["avaliações", learning.ratings.up + learning.ratings.down],
          ] as const
        ).map(([l, v]) => (
          <div key={l} className="rounded-lg border border-line p-3">
            <dd className="tabular font-mono text-2xl">{v}</dd>
            <dt className="text-[11px] text-muted">{l}</dt>
          </div>
        ))}
      </dl>
      <div>
        <p className="eyebrow">O que o sistema aprendeu com você</p>
        {hints.length ? (
          <ul className="mt-2 space-y-1.5 text-sm">
            {hints.map((h) => (
              <li key={h} className="border-l-2 border-primary pl-3">
                {h}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">Nada ainda. Escolha opções, edite cômodos e avalie as plantas: cada ação ajusta as próximas sugestões.</p>
        )}
      </div>
      {learning.log.length > 0 && (
        <div>
          <p className="eyebrow">Histórico</p>
          <ul className="mt-2 space-y-1 font-mono text-xs text-muted">
            {learning.log.slice(0, 10).map((e) => (
              <li key={e.at + e.detail}>{e.detail}</li>
            ))}
          </ul>
        </div>
      )}
      <button type="button" onClick={studio.resetLearning} className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline">
        Apagar o aprendizado
      </button>
    </div>
  );
}
