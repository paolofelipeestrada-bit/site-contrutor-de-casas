import { motion } from "framer-motion";
import { CircleAlert, CircleCheck, Hand, PencilRuler, Redo2, Trash2, Undo2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Botao3D } from "../components/casa3d/Botao3D";
import { BuilderCanvas, type BuilderTool } from "../components/BuilderCanvas";
import { CostPanel } from "../components/CostPanel";
import { PlanViewer } from "../components/PlanViewer";
import { MaskText } from "../components/MaskText";
import { Reveal, RevealItem } from "../components/Reveal";
import { ElectricalOverlay, ElectricalPanel, PlumbingOverlay, PlumbingPanel } from "../components/TechLayers";
import { useWiringEditor, WiringToolbar } from "../components/WiringEditor";
import { ZoomPan } from "../components/ZoomPan";
import { Chip, NumberField } from "../components/ui";
import { briefFromRooms, exemploInicial, planFromRooms, round2, sobrepostos, type BuilderLot, type BuilderRoom } from "../lib/builder";
import { ROOM_INFO, ZONE_COLORS, ZONE_LABELS } from "../lib/catalog";
import { DUR, EASE } from "../lib/motion";
import { EDICAO_VAZIA, electricalFor, type EdicaoEletrica } from "../lib/plan/electrical";
import { plumbingFor } from "../lib/plan/plumbing";
import { verificacoes } from "../lib/plan/report";
import type { RoomType, Zone } from "../lib/types";

/** Tipos que aparecem na paleta do modo "construir do zero". */
const PALETA: RoomType[] = [
  "sala",
  "cozinha",
  "quarto",
  "suite",
  "banheiro",
  "lavabo",
  "circulacao",
  "lavanderia",
  "escritorio",
  "garagem",
  "varanda",
  "area_gourmet",
  "closet",
  "jantar",
];
type Aba = "desenho" | "eletrica" | "hidraulica" | "custo";
const ABAS: [Aba, string][] = [
  ["desenho", "Desenho"],
  ["eletrica", "Elétrica"],
  ["hidraulica", "Hidráulica"],
  ["custo", "Custo"],
];
const fmt = (v: number, d = 1) => v.toFixed(d).replace(".", ",");

