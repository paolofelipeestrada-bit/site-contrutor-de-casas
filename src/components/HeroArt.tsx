import { motion } from "framer-motion";
import { Brain, Ruler } from "lucide-react";

const CYCLE = 9;
const WALLS = [
  "M60 70 H340",
  "M60 170 H340",
  "M160 170 V280",
  "M260 170 V280",
  "M260 228 H340",
  "M190 70 V170",
  "M210 70 V170",
  "M60 122 H190",
  "M125 122 V170",
  "M210 120 H340",
];

const ROOMS = [
  { x: 60, y: 40, w: 280, h: 30, c: "rgba(163,230,53,0.22)", t: "Varanda" },
  { x: 60, y: 70, w: 130, h: 52, c: "rgba(167,139,250,0.26)", t: "Suíte" },
  { x: 60, y: 122, w: 65, h: 48, c: "rgba(56,189,248,0.22)", t: "Banho" },
  { x: 125, y: 122, w: 65, h: 48, c: "rgba(56,189,248,0.22)", t: "Banho" },
  { x: 210, y: 70, w: 130, h: 50, c: "rgba(167,139,250,0.26)", t: "Quarto 2" },
  { x: 210, y: 120, w: 130, h: 50, c: "rgba(167,139,250,0.26)", t: "Quarto 1" },
  { x: 160, y: 170, w: 100, h: 110, c: "rgba(255,122,61,0.25)", t: "Sala" },
  { x: 260, y: 170, w: 80, h: 58, c: "rgba(255,122,61,0.25)", t: "Cozinha" },
  { x: 260, y: 228, w: 80, h: 52, c: "rgba(56,189,248,0.22)", t: "Lavand." },
  { x: 60, y: 170, w: 100, h: 110, c: "rgba(148,163,184,0.16)", t: "Garagem" },
];

const loop = (start: number, dur = 1.1) => {
  const a = start / CYCLE;
  const b = (start + dur) / CYCLE;
  return { times: [0, a, b, 0.9, 1], duration: CYCLE, repeat: Infinity, ease: "easeInOut" as const };
};

