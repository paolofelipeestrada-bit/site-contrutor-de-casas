import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { buscarResposta, NAO_SEI, POR_ID, RESPOSTAS, SAUDACAO, SECOES, type Resposta, type Secao } from "../lib/ajuda";
import { rolarPara } from "./SmoothScroll";

/**
 * Faísca: o mascote assistente, no canto direito de baixo.
 * Uma casinha laranja com uma faísca no telhado: pisca, acena, segue o mouse com os olhos e responde dúvidas.
 * Perguntas rápidas respondem na hora (src/lib/ajuda.ts); perguntas livres vão para a IA (/api/ajuda),
 * e sem IA ele usa as respostas prontas.
 */

type Humor = "normal" | "feliz" | "pensando";
interface Msg {
  id: number;
  de: "pessoa" | "faisca";
  texto: string;
  acao?: Resposta["acao"];
}

const CHAVE_OI = "casaai-faisca-oi";
const COR = { corpo: "#EE7A3E", telhado: "#C9573F", sombra: "#B4472F", brilho: "#F7A06C", faisca: "#F6C453", tinta: "#1B2422" };

/** Seção do site que está na tela (e "planta" quando já existe uma planta gerada). */
function useSecaoAtual(): Secao {
  const [secao, setSecao] = useState<Secao>("inicio");
  useEffect(() => {
    const ids: Secao[] = ["inicio", "como-funciona", "briefing", "construir", "fases"];
    let raf = 0;
    const medir = () => {
      raf = 0;
      let atual: Secao = "inicio";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.45) atual = id;
      }
      if (atual === "briefing" && document.querySelector("[aria-label='Camadas do projeto']")) atual = "planta";
      setSecao(atual);
    };
    const pedir = () => {
      if (!raf) raf = requestAnimationFrame(medir);
    };
    medir();
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    const t = setInterval(pedir, 1500); // a planta pode aparecer sem rolagem
    return () => {
      window.removeEventListener("scroll", pedir);
      window.removeEventListener("resize", pedir);
      clearInterval(t);
      cancelAnimationFrame(raf);
    };
  }, []);
  return secao;
}

const lerStorage = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const gravarStorage = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* navegador sem armazenamento: só não lembra */
  }
};

// ───────────────────────── O personagem ─────────────────────────

