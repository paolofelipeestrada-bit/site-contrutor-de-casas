import { motion } from "framer-motion";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { ZONE_COLORS } from "../lib/catalog";
import { DUR, EASE, EASE_DRAW, PLANTA, STAGGER } from "../lib/motion";
import { furnitureFor, type Piece } from "../lib/plan/furniture";
import type { SplitHandle } from "../lib/layout/slicing";
import type { Brief, Opening, PlacedRoom, Plan } from "../lib/types";

interface Props {
  plan: Plan;
  brief: Brief;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  editMode: boolean;
  /** true quando a planta é nova (anima o desenho); false durante edições */
  animate: boolean;
  onDrag?: (h: SplitHandle, pos: number, phase: "move" | "end") => void;
  showFurniture?: boolean;
  /** enquadramento: só a casa (padrão) ou o terreno inteiro com a rua */
  zoom?: "casa" | "terreno";
  /** camada técnica ativa: esconde móveis e clareia a arquitetura */
  layer?: Layer;
  /** desenho extra (elétrica, hidráulica) em metros, por cima da planta */
  overlay?: (fy: (y: number) => number) => ReactNode;
  /** miniatura: sem cotas, rótulos, móveis nem interação */
  thumbnail?: boolean;
}

export type Layer = "arquitetura" | "eletrica" | "hidraulica";

const fmt = (v: number, d = 2) => v.toFixed(d).replace(".", ",");
const WALL = 0.14;
const BG = "#141518";

