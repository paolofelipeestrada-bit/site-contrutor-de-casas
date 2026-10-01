import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { DUR, EASE, EASE_DRAW, STAGGER } from "../lib/motion";
import type { ProjetoEletrico } from "../lib/plan/electrical";
import type { ProjetoHidraulico } from "../lib/plan/plumbing";
import type { Pt } from "../lib/plan/geometry";

/** Cores técnicas (convenção de desenho: elétrica amarela, água azul, esgoto marrom). */
export const TECH = { power: "#E2B65A", water: "#7FB3C8", sewer: "#b98a63", label: "#F4F1EA" };

type Fy = (y: number) => number;
const poly = (pts: Pt[], fy: Fy) => pts.map((p) => `${p.x},${fy(p.y)}`).join(" ");
/** Traço que se desenha (pathLength 0 → 1). */
const draw = (delay: number) => ({
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: { delay, duration: DUR.traco, ease: EASE_DRAW },
});
/** Símbolo que surge no lugar, crescendo a partir do próprio centro. */
const popIn = (delay: number) => ({
  initial: { opacity: 0, scale: 0.3 },
  animate: { opacity: 1, scale: 1 },
  transition: { delay, duration: 0.6, ease: EASE },
  style: { transformBox: "fill-box" as const, transformOrigin: "center" },
});

const fmt = (v: number, d = 0) => v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

// ─────────────── Desenho sobre a planta ───────────────

/** Ferramentas do editor de fiação. */
export type FerramentaEletrica = "mover" | "luz" | "tug" | "tue" | "interruptor" | "apagar";

export interface EdicaoProps {
  ferramenta: FerramentaEletrica;
  selecionado: string | null;
  onPick: (id: string) => void;
  onMove: (id: string, pt: { x: number; y: number }, fase: "inicio" | "move") => void;
  onAdd: (pt: { x: number; y: number }) => void;
  toMeters: (e: { clientX: number; clientY: number }) => { x: number; y: number };
}

export function ElectricalOverlay({ e, fy, edit }: { e: ProjetoEletrico; fy: Fy; edit?: EdicaoProps }) {
  const c = TECH.power;
  const [arrastando, setArrastando] = useState<string | null>(null);
  const fade = (delay: number) => ({ initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay, duration: DUR.lento, ease: EASE } });
  return (
    <g pointerEvents={edit ? "auto" : "none"}>
      {edit && (
        // área de clique para acrescentar pontos
        <rect
          x={-50}
          y={-50}
          width={200}
          height={200}
          fill="transparent"
          style={{ cursor: edit.ferramenta === "mover" || edit.ferramenta === "apagar" ? "default" : "crosshair" }}
          onPointerDown={(ev) => {
            if (edit.ferramenta !== "mover" && edit.ferramenta !== "apagar") edit.onAdd(edit.toMeters(ev));
          }}
        />
      )}
      <g pointerEvents="none">
        {e.trechos.map((t, i) =>
          t.tipo === "Iluminação" ? (
            <motion.polyline {...draw(i * STAGGER.longo)} key={t.circuito} points={poly(t.pts, fy)} fill="none" stroke={c} strokeWidth={0.035} strokeOpacity={0.6} />
          ) : (
            <motion.polyline
              {...fade(0.6 + i * STAGGER.longo)}
              key={t.circuito}
              points={poly(t.pts, fy)}
              fill="none"
              stroke={c}
              strokeWidth={0.035}
              strokeOpacity={0.6}
              strokeDasharray={t.tipo === "Tomadas" ? "0.16 0.1" : "0.3 0.08 0.05 0.08"}
            />
          ),
        )}
        {e.comandos.map((k, i) => (
          <motion.line
            {...fade(1 + i * STAGGER.curto)}
            key={i}
            x1={k.a.x}
            y1={fy(k.a.y)}
            x2={k.b.x}
            y2={fy(k.b.y)}
            stroke={c}
            strokeWidth={0.02}
            strokeDasharray="0.06 0.06"
            strokeOpacity={0.7}
          />
        ))}
      </g>
      {e.pontos.map((p, i) => {
        const sel = edit?.selecionado === p.id;
        return (
          <motion.g
            key={p.id}
            {...popIn(0.3 + (p.circuito - 1 + (p.kind === "quadro" ? 0 : 1)) * STAGGER.longo + (i % 6) * 0.02)}
            style={{ ...popIn(0).style, cursor: edit ? (edit.ferramenta === "apagar" ? "not-allowed" : "grab") : undefined }}
            onPointerDown={
              edit
                ? (ev) => {
                    ev.stopPropagation();
                    edit.onPick(p.id);
                    if (edit.ferramenta === "mover") {
                      (ev.target as Element).setPointerCapture(ev.pointerId);
                      setArrastando(p.id);
                      edit.onMove(p.id, { x: p.x, y: p.y }, "inicio");
                    }
                  }
                : undefined
            }
            onPointerMove={edit && arrastando === p.id ? (ev) => edit.onMove(p.id, edit.toMeters(ev), "move") : undefined}
            onPointerUp={edit ? () => setArrastando(null) : undefined}
          >
            {/* alvo de toque maior que o símbolo */}
            {edit && <circle cx={p.x} cy={fy(p.y)} r={0.32} fill="transparent" />}
            {sel && <circle cx={p.x} cy={fy(p.y)} r={0.34} fill="none" stroke="#F4F1EA" strokeWidth={0.04} strokeDasharray="0.08 0.06" />}
            {simbolo(p, fy, c)}
          </motion.g>
        );
      })}
    </g>
  );
}

