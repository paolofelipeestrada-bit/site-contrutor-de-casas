import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { Movel3D } from "../../lib/three/mobilia";
import type { Door3D, Model3D, Room3D, Telhado, Wall3D, Window3D } from "../../lib/three/model";
import { Mobilia } from "./Moveis";

/**
 * A casa em Three.js. Só desenha o que vem do Model3D (que vem da planta 2D): nada é calculado aqui além de
 * converter metros da planta para o espaço 3D.
 * Planta (x, y, altura) → Three.js (x, altura, -y): a rua fica na frente da câmera e a esquerda continua esquerda.
 */
export const P = (x: number, y: number, z = 0) => new THREE.Vector3(x, z, -y);

export type Modo = "exterior" | "interior" | "andar";

/** Cores e acabamentos da maquete. Para mudar a aparência, edite aqui. */
export const CORES = {
  parede: "#ECE7DE",
  paredeExterna: "#E4DDD1",
  laje: "#D9D4CB",
  telhado: "#9C4A38",
  forro: "#F2EFE9",
  pisos: { madeira: "#B08A66", ceramica: "#D5D3CC", concreto: "#9A9C97", externo: "#B9AE9C" },
  selecionado: "#C9573F",
  folha: "#CDB79A",
  entrada: "#5B4636",
  batente: "#F4F1EA",
  caixilho: "#2F3533",
  vidro: "#A9C7D4",
  portao: "#4B5250",
  pilar: "#E4DDD1",
  lote: "#7E8F6E",
  entorno: "#6E7D63",
  calcada: "#B8B4AA",
  rua: "#3A3F3D",
  faixa: "#E8E2D2",
  divisa: "#F4F1EA",
};

/** Pessoa no modo andar (posição na planta), lida pelas portas para abrir sozinhas. */
export interface Jogador {
  x: number;
  y: number;
  ativo: boolean;
}

interface Props {
  model: Model3D;
  modo: Modo;
  medidas: boolean;
  selecionado: string | null;
  onSelecionar: (id: string | null) => void;
  jogador: MutableRefObject<Jogador>;
  /** instante (s do relógio do Three) em que a construção começou */
  inicioObra: MutableRefObject<number | null>;
  sombras: boolean;
  /** mobília automática (vazia = sem móveis) */
  moveis?: Movel3D[];
}

const DUR_OBRA = 2.2; // s para todas as paredes subirem

export function Cena({ model, modo, medidas, selecionado, onSelecionar, jogador, inicioObra, sombras, moveis = [] }: Props) {
  const { casa, lote } = model;
  const cx = casa.x + casa.w / 2;
  const cy = casa.y + casa.h / 2;
  const mostrarCobertura = modo !== "interior";

  return (
    <>
      <Luzes cx={cx} cy={cy} tamanho={Math.max(lote.largura, lote.profundidade)} sombras={sombras} />
      <Terreno model={model} />
      <group>
        {model.comodos.map((r) => (
          <Piso key={r.id} r={r} selecionado={r.id === selecionado} onSelecionar={modo === "andar" ? undefined : onSelecionar} />
        ))}
      </group>
      <Paredes paredes={model.paredes.filter((p) => p.parte !== "platibanda")} casa={casa} inicioObra={inicioObra} />
      <DepoisDasParedes inicioObra={inicioObra}>
        {model.portas.map((d) => (
          <Porta key={d.id} d={d} jogador={jogador} />
        ))}
        {model.janelas.map((j) => (
          <Janela key={j.id} j={j} />
        ))}
        <Mobilia moveis={moveis} />
        {model.pilares.map((p, i) => (
          <mesh key={i} position={P(p.x, p.y, p.altura / 2)} castShadow receiveShadow>
            <boxGeometry args={[p.lado, p.altura, p.lado]} />
            <meshStandardMaterial color={CORES.pilar} roughness={0.9} />
          </mesh>
        ))}
      </DepoisDasParedes>
      {mostrarCobertura && <Cobertura model={model} inicioObra={inicioObra} />}
      {medidas && modo !== "andar" && <Cotas model={model} />}
    </>
  );
}

// ───────────────────────── Luz ─────────────────────────

