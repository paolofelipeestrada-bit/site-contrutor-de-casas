import { motion } from "framer-motion";

/**
 * Desenho do topo: uma planta se traçando sozinha, em linha clara sobre papel milimetrado.
 * Coordenadas em "pixels de prancheta" (viewBox 400×320).
 */
const CYCLE = 9;
const WALLS = ["M60 70 H340", "M60 170 H340", "M160 170 V280", "M260 170 V280", "M260 228 H340", "M190 70 V170", "M210 70 V170", "M60 122 H190", "M125 122 V170", "M210 120 H340"];
const ROOMS = [
  { x: 60, y: 40, w: 280, h: 30, t: "VARANDA", a: "8,4" },
  { x: 60, y: 70, w: 130, h: 52, t: "SUÍTE", a: "14,2" },
  { x: 210, y: 70, w: 130, h: 50, t: "QUARTO 2", a: "10,1" },
  { x: 210, y: 120, w: 130, h: 50, t: "QUARTO 1", a: "10,1" },
  { x: 160, y: 170, w: 100, h: 110, t: "SALA", a: "22,0", social: true },
  { x: 260, y: 170, w: 80, h: 58, t: "COZINHA", a: "12,1", social: true },
  { x: 60, y: 170, w: 100, h: 110, t: "GARAGEM", a: "18,7" },
];
const loop = (start: number, dur = 1) => ({ times: [0, start / CYCLE, (start + dur) / CYCLE, 0.9, 1], duration: CYCLE, repeat: Infinity, ease: "easeInOut" as const });

export function HeroArt() {
  return (
    <figure className="panel relative overflow-hidden rounded-2xl">
      <div className="bg-grid absolute inset-0" />
      <svg viewBox="0 0 400 330" className="relative block w-full" role="img" aria-label="Planta baixa sendo desenhada">
        {ROOMS.map((r, i) => (
          <motion.g key={r.t} initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1, 1, 0] }} transition={loop(1.8 + i * 0.12, 0.5)}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={r.social ? "rgba(224,122,63,0.14)" : "rgba(236,235,231,0.05)"} />
            <text x={r.x + r.w / 2} y={r.y + r.h / 2} textAnchor="middle" fontSize="8" fill="#ecebe7" fontFamily="IBM Plex Mono" letterSpacing="0.8">
              {r.t}
            </text>
            <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 11} textAnchor="middle" fontSize="8" fill="#9a9993" fontFamily="IBM Plex Mono">
              {r.a} m²
            </text>
          </motion.g>
        ))}
        <motion.rect x={60} y={40} width={280} height={240} fill="none" stroke="#ecebe7" strokeWidth={4} initial={{ pathLength: 0 }} animate={{ pathLength: [0, 0, 1, 1, 0] }} transition={loop(0.1, 1.3)} />
        {WALLS.map((d, i) => (
          <motion.path key={d} d={d} stroke="#ecebe7" strokeWidth={2.2} fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: [0, 0, 1, 1, 0] }} transition={loop(0.6 + i * 0.09, 0.5)} />
        ))}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1, 1, 0] }} transition={loop(3.2, 0.5)} fontFamily="IBM Plex Mono" fontSize="8" fill="#e07a3f">
          <line x1={60} x2={340} y1={300} y2={300} stroke="#e07a3f" strokeWidth={0.8} />
          <line x1={60} x2={60} y1={295} y2={305} stroke="#e07a3f" strokeWidth={0.8} />
          <line x1={340} x2={340} y1={295} y2={305} stroke="#e07a3f" strokeWidth={0.8} />
          <text x={200} y={316} textAnchor="middle">9,00 m</text>
          <line x1={356} x2={356} y1={40} y2={280} stroke="#e07a3f" strokeWidth={0.8} />
          <text x={370} y={164} textAnchor="middle" transform="rotate(-90 370 164)">15,10 m</text>
        </motion.g>
        <motion.rect x={88} y={192} width={44} height={74} rx={9} fill="none" stroke="#9a9993" strokeWidth={1} initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1, 1, 0] }} transition={loop(3.4, 0.4)} />
        <motion.circle
          r={4}
          fill="#e07a3f"
          animate={{ cx: [60, 340, 340, 60, 60, 190, 210, 340, 60], cy: [40, 40, 280, 280, 170, 70, 170, 120, 122], opacity: [1, 1, 1, 1, 1, 1, 1, 1, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, repeatDelay: CYCLE - 3.4, ease: "easeInOut" }}
        />
      </svg>
      <figcaption className="relative flex flex-wrap justify-between gap-2 border-t border-line px-4 py-3 font-mono text-[11px] text-muted">
        <span>{"{ quartos: 3, suite: 1, garagem: 4,5 × 1,8 m }"}</span>
        <span className="text-ok">✓ 7/7 verificações</span>
      </figcaption>
    </figure>
  );
}
