import { motion } from "framer-motion";
import { Lightbulb, Move, Plug, RotateCcw, ToggleLeft, Trash2, Zap } from "lucide-react";
import { useState } from "react";
import { DUR, EASE } from "../lib/motion";
import { EDICAO_VAZIA, type EdicaoEletrica, type ProjetoEletrico } from "../lib/plan/electrical";
import type { Plan } from "../lib/types";
import type { EdicaoProps, FerramentaEletrica } from "./TechLayers";

/**
 * Editor de fiação: cada pessoa tem um gosto (tomada ao lado da cama, interruptor do outro lado da porta…).
 * Mover, acrescentar e apagar pontos, e trocar o circuito de um ponto. Disjuntores e cabos são recalculados.
 */

const FERRAMENTAS: { id: FerramentaEletrica; label: string; icon: typeof Move }[] = [
  { id: "mover", label: "Mover", icon: Move },
  { id: "tug", label: "+ Tomada", icon: Plug },
  { id: "luz", label: "+ Luz", icon: Lightbulb },
  { id: "interruptor", label: "+ Interruptor", icon: ToggleLeft },
  { id: "tue", label: "+ Ar/forno", icon: Zap },
  { id: "apagar", label: "Apagar", icon: Trash2 },
];

const NOME_TIPO: Record<string, string> = { luz: "Ponto de luz", interruptor: "Interruptor", tug: "Tomada de uso geral", tue: "Tomada de uso específico", quadro: "Quadro de distribuição" };
const SNAP = 0.05;
const snap = (v: number) => Math.round(v / SNAP) * SNAP;
const base = (nome: string) => nome.replace(/ \(\d+\)$/, "");

export function useWiringEditor(
  plan: Plan | null,
  edit: (fn: (e: EdicaoEletrica) => EdicaoEletrica, registrar?: boolean) => void,
  avisar: (m: string) => void,
) {
  const [ferramenta, setFerramenta] = useState<FerramentaEletrica>("mover");
  const [selecionado, setSelecionado] = useState<string | null>(null);

  const props = (toMeters: EdicaoProps["toMeters"]): EdicaoProps => ({
    ferramenta,
    selecionado,
    toMeters,
    onPick: (id) => {
      if (ferramenta === "apagar") {
        if (id === "quadro") return avisar("O quadro pode ser movido, mas não apagado.");
        edit((e) => ({ ...e, removidos: [...e.removidos, id] }));
        setSelecionado(null);
        return;
      }
      setSelecionado(id);
    },
    onMove: (id, pt, fase) => {
      if (fase === "inicio") return edit((e) => e); // registra o estado antes de arrastar
      edit((e) => ({ ...e, movidos: { ...e.movidos, [id]: { x: snap(pt.x), y: snap(pt.y) } } }), false);
    },
    onAdd: (pt) => {
      const room = plan?.rooms.find((r) => pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h);
      if (!room) return avisar("Clique dentro de um cômodo para acrescentar o ponto.");
      if (ferramenta === "mover" || ferramenta === "apagar") return;
      const id = `manual-${ferramenta}-${Date.now()}`;
      edit((e) => ({
        ...e,
        adicionados: [...e.adicionados, { id, kind: ferramenta, roomId: room.id, x: snap(pt.x), y: snap(pt.y), label: ferramenta === "tue" ? "Ar/forno" : undefined }],
      }));
      setSelecionado(id);
      avisar(`${NOME_TIPO[ferramenta]} acrescentado em ${room.nome}. Circuitos recalculados.`);
    },
  });

  return { ferramenta, setFerramenta, selecionado, setSelecionado, props };
}

export function WiringToolbar({
  wiring,
  e,
  plan,
  edit,
}: {
  wiring: ReturnType<typeof useWiringEditor>;
  e: ProjetoEletrico;
  plan: Plan;
  edit: (fn: (x: EdicaoEletrica) => EdicaoEletrica, registrar?: boolean) => void;
}) {
  const ponto = e.pontos.find((p) => p.id === wiring.selecionado);
  const circuito = ponto ? e.circuitos.find((c) => c.id === ponto.circuito) : undefined;
  const nomes = [...new Set(e.circuitos.map((c) => base(c.nome)))];
  const sala = ponto ? plan.rooms.find((r) => r.id === ponto.roomId) : undefined;

  return (
    <div className="space-y-3 rounded-xl border border-line bg-card p-3">
      <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Ferramentas da fiação">
        {FERRAMENTAS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={wiring.ferramenta === f.id}
            onClick={() => wiring.setFerramenta(f.id)}
            className={`relative inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${wiring.ferramenta === f.id ? "text-bg" : "text-muted hover:text-ink"}`}
          >
            {wiring.ferramenta === f.id && <motion.span layoutId="ferramenta" className="absolute inset-0 rounded-md bg-power" transition={{ duration: DUR.base, ease: EASE }} />}
            <f.icon className="relative size-3.5" />
            <span className="relative">{f.label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => edit(() => EDICAO_VAZIA)}
          className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-xs text-muted hover:text-ink"
        >
          <RotateCcw className="size-3.5" /> Fiação automática
        </button>
      </div>
      <p className="text-xs text-muted">
        {wiring.ferramenta === "mover"
          ? "Arraste qualquer símbolo (inclusive o quadro). Clique num ponto para trocar de circuito."
          : wiring.ferramenta === "apagar"
            ? "Clique no ponto que quer remover."
            : "Clique dentro do cômodo onde quer o ponto novo."}
      </p>
      {ponto && ponto.kind !== "quadro" && (
        <motion.div
          key={ponto.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.base, ease: EASE }}
          className="flex flex-wrap items-center gap-3 border-t border-line pt-3 text-sm"
        >
          <span className="min-w-0">
            <span className="block font-medium">{NOME_TIPO[ponto.kind]}</span>
            <span className="block text-xs text-muted">
              {sala?.nome} · {ponto.va} VA · circuito {circuito?.id} ({circuito?.nome})
            </span>
          </span>
          {ponto.kind !== "interruptor" && (
            <label className="ml-auto flex items-center gap-2 text-xs text-muted">
              Mudar para
              <select
                id="circuito-ponto"
                value={circuito ? base(circuito.nome) : ""}
                onChange={(ev) => {
                  const nome = ev.target.value === "__novo" ? `Circuito extra ${e.circuitos.length + 1}` : ev.target.value;
                  edit((x) => ({ ...x, circuito: { ...x.circuito, [ponto.id]: nome } }));
                }}
                className="h-8 max-w-[14rem] rounded-md border border-line bg-bg px-2 text-xs text-ink"
              >
                {nomes.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
                <option value="__novo">+ Novo circuito só para este ponto</option>
              </select>
            </label>
          )}
          <button
            type="button"
            onClick={() => {
              edit((x) => ({ ...x, removidos: [...x.removidos, ponto.id] }));
              wiring.setSelecionado(null);
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-xs text-muted hover:border-primary hover:text-primary"
          >
            <Trash2 className="size-3.5" /> Apagar
          </button>
        </motion.div>
      )}
    </div>
  );
}