function Luzes({ cx, cy, tamanho, sombras }: { cx: number; cy: number; tamanho: number; sombras: boolean }) {
  const s = tamanho * 0.8;
  return (
    <>
      {/* céu claro + reflexo do chão; o ambiente clareia o interior (as luzes internas entram na etapa Dia/Noite) */}
      <hemisphereLight args={["#F6F4EE", "#B9B2A4", 1.15]} />
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[cx - s * 0.6, s * 1.1, -cy + s * 0.9]}
        intensity={2.1}
        color="#FFF6E8"
        castShadow={sombras}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-s}
        shadow-camera-right={s}
        shadow-camera-top={s}
        shadow-camera-bottom={-s}
        shadow-camera-near={0.5}
        shadow-camera-far={s * 4}
      >
        <object3D attach="target" position={[cx, 0, -cy]} />
      </directionalLight>
    </>
  );
}

// ───────────────────────── Terreno, rua, divisas, norte ─────────────────────────

function Terreno({ model }: { model: Model3D }) {
  const { lote, norte } = model;
  const L = lote.largura;
  const D = lote.profundidade;
  const div = 0.06;
  return (
    <group>
      {/* entorno (chão além do terreno) */}
      <mesh rotation-x={-Math.PI / 2} position={[L / 2, -0.09, -D / 2]} receiveShadow>
        <planeGeometry args={[L + 120, D + 120]} />
        <meshStandardMaterial color={CORES.entorno} roughness={1} />
      </mesh>
      {/* lote */}
      <mesh rotation-x={-Math.PI / 2} position={[L / 2, -0.06, -D / 2]} receiveShadow>
        <planeGeometry args={[L, D]} />
        <meshStandardMaterial color={CORES.lote} roughness={1} />
      </mesh>
      {/* divisas do terreno */}
      {(
        [
          [L / 2, 0, L, div],
          [L / 2, D, L, div],
          [0, D / 2, div, D],
          [L, D / 2, div, D],
        ] as const
      ).map(([x, y, w, h], i) => (
        <mesh key={i} position={P(x, y, -0.04)} receiveShadow>
          <boxGeometry args={[w, 0.04, h]} />
          <meshStandardMaterial color={CORES.divisa} roughness={0.8} />
        </mesh>
      ))}
      {/* calçada e rua na frente (y < 0) */}
      <mesh position={P(L / 2, -0.9, -0.07)} receiveShadow>
        <boxGeometry args={[L + 40, 0.04, 1.8]} />
        <meshStandardMaterial color={CORES.calcada} roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={P(L / 2, -5.3, -0.085)} receiveShadow>
        <planeGeometry args={[L + 40, 7]} />
        <meshStandardMaterial color={CORES.rua} roughness={1} />
      </mesh>
      {Array.from({ length: Math.ceil((L + 40) / 3) }, (_, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={P(L / 2 - 20 + i * 3 + 0.75, -5.3, -0.08)}>
          <planeGeometry args={[1.5, 0.12]} />
          <meshBasicMaterial color={CORES.faixa} />
        </mesh>
      ))}
      {norte && <SetaNorte x={L + 1.6} y={1.6} dir={norte} />}
    </group>
  );
}

