import { HeroArt } from "../components/HeroArt";
import { SITE } from "../config";

export function Hero() {
  return (
    <section id="inicio" className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-8 lg:pt-16">
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="eyebrow">Planta baixa 2D · elétrica · hidráulica</p>
          <h1 className="mt-5 font-display text-5xl font-extrabold leading-[0.98] tracking-tight sm:text-6xl">
            Descreva a casa.
            <br />
            <span className="text-primary">O sistema calcula</span> a planta.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            A IA lê o seu pedido e o transforma em dados. Um algoritmo distribui os cômodos respeitando recuos, larguras mínimas e o tamanho do seu carro, e confere tudo
            antes de mostrar.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#briefing" className="inline-flex h-12 items-center rounded-lg bg-primary px-6 font-display font-semibold text-bg hover:bg-primary-2">
              Criar meu projeto
            </a>
            <a href="#como-funciona" className="inline-flex h-12 items-center rounded-lg border border-line px-5 text-sm font-medium hover:border-white/30">
              Como funciona
            </a>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-6">
            {[
              ["3", "opções calculadas para escolher"],
              ["7", "verificações automáticas por planta"],
              ["1:1", "móveis e carro em escala real"],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="tabular font-mono text-2xl text-ink">{n}</dt>
                <dd className="mt-1 text-xs leading-snug text-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
        {SITE.heroImage ? (
          <img src={SITE.heroImage} alt={SITE.heroImageAlt} className="w-full max-w-full rounded-2xl border border-line object-cover" />
        ) : (
          <HeroArt />
        )}
      </div>
    </section>
  );
}