function simbolo(p: ProjetoEletrico["pontos"][number], fy: Fy, c: string) {
  const x = p.x;
  const y = fy(p.y);
  switch (p.kind) {
    case "luz":
      return (
        <g>
          <circle cx={x} cy={y} r={0.2} fill="#121a18" stroke={c} strokeWidth={0.04} />
          <path d={`M${x - 0.14} ${y - 0.14} L${x + 0.14} ${y + 0.14} M${x + 0.14} ${y - 0.14} L${x - 0.14} ${y + 0.14}`} stroke={c} strokeWidth={0.03} />
          <text x={x + 0.26} y={y - 0.14} fontSize={0.18} fill={c} fontFamily="var(--font-mono)">
            {p.circuito}
          </text>
        </g>
      );
    case "interruptor":
      return (
        <g>
          <circle cx={x} cy={y} r={0.08} fill={c} />
          <text x={x + 0.12} y={y + 0.06} fontSize={0.17} fill={c} fontFamily="var(--font-mono)">
            S
          </text>
        </g>
      );
    case "tug":
      return <path d={`M${x} ${y - 0.14} L${x + 0.13} ${y + 0.09} L${x - 0.13} ${y + 0.09} Z`} fill="#121a18" stroke={c} strokeWidth={0.03} />;
    case "tue":
      return (
        <g>
          <path d={`M${x} ${y - 0.16} L${x + 0.15} ${y + 0.1} L${x - 0.15} ${y + 0.1} Z`} fill={c} />
          <text x={x + 0.2} y={y + 0.06} fontSize={0.17} fill={c} fontFamily="var(--font-mono)">
            {p.label}
          </text>
        </g>
      );
    case "quadro":
      return (
        <g>
          <rect x={x - 0.3} y={y - 0.13} width={0.6} height={0.26} fill={c} />
          <text x={x} y={y + 0.07} fontSize={0.17} textAnchor="middle" fill="#121a18" fontWeight={700} fontFamily="var(--font-mono)">
            QD
          </text>
        </g>
      );
  }
}

