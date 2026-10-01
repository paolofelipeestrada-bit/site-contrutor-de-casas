import { motion } from "framer-motion";
import { Logo } from "../components/Logo";
import { EASE } from "../lib/motion";

const LINKS = [
  ["#como-funciona", "Como funciona"],
  ["#briefing", "Gerar planta"],
  ["#construir", "Construir do zero"],
  ["#fases", "Fases"],
];

export function Header() {
  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.2, ease: EASE }}
      className="sticky z-50 border-b border-line bg-bg/90 backdrop-blur"
      style={{ top: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <a href="#inicio" aria-label="casaai, início">
          <Logo size={26} />
        </a>
        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href} className="transition-colors hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
        <a href="#briefing" className="rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-primary-2">
          Planeje com clareza →
        </a>
      </div>
    </motion.header>
  );
}

export function Footer() {
  return (
    <footer className="bg-primary text-ink">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8">
        <p className="font-display text-3xl font-medium leading-tight sm:text-4xl">Confiança para planejar. Clareza para decidir.</p>
        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-ink/25 pt-5 text-sm sm:flex-row">
          <Logo size={22} />
          <span className="text-ink/80">Estudo preliminar. Projeto executivo, estrutura e aprovação exigem arquiteto ou engenheiro.</span>
        </div>
      </div>
    </footer>
  );
}
