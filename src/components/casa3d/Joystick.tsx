import { useRef, useState, type MutableRefObject } from "react";
import type { Eixos } from "./Navegacao";

/** Joystick virtual para andar no celular. Escreve em `eixos` (x = lado, y = frente), de -1 a 1. */
export function Joystick({ eixos }: { eixos: MutableRefObject<Eixos> }) {
  const base = useRef<HTMLDivElement>(null);
  const [pino, setPino] = useState({ x: 0, y: 0 });
  const R = 48;

  const mover = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > R) {
      dx = (dx / d) * R;
      dy = (dy / d) * R;
    }
    setPino({ x: dx, y: dy });
    eixos.current = { x: dx / R, y: -dy / R };
  };
  const soltar = () => {
    setPino({ x: 0, y: 0 });
    eixos.current = { x: 0, y: 0 };
  };

  return (
    <div
      ref={base}
      role="application"
      aria-label="Joystick: arraste para andar"
      className="pointer-events-auto relative size-32 touch-none rounded-full border border-white/25 bg-black/30 backdrop-blur"
      onPointerDown={(e) => {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // sem captura o joystick ainda funciona enquanto o dedo estiver sobre ele
        }
        mover(e);
      }}
      onPointerMove={(e) => e.buttons && mover(e)}
      onPointerUp={soltar}
      onPointerCancel={soltar}
    >
      <span
        className="absolute left-1/2 top-1/2 size-14 rounded-full border border-white/40 bg-white/80 shadow"
        style={{ transform: `translate(calc(-50% + ${pino.x}px), calc(-50% + ${pino.y}px))` }}
      />
    </div>
  );
}
