import { motion, useScroll, useSpring } from "framer-motion";

export function Header() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/70 backdrop-blur-xl">
      <motion.div className="absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-primary via-pink to-sky" style={{ scaleX: progress }} />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-8">
        <a href="#inicio" className="flex items-center gap-2" aria-label="CasaAI, início">
          <motion.span whileHover={{ rotate: -8, scale: 1.05 }} className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-primary to-pink font-display text-xl font-bold text-bg shadow-[0_0_24px_rgba(255,122,61,0.45)]">
            C
          </motion.span>
          <span className="font-display text-2xl font-bold">
            Casa<span className="text-gradient">AI</span>
          </span>
        </a>
        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          <a href="#como-funciona" className="transition hover:text-ink">Como funciona</a>
          <a href="#briefing" className="transition hover:text-ink">Criar planta</a>
          <a href="#camadas" className="transition hover:text-ink">Camadas</a>
        </nav>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="rounded-full border border-lime/30 bg-lime/10 px-3 py-1.5 text-lime">2D disponível</span>
          <span className="hidden rounded-full border border-line px-3 py-1.5 text-muted sm:inline">3D em breve</span>
        </div>
      </div>
    </header>
  );
}

export function Cta3D() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-[2rem] border border-line bg-gradient-to-br from-card via-surface to-[#1a0f2e] px-6 py-14 text-center sm:px-12"
      >
        <div className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade opacity-50" />
        <span className="pointer-events-none absolute right-10 top-8 size-16 rounded-full bg-primary/70 blur-sm animate-float" />
        <span className="pointer-events-none absolute bottom-10 left-12 size-10 rounded-2xl bg-sky/60 blur-[2px] animate-float-slow" />
        <span className="pointer-events-none absolute left-1/2 top-0 size-80 -translate-x-1/2 rounded-full bg-grape/25 animate-pulse-glow" />
        <h2 className="relative font-display text-4xl font-bold sm:text-5xl">
          Hoje em 2D. <span className="text-gradient">Amanhã, você entra na casa.</span>
        </h2>
        <p className="relative mx-auto mt-4 max-w-2xl text-muted">
          A próxima fase transforma a planta aprovada em um modelo 3D navegável, com volumes, materiais e iluminação — usando os mesmos dados que você já editou aqui.
        </p>
        <a href="#briefing" className="relative mt-8 inline-flex h-12 items-center rounded-full bg-sun px-6 font-semibold text-bg transition hover:-translate-y-0.5">
          Começar pela planta 2D
        </a>
      </motion.div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 border-t border-line px-4 py-8 text-sm text-muted sm:flex-row sm:px-8">
      <span className="font-display text-lg font-bold text-ink">
        Casa<span className="text-gradient">AI</span>
      </span>
      <span>Estudo conceitual. Valide medidas, estrutura e legislação com um arquiteto.</span>
    </footer>
  );
}
