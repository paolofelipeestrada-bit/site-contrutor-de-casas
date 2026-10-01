import { Reveal, RevealItem } from "../components/Reveal";

const FASES: { n: number; titulo: string; texto: string; status: "Disponível" | "Prévia" | "Em breve" }[] = [
  {
    n: 1,
    titulo: "Planta 2D, edição e regeração",
    texto: "3 opções com nota, modo editar, comandos em texto, verificações e explicação do projeto.",
    status: "Disponível",
  },
  { n: 2, titulo: "Elétrica", texto: "Pontos de luz, interruptores, tomadas, circuitos, disjuntores e bitolas pelos critérios da NBR 5410.", status: "Prévia" },
  { n: 3, titulo: "Hidráulica e esgoto", texto: "Água fria, caixa d'água pelo número de moradores, esgoto até a rede e lista de materiais.", status: "Prévia" },
  { n: 4, titulo: "3D navegável", texto: "Paredes extrudadas a partir da mesma planta, com aberturas e materiais.", status: "Em breve" },
  { n: 5, titulo: "Estimativa de custo", texto: "Quantitativos de alvenaria, piso, elétrica e hidráulica com preços de referência.", status: "Em breve" },
];

const TONE = { Disponível: "border-ok/50 text-ok", Prévia: "border-primary/50 text-primary", "Em breve": "border-line text-muted" };

export function Roadmap() {
  return (
    <section id="fases" className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
      <p className="eyebrow">Fases do produto</p>
      <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Da planta ao projeto completo</h2>
      <p className="mt-4 max-w-2xl text-muted">
        Cada cômodo já existe como dado (posição, medidas e função), então as camadas técnicas usam a mesma planta, sem redesenhar.
      </p>
      <Reveal as="ol" each={0.1} className="mt-8 divide-y divide-line border-y border-line">
        {FASES.map((f) => (
          <RevealItem as="li" key={f.n} className="grid gap-2 py-4 sm:grid-cols-[3rem_1fr_auto] sm:items-baseline sm:gap-6">
            <span className="font-mono text-sm text-muted">Fase {f.n}</span>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-semibold">{f.titulo}</h3>
              <p className="text-sm text-muted">{f.texto}</p>
            </div>
            <span className={`w-fit rounded-md border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider ${TONE[f.status]}`}>{f.status}</span>
          </RevealItem>
        ))}
      </Reveal>
    </section>
  );
}