export function PlanViewer({
  plan,
  brief,
  selectedId,
  onSelect,
  editMode,
  animate,
  onDrag,
  showFurniture = true,
  zoom = "casa",
  layer = "arquitetura",
  overlay,
  thumbnail = false,
}: Props) {
  const tecnica = layer !== "arquitetura";
  showFurniture = showFurniture && !tecnica && !thumbnail;
  if (thumbnail) {
    animate = false;
    editMode = false;
  }
  const { lot, footprint: fp } = plan;
  const fy = (y: number) => lot.depth - y; // rua embaixo
  const pad = 1.8;
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [hoverHandle, setHoverHandle] = useState<string | null>(null);

  const furniture = useMemo(
    () => (showFurniture ? plan.rooms.map((r) => ({ id: r.id, pieces: furnitureFor(r, plan.openings, brief.carro) })) : []),
    [plan, brief.carro, showFurniture],
  );

  const toMeters = (e: React.PointerEvent) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: p.x, y: lot.depth - p.y };
  };

  const onlyCorridor = (ids: string[]) => ids.every((id) => id.startsWith("circulacao"));
  const handles = editMode && !tecnica ? plan.handles.filter((h) => !onlyCorridor(h.before) && !onlyCorridor(h.after)) : [];
  const d = (i: number) => (animate ? i : 0);

  return (
    <svg
      ref={svgRef}
      viewBox={
        zoom === "terreno"
          ? `${-pad} ${-pad} ${lot.width + pad * 2} ${lot.depth + pad * 2 + 1.2}`
          : `${fp.x - 1.3} ${fy(fp.y + fp.h) - 1.3} ${fp.w + 2.6} ${fp.h + 2.6}`
      }
      style={{ transition: "all .5s" }}
      className="h-full w-full touch-none select-none"
      role="img"
      aria-label={`Planta baixa: ${plan.rooms.map((r) => r.nome).join(", ")}`}
      onPointerDown={(e) => {
        if (e.target === svgRef.current) onSelect(null);
      }}
    >
      <defs>
        <pattern id="hatch" width="0.5" height="0.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="0.5" stroke="rgba(255,255,255,0.05)" strokeWidth="0.08" />
        </pattern>
        <linearGradient id="street" x1="0" x2="1">
          <stop offset="0" stopColor="#1b1d21" />
          <stop offset="1" stopColor="#1b1d21" />
        </linearGradient>
      </defs>

      {/* Terreno, recuos e rua */}
      {!thumbnail && (
      <>
      <motion.rect
        x={0}
        y={0}
        width={lot.width}
        height={lot.depth}
        fill="url(#hatch)"
        stroke="rgba(236,235,231,0.25)"
        strokeWidth={0.06}
        strokeDasharray="0.4 0.25"
        initial={animate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <rect x={-pad} y={lot.depth + 0.25} width={lot.width + pad * 2} height={1.6} fill="url(#street)" rx={0.1} />
      <line
        x1={-pad}
        x2={lot.width + pad}
        y1={lot.depth + 1.05}
        y2={lot.depth + 1.05}
        stroke="rgba(236,235,231,0.25)"
        strokeWidth={0.06}
        strokeDasharray="0.6 0.5"
        className="animate-dash"
        style={{ strokeDashoffset: 0 }}
      />
      <text x={lot.width / 2} y={lot.depth + 1.5} textAnchor="middle" fontSize={0.34} fill="#8a8983" letterSpacing={0.25} fontFamily="var(--font-mono)">
        RUA · FRENTE DO TERRENO
      </text>
      <DimH x1={0} x2={lot.width} y={-0.9} label={`${fmt(lot.width)} m`} color="#8a8983" />
      <DimV y1={0} y2={lot.depth} x={lot.width + 0.9} label={`${fmt(lot.depth)} m`} color="#8a8983" />
      {plan.setbacks.front > 0 && (
        <text x={fp.x + fp.w / 2} y={fy(plan.setbacks.front / 2) + 0.12} textAnchor="middle" fontSize={0.3} fill="#7d7c76" fontFamily="var(--font-mono)">
          recuo frontal {fmt(plan.setbacks.front, 1)} m
        </text>
      )}

      {/* Projeção da casa */}
      <DimH x1={fp.x} x2={fp.x + fp.w} y={fy(fp.y + fp.h) - 0.45} label={`${fmt(fp.w)} m`} color="#e07a3f" />
      <DimV y1={fy(fp.y + fp.h)} y2={fy(fp.y)} x={fp.x - 0.5} label={`${fmt(fp.h)} m`} color="#e07a3f" />
      </>
      )}

      {/* Pisos dos cômodos */}
      {plan.rooms.map((r, i) => {
        const c = ZONE_COLORS[r.zone];
        const selected = r.id === selectedId;
        return (
          <motion.rect
            key={`f-${r.id}`}
            x={r.x}
            y={fy(r.y + r.h)}
            width={r.w}
            height={r.h}
            fill={c.fill}
            initial={animate ? { opacity: 0 } : false}
            animate={{ opacity: tecnica ? 0.35 : editMode && selectedId && !selected ? 0.45 : 1 }}
            transition={{ delay: animate ? PLANTA.pisos + d(i) * STAGGER.curto : 0, duration: DUR.base, ease: EASE }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onSelect(r.id === selectedId ? null : r.id);
            }}
            className="cursor-pointer"
          />
        );
      })}

      {/* Mobiliário em tamanho real */}
      {furniture.map(({ id, pieces }, i) => (
        <motion.g
          key={`m-${id}`}
          initial={animate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: animate ? PLANTA.moveis + d(i) * STAGGER.curto : 0, duration: DUR.base, ease: EASE }}
          pointerEvents="none"
        >
          {pieces.map((p, j) => (
            <PieceShape key={j} p={p} fy={fy} />
          ))}
        </motion.g>
      ))}

      {/* Paredes */}
      {plan.rooms.map((r, i) => (
        <motion.rect
          key={`w-${r.id}`}
          x={r.x}
          y={fy(r.y + r.h)}
          width={r.w}
          height={r.h}
          fill="none"
          stroke={r.zone === "outdoor" ? "rgba(143,181,115,0.7)" : "#ecebe7"}
          strokeWidth={r.zone === "outdoor" ? 0.05 : WALL * 0.7}
          strokeDasharray={r.zone === "outdoor" ? "0.25 0.15" : undefined}
          strokeLinejoin="miter"
          initial={animate ? { pathLength: 0, opacity: 0 } : false}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: animate ? PLANTA.paredes + d(i) * STAGGER.curto : 0, duration: animate ? DUR.traco * 0.7 : 0, ease: EASE_DRAW }}
          pointerEvents="none"
        />
      ))}
      <motion.rect
        x={fp.x}
        y={fy(fp.y + fp.h)}
        width={fp.w}
        height={fp.h}
        fill="none"
        stroke="#ecebe7"
        strokeWidth={WALL * 1.4}
        initial={animate ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ delay: PLANTA.contorno, duration: animate ? DUR.traco * 1.3 : 0, ease: EASE_DRAW }}
        pointerEvents="none"
        
      />

      {/* Portas, passagens e janelas */}
      <motion.g
        initial={animate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ delay: animate ? PLANTA.aberturas : 0, duration: DUR.base, ease: EASE }}
        pointerEvents="none"
      >
        {plan.openings.map((o, i) => (
          <OpeningShape key={i} o={o} rooms={plan.rooms} fy={fy} />
        ))}
      </motion.g>

      {/* Rótulos */}
      {!thumbnail &&
        plan.rooms.map((r, i) => (
          <RoomLabel key={`l-${r.id}`} r={r} fy={fy} delay={animate ? PLANTA.rotulos + d(i) * STAGGER.curto : 0} animate={animate} selected={r.id === selectedId} muted={tecnica} />
        ))}

      {/* Camada técnica */}
      {overlay?.(fy)}

      {/* Seleção */}
      {selectedId &&
        plan.rooms
          .filter((r) => r.id === selectedId)
          .map((r) => (
            <motion.rect
              key={`sel-${r.id}-${r.w.toFixed(2)}-${r.h.toFixed(2)}`}
              x={r.x + 0.06}
              y={fy(r.y + r.h) + 0.06}
              width={r.w - 0.12}
              height={r.h - 0.12}
              rx={0.08}
              fill="none"
              stroke="#e07a3f"
              strokeWidth={0.09}
              
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              pointerEvents="none"
            />
          ))}

      {/* Paredes arrastáveis (modo editar) */}
      {handles.map((h) => {
        const active = dragging === h.id || hoverHandle === h.id;
        const line =
          h.axis === "x"
            ? { x1: h.pos, x2: h.pos, y1: fy(h.from), y2: fy(h.to) }
            : { x1: h.from, x2: h.to, y1: fy(h.pos), y2: fy(h.pos) };
        const mid = h.axis === "x" ? { x: h.pos, y: fy((h.from + h.to) / 2) } : { x: (h.from + h.to) / 2, y: fy(h.pos) };
        return (
          <g key={h.id}>
            <line {...line} stroke={active ? "#e07a3f" : "rgba(224,122,63,0.4)"} strokeWidth={active ? 0.12 : 0.06} strokeDasharray={active ? undefined : "0.2 0.15"} pointerEvents="none" />
            <circle cx={mid.x} cy={mid.y} r={active ? 0.24 : 0.17} fill="#e07a3f" stroke={BG} strokeWidth={0.05} pointerEvents="none" />
            <line
              {...line}
              stroke="transparent"
              strokeWidth={0.55}
              style={{ cursor: h.axis === "x" ? "ew-resize" : "ns-resize" }}
              onPointerEnter={() => setHoverHandle(h.id)}
              onPointerLeave={() => setHoverHandle(null)}
              onPointerDown={(e) => {
                e.stopPropagation();
                (e.target as Element).setPointerCapture(e.pointerId);
                setDragging(h.id);
              }}
              onPointerMove={(e) => {
                if (dragging !== h.id) return;
                const m = toMeters(e);
                onDrag?.(h, h.axis === "x" ? m.x : m.y, "move");
              }}
              onPointerUp={(e) => {
                if (dragging !== h.id) return;
                const m = toMeters(e);
                setDragging(null);
                onDrag?.(h, h.axis === "x" ? m.x : m.y, "end");
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}

function RoomLabel({ r, fy, delay, animate, selected, muted }: { r: PlacedRoom; fy: (y: number) => number; delay: number; animate: boolean; selected: boolean; muted?: boolean }) {
  if (muted) {
    return (
      <text x={r.x + r.w / 2} y={fy(r.y + r.h) + 0.42} textAnchor="middle" fontSize={0.24} fill="#8a8983" fontFamily="var(--font-mono)" pointerEvents="none">
        {r.tipo === "circulacao" ? "" : r.nome.toUpperCase()}
      </text>
    );
  }
  const short = Math.min(r.w, r.h);
  const area = r.w * r.h;
  const c = ZONE_COLORS[r.zone];
  const tiny = short < 1.45;
  const fs = tiny ? 0.22 : short < 2.2 ? 0.27 : 0.33;
  const cx = r.x + r.w / 2;
  const cy = fy(r.y + r.h / 2);
  const vertical = r.h > r.w * 1.8 && r.w < 1.6;
  if (r.tipo === "circulacao" && short < 1.3) {
    return (
      <text x={cx} y={cy} fontSize={0.2} fill="#64748b" textAnchor="middle" transform={vertical ? `rotate(-90 ${cx} ${cy})` : undefined} pointerEvents="none" fontFamily="var(--font-mono)" letterSpacing={0.08}>
        CIRCULAÇÃO
      </text>
    );
  }
  return (
    <motion.g
      initial={animate ? { opacity: 0, y: 0.3 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: DUR.base, ease: EASE }}
      pointerEvents="none"
      transform={vertical ? `rotate(-90 ${cx} ${cy})` : undefined}
    >
      <text x={cx} y={cy - (tiny ? 0.05 : 0.18)} textAnchor="middle" fontSize={fs} fontWeight={600} fill={selected ? "#fff" : c.text} fontFamily="var(--font-sans)" style={{ paintOrder: "stroke" }} stroke={BG} strokeWidth={0.08}>
        {(vertical ? r.h : r.w) < r.nome.length * fs * 0.6 ? r.nome.split(" ")[0] : r.nome}
      </text>
      <text x={cx} y={cy + fs * 0.95} textAnchor="middle" fontSize={fs * 0.82} fill="#ffffff" fontWeight={600} fontFamily="var(--font-mono)" style={{ paintOrder: "stroke" }} stroke={BG} strokeWidth={0.07}>
        {fmt(area, 1)} m²
      </text>
      {!tiny && (
        <text x={cx} y={cy + fs * 1.85} textAnchor="middle" fontSize={fs * 0.66} fill="#8a8983" fontFamily="var(--font-mono)" style={{ paintOrder: "stroke" }} stroke={BG} strokeWidth={0.06}>
          {fmt(r.w)} × {fmt(r.h)} m
        </text>
      )}
    </motion.g>
  );
}

function PieceShape({ p, fy }: { p: Piece; fy: (y: number) => number }) {
  const stroke = "rgba(236,235,231,0.5)";
  const fill = p.kind !== "line" && p.tone === "strong" ? "rgba(236,235,231,0.08)" : p.kind !== "line" && p.tone === "accent" ? "rgba(236,235,231,0.05)" : "rgba(236,235,231,0.03)";
  if (p.kind === "rect") return <rect x={p.x} y={fy(p.y + p.h)} width={p.w} height={p.h} rx={p.r ?? 0.05} fill={fill} stroke={stroke} strokeWidth={0.025} />;
  if (p.kind === "circle") return <circle cx={p.cx} cy={fy(p.cy)} r={p.r} fill={fill} stroke={stroke} strokeWidth={0.025} />;
  return <line x1={p.x1} y1={fy(p.y1)} x2={p.x2} y2={fy(p.y2)} stroke={stroke} strokeWidth={0.02} />;
}

function OpeningShape({ o, rooms, fy }: { o: Opening; rooms: PlacedRoom[]; fy: (y: number) => number }) {
  const horizontal = Math.abs(o.y1 - o.y2) < 1e-6;
  const len = Math.hypot(o.x2 - o.x1, o.y2 - o.y1);
  const gap = <line x1={o.x1} y1={fy(o.y1)} x2={o.x2} y2={fy(o.y2)} stroke={BG} strokeWidth={WALL * 1.9} />;

  if (o.kind === "window") {
    const off = 0.06;
    const pts = horizontal
      ? [
          [o.x1, fy(o.y1) - off, o.x2, fy(o.y2) - off],
          [o.x1, fy(o.y1) + off, o.x2, fy(o.y2) + off],
        ]
      : [
          [o.x1 - off, fy(o.y1), o.x2 - off, fy(o.y2)],
          [o.x1 + off, fy(o.y1), o.x2 + off, fy(o.y2)],
        ];
    return (
      <g>
        {gap}
        {pts.map(([a, b, c, d], i) => (
          <line key={i} x1={a} y1={b} x2={c} y2={d} stroke="#a9c3d6" strokeWidth={0.04} />
        ))}
        <line x1={o.x1} y1={fy(o.y1)} x2={o.x2} y2={fy(o.y2)} stroke="#a9c3d6" strokeWidth={0.025} opacity={0.7} />
      </g>
    );
  }
  if (o.kind === "passage") {
    return gap;
  }
  if (o.kind === "garage_door") {
    return (
      <g>
        {gap}
        <line x1={o.x1} y1={fy(o.y1)} x2={o.x2} y2={fy(o.y2)} stroke="#c9c7c0" strokeWidth={0.06} strokeDasharray="0.3 0.15" />
      </g>
    );
  }
  if (o.kind === "slide") {
    const off = 0.05;
    const half = horizontal ? (o.x2 - o.x1) / 2 : (o.y2 - o.y1) / 2;
    return (
      <g>
        {gap}
        {horizontal ? (
          <>
            <line x1={o.x1} y1={fy(o.y1) - off} x2={o.x1 + half * 1.1} y2={fy(o.y1) - off} stroke="#a9c3d6" strokeWidth={0.05} />
            <line x1={o.x2 - half * 1.1} y1={fy(o.y1) + off} x2={o.x2} y2={fy(o.y1) + off} stroke="#a9c3d6" strokeWidth={0.05} />
          </>
        ) : (
          <>
            <line x1={o.x1 - off} y1={fy(o.y1)} x2={o.x1 - off} y2={fy(o.y1 + half * 1.1)} stroke="#a9c3d6" strokeWidth={0.05} />
            <line x1={o.x1 + off} y1={fy(o.y2 - half * 1.1)} x2={o.x1 + off} y2={fy(o.y2)} stroke="#a9c3d6" strokeWidth={0.05} />
          </>
        )}
      </g>
    );
  }
  // porta de giro (e entrada principal): folha + arco de abertura, para dentro de swingInto
  const room = rooms.find((r) => r.id === o.swingInto) ?? rooms.find((r) => r.id === o.rooms[0]);
  let dir = 1;
  if (room) {
    if (horizontal) dir = room.y + room.h / 2 > o.y1 ? 1 : -1;
    else dir = room.x + room.w / 2 > o.x1 ? 1 : -1;
  }
  const hx = o.x1;
  const hy = o.y1;
  const leaf = horizontal ? { x: hx, y: hy + dir * len } : { x: hx + dir * len, y: hy };
  const end = { x: o.x2, y: o.y2 };
  const sweep = horizontal ? (dir > 0 ? 0 : 1) : dir > 0 ? 1 : 0;
  const color = o.kind === "entrance" ? "#e07a3f" : "#ecebe7";
  return (
    <g>
      {gap}
      <line x1={hx} y1={fy(hy)} x2={leaf.x} y2={fy(leaf.y)} stroke={color} strokeWidth={o.kind === "entrance" ? 0.07 : 0.045} />
      <path d={`M ${leaf.x} ${fy(leaf.y)} A ${len} ${len} 0 0 ${sweep} ${end.x} ${fy(end.y)}`} fill="none" stroke={color} strokeWidth={0.025} strokeDasharray="0.08 0.06" opacity={0.8} />
    </g>
  );
}

function DimH({ x1, x2, y, label, color }: { x1: number; x2: number; y: number; label: string; color: string }) {
  return (
    <g opacity={0.85}>
      <line x1={x1} x2={x2} y1={y} y2={y} stroke={color} strokeWidth={0.03} />
      <line x1={x1} x2={x1} y1={y - 0.15} y2={y + 0.15} stroke={color} strokeWidth={0.03} />
      <line x1={x2} x2={x2} y1={y - 0.15} y2={y + 0.15} stroke={color} strokeWidth={0.03} />
      <text x={(x1 + x2) / 2} y={y - 0.12} textAnchor="middle" fontSize={0.3} fill={color} fontFamily="var(--font-mono)">
        {label}
      </text>
    </g>
  );
}

function DimV({ y1, y2, x, label, color }: { y1: number; y2: number; x: number; label: string; color: string }) {
  const cy = (y1 + y2) / 2;
  return (
    <g opacity={0.85}>
      <line x1={x} x2={x} y1={y1} y2={y2} stroke={color} strokeWidth={0.03} />
      <line x1={x - 0.15} x2={x + 0.15} y1={y1} y2={y1} stroke={color} strokeWidth={0.03} />
      <line x1={x - 0.15} x2={x + 0.15} y1={y2} y2={y2} stroke={color} strokeWidth={0.03} />
      <text x={x - 0.12} y={cy} textAnchor="middle" fontSize={0.3} fill={color} fontFamily="var(--font-mono)" transform={`rotate(-90 ${x - 0.12} ${cy})`}>
        {label}
      </text>
    </g>
  );
}