export function Builder() {
  const [lot, setLot] = useState<BuilderLot>({ largura: 12, profundidade: 25 });
  const [rooms, setRooms] = useState<BuilderRoom[]>(() => exemploInicial({ largura: 12, profundidade: 25 }));
  const [tool, setTool] = useState<BuilderTool>("selecionar");
  const [tipo, setTipo] = useState<RoomType>("quarto");
  const [sel, setSel] = useState<string | null>(null);
  const [aba, setAba] = useState<Aba>("desenho");
  const [past, setPast] = useState<BuilderRoom[][]>([]);
  const [future, setFuture] = useState<BuilderRoom[][]>([]);
  const [eletricaEd, setEletricaEd] = useState<EdicaoEletrica>(EDICAO_VAZIA);
  const [editFiacao, setEditFiacao] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const commit = () => {
    setPast((p) => [...p.slice(-49), rooms]);
    setFuture([]);
  };
  const undo = () => {
    const prev = past.at(-1);
    if (!prev) return;
    setFuture((f) => [rooms, ...f]);
    setPast((p) => p.slice(0, -1));
    setRooms(prev);
  };
  const redo = () => {
    const next = future[0];
    if (!next) return;
    setPast((p) => [...p, rooms]);
    setFuture((f) => f.slice(1));
    setRooms(next);
  };
  const change = (next: BuilderRoom[], registrar = false) => {
    if (registrar) commit();
    setRooms(next);
    setEletricaEd(EDICAO_VAZIA); // a fiação automática acompanha o desenho
  };

  const plan = useMemo(() => planFromRooms(rooms, lot), [rooms, lot]);
  const brief = useMemo(() => briefFromRooms(rooms, lot), [rooms, lot]);
  const eletrica = useMemo(() => (plan ? electricalFor(plan, eletricaEd) : null), [plan, eletricaEd]);
  const hidraulica = useMemo(() => (plan ? plumbingFor(plan, brief) : null), [plan, brief]);
  const checks = useMemo(() => (plan ? verificacoes(plan, brief).filter((c) => !c.texto.startsWith("Área construída")) : []), [plan, brief]);
  const overlap = useMemo(() => sobrepostos(rooms), [rooms]);
  const wiring = useWiringEditor(plan, (fn) => setEletricaEd((e) => fn(e)), setAviso);
  const room = rooms.find((r) => r.id === sel);

  // teclado: Delete apaga, setas empurram 10 cm, Ctrl+Z / Ctrl+Shift+Z
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const alvo = (e.target as HTMLElement)?.tagName;
      if (alvo === "INPUT" || alvo === "TEXTAREA" || alvo === "SELECT" || aba !== "desenho") return;
      if (!document.getElementById("construir")?.matches(":hover") && !document.activeElement?.closest("#construir")) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (!room) return;
      const passo = e.shiftKey ? 1 : 0.1;
      const move = { ArrowLeft: [-passo, 0], ArrowRight: [passo, 0], ArrowUp: [0, passo], ArrowDown: [0, -passo] }[e.key];
      if (move) {
        e.preventDefault();
        change(
          rooms.map((r) => (r.id === room.id ? { ...r, x: round2(r.x + move[0]), y: round2(r.y + move[1]) } : r)),
          true,
        );
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        change(
          rooms.filter((r) => r.id !== room.id),
          true,
        );
        setSel(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const criar = (r: { x: number; y: number; w: number; h: number }) => {
    const n = rooms.filter((x) => x.tipo === tipo).length + 1;
    const id = `${tipo}-${Date.now()}`;
    const label = ROOM_INFO[tipo].label;
    change([...rooms, { id, tipo, nome: n > 1 ? `${label} ${n}` : label, ...r }], true);
    setSel(id);
    setTool("selecionar");
  };

  const porZona = (Object.keys(ZONE_LABELS) as Zone[])
    .map((z) => [z, rooms.filter((r) => ROOM_INFO[r.tipo].zone === z).reduce((s, r) => s + r.w * r.h, 0)] as const)
    .filter(([, a]) => a > 0);
  const total = rooms.reduce((s, r) => s + r.w * r.h, 0);

  return (
    <section id="construir" className="border-t border-line py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <Reveal className="mb-10 max-w-2xl">
          <RevealItem as="p" className="eyebrow">
            Construir do zero
          </RevealItem>
          <MaskText as="h2" className="mt-2 font-display text-4xl font-medium sm:text-5xl">
            Desenhe sua casa, cômodo por cômodo.
          </MaskText>
          <RevealItem as="p" className="mt-4 text-muted">
            Arraste na prancheta para criar cada ambiente. As portas, janelas, verificações, a elétrica, a água e o custo são calculados a cada traço.
          </RevealItem>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* Painel de ferramentas */}
          <aside className="panel min-w-0 space-y-6 rounded-2xl p-5">
            <div className="grid grid-cols-2 gap-2.5">
              <NumberField
                id="b-largura"
                label="Terreno: largura"
                unit="m"
                min={5}
                value={lot.largura}
                onChange={(v) => v >= 5 && setLot({ ...lot, largura: v })}
              />
              <NumberField
                id="b-fundo"
                label="Terreno: fundo"
                unit="m"
                min={8}
                value={lot.profundidade}
                onChange={(v) => v >= 8 && setLot({ ...lot, profundidade: v })}
              />
            </div>

            <div className="space-y-2">
              <p className="eyebrow">Ferramenta</p>
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-line p-1 text-sm">
                {(
                  [
                    ["selecionar", "Selecionar", Hand],
                    ["desenhar", "Desenhar", PencilRuler],
                  ] as const
                ).map(([t, l, Icon]) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTool(t)}
                    className={`relative flex items-center justify-center gap-1.5 rounded-md py-1.5 font-medium ${tool === t ? "text-ink" : "text-muted"}`}
                  >
                    {tool === t && (
                      <motion.span layoutId="b-tool" className="absolute inset-0 rounded-md bg-primary" transition={{ duration: DUR.base, ease: EASE }} />
                    )}
                    <Icon className="relative size-4" />
                    <span className="relative">{l}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="eyebrow">Cômodo a desenhar</p>
              <div className="flex flex-wrap gap-1.5">
                {PALETA.map((t) => (
                  <Chip
                    key={t}
                    active={tipo === t}
                    onClick={() => {
                      setTipo(t);
                      setTool("desenhar");
                    }}
                  >
                    {ROOM_INFO[t].label}
                  </Chip>
                ))}
              </div>
            </div>

            {room && (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DUR.base, ease: EASE }}
                className="space-y-3 rounded-xl border border-line bg-card p-3"
              >
                <input
                  key={room.id + room.nome}
                  id="b-nome"
                  aria-label="Nome do cômodo"
                  defaultValue={room.nome}
                  onBlur={(e) =>
                    e.target.value.trim() &&
                    change(
                      rooms.map((r) => (r.id === room.id ? { ...r, nome: e.target.value.trim() } : r)),
                      true,
                    )
                  }
                  className="w-full rounded-md border border-transparent bg-transparent font-display text-lg font-semibold outline-none hover:border-line focus:border-primary"
                />
                <label className="flex items-center gap-2 text-xs text-muted">
                  Tipo
                  <select
                    id="b-tipo"
                    value={room.tipo}
                    onChange={(e) =>
                      change(
                        rooms.map((r) => (r.id === room.id ? { ...r, tipo: e.target.value as RoomType } : r)),
                        true,
                      )
                    }
                    className="h-8 flex-1 rounded-md border border-line bg-bg px-2 text-sm text-ink"
                  >
                    {PALETA.map((t) => (
                      <option key={t} value={t}>
                        {ROOM_INFO[t].label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    id="b-w"
                    label="Largura"
                    unit="m"
                    min={0.8}
                    step={0.1}
                    value={room.w}
                    onChange={(v) =>
                      v >= 0.8 &&
                      change(
                        rooms.map((r) => (r.id === room.id ? { ...r, w: round2(v) } : r)),
                        true,
                      )
                    }
                  />
                  <NumberField
                    id="b-h"
                    label="Profundidade"
                    unit="m"
                    min={0.8}
                    step={0.1}
                    value={room.h}
                    onChange={(v) =>
                      v >= 0.8 &&
                      change(
                        rooms.map((r) => (r.id === room.id ? { ...r, h: round2(v) } : r)),
                        true,
                      )
                    }
                  />
                </div>
                <p className="tabular font-mono text-xs text-muted">
                  {fmt(room.w * room.h, 2)} m² · mínimo recomendado {fmt(ROOM_INFO[room.tipo].minWidth, 2)} m de largura · setas movem 10 cm
                </p>
                <button
                  type="button"
                  onClick={() => {
                    change(
                      rooms.filter((r) => r.id !== room.id),
                      true,
                    );
                    setSel(null);
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-xs text-muted hover:border-primary hover:text-primary"
                >
                  <Trash2 className="size-3.5" /> Apagar cômodo
                </button>
              </motion.div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={undo}
                disabled={!past.length}
                className="grid size-9 place-items-center rounded-lg border border-line text-muted disabled:opacity-30"
                aria-label="Desfazer"
              >
                <Undo2 className="size-4" />
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={!future.length}
                className="grid size-9 place-items-center rounded-lg border border-line text-muted disabled:opacity-30"
                aria-label="Refazer"
              >
                <Redo2 className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => change(exemploInicial(lot), true)}
                className="h-9 rounded-lg border border-line px-3 text-sm hover:border-ink/30"
              >
                Exemplo
              </button>
              <button
                type="button"
                onClick={() => {
                  change([], true);
                  setSel(null);
                  setTool("desenhar");
                }}
                className="h-9 rounded-lg border border-line px-3 text-sm hover:border-primary hover:text-primary"
              >
                Começar em branco
              </button>
            </div>

            <div className="space-y-2 border-t border-line pt-4">
              <p className="tabular flex items-baseline justify-between">
                <span className="eyebrow">Área total</span>
                <span className="font-display text-2xl font-semibold">{fmt(total)} m²</span>
              </p>
              {porZona.map(([z, a]) => (
                <p key={z} className="tabular flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted">
                    <span className="size-2.5 rounded-sm" style={{ background: ZONE_COLORS[z].stroke }} />
                    {ZONE_LABELS[z]}
                  </span>
                  <span className="font-mono text-xs">{fmt(a)} m²</span>
                </p>
              ))}
            </div>

            {checks.length > 0 && (
              <ul className="space-y-1.5 border-t border-line pt-4 text-xs">
                {checks.map((c) => (
                  <li key={c.texto} className="flex gap-2">
                    {c.ok ? <CircleCheck className="size-3.5 shrink-0 text-ok" /> : <CircleAlert className="size-3.5 shrink-0 text-warn" />}
                    <span className={c.ok ? "text-muted" : "text-warn"}>{c.texto}</span>
                  </li>
                ))}
                {plan?.issues
                  .filter((i) => /sobrepostos|fora do terreno|sem porta/.test(i))
                  .map((i) => (
                    <li key={i} className="flex gap-2 text-warn">
                      <CircleAlert className="size-3.5 shrink-0" /> {i}
                    </li>
                  ))}
              </ul>
            )}
          </aside>

          {/* Prancheta e camadas */}
          <div className="panel min-w-0 space-y-4 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line">
              <nav className="flex min-w-0 gap-1 overflow-x-auto text-sm" aria-label="Camadas do desenho">
                {ABAS.map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setAba(k)}
                    className={`relative shrink-0 px-3 py-2 font-medium ${aba === k ? "text-ink" : "text-muted hover:text-ink"}`}
                  >
                    {l}
                    {aba === k && (
                      <motion.span
                        layoutId="b-aba"
                        className="absolute inset-x-0 -bottom-px h-0.5 bg-primary"
                        transition={{ duration: DUR.base, ease: EASE }}
                      />
                    )}
                  </button>
                ))}
              </nav>
              <Botao3D plan={overlap.size ? null : plan} brief={brief} onEditar={() => setAba("desenho")} className="mb-1.5" />
            </div>
            <div className="relative overflow-hidden rounded-xl border border-line bg-[#121a18]">
              <div className="relative aspect-[4/5] w-full sm:aspect-[5/6] lg:aspect-[4/4.3]">
                <div className="absolute inset-0 p-2">
                  <ZoomPan>
                    {aba === "desenho" ? (
                      <BuilderCanvas
                        lot={lot}
                        rooms={rooms}
                        selectedId={sel}
                        tool={tool}
                        overlapping={overlap}
                        onSelect={setSel}
                        onCreate={criar}
                        onChange={(r) => change(r)}
                        onCommit={commit}
                      />
                    ) : plan ? (
                      <PlanViewer
                        plan={plan}
                        brief={brief}
                        selectedId={null}
                        onSelect={() => {}}
                        editMode={false}
                        animate={false}
                        layer={aba === "custo" ? "arquitetura" : aba}
                        overlay={
                          aba === "eletrica" && eletrica
                            ? (fy, toMeters) => <ElectricalOverlay e={eletrica} fy={fy} edit={editFiacao ? wiring.props(toMeters) : undefined} />
                            : aba === "hidraulica" && hidraulica
                              ? (fy) => <PlumbingOverlay h={hidraulica} fy={fy} />
                              : undefined
                        }
                      />
                    ) : (
                      <p className="grid h-full place-items-center text-sm text-muted">Desenhe ao menos um cômodo.</p>
                    )}
                  </ZoomPan>
                </div>
                {aba === "desenho" && (
                  <p className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-bg/90 px-2.5 py-1 text-[11px] text-ink">
                    {tool === "desenhar" ? `Arraste para desenhar: ${ROOM_INFO[tipo].label}` : "Arraste para mover · puxe os cantos para redimensionar"}
                  </p>
                )}
              </div>
            </div>
            {aba === "eletrica" && eletrica && plan && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditFiacao(!editFiacao)}
                    className={`h-9 rounded-lg border px-3 text-sm font-medium ${editFiacao ? "border-power bg-power text-bg" : "border-line"}`}
                  >
                    {editFiacao ? "Editando a fiação" : "Editar fiação"}
                  </button>
                  {aviso && <span className="text-xs text-muted">{aviso}</span>}
                </div>
                {editFiacao && <WiringToolbar wiring={wiring} e={eletrica} plan={plan} edit={(fn) => setEletricaEd((e) => fn(e))} />}
                <ElectricalPanel e={eletrica} />
              </div>
            )}
            {aba === "hidraulica" && hidraulica && <PlumbingPanel h={hidraulica} />}
            {aba === "custo" && plan && eletrica && hidraulica && <CostPanel plan={plan} e={eletrica} h={hidraulica} />}
          </div>
        </div>
      </div>
    </section>
  );
}
