import { motion } from "framer-motion";
import { Box, Droplets, MousePointerClick, Zap } from "lucide-react";
import type { ReactNode } from "react";

const PLAN = "M20 20 H180 V140 H20 Z M20 70 H180 M100 20 V140 M140 70 V140";

export function Roadmap() {
  return (
    <section id="camadas" className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl">
        <p className="font-semibold text-sky">Próximas camadas</p>
        <h2 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Da planta ao projeto completo</h2>
        <p className="mt-4 text-muted">
          Como cada cômodo já existe como dado (posição, medidas, função), dá para empilhar camadas técnicas em cima da mesma planta — sem redesenhar nada.
        </p>
      </motion.div>
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card status="Disponível" tone="lime" icon={<MousePointerClick className="size-5" />} title="Modo editar" text="Clique no quarto e veja 12,4 m² · 3,2 × 3,9 m. Arraste a parede ou peça “aumentar a suíte em 2 m²” — a planta recalcula.">
          <EditArt />
        </Card>
        <Card status="Em breve" tone="sun" icon={<Zap className="size-5" />} title="Camada elétrica" text="Tomadas, interruptores, pontos de luz e quadro de distribuição posicionados por regra, cômodo a cômodo.">
          <ElectricArt />
        </Card>
        <Card status="Em breve" tone="sky" icon={<Droplets className="size-5" />} title="Camada hidráulica" text="Água fria e quente, esgoto, chuveiro, pias e tanque — com as áreas molhadas já agrupadas para economizar tubulação.">
          <WaterArt />
        </Card>
        <Card status="Em desenvolvimento" tone="grape" icon={<Box className="size-5" />} title="Passeio 3D" text="A planta aprovada vira um modelo 3D navegável, com volumes, materiais e iluminação.">
          <ThreeDArt />
        </Card>
      </div>
    </section>
  );
}

function Card({ status, tone, icon, title, text, children }: { status: string; tone: "lime" | "sun" | "sky" | "grape"; icon: ReactNode; title: string; text: string; children: ReactNode }) {
  const tones = {
    lime: "text-lime bg-lime/15 border-lime/30",
    sun: "text-sun bg-sun/15 border-sun/30",
    sky: "text-sky bg-sky/15 border-sky/30",
    grape: "text-grape bg-grape/15 border-grape/30",
  };
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      whileHover={{ y: -8 }}
      transition={{ type: "spring", bounce: 0.3 }}
      className="glass group flex flex-col overflow-hidden rounded-3xl"
    >
      <div className="relative h-44 overflow-hidden border-b border-line bg-[#0a0c18]">
        <div className="bg-grid absolute inset-0 opacity-60" />
        <div className="relative h-full p-3">{children}</div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between">
          <span className={`grid size-10 place-items-center rounded-xl border ${tones[tone]}`}>{icon}</span>
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${tones[tone]}`}>{status}</span>
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
      </div>
    </motion.article>
  );
}

function BasePlan({ color = "rgba(236,238,251,0.35)" }: { color?: string }) {
  return <path d={PLAN} fill="none" stroke={color} strokeWidth={2} />;
}

function EditArt() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full">
      <rect x={20} y={20} width={80} height={50} fill="rgba(167,139,250,0.2)" />
      <motion.rect x={100} y={20} height={50} fill="rgba(255,122,61,0.22)" animate={{ width: [80, 60, 80] }} transition={{ duration: 3, repeat: Infinity }} />
      <BasePlan />
      <motion.line y1={20} y2={70} stroke="#ff7a3d" strokeWidth={3} animate={{ x1: [100, 120, 100], x2: [100, 120, 100] }} transition={{ duration: 3, repeat: Infinity }} />
      <motion.circle cy={45} r={5} fill="#ff7a3d" animate={{ cx: [100, 120, 100] }} transition={{ duration: 3, repeat: Infinity }} />
      <motion.g animate={{ x: [0, 20, 0] }} transition={{ duration: 3, repeat: Infinity }}>
        <rect x={34} y={78} width={88} height={22} rx={6} fill="#121528" stroke="rgba(255,255,255,0.15)" />
        <text x={78} y={93} textAnchor="middle" fontSize={9} fill="#eceefb" fontFamily="JetBrains Mono">
          Quarto 1 · 12,4 m²
        </text>
      </motion.g>
    </svg>
  );
}

function ElectricArt() {
  const points = [
    [40, 30], [160, 30], [60, 110], [120, 100], [165, 125], [30, 60],
  ];
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full">
      <BasePlan />
      <motion.path d="M28 132 H60 V110 M60 132 H120 V100 M120 132 H165 V125 M28 132 V60 H30 M28 60 V30 H40 M40 30 H160" fill="none" stroke="#fbbf24" strokeWidth={1.4} strokeDasharray="4 3" className="animate-dash" />
      <rect x={20} y={124} width={16} height={16} rx={2} fill="#fbbf24" />
      {points.map(([x, y], i) => (
        <motion.circle key={i} cx={x} cy={y} r={4} fill="#fbbf24" animate={{ opacity: [0.3, 1, 0.3], r: [3, 5, 3] }} transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.25 }} style={{ filter: "drop-shadow(0 0 6px #fbbf24)" }} />
      ))}
    </svg>
  );
}

function WaterArt() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full">
      <BasePlan />
      <path d="M10 150 H150 V95 M150 120 H170 M120 150 V110" fill="none" stroke="#38bdf8" strokeWidth={2.4} />
      <path d="M190 150 H160 V88 M160 140 H130 V125" fill="none" stroke="#a78bfa" strokeWidth={2.4} />
      {[0, 1, 2, 3].map((i) => (
        <motion.circle
          key={i}
          r={3}
          fill="#7dd3fc"
          animate={{ cx: [10, 150, 150], cy: [150, 150, 95] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6, ease: "linear", times: [0, 0.7, 1] }}
          style={{ filter: "drop-shadow(0 0 5px #38bdf8)" }}
        />
      ))}
      {[[150, 95], [170, 120], [120, 110]].map(([x, y], i) => (
        <motion.circle key={i} cx={x} cy={y} r={5} fill="none" stroke="#38bdf8" strokeWidth={2} animate={{ r: [4, 8, 4], opacity: [1, 0.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }} />
      ))}
    </svg>
  );
}

function ThreeDArt() {
  // casa isométrica girando (wireframe)
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full">
      <motion.g animate={{ rotate: [0, 6, -6, 0], y: [0, -4, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "100px 90px" }}>
        <path d="M40 95 L100 125 L160 95 L100 65 Z" fill="rgba(167,139,250,0.15)" stroke="#a78bfa" strokeWidth={1.5} />
        <path d="M40 95 V60 L100 90 V125 M100 90 L160 60 V95 M40 60 L100 30 L160 60" fill="none" stroke="#c4b5fd" strokeWidth={1.5} />
        <path d="M40 60 L100 90 L160 60" fill="rgba(244,114,182,0.12)" stroke="#f472b6" strokeWidth={1.5} />
        <path d="M100 30 L100 90" stroke="rgba(196,181,253,0.4)" strokeDasharray="3 3" />
        <rect x={62} y={86} width={14} height={18} fill="rgba(251,191,36,0.6)" transform="skewY(26)" />
        <rect x={118} y={20} width={16} height={12} fill="rgba(56,189,248,0.55)" transform="skewY(-26)" />
      </motion.g>
      <motion.ellipse cx={100} cy={140} rx={60} ry={8} fill="rgba(167,139,250,0.2)" animate={{ rx: [55, 65, 55] }} transition={{ duration: 6, repeat: Infinity }} />
    </svg>
  );
}
