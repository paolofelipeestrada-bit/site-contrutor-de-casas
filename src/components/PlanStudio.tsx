import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  Braces,
  FlipHorizontal2,
  LayoutGrid,
  Minus,
  MousePointer2,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  Shuffle,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  TriangleAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ROOM_INFO, ZONE_COLORS, ZONE_LABELS } from "../lib/catalog";
import { explainPlan } from "../lib/layout/layout";
import { STRATEGY_LABEL, learnedHints } from "../lib/learning/engine";
import type { Zone } from "../lib/types";
import type { Studio } from "../hooks/useStudio";
import { GenerationSteps } from "./GenerationSteps";
import { PlanViewer } from "./PlanViewer";
import { Badge } from "./ui";

type Tab = "planta" | "dados" | "aprendizado";

export function PlanStudio({ studio }: { studio: Studio }) {
  const { phase, plan, result } = studio;
  const [tab, setTab] = useState<Tab>("planta");
  const [zoom, setZoom] = useState<"casa" | "terreno">("casa");
  const generating = phase === "interpretando" || phase === "estruturando" || phase === "distribuindo";

  return (
    <section id="planta" aria-live="polite" className="glass glow-border min-w-0 rounded-3xl p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-2xl font-semibold">{plan ? "Sua planta 2D" : "Sua planta aparece aqui"}</p>
          <p className="mt-1 text-sm text-muted">
            {plan
              ? `Opção ${result!.index + 1} de ${result!.plans.length} · ${STRATEGY_LABEL[plan.strategy.kind]}`
              : "Preencha o briefing: a IA organiza os ambientes e o algoritmo desenha com medidas reais."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {result && <Badge tone={result.fonte === "claude" ? "primary" : "sky"}>{result.fonte === "claude" ? "IA Claude" : "IA local"}</Badge>}
          {plan && <ScoreBadge score={plan.score} />}
          <Badge>Planta 2D</Badge>
        </div>
      </div>

      {result && (
        <div className="mt-4 flex gap-1 rounded-full border border-line bg-bg/60 p-1 text-xs font-semibold">
          {(
            [
              ["planta", "Planta", LayoutGrid],
              ["dados", "Dados", Braces],
              ["aprendizado", "Aprendizado", Brain],
            ] as const
          ).map(([k, label, Icon]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 transition ${tab === k ? "text-bg" : "text-muted hover:text-ink"}`}
            >
              {tab === k && <motion.span layoutId="tab" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />}
              <Icon className="relative size-3.5" />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="relative mt-4 overflow-hidden rounded-2xl border border-line bg-[#0b0d1a]">
        <div className="bg-grid absolute inset-0 opacity-70" />
        <div className="relative aspect-[4/5] w-full sm:aspect-[5/6] lg:aspect-[4/4.3]">
          {generating ? (
            <GenerationSteps phase={phase} />
          ) : !plan ? (
            <EmptyState />
          ) : tab === "planta" ? (
            <div className="absolute inset-0 p-2 sm:p-3">
              <PlanViewer
                plan={plan}
                brief={result!.brief}
                selectedId={studio.selectedId}
                onSelect={studio.setSelectedId}
                editMode={studio.editMode}
                animate={studio.animate}
                onDrag={studio.onDrag}
                zoom={zoom}
              />
              <div className="absolute right-3 top-3 flex gap-1 rounded-full border border-line bg-bg/80 p-1 text-[11px] font-semibold backdrop-blur">
                {(["casa", "terreno"] as const).map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZoom(z)}
                    className={`rounded-full px-3 py-1 transition ${zoom === z ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}
                  >
                    {z === "casa" ? "Casa" : "Terreno"}
                  </button>
                ))}
              </div>
              {studio.editMode && (
                <div className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1 text-[11px] font-bold text-bg">
                  <MousePointer2 className="size-3" /> Arraste as paredes laranja · clique num cômodo
                </div>
              )}
            </div>
          ) : tab === "dados" ? (
            <DataPanel studio={studio} />
          ) : (
            <LearningPanel studio={studio} />
          )}
        </div>
      </div>

      {plan && tab === "planta" && !generating && <Toolbar studio={studio} />}
    </section>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone = score >= 75 ? "lime" : score >= 55 ? "sun" : "primary";
  return <Badge tone={tone}>Nota {score}</Badge>;
}

function EmptyState() {
  return (
    <div className="grid h-full place-items-center p-6">
      <div className="max-w-xs text-center">
        <motion.div
          className="mx-auto grid size-20 place-items-center rounded-3xl border-2 border-dashed border-white/15 bg-card"
          animate={{ rotate: [0, 4, -4, 0], y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="size-8 text-primary" />
        </motion.div>
        <p className="mt-5 font-display text-xl font-semibold">Pronta para ganhar forma</p>
        <p className="mt-2 text-sm text-muted">Clique em “Gerar projeto 2D”. Você vai ver a IA ler o pedido, montar os dados e o algoritmo desenhar parede por parede.</p>
      </div>
    </div>
  );
}

function Toolbar({ studio }: { studio: Studio }) {
  const { plan, result, editMode, setEditMode, rated, message } = studio;
  const [cmd, setCmd] = useState("");
  const selected = plan!.rooms.find((r) => r.id === studio.selectedId);
  const why = useMemo(() => explainPlan(plan!, result!.brief, studio.learning).slice(0, 4), [plan, result, studio.learning]);
  const edited = Object.keys(studio.overrides).length > 0;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToolButton active={editMode} onClick={() => setEditMode(!editMode)} icon={Pencil}>
          {editMode ? "Editando" : "Modo editar"}
        </ToolButton>
        <ToolButton onClick={studio.nextOption} icon={Shuffle}>
          Outra opção
        </ToolButton>
        <ToolButton onClick={studio.mirror} icon={FlipHorizontal2}>
          Espelhar
        </ToolButton>
        {edited && (
          <ToolButton onClick={studio.resetEdits} icon={RotateCcw}>
            Desfazer
          </ToolButton>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="hidden text-xs text-muted sm:inline">Gostou?</span>
          <RateButton active={rated === "up"} onClick={() => studio.rate(true)} label="Gostei">
            <ThumbsUp className="size-4" />
          </RateButton>
          <RateButton active={rated === "down"} onClick={() => studio.rate(false)} label="Não gostei">
            <ThumbsDown className="size-4" />
          </RateButton>
        </div>
      </div>

      <AnimatePresence>
        {editMode && (
          <motion.form
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (cmd.trim()) {
                studio.runCommand(cmd);
                setCmd("");
              }
            }}
            className="flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-1.5 pl-3"
          >
            <Sparkles className="size-4 shrink-0 text-primary" />
            <input
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              placeholder="Ex.: aumentar a suíte em 2 m² · adicionar escritório · espelhar"
              aria-label="Comando de edição"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/70"
            />
            <button type="submit" className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-bg transition hover:bg-primary-2" aria-label="Aplicar comando">
              <Send className="size-4" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {message && (
          <motion.p key={message} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-sky/10 px-3 py-2 text-xs text-sky">
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
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-card/80 p-4"
          >
            <span className="size-10 shrink-0 rounded-xl" style={{ background: ZONE_COLORS[selected.zone].fill, border: `2px solid ${ZONE_COLORS[selected.zone].stroke}` }} />
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold">{selected.nome}</p>
              <p className="font-mono text-sm text-muted">
                {(selected.w * selected.h).toFixed(1).replace(".", ",")} m² · {selected.w.toFixed(2).replace(".", ",")} × {selected.h.toFixed(2).replace(".", ",")} m
              </p>
              <p className="text-xs text-muted/80">
                Alvo {selected.targetArea.toFixed(1).replace(".", ",")} m² · mínimo recomendado {ROOM_INFO[selected.tipo].minWidth.toString().replace(".", ",")} m de largura
              </p>
            </div>
            {selected.tipo !== "circulacao" && (
              <div className="ml-auto flex items-center gap-2">
                <button type="button" onClick={() => studio.setRoomArea(selected.id, selected.w * selected.h - 1)} className="grid size-10 place-items-center rounded-xl border border-line hover:border-primary/60 hover:text-primary" aria-label="Diminuir 1 m²">
                  <Minus className="size-4" />
                </button>
                <button type="button" onClick={() => studio.setRoomArea(selected.id, selected.w * selected.h + 1)} className="grid size-10 place-items-center rounded-xl border border-line hover:border-primary/60 hover:text-primary" aria-label="Aumentar 1 m²">
                  <Plus className="size-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white/[0.02] p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Resumo</p>
          <p className="mt-1 font-mono text-sm">
            {plan!.builtArea.toString().replace(".", ",")} m² construídos · {plan!.footprint.w.toFixed(1).replace(".", ",")} × {plan!.footprint.h.toFixed(1).replace(".", ",")} m
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {(Object.keys(ZONE_LABELS) as Zone[])
              .filter((z) => plan!.rooms.some((r) => r.zone === z))
              .map((z) => (
                <span key={z} className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                  <span className="size-2.5 rounded-sm" style={{ background: ZONE_COLORS[z].stroke }} />
                  {ZONE_LABELS[z]}
                </span>
              ))}
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-white/[0.02] p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Por que essa nota</p>
          {why.length === 0 && plan!.issues.length === 0 ? (
            <p className="mt-1 text-sm text-lime">Tudo dentro das regras que o algoritmo verifica.</p>
          ) : (
            <ul className="mt-1 space-y-0.5 text-xs text-muted">
              {plan!.issues.slice(0, 2).map((i) => (
                <li key={i} className="flex gap-1.5 text-sun">
                  <TriangleAlert className="mt-0.5 size-3 shrink-0" /> {i}
                </li>
              ))}
              {why.map((w) => (
                <li key={w} className="font-mono">
                  {w}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolButton({ children, onClick, icon: Icon, active }: { children: React.ReactNode; onClick: () => void; icon: typeof Pencil; active?: boolean }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
        active ? "border-primary bg-primary text-bg" : "border-line bg-white/[0.03] text-ink hover:border-white/25"
      }`}
    >
      <Icon className="size-4" />
      {children}
    </motion.button>
  );
}

function RateButton({ children, onClick, active, label }: { children: React.ReactNode; onClick: () => void; active: boolean; label: string }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      whileTap={{ scale: 0.85, rotate: -8 }}
      onClick={onClick}
      className={`grid size-10 place-items-center rounded-full border transition ${active ? "border-lime bg-lime/20 text-lime" : "border-line text-muted hover:text-ink"}`}
    >
      {children}
    </motion.button>
  );
}

function DataPanel({ studio }: { studio: Studio }) {
  const { result } = studio;
  const json = JSON.stringify(result!.brief, null, 2);
  return (
    <div className="absolute inset-0 overflow-auto p-4">
      <p className="mb-2 text-xs text-muted">
        Este é o “contrato” entre a IA e o algoritmo. A IA só <b className="text-ink">entende</b> o pedido; quem desenha, respeitando as medidas, é o nosso sistema.
      </p>
      {result!.aviso && <p className="mb-2 text-xs text-sun">{result!.aviso}</p>}
      <pre className="whitespace-pre-wrap break-words rounded-xl border border-line bg-bg/80 p-3 font-mono text-[11px] leading-relaxed text-sky/90">{json}</pre>
    </div>
  );
}

function LearningPanel({ studio }: { studio: Studio }) {
  const { learning } = studio;
  const hints = learnedHints(learning);
  const factors = Object.entries(learning.areaFactor) as [keyof typeof ROOM_INFO, { value: number; n: number }][];
  return (
    <div className="absolute inset-0 overflow-auto p-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Plantas geradas" value={learning.generations} />
        <Stat label="Ajustes feitos" value={learning.edits} />
        <Stat label="Avaliações" value={learning.ratings.up + learning.ratings.down} />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">O que a IA aprendeu com você</p>
      {hints.length ? (
        <ul className="mt-2 space-y-1.5">
          {hints.map((h) => (
            <motion.li key={h} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2 rounded-xl bg-grape/10 px-3 py-2 text-sm text-grape">
              <Brain className="mt-0.5 size-4 shrink-0" /> {h}
            </motion.li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">Ainda nada. Edite cômodos, arraste paredes e avalie as plantas com 👍/👎 — cada ação ajusta as próximas sugestões.</p>
      )}
      {factors.length > 0 && (
        <div className="mt-4 space-y-2">
          {factors.map(([tipo, f]) => (
            <div key={tipo}>
              <div className="flex justify-between text-xs">
                <span>{ROOM_INFO[tipo].label}</span>
                <span className="font-mono text-muted">{f.value >= 1 ? "+" : ""}{Math.round((f.value - 1) * 100)}%</span>
              </div>
              <div className="relative mt-1 h-1.5 rounded-full bg-white/5">
                <span className="absolute left-1/2 top-0 h-full w-px bg-white/30" />
                <motion.span
                  className={`absolute top-0 h-full rounded-full ${f.value >= 1 ? "bg-primary" : "bg-sky"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(50, Math.abs(f.value - 1) * 62.5)}%`, left: f.value >= 1 ? "50%" : `${50 - Math.min(50, Math.abs(f.value - 1) * 62.5)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {learning.log.length > 0 && (
        <>
          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted">Linha do tempo</p>
          <ul className="mt-2 space-y-1">
            {learning.log.slice(0, 8).map((e) => (
              <li key={e.at + e.detail} className="flex items-center gap-2 text-xs text-muted">
                <span className={`size-1.5 rounded-full ${e.kind === "like" ? "bg-lime" : e.kind === "dislike" ? "bg-pink" : e.kind === "edicao" ? "bg-primary" : "bg-sky"}`} />
                {e.detail}
              </li>
            ))}
          </ul>
        </>
      )}
      <button type="button" onClick={studio.resetLearning} className="mt-5 text-xs text-muted underline-offset-4 hover:text-pink hover:underline">
        Zerar aprendizado
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-white/[0.03] p-3 text-center">
      <motion.p key={value} initial={{ scale: 1.3, color: "#ff7a3d" }} animate={{ scale: 1, color: "#eceefb" }} className="font-display text-2xl font-bold">
        {value}
      </motion.p>
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
    </div>
  );
}
