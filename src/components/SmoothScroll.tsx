import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";
import { ROLAGEM } from "../lib/motion";

/**
 * Rolagem com inércia (Lenis) para a página inteira, inclusive nos links do menu (#âncoras).
 * - Desligada para quem pediu menos movimento no sistema.
 * - Ctrl/⌘ + roda continua sendo o zoom das pranchetas (o Lenis ignora a roda com Ctrl).
 * - Áreas com rolagem própria (tabelas, listas) rolam normalmente (allowNestedScroll).
 * - Elementos com o atributo data-lenis-prevent ficam fora da rolagem suave.
 */
let ativa: Lenis | null = null;

/** Rola suavemente até uma seção (id sem "#"), usada pelo mascote para "me leva lá". */
export function rolarPara(id: string) {
  const alvo = document.getElementById(id);
  if (!alvo) return;
  if (ativa) ativa.scrollTo(alvo, { offset: ROLAGEM.offsetAncora });
  else alvo.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      lerp: ROLAGEM.lerp,
      wheelMultiplier: ROLAGEM.wheelMultiplier,
      anchors: { offset: ROLAGEM.offsetAncora },
      allowNestedScroll: true,
      autoRaf: true,
    });
    ativa = lenis;
    // link direto com âncora (ex.: site.com/#construir): vai até a seção depois que a página montou
    const alvo = window.location.hash && document.querySelector(window.location.hash);
    const t = alvo ? setTimeout(() => lenis.scrollTo(alvo as HTMLElement, { offset: ROLAGEM.offsetAncora, immediate: true }), 50) : undefined;
    return () => {
      clearTimeout(t);
      lenis.destroy();
      ativa = null;
    };
  }, []);
  return null;
}