export function PlumbingOverlay({ h, fy }: { h: ProjetoHidraulico; fy: Fy }) {
  const w = TECH.water;
  const s = TECH.sewer;
  const r = h.reservatorio;
  return (
    <g pointerEvents="none">
      {h.trechos.map((t, i) => (
        <motion.polyline
          {...draw((t.tipo === "fria" ? 0 : 0.9) + (i % 12) * STAGGER.curto)}
          key={i}
          points={poly(t.pts, fy)}
          fill="none"
          stroke={t.tipo === "fria" ? w : s}
          strokeWidth={t.tipo === "fria" ? 0.05 : t.diametro >= 100 ? 0.1 : 0.06}
          strokeDasharray={t.tipo === "esgoto" ? "0.25 0.1" : undefined}
          strokeLinejoin="round"
        />
      ))}
      <rect
        x={r.x - 0.6}
        y={fy(r.y) - 0.6}
        width={1.2}
        height={1.2}
        fill="#121a18"
        fillOpacity={0.6}
        stroke={w}
        strokeWidth={0.05}
        strokeDasharray="0.15 0.08"
      />
      <text x={r.x} y={fy(r.y) + 0.07} fontSize={0.2} textAnchor="middle" fill={w} fontFamily="var(--font-mono)">
        {r.litros} L
      </text>
      <rect x={h.hidrometro.x - 0.25} y={fy(h.hidrometro.y) - 0.15} width={0.5} height={0.3} fill={w} />
      <text x={h.hidrometro.x + 0.35} y={fy(h.hidrometro.y) + 0.07} fontSize={0.2} fill={w} fontFamily="var(--font-mono)">
        HD
      </text>
      <text x={h.ligacaoRede.x + 0.2} y={fy(h.ligacaoRede.y) + 0.07} fontSize={0.2} fill={s} fontFamily="var(--font-mono)">
        REDE
      </text>
      {h.aparelhos.map((a, i) => (
        <motion.circle {...popIn(0.5 + i * STAGGER.curto)} key={i} cx={a.x} cy={fy(a.y)} r={0.09} fill={w} stroke="#121a18" strokeWidth={0.02} />
      ))}
      {h.caixas.map((c, i) =>
        c.tipo === "CS" ? (
          <motion.circle {...popIn(1.4 + i * STAGGER.base)} key={i} cx={c.x} cy={fy(c.y)} r={0.15} fill="#121a18" stroke={s} strokeWidth={0.04} />
        ) : (
          <motion.g key={i} {...popIn(1.4 + i * STAGGER.base)}>
            <rect x={c.x - 0.25} y={fy(c.y) - 0.25} width={0.5} height={0.5} fill="#121a18" stroke={s} strokeWidth={0.05} />
            <text x={c.x} y={fy(c.y) + 0.07} fontSize={0.18} textAnchor="middle" fill={s} fontFamily="var(--font-mono)">
              {c.label}
            </text>
          </motion.g>
        ),
      )}
    </g>
  );
}

// ─────────────── Painéis abaixo da planta ───────────────

