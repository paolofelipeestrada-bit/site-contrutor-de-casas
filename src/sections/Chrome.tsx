import { motion, useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { Logo } from "../components/Logo";
import { Magnetic } from "../components/Magnetic";
import { MaskText } from "../components/MaskText";
import { DUR, EASE, INTRO } from "../lib/motion";

const LINKS = [
  ["#como-funciona", "Como funciona"],
  ["#briefing", "Gerar planta"],
  ["#construir", "Construir do zero"],
  ["#fases", "Fases"],
];

/** Qual seção do menu está no meio da tela agora. */
function useSecaoAtiva() {
  const [ativa, setAtiva] = useState<string | null>(null);
  useEffect(() => {
    const els = LINKS.map(([h]) => document.querySelector(h)).filter((e): e is Element => !!e);
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) if (e.isIntersecting) setAtiva(`#${e.target.id}`);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return ativa;
}

export function Header() {
  const { scrollY } = useScroll();
  const [entrou, setEntrou] = useState(false);
  const [oculto, setOculto] = useState(false);
  const [rolou, setRolou] = useState(false);
  const ativa = useSecaoAtiva();

  // some ao descer (mais espaço para a planta), volta ao subir um pouco
  useMotionValueEvent(scrollY, "change", (y) => {
    const anterior = scrollY.getPrevious() ?? 0;
    setRolou(y > 24);
    if (y < 160) setOculto(false);
    else if (y > anterior + 6) setOculto(true);
    else if (y < anterior - 6) setOculto(false);
  });

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: oculto ? "-100%" : 0, opacity: 1 }}
      transition={{ duration: oculto ? DUR.base * 0.7 : DUR.base, ease: EASE, delay: entrou ? 0 : INTRO }}
      onAnimationComplete={() => setEntrou(true)}
      className={`sticky z-50 border-b backdrop-blur transition-colors duration-700 ${rolou ? "border-line bg-bg/85" : "border-transparent bg-bg/0"}`}
      style={{ top: "env(safe-area-inset-top, 0px)" }}
    >
      <div className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-[padding] duration-700 sm:px-8 ${rolou ? "py-2.5" : "py-4"}`}>
        <a href="#inicio" aria-label="casaai, início">
          <Logo size={26} />
        </a>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href} className={`relative py-1 transition-colors duration-500 ${ativa === href ? "text-ink" : "text-muted hover:text-ink"}`}>
              {label}
              {ativa === href && (
                <motion.span layoutId="menu-ativo" className="absolute inset-x-0 -bottom-0.5 h-px bg-primary" transition={{ duration: DUR.base, ease: EASE }} />
              )}
            </a>
          ))}
        </nav>
        <Magnetic forca={0.2}>
          <a href="#briefing" className="rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-primary-2">
            Planeje com clareza →
          </a>
        </Magnetic>
      </div>
    </motion.header>
  );
}

/** Linha fina no topo da tela mostrando quanto da página já foi lido (fica visível mesmo com o menu escondido). */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const progresso = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  return <motion.div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-primary" style={{ scaleX: progresso }} />;
}

export function Footer() {
  return (
    <footer className="bg-primary text-ink">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8">
        <MaskText as="p" className="font-display text-3xl font-medium leading-tight sm:text-4xl">
          Confiança para planejar. Clareza para decidir.
        </MaskText>
        <motion.div
          className="mt-10 flex flex-col justify-between gap-3 border-t border-ink/25 pt-5 text-sm sm:flex-row"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: DUR.lento, ease: EASE, delay: 0.4 }}
        >
          <Logo size={22} />
          <span className="text-ink/80">Estudo preliminar. Projeto executivo, estrutura e aprovação exigem arquiteto ou engenheiro.</span>
        </motion.div>
      </div>
    </footer>
  );
}
