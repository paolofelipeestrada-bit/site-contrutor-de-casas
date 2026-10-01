import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { ROOM_INFO, ZONE_COLORS } from "../lib/catalog";
import { round2, snap, type BuilderLot, type BuilderRoom } from "../lib/builder";
import { EASE } from "../lib/motion";

export type BuilderTool = "desenhar" | "selecionar";
type Corner = "nw" | "ne" | "sw" | "se";
type Gesture =
  | { kind: "draw"; x0: number; y0: number; x1: number; y1: number }
  | { kind: "move"; id: string; dx: number; dy: number }
  | { kind: "resize"; id: string; corner: Corner; orig: BuilderRoom };

const fmt = (v: number, d = 2) => v.toFixed(d).replace(".", ",");
const MIN = 0.8; // menor lado de um cômodo desenhado (m)
const ROOM_ZONE = (r: BuilderRoom) => ROOM_INFO[r.tipo].zone;

/**
 * Prancheta do modo "construir do zero". Coordenadas em metros, rua embaixo.
 * - Desenhar: arraste num espaço vazio para criar um cômodo do tipo escolhido.
 * - Selecionar: arraste o cômodo para mover; puxe os cantos para redimensionar.
 */
export function BuilderCanvas({
  lot,
  rooms,
  selectedId,
  tool,
  overlapping,
  onSelect,
  onCreate,
  onChange,
  onCommit,
}: {
  lot: BuilderLot;
  rooms: BuilderRoom[];
  selectedId: string | null;
  tool: BuilderTool;
  overlapping: Set<string>;
  onSelect: (id: string | null) => void;
  onCreate: (r: { x: number; y: number; w: number; h: number }) => void;
  onChange: (rooms: BuilderRoom[]) => void;
  onCommit: () => void;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const [g, setG] = useState<Gesture | null>(null);
  const D = lot.profundidade;
  const fy = (y: number) => D - y;

  const toM = (e: { clientX: number; clientY: number }) => {
    const pt = svg.current!.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.current!.getScreenCTM()!.inverse());
    return { x: Math.min(lot.largura, Math.max(0, snap(p.x))), y: Math.min(D, Math.max(0, snap(D - p.y))) };
  };

  const update = (id: string, patch: Partial<BuilderRoom>) => onChange(rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const onMove = (e: React.PointerEvent) => {
    if (!g) return;
    const m = toM(e);
    if (g.kind === "draw") setG({ ...g, x1: m.x, y1: m.y });
    if (g.kind === "move") {
      const r = rooms.find((x) => x.id === g.id)!;
      update(g.id, { x: round2(Math.min(lot.largura - r.w, Math.max(0, m.x - g.dx))), y: round2(Math.min(D - r.h, Math.max(0, m.y - g.dy))) });
    }
    if (g.kind === "resize") {
      const o = g.orig;
      let { x, y, w, h } = o;
      // na tela a rua fica embaixo: "n" (norte da tela) é o lado do fundo (y maior)
      if (g.corner === "nw" || g.corner === "sw") {
        x = Math.min(m.x, o.x + o.w - MIN);
        w = o.x + o.w - x;
      } else w = Math.max(MIN, m.x - o.x);
      if (g.corner === "sw" || g.corner === "se") {
        y = Math.min(m.y, o.y + o.h - MIN);
        h = o.y + o.h - y;
      } else h = Math.max(MIN, m.y - o.y);
      update(g.id, { x: round2(x), y: round2(y), w: round2(w), h: round2(h) });
    }
  };

  const onUp = () => {
    if (g?.kind === "draw") {
      const x = Math.min(g.x0, g.x1);
      const y = Math.min(g.y0, g.y1);
      const w = Math.abs(g.x1 - g.x0);
      const h = Math.abs(g.y1 - g.y0);
      if (w >= MIN && h >= MIN) onCreate({ x: round2(x), y: round2(y), w: round2(w), h: round2(h) });
    }
    setG(null);
  };

  const draft = g?.kind === "draw" ? { x: Math.min(g.x0, g.x1), y: Math.min(g.y0, g.y1), w: Math.abs(g.x1 - g.x0), h: Math.abs(g.y1 - g.y0) } : null;
  const sel = rooms.find((r) => r.id === selectedId);

  return (
    <svg
      ref={svg}
      viewBox={`-1 -1 ${lot.largura + 2} ${D + 3}`}
      className="h-full w-full touch-none select-none"
      role="application"
      aria-label="Prancheta para desenhar os cômodos"
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      <defs>
        <pattern id="grade-1m" width={1} height={1} patternUnits="userSpaceOnUse">
          <path d="M1 0H0V1" fill="none" stroke="rgba(244,241,234,0.08)" strokeWidth={0.02} />
        </pattern>
      </defs>
      {/* terreno + grade; clique aqui para desenhar */}
      <rect
        x={0}
        y={0}
        width={lot.largura}
        height={D}
        fill="url(#grade-1m)"
        stroke="rgba(244,241,234,0.35)"
        strokeWidth={0.05}
        strokeDasharray="0.3 0.2"
        style={{ cursor: tool === "desenhar" ? "crosshair" : "default" }}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          if (tool === "desenhar") {
            const m = toM(e);
            setG({ kind: "draw", x0: m.x, y0: m.y, x1: m.x, y1: m.y });
          } else onSelect(null);
        }}
      />
      <text x={lot.largura / 2} y={D + 0.9} textAnchor="middle" fontSize={0.4} fill="#8E9A96" fontFamily="var(--font-mono)" letterSpacing={0.2}>
        RUA · {fmt(lot.largura)} m
      </text>

      <AnimatePresence>
        {rooms.map((r) => {
          const c = ZONE_COLORS[ROOM_ZONE(r)];
          const bad = overlapping.has(r.id);
          return (
            <motion.g
              key={r.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6, ease: EASE }}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            >
              <rect
                x={r.x}
                y={fy(r.y + r.h)}
                width={r.w}
                height={r.h}
                fill={c.fill}
                stroke={bad ? "#E0B26B" : "#F4F1EA"}
                strokeWidth={bad ? 0.08 : 0.1}
                strokeDasharray={bad ? "0.2 0.1" : undefined}
                style={{ cursor: tool === "selecionar" ? "move" : "pointer" }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onSelect(r.id);
                  if (tool !== "selecionar") return;
                  (e.target as Element).setPointerCapture?.(e.pointerId);
                  const m = toM(e);
                  onCommit();
                  setG({ kind: "move", id: r.id, dx: m.x - r.x, dy: m.y - r.y });
                }}
              />
              <text x={r.x + r.w / 2} y={fy(r.y + r.h / 2) - 0.08} textAnchor="middle" fontSize={Math.min(0.36, r.w / 6)} fill="#F4F1EA" fontWeight={600} pointerEvents="none">
                {r.nome}
              </text>
              <text x={r.x + r.w / 2} y={fy(r.y + r.h / 2) + 0.36} textAnchor="middle" fontSize={Math.min(0.26, r.w / 8)} fill="#9EA9A5" fontFamily="var(--font-mono)" pointerEvents="none">
                {fmt(r.w)} × {fmt(r.h)} · {fmt(r.w * r.h, 1)} m²
              </text>
            </motion.g>
          );
        })}
      </AnimatePresence>

      {sel && tool === "selecionar" && (
        <g>
          <rect x={sel.x} y={fy(sel.y + sel.h)} width={sel.w} height={sel.h} fill="none" stroke="#C9573F" strokeWidth={0.08} pointerEvents="none" />
          {(
            [
              ["sw", sel.x, sel.y],
              ["se", sel.x + sel.w, sel.y],
              ["nw", sel.x, sel.y + sel.h],
              ["ne", sel.x + sel.w, sel.y + sel.h],
            ] as [Corner, number, number][]
          ).map(([corner, x, y]) => (
            <rect
              key={corner}
              x={x - 0.18}
              y={fy(y) - 0.18}
              width={0.36}
              height={0.36}
              fill="#C9573F"
              stroke="#17211F"
              strokeWidth={0.04}
              style={{ cursor: corner === "nw" || corner === "se" ? "nwse-resize" : "nesw-resize" }}
              onPointerDown={(e) => {
                e.stopPropagation();
                (e.target as Element).setPointerCapture?.(e.pointerId);
                onCommit();
                setG({ kind: "resize", id: sel.id, corner, orig: sel });
              }}
            />
          ))}
        </g>
      )}

      {draft && (
        <g pointerEvents="none">
          <rect x={draft.x} y={fy(draft.y + draft.h)} width={draft.w} height={draft.h} fill="rgba(201,87,63,0.18)" stroke="#C9573F" strokeWidth={0.06} strokeDasharray="0.2 0.12" />
          <rect x={draft.x + draft.w / 2 - 1.1} y={fy(draft.y + draft.h / 2) - 0.3} width={2.2} height={0.5} rx={0.08} fill="#C9573F" />
          <text x={draft.x + draft.w / 2} y={fy(draft.y + draft.h / 2) + 0.05} textAnchor="middle" fontSize={0.3} fill="#F4F1EA" fontFamily="var(--font-mono)">
            {fmt(draft.w)} × {fmt(draft.h)} m
          </text>
        </g>
      )}
    </svg>
  );
}
