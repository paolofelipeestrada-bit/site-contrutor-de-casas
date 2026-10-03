import { Canvas } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Box, Check, Eye, Footprints, House, Map as MapIcon, Moon, MousePointer2, Pencil, Ruler, Shuffle, Sofa, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EASE } from "../../lib/motion";
import { carregarPrefs, salvarPrefs, type PrefsControle } from "../../lib/three/controle";
import { mobiliarComVistoria, obstaculosDosMoveis, type VistoriaComodo } from "../../lib/three/mobilia";
import { medidasDoComodo, planTo3D, type Cobertura, type Room3D } from "../../lib/three/model";
import type { Brief, Plan } from "../../lib/types";
import { Symbol } from "../Logo";
import { Cena, P, type Jogador, type Modo } from "./Cena";
import { Joystick } from "./Joystick";
import { Andar, Orbita, type Eixos } from "./Navegacao";
import { PainelControles } from "./PainelControles";
import { CamadaDeRotulos, Projetor, rotulosDaCena } from "./Rotulos";

/**
 * "Entrar na casa 3D": tela cheia com a casa montada a partir da planta 2D atual.
 * Carregada sob demanda (o Three.js só baixa quando a pessoa abre o 3D).
 */
export default function Casa3D({ plan, brief, onFechar, onEditar }: { plan: Plan; brief: Brief | null; onFechar: () => void; onEditar?: () => void }) {
  const [cobertura, setCobertura] = useState<Cobertura>("laje");
  const [modo, setModo] = useState<Modo>("exterior");
  const [medidas, setMedidas] = useState(false);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [fase, setFase] = useState<"obra" | "pronta" | "livre">("obra");
  const [aqui, setAqui] = useState<Room3D | null>(null);
  const [travado, setTravado] = useState(false);
  const [mobilia, setMobilia] = useState(true);
  // cada clique em "Outra combinação" sorteia outros modelos do catálogo (as posições não mudam)
  const [variacao, setVariacao] = useState(0);
  const [painel, setPainel] = useState(false);
  // preferências do mouse: estado para a interface, ref para a câmera ler a cada quadro sem remontar
  const [prefs, setPrefsEstado] = useState<PrefsControle>(carregarPrefs);
  const prefsRef = useRef(prefs);
  const setPrefs = (p: PrefsControle) => {
    prefsRef.current = p;
    setPrefsEstado(p);
    salvarPrefs(p);
  };
  const jogador = useRef<Jogador>({ x: 0, y: 0, ativo: false });
  const joystick = useRef<Eixos>({ x: 0, y: 0 });
  const inicioObra = useRef<number | null>(null);
  const toque = useMemo(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches, []);

  // a planta 2D é a fonte de verdade: qualquer mudança nela refaz o modelo
  const model = useMemo(() => planTo3D(plan, brief, cobertura), [plan, brief, cobertura]);
  // planta → modelo 3D → móveis: a mobília também sai da planta (tipo e medidas de cada cômodo);
  // em seguida a vistoria confere cômodo por cômodo e completa o que ficou vazio
  const { moveis, vistoria } = useMemo(() => mobiliarComVistoria(plan, brief, { variacao }), [plan, brief, variacao]);
  const obstaculosMoveis = useMemo(() => (mobilia ? obstaculosDosMoveis(moveis) : []), [moveis, mobilia]);
  const sel = model.comodos.find((r) => r.id === selecionado) ?? null;
  const rotulos = useMemo(() => rotulosDaCena(model, medidas, modo), [model, medidas, modo]);
  const elsRotulos = useRef<Record<string, HTMLElement | null>>({});

  // "Construindo sua casa..." enquanto as paredes sobem e a cobertura desce
  useEffect(() => {
    const t = setTimeout(() => setFase((f) => (f === "obra" ? "pronta" : f)), 3600);
    return () => clearTimeout(t);
  }, []);

  // trava a rolagem da página por trás e fecha com Esc (fora do modo andar, onde Esc solta o cursor)
  useEffect(() => {
    const html = document.documentElement;
    const antes = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && modo !== "andar" && onFechar();
    const onLock = () => setTravado(!!document.pointerLockElement);
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerlockchange", onLock);
    return () => {
      html.style.overflow = antes;
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerlockchange", onLock);
    };
  }, [modo, onFechar]);

  const irPara = (m: Modo) => {
    setModo(m);
    setFase("livre");
    if (m === "andar") setSelecionado(null);
  };
  const onComodo = useCallback((r: Room3D | null) => setAqui(r), []);

  const S = Math.max(model.casa.w, model.casa.h) + 4;
  const cx = model.casa.x + model.casa.w / 2;
  const camInicial = P(cx - S * 0.55, model.casa.y - S * 0.75, S * 0.38);

  const btn = "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors";
  const ativo = "bg-ink text-bg";
  const inativo = "text-ink/80 hover:bg-white/10 hover:text-ink";
  const m = sel ? medidasDoComodo(sel) : null;
  const ma = aqui ? medidasDoComodo(aqui) : null;

  return (
    <div className="fixed inset-0 z-[80] bg-[#C9D3D0] text-ink" data-lenis-prevent role="dialog" aria-modal="true" aria-label="Casa em 3D">
      <Canvas
        shadows={!toque}
        dpr={[1, toque ? 1.5 : 2]}
        camera={{ fov: 60, near: 0.05, far: 400, position: camInicial }}
        onPointerMissed={() => modo !== "andar" && setSelecionado(null)}
        className="!absolute inset-0"
      >
        <color attach="background" args={["#C9D3D0"]} />
        <fog attach="fog" args={["#C9D3D0", 45, 160]} />
        <Cena
          model={model}
          modo={modo}
          medidas={medidas}
          selecionado={selecionado}
          onSelecionar={setSelecionado}
          jogador={jogador}
          inicioObra={inicioObra}
          sombras={!toque}
          moveis={mobilia ? moveis : []}
        />
        <Projetor rotulos={rotulos} els={elsRotulos} />
        {modo === "andar" ? (
          <Andar model={model} jogador={jogador} joystick={joystick} onComodo={onComodo} prefs={prefsRef} obstaculosExtra={obstaculosMoveis} />
        ) : (
          <Orbita model={model} modo={modo} sensibilidade={prefs.sensibilidade} />
        )}
      </Canvas>
      <CamadaDeRotulos rotulos={rotulos} els={elsRotulos} />

      {/* Barra do topo */}
      <header className="absolute inset-x-0 top-0 z-10 flex items-center gap-3 border-b border-white/10 bg-bg/90 px-3 py-2 backdrop-blur sm:px-5">
        <span className="flex shrink-0 items-center gap-2 font-display text-base font-semibold">
          <Symbol size={22} />
          <span className="hidden sm:inline">CasaAI 3D</span>
        </span>
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" aria-label="Ferramentas do 3D">
          <button type="button" className={`${btn} ${inativo}`} onClick={onFechar}>
            <MapIcon className="size-4" /> Planta 2D
          </button>
          <button type="button" className={`${btn} ${ativo}`} aria-pressed>
            <Box className="size-4" /> 3D
          </button>
          {onEditar && (
            <button type="button" className={`${btn} ${inativo}`} onClick={onEditar}>
              <Pencil className="size-4" /> Editar
            </button>
          )}
          <button type="button" className={`${btn} ${inativo} cursor-not-allowed opacity-45`} disabled title="Próxima etapa: dia/noite e luzes internas">
            <Moon className="size-4" /> Dia/Noite
          </button>
          <button
            type="button"
            className={`${btn} ${mobilia ? "bg-white/10 text-ink" : inativo}`}
            aria-pressed={mobilia}
            onClick={() => setMobilia(!mobilia)}
            title="Móveis gerados a partir do tipo e das medidas de cada cômodo"
          >
            <Sofa className="size-4" /> Mobília{mobilia ? "" : ": desligada"}
            {mobilia && <Check className="size-3.5 text-ok" />}
          </button>
          {mobilia && (
            <button
              type="button"
              className={`${btn} ${inativo}`}
              onClick={() => setVariacao((v) => v + 1)}
              title={`Outra combinação de móveis do catálogo (estilo ${brief?.estilo ?? "da casa"})`}
              aria-label="Outra combinação de móveis"
            >
              <Shuffle className="size-4" /> Variar
            </button>
          )}
          <button type="button" className={`${btn} ${medidas ? "bg-primary text-ink" : inativo}`} aria-pressed={medidas} onClick={() => setMedidas(!medidas)}>
            <Ruler className="size-4" /> Medidas
          </button>
          <button type="button" className={`${btn} ${painel ? "bg-white/10 text-ink" : inativo}`} aria-expanded={painel} onClick={() => setPainel(!painel)}>
            <MousePointer2 className="size-4" /> Controles
          </button>
        </nav>
        <button
          type="button"
          onClick={onEditar ?? onFechar}
          className="hidden h-9 shrink-0 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-sm font-medium text-ink transition-colors hover:bg-white/10 md:inline-flex"
        >
          <ArrowLeft className="size-4" /> Voltar para editar planta
        </button>
        <button
          type="button"
          onClick={onFechar}
          className="grid size-9 shrink-0 place-items-center rounded-lg text-ink/80 hover:bg-white/10 md:hidden"
          aria-label="Fechar 3D"
        >
          <X className="size-5" />
        </button>
      </header>

      <AnimatePresence>{painel && <PainelControles prefs={prefs} onChange={setPrefs} onFechar={() => setPainel(false)} />}</AnimatePresence>

      {/* Onde estou (modo andar) */}
      <AnimatePresence>
        {modo === "andar" && ma && (
          <motion.div
            key={aqui!.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="pointer-events-none absolute left-3 top-16 z-10 rounded-xl bg-bg/85 px-4 py-2.5 backdrop-blur sm:left-5"
          >
            <p className="eyebrow">Você está em</p>
            <p className="font-display text-lg font-semibold">{aqui!.nome}</p>
            <p className="tabular font-mono text-xs text-muted">
              {ma.dimensoes} · {ma.area}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Medidas do cômodo clicado */}
      <AnimatePresence>
        {m && modo !== "andar" && (
          <motion.aside
            key={sel!.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="absolute right-3 top-16 z-10 w-64 rounded-xl bg-bg/90 p-4 backdrop-blur sm:right-5"
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-display text-lg font-bold tracking-wide">{m.titulo}</p>
              <button
                type="button"
                onClick={() => setSelecionado(null)}
                className="grid size-7 place-items-center rounded-md text-muted hover:bg-white/10 hover:text-ink"
                aria-label="Fechar medidas"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="tabular mt-2 font-mono text-xl">{m.dimensoes}</p>
            <dl className="tabular mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Área</dt>
                <dd className="font-mono">{m.area}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Pé-direito</dt>
                <dd className="font-mono">{m.peDireito}</dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-line pt-2 text-[11px] leading-snug text-muted">
              Medidas de eixo das paredes, iguais às da planta 2D. Vão livre: {m.livre}.
            </p>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Obra → pronta */}
      <AnimatePresence>
        {fase !== "livre" && (
          <motion.div
            key="fase"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="absolute inset-x-3 bottom-32 z-20 mx-auto max-w-sm rounded-2xl bg-bg/92 p-5 text-center shadow-2xl backdrop-blur sm:bottom-28"
          >
            {fase === "obra" ? <Construindo /> : <Pronta vistoria={vistoria} onEntrar={() => irPara("andar")} onExterior={() => irPara("exterior")} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vistas e cobertura */}
      <div className="absolute inset-x-0 bottom-3 z-10 flex flex-wrap items-end justify-center gap-2 px-3 sm:bottom-5">
        <div className="flex rounded-xl bg-bg/90 p-1 backdrop-blur" role="radiogroup" aria-label="Vista">
          {(
            [
              ["exterior", "Ver exterior", House],
              ["interior", "Por dentro", Eye],
              ["andar", "Andar", Footprints],
            ] as const
          ).map(([k, label, Icon]) => (
            <button key={k} type="button" role="radio" aria-checked={modo === k} onClick={() => irPara(k)} className={`${btn} ${modo === k ? ativo : inativo}`}>
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
        <div className="flex rounded-xl bg-bg/90 p-1 backdrop-blur" role="radiogroup" aria-label="Cobertura">
          {(
            [
              ["laje", "Laje"],
              ["telhado", "Telhado moderno"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={cobertura === k}
              onClick={() => setCobertura(k)}
              className={`${btn} ${cobertura === k ? ativo : inativo}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Comandos do modo andar */}
      {modo === "andar" && (
        <>
          {toque ? (
            <div className="absolute bottom-36 left-4 z-10 sm:bottom-24">
              <Joystick eixos={joystick} />
            </div>
          ) : null}
          <motion.p
            initial={{ opacity: 1 }}
            animate={{ opacity: toque ? 0 : 1 }}
            transition={{ delay: 6, duration: 1 }}
            className={`pointer-events-none absolute left-1/2 z-10 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-lg bg-bg/80 px-3 py-1.5 text-center text-xs text-ink/90 backdrop-blur ${toque ? "top-40" : "bottom-24"}`}
          >
            {toque
              ? "Joystick para andar · arraste a tela para olhar"
              : travado
                ? "WASD ou setas para andar · Shift corre · Esc solta o mouse"
                : "WASD ou setas para andar · arraste ou clique na tela para olhar com o mouse"}
          </motion.p>
          {!toque && travado && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90" />
          )}
        </>
      )}

      {model.avisos.length > 0 && modo !== "andar" && (
        <p className="absolute left-3 top-16 z-10 max-w-xs rounded-lg bg-bg/85 px-3 py-2 text-[11px] text-muted backdrop-blur sm:left-5">
          {model.avisos.join(" ")}
        </p>
      )}
    </div>
  );
}

const ETAPAS = ["Lendo a planta 2D", "Levantando as paredes", "Portas e janelas", "Cobertura", "Vistoriando os móveis de cada cômodo"];

function Construindo() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => Math.min(ETAPAS.length - 1, v + 1)), 700);
    return () => clearInterval(t);
  }, []);
  return (
    <div>
      <p className="font-display text-lg font-semibold">Construindo sua casa...</p>
      <p className="mt-1 h-5 text-sm text-muted">{ETAPAS[i]}</p>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
        <motion.div className="h-full bg-primary" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3.4, ease: "easeInOut" }} />
      </div>
    </div>
  );
}

/** "9 cômodos conferidos · 7 peças acrescentadas" + os cômodos que mais receberam. */
function resumoVistoria(v: VistoriaComodo[]) {
  const comPecas = v.filter((c) => c.acrescentados.length > 0).sort((a, b) => b.acrescentados.length - a.acrescentados.length);
  const total = comPecas.reduce((s, c) => s + c.acrescentados.length, 0);
  const cabecalho = `Vistoria: ${v.length} cômodos conferidos · ${total ? `${total} ${total === 1 ? "peça acrescentada" : "peças acrescentadas"} onde estava vazio` : "nada vazio"}`;
  const detalhe = comPecas
    .slice(0, 3)
    .map((c) => `${c.nome} +${c.acrescentados.length}`)
    .join(" · ");
  return { cabecalho, detalhe };
}

function Pronta({ vistoria, onEntrar, onExterior }: { vistoria: VistoriaComodo[]; onEntrar: () => void; onExterior: () => void }) {
  const r = resumoVistoria(vistoria);
  return (
    <div>
      <p className="font-display text-lg font-semibold">Sua casa está pronta.</p>
      <p className="mt-1 text-sm text-muted">Montada a partir da planta 2D, com as mesmas medidas.</p>
      {vistoria.length > 0 && (
        <p className="mt-2 text-xs text-muted">
          <span className="text-ink/90">{r.cabecalho}</span>
          {r.detalhe && <span className="block">{r.detalhe}</span>}
        </p>
      )}
      <div className="mt-4 flex justify-center gap-2">
        <button
          type="button"
          onClick={onEntrar}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 font-display font-semibold text-ink hover:bg-primary-2"
          autoFocus
        >
          <Footprints className="size-4" /> Entrar na casa
        </button>
        <button
          type="button"
          onClick={onExterior}
          className="inline-flex h-11 items-center rounded-lg border border-white/20 px-4 text-sm font-medium hover:bg-white/10"
        >
          Ver exterior
        </button>
      </div>
    </div>
  );
}
