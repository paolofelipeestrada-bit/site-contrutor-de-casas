import { Hand, Maximize2, Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Zoom e deslocamento para as pranchetas (planta gerada e "construir do zero").
 * - Botões + / − e "Ajustar" (volta ao tamanho inteiro)
 * - Ctrl/⌘ + roda do mouse (ou pinça no trackpad) aproxima no ponto do cursor
 * - Pinça com dois dedos no celular
 * - Arrastar a visão: ferramenta "mão", tecla Espaço segurada ou botão do meio do mouse
 * Usa transform CSS, então arrastar paredes, cômodos e pontos continua funcionando em qualquer zoom.
 */
const MIN = 1;
const MAX = 6;
const PASSO = 1.4;

export function ZoomPan({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [v, setV] = useState({ s: 1, x: 0, y: 0 });
  const [mao, setMao] = useState(false);
  const [espaco, setEspaco] = useState(false);
  const [animar, setAnimar] = useState(false);
  const pan = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const toques = useRef(new Map<number, { x: number; y: number }>());
  const pinca = useRef<{ d: number; s: number } | null>(null);

  /** Mantém a planta dentro da área visível. */
  const limitar = (s: number, x: number, y: number) => {
    const el = box.current;
    if (!el) return { s, x, y };
    const w = el.clientWidth;
    const h = el.clientHeight;
    return { s, x: Math.min(0, Math.max(w - w * s, x)), y: Math.min(0, Math.max(h - h * s, y)) };
  };

  /** Aproxima mantendo fixo o ponto (cx, cy) da tela. */
  const zoomEm = (fator: number, cx?: number, cy?: number, suave = false) => {
    const el = box.current;
    if (!el) return;
    const px = cx ?? el.clientWidth / 2;
    const py = cy ?? el.clientHeight / 2;
    setAnimar(suave);
    setV((o) => {
      const s = Math.min(MAX, Math.max(MIN, o.s * fator));
      const k = s / o.s;
      return limitar(s, px - (px - o.x) * k, py - (py - o.y) * k);
    });
  };

  // Ctrl/⌘ + roda: precisa de listener não passivo para impedir o zoom da página
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomEm(Math.exp(Math.max(-0.25, Math.min(0.25, -e.deltaY * 0.0025))), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  // Espaço segurado = mão temporária (quando o mouse está sobre a prancheta)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && box.current?.matches(":hover") && !/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setEspaco(true);
      }
    };
    const up = (e: KeyboardEvent) => e.code === "Space" && setEspaco(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const arrastandoVisao = mao || espaco;
  const btn = "grid size-8 place-items-center rounded-md text-muted transition-colors hover:bg-ink/10 hover:text-ink disabled:opacity-30";

  return (
    <div
      ref={box}
      className="relative h-full w-full overflow-hidden"
      style={{ cursor: arrastandoVisao ? (pan.current ? "grabbing" : "grab") : undefined, touchAction: "none" }}
      onPointerDownCapture={(e) => {
        const r = box.current!.getBoundingClientRect();
        toques.current.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top });
        if (toques.current.size === 2) {
          const [a, b] = [...toques.current.values()];
          pinca.current = { d: Math.hypot(a.x - b.x, a.y - b.y), s: v.s };
          e.stopPropagation();
          return;
        }
        if (arrastandoVisao || e.button === 1) {
          e.stopPropagation();
          e.preventDefault();
          (e.currentTarget as Element).setPointerCapture(e.pointerId);
          setAnimar(false);
          pan.current = { px: e.clientX, py: e.clientY, x: v.x, y: v.y };
        }
      }}
      onPointerMoveCapture={(e) => {
        const r = box.current!.getBoundingClientRect();
        if (toques.current.has(e.pointerId)) toques.current.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top });
        if (pinca.current && toques.current.size === 2) {
          e.stopPropagation();
          const [a, b] = [...toques.current.values()];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          const alvo = Math.min(MAX, Math.max(MIN, pinca.current.s * (d / pinca.current.d)));
          zoomEm(alvo / v.s, (a.x + b.x) / 2, (a.y + b.y) / 2);
          return;
        }
        if (pan.current) {
          e.stopPropagation();
          const p = pan.current;
          setV((o) => limitar(o.s, p.x + e.clientX - p.px, p.y + e.clientY - p.py));
        }
      }}
      onPointerUpCapture={(e) => {
        toques.current.delete(e.pointerId);
        if (toques.current.size < 2) pinca.current = null;
        if (pan.current) {
          e.stopPropagation();
          pan.current = null;
        }
      }}
      onPointerCancelCapture={(e) => {
        toques.current.delete(e.pointerId);
        pinca.current = null;
        pan.current = null;
      }}
    >
      <div
        className="h-full w-full origin-top-left"
        style={{
          transform: `translate(${v.x}px, ${v.y}px) scale(${v.s})`,
          transition: animar ? "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
          pointerEvents: arrastandoVisao ? "none" : undefined,
        }}
      >
        {children}
      </div>

      <div
        className="absolute bottom-3 right-3 z-10 flex items-center gap-0.5 rounded-lg border border-line bg-bg/90 p-0.5 backdrop-blur"
        role="toolbar"
        aria-label="Zoom da planta"
      >
        <button type="button" className={btn} onClick={() => zoomEm(1 / PASSO, undefined, undefined, true)} disabled={v.s <= MIN} aria-label="Diminuir zoom">
          <Minus className="size-4" />
        </button>
        <span className="tabular w-11 text-center font-mono text-[11px] text-ink">{Math.round(v.s * 100)}%</span>
        <button type="button" className={btn} onClick={() => zoomEm(PASSO, undefined, undefined, true)} disabled={v.s >= MAX} aria-label="Aumentar zoom">
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => {
            setAnimar(true);
            setV({ s: 1, x: 0, y: 0 });
          }}
          disabled={v.s === 1}
          aria-label="Ajustar à tela"
          title="Ajustar à tela"
        >
          <Maximize2 className="size-4" />
        </button>
        <button
          type="button"
          className={`${btn} ${mao ? "bg-primary text-ink hover:bg-primary" : ""}`}
          onClick={() => setMao(!mao)}
          aria-pressed={mao}
          aria-label="Mover a visão (ou segure Espaço)"
          title="Mover a visão (ou segure Espaço)"
        >
          <Hand className="size-4" />
        </button>
      </div>
    </div>
  );
}