export function Faisca({
  humor = "normal",
  olhar = { x: 0, y: 0 },
  piscando = false,
  acenando = false,
  parado = false,
  className,
}: {
  humor?: Humor;
  olhar?: { x: number; y: number };
  piscando?: boolean;
  acenando?: boolean;
  /** sem o pulinho (avatar pequeno do cabeçalho) */
  parado?: boolean;
  className?: string;
}) {
  const px = olhar.x * 3.2;
  const py = olhar.y * 3.2;
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      {!parado && (
        <motion.ellipse
          cx={60}
          cy={113}
          rx={26}
          ry={4}
          fill="#000"
          opacity={0.28}
          animate={{ scaleX: [1, 0.86, 1] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <motion.g animate={parado ? undefined : { y: [0, -5, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}>
        {/* bracinhos (o direito acena) */}
        <rect x={12} y={70} width={16} height={9} rx={4.5} fill={COR.sombra} transform="rotate(20 28 74)" />
        <motion.g
          style={{ originX: 0, originY: 0.5 }}
          animate={acenando ? { rotate: [0, -48, -18, -48, -18, 0] } : { rotate: 0 }}
          transition={{ duration: 1.3, ease: "easeInOut" }}
        >
          <rect x={92} y={70} width={16} height={9} rx={4.5} fill={COR.sombra} transform="rotate(-20 92 74)" />
        </motion.g>
        {/* pezinhos */}
        <ellipse cx={45} cy={106} rx={9} ry={4.5} fill={COR.sombra} />
        <ellipse cx={75} cy={106} rx={9} ry={4.5} fill={COR.sombra} />
        {/* corpo e telhado: uma casinha */}
        <rect x={24} y={44} width={72} height={62} rx={20} fill={COR.corpo} />
        <rect x={33} y={53} width={18} height={6} rx={3} fill={COR.brilho} opacity={0.8} />
        <path d="M18 55 L60 20 L102 55 Z" fill={COR.telhado} stroke={COR.telhado} strokeWidth={9} strokeLinejoin="round" />
        {/* a faísca no telhado */}
        <motion.path
          d="M60 0 C61.6 7.2 62.8 8.4 70 10 C62.8 11.6 61.6 12.8 60 20 C58.4 12.8 57.2 11.6 50 10 C57.2 8.4 58.4 7.2 60 0 Z"
          fill={COR.faisca}
          style={{ originX: 0.5, originY: 0.5 }}
          animate={humor === "pensando" ? { rotate: 360, scale: 1.1 } : { rotate: [0, 14, -8, 0], scale: [1, 1.22, 0.92, 1] }}
          transition={humor === "pensando" ? { duration: 0.9, repeat: Infinity, ease: "linear" } : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* bochechas */}
        <circle cx={36} cy={88} r={5.5} fill="#FFB4A2" opacity={0.6} />
        <circle cx={84} cy={88} r={5.5} fill="#FFB4A2" opacity={0.6} />
        {/* olhos */}
        {humor === "feliz" ? (
          <g stroke={COR.tinta} strokeWidth={4.5} strokeLinecap="round" fill="none">
            <path d="M39 77 Q46 68 53 77" />
            <path d="M67 77 Q74 68 81 77" />
          </g>
        ) : (
          <motion.g style={{ originX: 0.5, originY: 0.5 }} animate={{ scaleY: piscando ? 0.12 : 1 }} transition={{ duration: 0.08 }}>
            <ellipse cx={46} cy={75} rx={8.5} ry={9.5} fill="#fff" />
            <ellipse cx={74} cy={75} rx={8.5} ry={9.5} fill="#fff" />
            <circle cx={46 + (humor === "pensando" ? 2.5 : px)} cy={75 + (humor === "pensando" ? -3.5 : py)} r={4.6} fill={COR.tinta} />
            <circle cx={74 + (humor === "pensando" ? 2.5 : px)} cy={75 + (humor === "pensando" ? -3.5 : py)} r={4.6} fill={COR.tinta} />
            <circle cx={47.6 + px} cy={73.2 + py} r={1.5} fill="#fff" />
            <circle cx={75.6 + px} cy={73.2 + py} r={1.5} fill="#fff" />
          </motion.g>
        )}
        {/* boca */}
        {humor === "feliz" ? (
          <path d="M50 88 Q60 101 70 88 Z" fill={COR.tinta} stroke={COR.tinta} strokeWidth={2} strokeLinejoin="round" />
        ) : humor === "pensando" ? (
          <circle cx={62} cy={92} r={3} fill={COR.tinta} />
        ) : (
          <path d="M52 89 Q60 96 68 89" stroke={COR.tinta} strokeWidth={3.6} strokeLinecap="round" fill="none" />
        )}
      </motion.g>
    </svg>
  );
}

/** Texto que aparece letra por letra (instantâneo para quem pediu menos movimento). */
function TextoDigitado({ texto, animar, onFim }: { texto: string; animar: boolean; onFim?: () => void }) {
  const [n, setN] = useState(animar ? 0 : texto.length);
  useEffect(() => {
    if (!animar) return;
    if (n >= texto.length) {
      onFim?.();
      return;
    }
    const t = setTimeout(() => setN((v) => Math.min(texto.length, v + 2)), 16);
    return () => clearTimeout(t);
  }, [n, texto, animar, onFim]);
  return <>{texto.slice(0, n)}</>;
}

// ───────────────────────── O assistente ─────────────────────────

export function Mascote() {
  const secao = useSecaoAtual();
  const [aberto, setAberto] = useState(false);
  const [oi, setOi] = useState(false);
  const [humor, setHumor] = useState<Humor>("normal");
  const [piscando, setPiscando] = useState(false);
  const [acenando, setAcenando] = useState(false);
  const [olhar, setOlhar] = useState({ x: 0, y: 0 });
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [feitas, setFeitas] = useState<string[]>([]);
  const [texto, setTexto] = useState("");
  const [esperando, setEsperando] = useState(false);
  const [digitando, setDigitando] = useState<number | null>(null);
  const [rolando, setRolando] = useState(false);
  const botao = useRef<HTMLButtonElement>(null);
  const lista = useRef<HTMLDivElement>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const seq = useRef(0);
  const menosMovimento = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // pisca de vez em quando
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const ciclo = () => {
      t = setTimeout(() => {
        setPiscando(true);
        setTimeout(() => setPiscando(false), 140);
        ciclo();
      }, 2600 + Math.random() * 3000);
    };
    ciclo();
    return () => clearTimeout(t);
  }, []);

  // acena de tempos em tempos enquanto está fechado
  const acenar = useCallback(() => {
    setAcenando(true);
    setTimeout(() => setAcenando(false), 1400);
  }, []);
  useEffect(() => {
    if (aberto) return;
    const t = setInterval(acenar, 15000);
    return () => clearInterval(t);
  }, [aberto, acenar]);

  // os olhos seguem o mouse
  useEffect(() => {
    let raf = 0;
    const mover = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = botao.current?.getBoundingClientRect();
        if (!r) return;
        const dx = e.clientX - (r.x + r.width / 2);
        const dy = e.clientY - (r.y + r.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 220);
        setOlhar({ x: (dx / d) * k, y: (dy / d) * k });
      });
    };
    window.addEventListener("pointermove", mover, { passive: true });
    return () => {
      window.removeEventListener("pointermove", mover);
      cancelAnimationFrame(raf);
    };
  }, []);

  // enquanto a página rola ele se abaixa (para não ficar na frente dos botões) e volta quando ela para
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const rolar = () => {
      setRolando(true);
      clearTimeout(t);
      t = setTimeout(() => setRolando(false), 900);
    };
    window.addEventListener("scroll", rolar, { passive: true });
    return () => {
      window.removeEventListener("scroll", rolar);
      clearTimeout(t);
    };
  }, []);

  // na primeira visita ele se apresenta
  useEffect(() => {
    if (lerStorage(CHAVE_OI)) return;
    const t1 = setTimeout(() => {
      setOi(true);
      acenar();
      gravarStorage(CHAVE_OI, "1");
    }, 7000);
    const t2 = setTimeout(() => setOi(false), 17000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [acenar]);

  const falar = useCallback((t: string, acao?: Resposta["acao"]) => {
    const id = ++seq.current;
    setMsgs((m) => [...m, { id, de: "faisca", texto: t, acao }]);
    setDigitando(id);
    setHumor("feliz");
    setTimeout(() => setHumor("normal"), 1800);
  }, []);

  const abrir = () => {
    setOi(false);
    setAberto(true);
    if (!msgs.length) falar(`${SAUDACAO} ${SECOES[secao].dica}`);
  };

  // rola a conversa para a última mensagem
  useEffect(() => {
    lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: menosMovimento ? "auto" : "smooth" });
  }, [msgs, esperando, digitando, menosMovimento]);

  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", esc);
    if (!window.matchMedia("(pointer: coarse)").matches) setTimeout(() => entrada.current?.focus(), 250);
    return () => window.removeEventListener("keydown", esc);
  }, [aberto]);

  const perguntaPronta = (r: Resposta) => {
    if (esperando) return;
    setMsgs((m) => [...m, { id: ++seq.current, de: "pessoa", texto: r.pergunta }]);
    setFeitas((f) => [...f, r.id]);
    setEsperando(true);
    setHumor("pensando");
    setTimeout(() => {
      setEsperando(false);
      falar(r.resposta, r.acao);
    }, 550);
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const pergunta = texto.trim();
    if (!pergunta || esperando) return;
    setTexto("");
    const historico = msgs.slice(-6).map((m) => ({ de: m.de, texto: m.texto }));
    setMsgs((m) => [...m, { id: ++seq.current, de: "pessoa", texto: pergunta }]);
    setEsperando(true);
    setHumor("pensando");
    const local = buscarResposta(pergunta);
    // pergunta que bate forte com uma resposta pronta: responde na hora, sem IA
    if (local && local.pontos >= 2) {
      setTimeout(() => {
        setEsperando(false);
        setFeitas((f) => [...f, local.resposta.id]);
        falar(local.resposta.resposta, local.resposta.acao);
      }, 550);
      return;
    }
    try {
      const res = await fetch("/api/ajuda", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pergunta, secao, historico }),
        signal: AbortSignal.timeout(25_000),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { resposta } = (await res.json()) as { resposta?: string };
      if (!resposta) throw new Error("vazia");
      setEsperando(false);
      falar(resposta, local?.resposta.acao);
    } catch {
      setEsperando(false);
      if (local) falar(local.resposta.resposta, local.resposta.acao);
      else falar(NAO_SEI);
    }
  };

  const sugestoes = [...SECOES[secao].perguntas, ...RESPOSTAS.map((r) => r.id)]
    .filter((id, i, a) => a.indexOf(id) === i && !feitas.includes(id))
    .slice(0, 4)
    .map((id) => POR_ID[id]);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {aberto && (
          <motion.div
            key="painel"
            role="dialog"
            aria-label="Ajuda do Faísca"
            data-lenis-prevent
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            style={{ originX: 1, originY: 1 }}
            className="pointer-events-auto flex max-h-[min(70vh,560px)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-2xl"
          >
            <header className="flex items-center gap-3 border-b border-line px-4 py-3">
              <span className="grid size-10 place-items-center rounded-full bg-[#EE7A3E]/15">
                <Faisca parado humor={esperando ? "pensando" : humor} piscando={piscando} className="size-9" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-semibold">Faísca</p>
                <p className="truncate text-[11px] text-muted">{esperando ? "pensando…" : "assistente da CasaAI"}</p>
              </div>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="grid size-8 place-items-center rounded-lg text-muted hover:bg-white/5 hover:text-ink"
                aria-label="Fechar ajuda"
              >
                <X className="size-4" />
              </button>
            </header>

            <div ref={lista} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
              {msgs.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className={m.de === "pessoa" ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={
                      m.de === "pessoa"
                        ? "max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-ink"
                        : "max-w-[90%] rounded-2xl rounded-bl-md border border-[#EE7A3E]/25 bg-[#EE7A3E]/10 px-3.5 py-2 text-sm leading-relaxed text-ink"
                    }
                  >
                    {m.de === "faisca" ? (
                      <TextoDigitado texto={m.texto} animar={!menosMovimento && digitando === m.id} onFim={() => setDigitando((d) => (d === m.id ? null : d))} />
                    ) : (
                      m.texto
                    )}
                    {m.acao && digitando !== m.id && (
                      <button
                        type="button"
                        onClick={() => {
                          rolarPara(m.acao!.secao);
                          if (window.innerWidth < 640) setAberto(false);
                        }}
                        className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#F7A06C] hover:underline"
                      >
                        {m.acao.rotulo} <ArrowRight className="size-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
              {esperando && (
                <div className="flex gap-1 px-1" aria-label="Faísca está pensando">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="size-2 rounded-full bg-[#EE7A3E]"
                      animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              )}
            </div>

            {sugestoes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-line px-4 py-2.5">
                {sugestoes.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    disabled={esperando}
                    onClick={() => perguntaPronta(r)}
                    className="rounded-full border border-[#EE7A3E]/35 px-2.5 py-1 text-xs text-ink transition-colors hover:bg-[#EE7A3E]/15 disabled:opacity-50"
                  >
                    {r.pergunta}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={enviar} className="flex items-center gap-2 border-t border-line p-3">
              <input
                ref={entrada}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                maxLength={300}
                placeholder="Pergunte qualquer coisa…"
                aria-label="Sua pergunta para o Faísca"
                className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-[#EE7A3E]"
              />
              <button
                type="submit"
                disabled={!texto.trim() || esperando}
                aria-label="Enviar pergunta"
                className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#EE7A3E] text-[#1B2422] transition-opacity disabled:opacity-40"
              >
                <Send className="size-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {oi && !aberto && (
          <motion.div
            key="oi"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            style={{ originX: 1, originY: 1 }}
            className="pointer-events-auto relative max-w-[250px] rounded-2xl rounded-br-md border border-line bg-card px-4 py-3 pr-9 text-sm shadow-xl"
          >
            <button type="button" onClick={abrir} className="text-left">
              <b className="font-semibold">Oi! Eu sou o Faísca ⚡</b>
              <span className="mt-0.5 block text-muted">Ficou com alguma dúvida? É só me chamar.</span>
            </button>
            <button
              type="button"
              onClick={() => setOi(false)}
              aria-label="Fechar"
              className="absolute right-2 top-2 grid size-6 place-items-center rounded-md text-muted hover:text-ink"
            >
              <X className="size-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        ref={botao}
        type="button"
        onClick={() => (aberto ? setAberto(false) : abrir())}
        onHoverStart={() => !aberto && acenar()}
        aria-label={aberto ? "Fechar a ajuda do Faísca" : "Abrir a ajuda do Faísca"}
        aria-expanded={aberto}
        whileHover={{ scale: 1.08, rotate: [0, -6, 6, 0] }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, y: 40, scale: 0.6 }}
        animate={rolando && !aberto ? { opacity: 0.35, y: 46, scale: 0.75 } : { opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className="pointer-events-auto relative size-14 rounded-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)] outline-offset-4 sm:size-[76px]"
      >
        <Faisca humor={esperando ? "pensando" : aberto ? "feliz" : humor} olhar={olhar} piscando={piscando} acenando={acenando} className="size-full" />
      </motion.button>
    </div>
  );
}