function SetaNorte({ x, y, dir }: { x: number; y: number; dir: { x: number; y: number } }) {
  // seta no chão apontando para o norte (ângulo na planta → rotação no plano)
  const ang = Math.atan2(dir.y, dir.x);
  const forma = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0.9, 0);
    s.lineTo(-0.5, 0.45);
    s.lineTo(-0.25, 0);
    s.lineTo(-0.5, -0.45);
    s.closePath();
    return s;
  }, []);
  return (
    <group position={P(x, y, 0.01)}>
      <mesh rotation={[-Math.PI / 2, 0, ang]}>
        <shapeGeometry args={[forma]} />
        <meshBasicMaterial color={CORES.selecionado} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ───────────────────────── Pisos (clicáveis) ─────────────────────────

function Piso({ r, selecionado, onSelecionar }: { r: Room3D; selecionado: boolean; onSelecionar?: (id: string | null) => void }) {
  const cor = selecionado ? CORES.selecionado : CORES.pisos[r.piso];
  return (
    <mesh
      position={P(r.x + r.largura / 2, r.y + r.profundidade / 2, -0.025)}
      receiveShadow
      onClick={
        onSelecionar
          ? (e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              onSelecionar(selecionado ? null : r.id);
            }
          : undefined
      }
      onPointerOver={onSelecionar ? () => (document.body.style.cursor = "pointer") : undefined}
      onPointerOut={onSelecionar ? () => (document.body.style.cursor = "") : undefined}
    >
      <boxGeometry args={[r.largura, 0.05, r.profundidade]} />
      <meshStandardMaterial color={cor} roughness={r.piso === "ceramica" ? 0.45 : 0.85} />
    </mesh>
  );
}

// ───────────────────────── Paredes (sobem durante a "obra") ─────────────────────────

/** Converte um segmento de parede da planta em caixa: centro, tamanho e se corre ao longo de x. */
function caixa(p: { x1: number; y1: number; x2: number; y2: number }, esp: number, base: number, topo: number) {
  const aoLongoX = Math.abs(p.y1 - p.y2) < 1e-6;
  const len = Math.hypot(p.x2 - p.x1, p.y2 - p.y1);
  const centro = P((p.x1 + p.x2) / 2, (p.y1 + p.y2) / 2, (base + topo) / 2);
  const tamanho: [number, number, number] = aoLongoX ? [len, topo - base, esp] : [esp, topo - base, len];
  return { centro, tamanho };
}

function Paredes({ paredes, casa, inicioObra }: { paredes: Wall3D[]; casa: { y: number; h: number }; inicioObra: MutableRefObject<number | null> }) {
  const grupo = useRef<THREE.Group>(null);
  const matInt = useMemo(() => new THREE.MeshStandardMaterial({ color: CORES.parede, roughness: 0.92 }), []);
  const matExt = useMemo(() => new THREE.MeshStandardMaterial({ color: CORES.paredeExterna, roughness: 0.95 }), []);
  const pronto = useRef(false);

  // a obra: cada parede sobe do chão, da frente para os fundos
  useFrame(({ clock }) => {
    if (pronto.current || !grupo.current) return;
    if (inicioObra.current === null) inicioObra.current = clock.elapsedTime;
    const t = clock.elapsedTime - inicioObra.current;
    let todas = true;
    for (const m of grupo.current.children as THREE.Mesh[]) {
      const { atraso, base, topo } = m.userData as { atraso: number; base: number; topo: number };
      const k = THREE.MathUtils.clamp((t - atraso) / 0.9, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      if (k < 1) todas = false;
      // a parede inteira cresce a partir do chão (vergas e peitoris acompanham na mesma proporção)
      m.scale.y = Math.max(0.0001, e);
      m.position.y = ((base + topo) / 2) * e;
      m.visible = e > 0.001;
    }
    if (todas) pronto.current = true;
  });

  return (
    <group ref={grupo}>
      {paredes.map((p) => {
        const { centro, tamanho } = caixa(p, p.espessura, p.base, p.topo);
        const frente = ((p.y1 + p.y2) / 2 - casa.y) / Math.max(casa.h, 1);
        return (
          <mesh
            key={p.id}
            position={centro}
            material={p.externa ? matExt : matInt}
            castShadow
            receiveShadow
            userData={{ atraso: frente * (DUR_OBRA - 0.9), base: p.base, topo: p.topo }}
          >
            <boxGeometry args={tamanho} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Portas, janelas e pilares entram quando as paredes terminam de subir. */
function DepoisDasParedes({ inicioObra, children }: { inicioObra: MutableRefObject<number | null>; children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current || inicioObra.current === null) return;
    const k = THREE.MathUtils.clamp((clock.elapsedTime - inicioObra.current - DUR_OBRA * 0.75) / 0.5, 0, 1);
    g.current.visible = k > 0;
    g.current.scale.y = 1 - Math.pow(1 - k, 3) || 0.0001;
  });
  return (
    <group ref={g} visible={false}>
      {children}
    </group>
  );
}

// ───────────────────────── Portas ─────────────────────────

const angulo = (x: number, y: number) => Math.atan2(y, x);
const normaliza = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/** Grupo alinhado à abertura: origem em (x1,y1), eixo X local ao longo da abertura, Z local atravessando a parede. */
function Alinhado({ a, children }: { a: { x1: number; y1: number; x2: number; y2: number }; children: React.ReactNode }) {
  return (
    <group position={P(a.x1, a.y1)} rotation-y={angulo(a.x2 - a.x1, a.y2 - a.y1)}>
      {children}
    </group>
  );
}

function Porta({ d, jogador }: { d: Door3D; jogador: MutableRefObject<Jogador> }) {
  const pivo = useRef<THREE.Group>(null);
  const folha = useRef<THREE.Group>(null);
  const aberta = useRef(0); // 0 = fechada, 1 = aberta
  const alvo = useRef(0);
  const clicada = useRef<boolean | null>(null);
  const L = d.largura;
  const H = d.altura;
  const bat = 0.05; // batente
  const cx = (d.x1 + d.x2) / 2;
  const cy = (d.y1 + d.y2) / 2;
  // quanto a folha gira para abrir para dentro do cômodo (±90°, um pouco menos para não encostar na parede)
  const giro = normaliza(angulo(d.abre.x, d.abre.y) - angulo(d.x2 - d.x1, d.y2 - d.y1)) * 0.94;

  useFrame((_, dt) => {
    const j = jogador.current;
    if (j.ativo) alvo.current = Math.hypot(j.x - cx, j.y - cy) < 1.7 ? 1 : 0;
    else alvo.current = clicada.current ? 1 : 0;
    aberta.current = THREE.MathUtils.damp(aberta.current, alvo.current, 4, dt);
    const k = aberta.current;
    if (pivo.current) pivo.current.rotation.y = giro * k;
    if (folha.current && d.tipo === "correr") folha.current.position.x = -k * (L / 2 - 0.08);
    if (folha.current && d.tipo === "portao") {
      folha.current.scale.y = 1 - k * 0.88;
      folha.current.position.y = H / 2 + (k * H * 0.88) / 2;
    }
  });

  const alternar = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    clicada.current = !(clicada.current ?? false);
  };

  if (!d.naParede) {
    // a planta pôs a abertura num lado aberto: só a soleira marca o lugar
    return (
      <Alinhado a={d}>
        <mesh position={[L / 2, 0.005, 0]} receiveShadow>
          <boxGeometry args={[L, 0.02, 0.3]} />
          <meshStandardMaterial color={CORES.batente} roughness={0.7} />
        </mesh>
      </Alinhado>
    );
  }
  if (d.tipo === "passagem") return null;

  const esp = d.espessura + 0.02;
  const Batente = (
    <>
      <mesh position={[bat / 2, H / 2, 0]} castShadow>
        <boxGeometry args={[bat, H, esp]} />
        <meshStandardMaterial color={CORES.batente} roughness={0.6} />
      </mesh>
      <mesh position={[L - bat / 2, H / 2, 0]} castShadow>
        <boxGeometry args={[bat, H, esp]} />
        <meshStandardMaterial color={CORES.batente} roughness={0.6} />
      </mesh>
      <mesh position={[L / 2, H - bat / 2, 0]} castShadow>
        <boxGeometry args={[L, bat, esp]} />
        <meshStandardMaterial color={CORES.batente} roughness={0.6} />
      </mesh>
    </>
  );

  if (d.tipo === "portao") {
    return (
      <Alinhado a={d}>
        <group ref={folha} position={[L / 2, H / 2, 0]} onClick={alternar}>
          <mesh castShadow>
            <boxGeometry args={[L - 0.04, H - 0.02, 0.05]} />
            <meshStandardMaterial color={CORES.portao} roughness={0.6} metalness={0.3} />
          </mesh>
          {Array.from({ length: Math.floor(H / 0.25) }, (_, i) => (
            <mesh key={i} position={[0, -H / 2 + 0.25 * (i + 0.5), 0.03]}>
              <boxGeometry args={[L - 0.06, 0.02, 0.01]} />
              <meshStandardMaterial color="#3D4341" />
            </mesh>
          ))}
        </group>
      </Alinhado>
    );
  }

  if (d.tipo === "correr") {
    const meia = L / 2 + 0.04;
    const Painel = ({ x, z }: { x: number; z: number }) => (
      <group position={[x, H / 2, z]}>
        <mesh>
          <boxGeometry args={[meia, H - 0.04, 0.012]} />
          <meshStandardMaterial color={CORES.vidro} transparent opacity={0.28} roughness={0.05} metalness={0.1} depthWrite={false} />
        </mesh>
        {[
          [-meia / 2 + 0.025, 0, 0.05, H - 0.04],
          [meia / 2 - 0.025, 0, 0.05, H - 0.04],
          [0, H / 2 - 0.045, meia, 0.05],
          [0, -H / 2 + 0.045, meia, 0.05],
        ].map(([px, py, w, h], i) => (
          <mesh key={i} position={[px, py, 0]} castShadow>
            <boxGeometry args={[w, h, 0.04]} />
            <meshStandardMaterial color={CORES.caixilho} roughness={0.5} metalness={0.4} />
          </mesh>
        ))}
      </group>
    );
    return (
      <Alinhado a={d}>
        <group onClick={alternar}>
          <Painel x={meia / 2} z={0.025} />
          <group ref={folha}>
            <Painel x={L - meia / 2} z={-0.025} />
          </group>
        </group>
      </Alinhado>
    );
  }

  // porta de giro (interna ou entrada): batente + folha que gira na dobradiça
  const larguraFolha = L - 2 * bat;
  return (
    <Alinhado a={d}>
      {Batente}
      <group ref={pivo} position={[bat, 0, 0]} onClick={alternar}>
        <mesh position={[larguraFolha / 2, (H - bat) / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[larguraFolha - 0.01, H - bat - 0.01, 0.04]} />
          <meshStandardMaterial color={d.tipo === "entrada" ? CORES.entrada : CORES.folha} roughness={0.7} />
        </mesh>
        {/* maçaneta dos dois lados */}
        <mesh position={[larguraFolha - 0.08, 1.05, 0.04]}>
          <boxGeometry args={[0.12, 0.025, 0.03]} />
          <meshStandardMaterial color="#B8B2A6" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[larguraFolha - 0.08, 1.05, -0.04]}>
          <boxGeometry args={[0.12, 0.025, 0.03]} />
          <meshStandardMaterial color="#B8B2A6" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
    </Alinhado>
  );
}

// ───────────────────────── Janelas ─────────────────────────

function Janela({ j }: { j: Window3D }) {
  const L = j.largura;
  const H = j.altura;
  const b = 0.05;
  const esp = j.espessura * 0.6;
  const barras: [number, number, number, number][] = [
    [b / 2, H / 2, b, H],
    [L - b / 2, H / 2, b, H],
    [L / 2, b / 2, L, b],
    [L / 2, H - b / 2, L, b],
  ];
  if (L > 1.0) barras.push([L / 2, H / 2, 0.04, H]);
  return (
    <Alinhado a={j}>
      <group position={[0, j.peitoril, 0]}>
        {barras.map(([x, y, w, h], i) => (
          <mesh key={i} position={[x, y, 0]} castShadow>
            <boxGeometry args={[w, h, esp]} />
            <meshStandardMaterial color={CORES.caixilho} roughness={0.5} metalness={0.4} />
          </mesh>
        ))}
        <mesh position={[L / 2, H / 2, 0]}>
          <boxGeometry args={[L - 2 * b, H - 2 * b, 0.01]} />
          <meshStandardMaterial color={CORES.vidro} transparent opacity={0.3} roughness={0.05} metalness={0.1} depthWrite={false} />
        </mesh>
        {/* soleira de pedra por fora */}
        <mesh position={[L / 2, -0.015, 0]} receiveShadow>
          <boxGeometry args={[L + 0.1, 0.03, j.espessura + 0.06]} />
          <meshStandardMaterial color={CORES.batente} roughness={0.7} />
        </mesh>
      </group>
    </Alinhado>
  );
}

// ───────────────────────── Cobertura ─────────────────────────

function Cobertura({ model, inicioObra }: { model: Model3D; inicioObra: MutableRefObject<number | null> }) {
  const grupo = useRef<THREE.Group>(null);
  const { cobertura, config } = model;
  const platibandas = model.paredes.filter((p) => p.parte === "platibanda");

  // a cobertura desce no lugar depois que as paredes subiram
  useFrame(({ clock }) => {
    if (!grupo.current || inicioObra.current === null) return;
    const t = clock.elapsedTime - inicioObra.current - DUR_OBRA;
    const k = THREE.MathUtils.clamp(t / 0.8, 0, 1);
    const e = 1 - Math.pow(1 - k, 3);
    grupo.current.position.y = (1 - e) * 2.5;
    grupo.current.visible = k > 0;
  });

  return (
    <group ref={grupo} visible={false}>
      {cobertura.tipo === "laje" ? (
        <>
          {cobertura.lajes.map((l, i) => (
            <mesh key={i} position={P(l.x + l.w / 2, l.y + l.h / 2, config.peDireito + config.laje.espessura / 2)} castShadow receiveShadow>
              <boxGeometry args={[l.w + 0.001, config.laje.espessura, l.h + 0.001]} />
              <meshStandardMaterial color={CORES.laje} roughness={0.95} />
            </mesh>
          ))}
          {platibandas.map((p) => {
            const { centro, tamanho } = caixa(p, p.espessura, p.base, p.topo);
            return (
              <mesh key={p.id} position={centro} castShadow receiveShadow>
                <boxGeometry args={tamanho} />
                <meshStandardMaterial color={CORES.paredeExterna} roughness={0.95} />
              </mesh>
            );
          })}
        </>
      ) : (
        cobertura.telhado && (
          <>
            {/* forro: teto de todos os cômodos e o lado de baixo do beiral */}
            <mesh
              rotation-x={-Math.PI / 2}
              position={P(cobertura.telhado.x + cobertura.telhado.largura / 2, cobertura.telhado.y + cobertura.telhado.profundidade / 2, config.peDireito)}
            >
              <planeGeometry args={[cobertura.telhado.largura, cobertura.telhado.profundidade]} />
              <meshStandardMaterial color={CORES.forro} side={THREE.DoubleSide} roughness={1} />
            </mesh>
            <Telhado4Aguas t={cobertura.telhado} />
          </>
        )
      )}
    </group>
  );
}

function Telhado4Aguas({ t }: { t: Telhado }) {
  const geo = useMemo(() => {
    const { x, y, largura: L, profundidade: D, base: b, cumeeira: c } = t;
    // cumeeira ao longo do lado maior; as águas têm a mesma inclinação
    const v: number[][] =
      t.eixo === "x"
        ? (() => {
            const m = D / 2;
            const yc = y + m;
            const A = [x, y, b],
              B = [x + L, y, b],
              C = [x + L, y + D, b],
              Dd = [x, y + D, b];
            const R1 = [x + m, yc, c],
              R2 = [x + L - m, yc, c];
            return [A, B, R2, A, R2, R1, C, Dd, R1, C, R1, R2, Dd, A, R1, B, C, R2];
          })()
        : (() => {
            const m = L / 2;
            const xc = x + m;
            const A = [x, y, b],
              B = [x + L, y, b],
              C = [x + L, y + D, b],
              Dd = [x, y + D, b];
            const R1 = [xc, y + m, c],
              R2 = [xc, y + D - m, c];
            return [Dd, A, R1, Dd, R1, R2, B, C, R2, B, R2, R1, A, B, R1, C, Dd, R2];
          })();
    const pos = new Float32Array(v.flatMap(([px, py, pz]) => [px, pz, -py]));
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  }, [t]);
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial color={CORES.telhado} roughness={0.85} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ───────────────────────── Medidas ─────────────────────────

function Cotas({ model }: { model: Model3D }) {
  // linhas das cotas totais no chão (os números ficam nos rótulos HTML, ver Rotulos.tsx)
  const { casa } = model;
  return (
    <group>
      <mesh position={P(casa.x + casa.w / 2, casa.y - 0.6, 0.02)}>
        <boxGeometry args={[casa.w, 0.01, 0.03]} />
        <meshBasicMaterial color={CORES.selecionado} />
      </mesh>
      <mesh position={P(casa.x - 0.6, casa.y + casa.h / 2, 0.02)}>
        <boxGeometry args={[0.03, 0.01, casa.h]} />
        <meshBasicMaterial color={CORES.selecionado} />
      </mesh>
    </group>
  );
}