function Legend({ items }: { items: [ReactNode, string][] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
      {items.map(([icon, label]) => (
        <li key={label} className="flex items-center gap-1.5">
          <svg width="22" height="12" viewBox="0 0 22 12" aria-hidden>
            {icon}
          </svg>
          {label}
        </li>
      ))}
    </ul>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <p className="tabular font-mono text-lg text-ink">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}

export function ElectricalPanel({ e }: { e: ProjetoEletrico }) {
  const c = TECH.power;
  const count = (k: string) => e.pontos.filter((p) => p.kind === k).length;
  return (
    <div className="space-y-4">
      <Legend
        items={[
          [
            <>
              <circle cx="11" cy="6" r="5" fill="none" stroke={c} />
              <path d="M7.5 2.5l7 7m0-7l-7 7" stroke={c} />
            </>,
            "Ponto de luz (teto)",
          ],
          [
            <>
              <circle cx="8" cy="6" r="2.5" fill={c} />
              <text x="12" y="9" fontSize="8" fill={c}>
                S
              </text>
            </>,
            "Interruptor",
          ],
          [<path d="M11 2l4.5 8h-9z" fill="none" stroke={c} />, "Tomada de uso geral"],
          [<path d="M11 2l4.5 8h-9z" fill={c} />, "Tomada de uso específico"],
          [<rect x="3" y="3" width="16" height="6" fill={c} />, "Quadro de distribuição"],
          [<path d="M1 6h20" stroke={c} strokeDasharray="4 2" />, "Eletroduto (circuito)"],
        ]}
      />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <Stat value={String(count("luz"))} label="pontos de luz" />
        <Stat value={String(count("tug"))} label="tomadas TUG" />
        <Stat value={String(count("tue"))} label="tomadas TUE" />
        <Stat value={String(e.circuitos.length)} label="circuitos" />
        <Stat value={`${fmt(e.totalVA / 1000, 1)} kVA`} label="carga instalada" />
        <Stat value={`${e.eletrodutoM} m`} label="eletroduto aprox." />
      </div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="tabular w-full min-w-[520px] text-left text-xs">
          <thead className="bg-card text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Nº</th>
              <th className="px-3 py-2 font-medium">Circuito</th>
              <th className="px-3 py-2 text-right font-medium">Pontos</th>
              <th className="px-3 py-2 text-right font-medium">Carga</th>
              <th className="px-3 py-2 text-right font-medium">Corrente</th>
              <th className="px-3 py-2 text-right font-medium">Disjuntor</th>
              <th className="px-3 py-2 text-right font-medium">Cabo</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {e.circuitos.map((k) => (
              <tr key={k.id} className="border-t border-line">
                <td className="px-3 py-1.5 text-muted">{k.id}</td>
                <td className="px-3 py-1.5 font-sans text-ink">{k.nome}</td>
                <td className="px-3 py-1.5 text-right">{k.pontos}</td>
                <td className="px-3 py-1.5 text-right">{fmt(k.va)} VA</td>
                <td className="px-3 py-1.5 text-right">{fmt(k.corrente, 1)} A</td>
                <td className="px-3 py-1.5 text-right">{k.disjuntor} A</td>
                <td className="px-3 py-1.5 text-right">{fmt(k.cabo, 1)} mm²</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        Esquema preliminar com critérios simplificados da NBR 5410 (220 V, cobre/PVC embutido). O projeto executivo, o padrão de entrada e o DR devem ser
        definidos por um engenheiro eletricista.
      </p>
    </div>
  );
}

export function PlumbingPanel({ h }: { h: ProjetoHidraulico }) {
  return (
    <div className="space-y-4">
      <Legend
        items={[
          [<path d="M1 6h20" stroke={TECH.water} strokeWidth="2" />, "Água fria"],
          [<path d="M1 6h20" stroke={TECH.sewer} strokeWidth="2.5" strokeDasharray="5 2" />, "Esgoto"],
          [<circle cx="11" cy="6" r="3" fill={TECH.water} />, "Aparelho (pia, vaso, chuveiro…)"],
          [<circle cx="11" cy="6" r="4" fill="none" stroke={TECH.sewer} />, "Caixa sifonada"],
          [<rect x="6" y="1" width="10" height="10" fill="none" stroke={TECH.sewer} />, "Caixa de inspeção / gordura"],
          [<rect x="5" y="1" width="12" height="10" fill="none" stroke={TECH.water} strokeDasharray="3 2" />, "Caixa d'água"],
        ]}
      />
      <div className="grid grid-cols-3 gap-3">
        <Stat value={String(h.aparelhos.length)} label="aparelhos com água" />
        <Stat value={`${h.reservatorio.litros} L`} label="caixa d'água" />
        <Stat value={String(h.caixas.filter((c) => c.tipo !== "CS").length)} label="caixas externas" />
      </div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="tabular w-full min-w-[420px] text-left text-xs">
          <thead className="bg-card text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Material</th>
              <th className="px-3 py-2 text-right font-medium">Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {h.materiais.map((m) => (
              <tr key={m.item} className="border-t border-line">
                <td className="px-3 py-1.5 text-ink">{m.item}</td>
                <td className="px-3 py-1.5 text-right font-mono">
                  {m.qtd} {m.unidade}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        Esquema preliminar (NBR 5626 e NBR 8160 simplificadas): traçados ortogonais, quantidades com 10% de perdas. Caimentos, ventilação e água quente ficam
        para o projeto executivo.
      </p>
    </div>
  );
}