export function HeroArt() {
  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      {/* brilhos de fundo */}
      <div className="pointer-events-none absolute -left-10 top-6 size-56 rounded-full bg-primary/40 animate-pulse-glow" />
      <div className="pointer-events-none absolute -right-6 bottom-0 size-64 rounded-full bg-grape/40 animate-pulse-glow" style={{ animationDelay: "1.4s" }} />
      <div className="pointer-events-none absolute right-24 top-0 size-40 rounded-full bg-sky/30 animate-pulse-glow" style={{ animationDelay: "0.7s" }} />

      <div className="glass glow-border relative overflow-hidden rounded-[2rem] p-3 shadow-2xl">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-[#0a0c18]">
          <div className="bg-grid absolute inset-0" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-sky/15 to-transparent animate-scan" />
          <svg viewBox="0 0 400 320" className="relative block w-full" aria-hidden>
            <defs>
              <filter id="hglow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.2" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {ROOMS.map((r, i) => (
              <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1, 1, 0] }} transition={loop(1.6 + i * 0.12, 0.6)}>
                <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={r.c} />
                <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 3} textAnchor="middle" fontSize="9" fill="#eceefb" fontFamily="Fredoka" fontWeight={600}>
                  {r.t}
                </text>
              </motion.g>
            ))}
            {/* carro */}
            <motion.rect x={88} y={192} width={44} height={74} rx={10} fill="rgba(236,238,251,0.08)" stroke="rgba(236,238,251,0.5)" strokeWidth={1} initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1, 1, 0] }} transition={loop(3.2, 0.6)} />
            {/* cama */}
            <motion.rect x={100} y={74} width={40} height={36} rx={4} fill="rgba(236,238,251,0.08)" stroke="rgba(236,238,251,0.45)" strokeWidth={1} initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1, 1, 0] }} transition={loop(3.3, 0.6)} />
            <motion.rect x={175} y={250} width={60} height={20} rx={6} fill="rgba(236,238,251,0.08)" stroke="rgba(236,238,251,0.45)" strokeWidth={1} initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1, 1, 0] }} transition={loop(3.4, 0.6)} />
            {/* paredes */}
            <motion.rect x={60} y={40} width={280} height={240} fill="none" stroke="#ffffff" strokeWidth={4} filter="url(#hglow)" initial={{ pathLength: 0 }} animate={{ pathLength: [0, 0, 1, 1, 0] }} transition={loop(0.1, 1.3)} />
            {WALLS.map((d, i) => (
              <motion.path key={d} d={d} stroke="#c7d2fe" strokeWidth={2.4} fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: [0, 0, 1, 1, 0] }} transition={loop(0.6 + i * 0.09, 0.5)} />
            ))}
            {/* janelas */}
            {[
              [80, 40, 130, 40],
              [235, 40, 315, 40],
              [190, 280, 240, 280],
              [340, 85, 340, 110],
              [340, 135, 340, 160],
            ].map(([x1, y1, x2, y2], i) => (
              <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#38bdf8" strokeWidth={5} strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1, 1, 0] }} transition={loop(2.6 + i * 0.1, 0.4)} />
            ))}
            {/* portão e entrada */}
            <motion.line x1={68} y1={280} x2={152} y2={280} stroke="#fbbf24" strokeWidth={4} strokeDasharray="8 5" initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1, 1, 0] }} transition={loop(2.9, 0.4)} />
            <motion.path d="M245 280 V262 A18 18 0 0 1 263 280" stroke="#ff7a3d" strokeWidth={2} fill="none" initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1, 1, 0] }} transition={loop(3.0, 0.4)} />
            {/* cotas */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1, 1, 0] }} transition={loop(3.6, 0.5)} fontFamily="JetBrains Mono" fontSize="8" fill="#ff9f6b">
              <line x1={60} x2={340} y1={298} y2={298} stroke="#ff9f6b" strokeWidth={0.8} />
              <text x={200} y={310} textAnchor="middle">9,00 m</text>
              <line x1={354} x2={354} y1={40} y2={280} stroke="#ff9f6b" strokeWidth={0.8} />
              <text x={366} y={164} textAnchor="middle" transform="rotate(-90 366 164)">
                15,10 m
              </text>
            </motion.g>
            {/* cursor da IA desenhando */}
            <motion.circle
              r={5}
              fill="#ff7a3d"
              filter="url(#hglow)"
              animate={{ cx: [60, 340, 340, 60, 60, 190, 210, 340, 60], cy: [40, 40, 280, 280, 170, 70, 170, 120, 122], opacity: [1, 1, 1, 1, 1, 1, 1, 1, 0] }}
              transition={{ duration: 3.4, repeat: Infinity, repeatDelay: CYCLE - 3.4, ease: "easeInOut" }}
            />
          </svg>
        </div>
      </div>

      {/* chips flutuantes */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
        className="glass absolute -left-2 top-10 hidden rounded-2xl px-3 py-2 font-mono text-[11px] text-sky shadow-xl animate-float sm:block md:-left-8"
      >
        <span className="text-muted">{"{"}</span> "quartos": <span className="text-primary-2">3</span>, "suite": <span className="text-primary-2">1</span> <span className="text-muted">{"}"}</span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.1 }}
        className="glass absolute -right-2 bottom-16 flex items-center gap-2 rounded-2xl px-3 py-2 shadow-xl animate-float-slow md:-right-8"
      >
        <span className="grid size-8 place-items-center rounded-xl bg-grape/20 text-grape">
          <Ruler className="size-4" />
        </span>
        <span>
          <span className="block text-xs font-semibold">Suíte</span>
          <span className="block font-mono text-[11px] text-muted">14,2 m² · 3,40 × 4,18 m</span>
        </span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="glass absolute -bottom-5 left-8 flex items-center gap-2 rounded-2xl px-3 py-2 shadow-xl animate-float"
        style={{ animationDelay: "1.5s" }}
      >
        <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-primary to-pink text-bg">
          <Brain className="size-4" />
        </span>
        <span className="text-xs">
          <span className="block font-semibold">IA aprendeu</span>
          <span className="block text-muted">você prefere suítes 12% maiores</span>
        </span>
      </motion.div>
    </div>
  );
}
