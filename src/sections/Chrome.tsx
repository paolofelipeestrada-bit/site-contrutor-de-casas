import { SITE } from "../config";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/90 backdrop-blur" style={{ top: "env(safe-area-inset-top, 0px)" }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <a href="#inicio" className="flex items-center gap-2.5" aria-label={`${SITE.nome}, início`}>
          <svg viewBox="0 0 64 64" className="size-8" aria-hidden>
            <path d="M14 50V26L32 13l18 13v24H14Z" fill="none" stroke="#ecebe7" strokeWidth="4" strokeLinejoin="round" />
            <path d="M14 36h20v14" fill="none" stroke="#e07a3f" strokeWidth="4" />
          </svg>
          <span className="font-display text-xl font-bold tracking-tight">{SITE.nome}</span>
        </a>
        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          <a href="#como-funciona" className="hover:text-ink">Como funciona</a>
          <a href="#briefing" className="hover:text-ink">Criar planta</a>
          <a href="#fases" className="hover:text-ink">Fases</a>
        </nav>
        <a href="#briefing" className="rounded-lg bg-ink px-3.5 py-2 text-sm font-semibold text-bg hover:bg-white">
          Criar planta
        </a>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto flex max-w-7xl flex-col justify-between gap-2 border-t border-line px-4 py-8 text-sm text-muted sm:flex-row sm:px-8">
      <span className="font-display font-bold text-ink">{SITE.nome}</span>
      <span>Estudo preliminar. Projeto executivo, estrutura e aprovação na prefeitura exigem arquiteto ou engenheiro.</span>
    </footer>
  );
}
