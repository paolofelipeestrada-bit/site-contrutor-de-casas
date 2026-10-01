import { motion } from "framer-motion";
import { Brain, Braces, LayoutGrid, MessageSquareText, PenTool, RefreshCcw } from "lucide-react";

const STEPS = [
  {
    icon: MessageSquareText,
    title: "Texto",
    color: "from-sky to-grape",
    body: "“Casa de 120 m², 3 quartos, sala integrada, varanda nos fundos…”",
    mono: false,
  },
  {
    icon: Brain,
    title: "IA",
    color: "from-grape to-pink",
    body: "Entende a intenção, resolve ambiguidades e completa o que faltou.",
    mono: false,
  },
  {
    icon: Braces,
    title: "Dados",
    color: "from-pink to-primary",
    body: '{ "tipo": "suite", "area": 16 }\n{ "tipo": "garagem", "carro": 4,5 m }',
    mono: true,
  },
  {
    icon: LayoutGrid,
    title: "Algoritmo",
    color: "from-primary to-sun",
    body: "Testa 8+ distribuições, respeita recuos e mínimos, pontua e escolhe a melhor.",
    mono: false,
  },
  {
    icon: PenTool,
    title: "Planta 2D",
    color: "from-sun to-lime",
    body: "Paredes, portas, janelas, móveis em escala e cotas de cada cômodo.",
    mono: false,
  },
];

export function Pipeline() {
  return (
    <section id="como-funciona" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} className="max-w-2xl">
        <p className="font-semibold text-primary">Como funciona</p>
        <h2 className="mt-2 font-display text-4xl font-bold sm:text-5xl">
          A IA não desenha. <span className="text-gradient">Ela entende.</span>
        </h2>
        <p className="mt-4 text-muted">
          Modelos de imagem “inventam” plantas que não fecham as contas. Aqui a IA só traduz o seu pedido em dados — e um algoritmo próprio monta a planta respeitando cada medida. É mais preciso, editável e evolui com o tempo.
        </p>
      </motion.div>

      <div className="relative mt-12">
        <svg className="pointer-events-none absolute left-0 top-12 hidden h-2 w-full lg:block" preserveAspectRatio="none" viewBox="0 0 100 2" aria-hidden>
          <line x1="2" x2="98" y1="1" y2="1" stroke="url(#pipe)" strokeWidth="0.4" strokeDasharray="1.2 0.8" className="animate-dash" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 2 }} />
          <defs>
            <linearGradient id="pipe" x1="0" x2="1">
              <stop offset="0" stopColor="#38bdf8" />
              <stop offset="0.5" stopColor="#ff7a3d" />
              <stop offset="1" stopColor="#a3e635" />
            </linearGradient>
          </defs>
        </svg>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              whileHover={{ y: -6 }}
              className="glass relative rounded-3xl p-5"
            >
              <div className={`grid size-14 place-items-center rounded-2xl bg-gradient-to-br ${s.color} text-bg shadow-lg`}>
                <s.icon className="size-6" />
              </div>
              <span className="absolute right-5 top-5 font-mono text-xs text-muted">0{i + 1}</span>
              <h3 className="mt-4 font-display text-xl font-semibold">{s.title}</h3>
              <p className={`mt-2 whitespace-pre-line text-sm leading-relaxed ${s.mono ? "font-mono text-[11px] text-sky" : "text-muted"}`}>{s.body}</p>
            </motion.li>
          ))}
        </ol>
      </div>

      <LearningLoop />
    </section>
  );
}

function LearningLoop() {
  const items = [
    ["Você ajusta", "Arrasta uma parede, pede “suíte +2 m²”, troca de opção ou dá 👍/👎."],
    ["O sistema registra", "Cada ação vira um sinal: fatores de área por cômodo e preferência por tipo de layout."],
    ["A próxima planta já vem do seu jeito", "As preferências viram dicas para a IA e pesos no algoritmo. Quanto mais usa, mais acerta."],
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      className="glass glow-border relative mt-14 overflow-hidden rounded-[2rem] p-6 sm:p-10"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-grape/30 animate-pulse-glow" />
      <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-grape/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-grape">
            <RefreshCcw className="size-3.5" /> Aprende com o tempo
          </span>
          <h3 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Um modelo que fica melhor a cada planta</h3>
          <ol className="mt-6 space-y-4">
            {items.map(([t, d], i) => (
              <motion.li key={t} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.15 }} className="flex gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-grape/40 font-display font-bold text-grape">{i + 1}</span>
                <span>
                  <span className="block font-semibold">{t}</span>
                  <span className="block text-sm text-muted">{d}</span>
                </span>
              </motion.li>
            ))}
          </ol>
        </div>
        <NeuralArt />
      </div>
    </motion.div>
  );
}

function NeuralArt() {
  const layers = [
    [40, 90, 140, 190, 240],
    [65, 115, 165, 215],
    [90, 140, 190],
  ];
  const xs = [60, 200, 340];
  const nodes = layers.flatMap((col, li) => col.map((y) => ({ x: xs[li], y, li })));
  const edges: [number, number, number, number][] = [];
  for (let li = 0; li < layers.length - 1; li++)
    for (const a of layers[li]) for (const b of layers[li + 1]) edges.push([xs[li], a, xs[li + 1], b]);
  return (
    <svg viewBox="0 0 400 280" className="w-full" aria-hidden>
      <defs>
        <linearGradient id="edge" x1="0" x2="1">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      {edges.map(([x1, y1, x2, y2], i) => (
        <g key={i}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(167,139,250,0.18)" strokeWidth={1} />
          <motion.circle
            r={2.2}
            fill="url(#edge)"
            initial={{ cx: x1, cy: y1, opacity: 0 }}
            animate={{ cx: [x1, x2], cy: [y1, y2], opacity: [0, 1, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: (i * 0.137) % 2.4, ease: "easeInOut" }}
          />
        </g>
      ))}
      {nodes.map((n, i) => (
        <motion.circle
          key={i}
          cx={n.x}
          cy={n.y}
          r={n.li === 2 ? 11 : 8}
          fill="#0d0f1c"
          stroke={n.li === 0 ? "#38bdf8" : n.li === 1 ? "#a78bfa" : "#ff7a3d"}
          strokeWidth={2.5}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.18 }}
          style={{ transformOrigin: `${n.x}px ${n.y}px` }}
        />
      ))}
      {/* saída: mini planta */}
      <g transform="translate(360 110)">
        <rect x={0} y={0} width={34} height={60} fill="none" stroke="#a3e635" strokeWidth={2} />
        <path d="M0 24 H34 M17 0 V24 M0 42 H34" stroke="#a3e635" strokeWidth={1.4} />
      </g>
    </svg>
  );
}
