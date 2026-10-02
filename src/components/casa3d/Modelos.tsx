import type { ReactElement } from "react";
import { B, C, Cil, Cone, Esf, mat, Pes, type Dim } from "./primitivas";

/**
 * VARIAÇÕES DE MÓVEIS 3D (os modelos do catálogo, src/lib/three/catalogo.ts).
 * Cada desenho recebe as medidas que a mobília automática reservou (l = largura, p = profundidade, a = altura),
 * com a frente para +Z e a base em y = 0, e cabe dentro delas — por isso trocar o modelo nunca quebra o encaixe.
 * Tudo é feito com caixas, cilindros, esferas e cones (leve para o celular).
 */

type Desenho = (d: Dim) => ReactElement;

/** Tons usados pelas variações. */
const T = {
  linho: "#D8CFC0",
  cinza: "#8A918F",
  grafite: "#4A4F4E",
  terracota: "#B5654A",
  verde: "#6F8277",
  mostarda: "#C59A45",
  azul: "#5B7183",
  couro: "#8A5A3B",
  boucle: "#EDE7DC",
  vime: "#C9A66B",
  nogueira: "#7A5638",
  carvalho: "#C4A47E",
  pinus: "#D9BE8F",
  laca: "#ECE8E0",
  preto: "#232726",
  metal: "#3A3E3D",
  latao: "#C8A55A",
  quartzo: "#F1EEE8",
  granito: "#3B3F3E",
  vidro: "#CFE3EA",
  folha: "#55764A",
  folhaClara: "#7A9A5A",
  folhaEscura: "#3F5C3A",
  tijolo: "#A65A42",
};

const mm = (cor: string, rough = 0.8) => mat(cor, { rough });

// ───────────────────────── Estofados ─────────────────────────

interface OpSofa {
  cor: string;
  almofada?: string;
  braco?: number;
  bracoA?: number;
  pes?: "palito" | "metal" | "madeira";
  pe?: number;
  base?: number;
  lugares?: number;
  capitone?: boolean;
  soltas?: boolean;
  estrutura?: string;
}

/** Sofá/poltrona paramétrico: pés, braços, almofadas soltas, capitonê ou estrutura de madeira. */
function SofaG({ l, p, a, o }: Dim & { o: OpSofa }) {
  const pe = o.pes ? (o.pe ?? 0.14) : 0;
  const base = o.base ?? 0.28;
  const braco = o.braco ?? Math.min(0.18, l * 0.1);
  const lugares = o.lugares ?? (l > 1.9 ? 3 : l > 1.1 ? 2 : 1);
  const assento = (l - 2 * braco) / lugares;
  const m = mm(o.cor, 0.95);
  const ma = mm(o.almofada ?? o.cor, 0.95);
  const est = o.estrutura ? mm(o.estrutura, 0.6) : m;
  const topoBase = pe + base;
  const bracoA = o.bracoA ?? Math.min(a - 0.15, topoBase + 0.22);
  const pesM = o.pes === "metal" ? mm(T.preto, 0.4) : mm(o.pes === "palito" ? C.madeira : C.madeiraEscura, 0.6);
  return (
    <group>
      {o.pes && <Pes l={l - 0.1} p={p - 0.1} a={pe} r={0.04} s={o.pes === "metal" ? 0.025 : 0.035} m={pesM} redondo={o.pes === "palito"} />}
      <B c={[0, pe + base / 2, 0]} s={[l, base, p]} m={est} />
      <B c={[0, (topoBase + a) / 2, -p / 2 + 0.1]} s={[l, a - topoBase, 0.2]} m={est} />
      <B c={[-l / 2 + braco / 2, (pe + bracoA) / 2, 0]} s={[braco, bracoA - pe, p]} m={est} />
      <B c={[l / 2 - braco / 2, (pe + bracoA) / 2, 0]} s={[braco, bracoA - pe, p]} m={est} />
      {Array.from({ length: lugares }, (_, i) => (
        <group key={i}>
          <B c={[-l / 2 + braco + assento * (i + 0.5), topoBase + 0.06, 0.06]} s={[assento - 0.03, 0.12, p - 0.28]} m={ma} />
          {o.soltas && (
            <B
              c={[-l / 2 + braco + assento * (i + 0.5), topoBase + 0.3, -p / 2 + 0.28]}
              s={[assento - 0.06, Math.min(0.42, a - topoBase - 0.08), 0.16]}
              m={ma}
            />
          )}
        </group>
      ))}
      {o.capitone &&
        Array.from({ length: Math.max(2, Math.round(l / 0.25)) }, (_, i) =>
          [0.62, 0.78].map((f) => (
            <Esf
              key={`${i}-${f}`}
              c={[-l / 2 + 0.15 + ((l - 0.3) / Math.max(1, Math.round(l / 0.25) - 1)) * i, a * f, -p / 2 + 0.205]}
              s={[0.025, 0.025, 0.012]}
              m={mm("#2A1E17")}
            />
          )),
        )}
    </group>
  );
}

const sofa =
  (o: OpSofa): Desenho =>
  (d) => <SofaG {...d} o={o} />;
const poltrona =
  (o: OpSofa): Desenho =>
  (d) => <SofaG {...d} o={{ lugares: 1, braco: 0.14, ...o }} />;

function PoltronaConcha({ l, p, cor, pe = T.carvalho }: Dim & { cor: string; pe?: string }) {
  return (
    <group>
      <Pes l={l * 0.7} p={p * 0.7} a={0.32} s={0.03} m={mm(pe, 0.6)} redondo />
      <Cil c={[0, 0.38, 0.02]} d={Math.min(l, p) * 0.85} a={0.12} m={mm(cor, 0.9)} />
      <Esf c={[0, 0.62, -p * 0.18]} s={[l * 0.95, 0.55, p * 0.55]} m={mm(cor, 0.9)} />
    </group>
  );
}

function Bergere({ l, p, a }: Dim) {
  const m = mm("#B9A27E", 0.9);
  const w = mm(C.madeiraEscura, 0.5);
  return (
    <group>
      <Pes l={l - 0.1} p={p - 0.1} a={0.2} s={0.045} m={w} redondo />
      <B c={[0, 0.3, 0]} s={[l - 0.1, 0.2, p - 0.1]} m={m} />
      <B c={[0, (0.4 + a) / 2 + 0.02, -p / 2 + 0.1]} s={[l - 0.14, a - 0.36, 0.12]} m={m} />
      <Cil c={[0, a - 0.02, -p / 2 + 0.1]} d={0.12} a={l - 0.14} m={m} deitado="x" />
      {[-1, 1].map((sx) => (
        <B key={sx} c={[sx * (l / 2 - 0.06), 0.5, 0]} s={[0.06, 0.2, p - 0.15]} m={w} />
      ))}
    </group>
  );
}

function PoltronaVime({ l, p, a }: Dim) {
  return (
    <group>
      <Cil c={[0, 0.2, 0]} d={Math.min(l, p) * 0.95} a={0.4} m={mm(T.vime, 1)} />
      <Cil c={[0, 0.45, 0.02]} d={Math.min(l, p) * 0.85} a={0.1} m={mm(T.linho, 1)} />
      <Esf c={[0, a * 0.72, -p * 0.2]} s={[l * 0.95, a * 0.6, p * 0.45]} m={mm(T.vime, 1)} />
    </group>
  );
}

function PoltronaBoucle({ l, p, a }: Dim) {
  const m = mm(T.boucle, 1);
  return (
    <group>
      <Cil c={[0, 0.2, 0.02]} d={Math.min(l, p)} a={0.4} m={m} />
      <Esf c={[0, a * 0.62, -p * 0.22]} s={[l, a * 0.7, p * 0.45]} m={m} />
      <Esf c={[-l * 0.36, 0.5, 0]} s={[0.22, 0.3, p * 0.8]} m={m} />
      <Esf c={[l * 0.36, 0.5, 0]} s={[0.22, 0.3, p * 0.8]} m={m} />
    </group>
  );
}

// ───────────────────────── Mesas de centro, racks, TV ─────────────────────────

function MesaCentroRedonda({ l, p, a }: Dim) {
  const d = Math.min(l, p * 1.6);
  return (
    <group>
      <Cil c={[0, a - 0.02, 0]} d={Math.min(d, l)} a={0.04} m={mm(T.nogueira, 0.5)} />
      <Cil c={[0, (a - 0.04) / 2, 0]} d={0.3} a={a - 0.04} m={mm(T.preto, 0.5)} />
    </group>
  );
}

function MesaCentroVidro({ l, p, a }: Dim) {
  return (
    <group>
      <B c={[0, a - 0.01, 0]} s={[l, 0.02, p]} m={mat(T.vidro, { opacity: 0.35, rough: 0.05 })} sombra={false} />
      <Pes l={l} p={p} a={a - 0.02} r={0.03} s={0.025} m={mm(T.latao, 0.35)} />
      <B c={[0, 0.12, 0]} s={[l - 0.06, 0.015, p - 0.06]} m={mat(T.vidro, { opacity: 0.35, rough: 0.05 })} sombra={false} />
    </group>
  );
}

function MesaCentroNinho({ l, p, a }: Dim) {
  return (
    <group>
      <Cil c={[-l * 0.18, a - 0.02, 0]} d={Math.min(p, l * 0.6)} a={0.03} m={mm(T.carvalho, 0.5)} />
      <Cil c={[-l * 0.18, (a - 0.03) / 2, 0]} d={0.05} a={a - 0.03} m={mm(T.preto)} />
      <Cil c={[l * 0.22, a * 0.75, 0.04]} d={Math.min(p, l * 0.45)} a={0.03} m={mm(T.preto, 0.5)} />
      <Cil c={[l * 0.22, (a * 0.75) / 2, 0.04]} d={0.05} a={a * 0.75} m={mm(T.preto)} />
    </group>
  );
}

function MesaCentroBloco({ l, p, a }: Dim) {
  return <B c={[0, a / 2, 0]} s={[l, a, p]} m={mm("#CFC8BD", 0.95)} />;
}

function Bau({ l, p, a }: Dim) {
  return (
    <group>
      <B c={[0, a / 2 - 0.03, 0]} s={[l, a - 0.06, p]} m={mm(T.nogueira, 0.7)} />
      <B c={[0, a - 0.03, 0]} s={[l + 0.02, 0.06, p + 0.02]} m={mm(C.madeiraEscura, 0.6)} />
      {[-l / 3, l / 3].map((x) => (
        <B key={x} c={[x, a / 2, 0]} s={[0.04, a + 0.005, p + 0.03]} m={mm(T.metal, 0.4)} sombra={false} />
      ))}
    </group>
  );
}

interface OpRack {
  cor: string;
  frente?: string;
  pes?: "palito" | "torneado";
  suspenso?: boolean;
  nichos?: boolean;
  ripado?: boolean;
}
function RackG({ l, p, a, o }: Dim & { o: OpRack }) {
  const y0 = o.suspenso ? 0.18 : o.pes ? 0.16 : 0.02;
  const h = a - y0;
  const m = mm(o.cor, 0.6);
  return (
    <group>
      {o.pes && (
        <Pes l={l - 0.1} p={p - 0.08} a={y0} s={o.pes === "torneado" ? 0.05 : 0.035} m={mm(o.pes === "torneado" ? C.madeiraEscura : C.madeira, 0.6)} redondo />
      )}
      <B c={[0, y0 + h / 2, 0]} s={[l, h, p]} m={m} />
      {o.nichos &&
        [-l / 3, 0, l / 3].map((x, i) => (
          <B key={x} c={[x, y0 + h / 2, p / 2 - 0.12]} s={[l / 3 - 0.06, h - 0.08, 0.25]} m={mm(i === 1 ? T.preto : "#2F2A26", 0.9)} sombra={false} />
        ))}
      {o.ripado &&
        Array.from({ length: Math.round(l / 0.05) }, (_, i) => (
          <B
            key={i}
            c={[-l / 2 + 0.025 + i * 0.05, y0 + h / 2, p / 2 + 0.008]}
            s={[0.025, h - 0.04, 0.015]}
            m={mm(o.frente ?? T.carvalho, 0.6)}
            sombra={false}
          />
        ))}
      {!o.nichos &&
        !o.ripado &&
        [-l / 4, l / 4].map((x) => (
          <B key={x} c={[x, y0 + h / 2, p / 2 + 0.003]} s={[l / 2 - 0.05, h - 0.06, 0.006]} m={mm(o.frente ?? o.cor, 0.5)} sombra={false} />
        ))}
    </group>
  );
}

function TvSoundbar({ l, a }: Dim) {
  const h = a - 0.14;
  return (
    <group>
      <B c={[0, 0.03, 0.02]} s={[Math.min(0.9, l * 0.7), 0.06, 0.07]} m={mm(T.preto, 0.6)} />
      <B c={[0, 0.1, -0.01]} s={[0.06, 0.08, 0.03]} m={mm(T.preto, 0.3)} />
      <B c={[0, 0.14 + h / 2, 0]} s={[l, h, 0.035]} m={mm(T.preto, 0.3)} />
      <B c={[0, 0.14 + h / 2, 0.019]} s={[l - 0.02, h - 0.02, 0.002]} m={mat("#18222A", { rough: 0.12, metal: 0.3 })} sombra={false} />
    </group>
  );
}

function TvParede({ l, a }: Dim) {
  const h = a - 0.1;
  return (
    <group>
      <B c={[0, 0.12 + h / 2, -0.02]} s={[l, h, 0.025]} m={mm(T.preto, 0.3)} />
      <B c={[0, 0.12 + h / 2, -0.006]} s={[l - 0.015, h - 0.015, 0.002]} m={mat("#1A242B", { rough: 0.12, metal: 0.3 })} sombra={false} />
    </group>
  );
}

// ───────────────────────── Mesas e cadeiras ─────────────────────────

function MesaCentral({ l, p, a }: Dim) {
  return (
    <group>
      <B c={[0, a - 0.02, 0]} s={[l, 0.04, p]} m={mm(T.laca, 0.4)} />
      <Cil c={[0, (a - 0.04) / 2, 0]} d={0.12} a={a - 0.04} m={mm(T.preto, 0.5)} />
      <Cil c={[0, 0.015, 0]} d={Math.min(0.6, p - 0.1)} a={0.03} m={mm(T.preto, 0.5)} />
    </group>
  );
}

function MesaCavalete({ l, p, a }: Dim) {
  const m = mm(C.madeiraEscura, 0.6);
  return (
    <group>
      <B c={[0, a - 0.02, 0]} s={[l, 0.04, p]} m={mm(T.carvalho, 0.55)} />
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <group key={`${sx}${sz}`} position={[sx * (l / 2 - 0.25), (a - 0.04) / 2, sz * (p / 4)]} rotation={[sz * 0.32, 0, 0]}>
            <B c={[0, 0, 0]} s={[0.05, a - 0.02, 0.05]} m={m} />
          </group>
        )),
      )}
      {[-1, 1].map((sx) => (
        <B key={sx} c={[sx * (l / 2 - 0.25), a * 0.35, 0]} s={[0.04, 0.04, p * 0.55]} m={m} />
      ))}
    </group>
  );
}

function MesaVidro({ l, p, a }: Dim) {
  return (
    <group>
      <B c={[0, a - 0.01, 0]} s={[l, 0.02, p]} m={mat(T.vidro, { opacity: 0.35, rough: 0.05 })} sombra={false} />
      <Pes l={l} p={p} a={a - 0.02} r={0.08} s={0.03} m={mm(T.preto, 0.4)} />
      <B c={[0, a - 0.04, 0]} s={[l - 0.15, 0.03, p - 0.15]} m={mm(T.preto, 0.4)} />
    </group>
  );
}

function MesaMacica({ l, p, a }: Dim) {
  const m = mm(T.nogueira, 0.75);
  return (
    <group>
      <B c={[0, a - 0.04, 0]} s={[l, 0.08, p]} m={m} />
      <Pes l={l} p={p} a={a - 0.08} r={0.1} s={0.1} m={m} />
    </group>
  );
}

function MesaClassica({ l, p, a }: Dim) {
  const m = mm(C.madeiraEscura, 0.45);
  return (
    <group>
      <B c={[0, a - 0.02, 0]} s={[l, 0.04, p]} m={m} />
      <B c={[0, a - 0.07, 0]} s={[l - 0.12, 0.06, p - 0.12]} m={m} />
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz]) => (
        <group key={`${sx}${sz}`} position={[sx * (l / 2 - 0.09), 0, sz * (p / 2 - 0.09)]}>
          <Cil c={[0, (a - 0.1) / 2, 0]} d={0.06} a={a - 0.1} m={m} />
          <Esf c={[0, a * 0.55, 0]} s={[0.09, 0.09, 0.09]} m={m} />
          <Esf c={[0, 0.12, 0]} s={[0.08, 0.08, 0.08]} m={m} />
        </group>
      ))}
    </group>
  );
}

function MesaTulipa({ l, a }: Dim) {
  return (
    <group>
      <Cil c={[0, a - 0.015, 0]} d={l} a={0.03} m={mm(T.laca, 0.3)} />
      <Cone c={[0, (a - 0.03) / 2, 0]} d={0.5} a={a - 0.03} m={mm(T.laca, 0.3)} invertido />
    </group>
  );
}

function MesaRedondaMadeira({ l, a }: Dim) {
  const m = mm(T.carvalho, 0.6);
  return (
    <group>
      <Cil c={[0, a - 0.02, 0]} d={l} a={0.04} m={m} />
      {[0, 1, 2].map((i) => {
        const ang = (i * 2 * Math.PI) / 3;
        return <Cil key={i} c={[Math.cos(ang) * l * 0.28, (a - 0.04) / 2, Math.sin(ang) * l * 0.28]} d={0.045} a={a - 0.04} m={mm(C.madeiraEscura)} />;
      })}
    </group>
  );
}

function CadeiraConcha({ l, p, a }: Dim) {
  return (
    <group>
      <Pes l={l * 0.8} p={p * 0.8} a={0.42} s={0.025} m={mm(T.carvalho, 0.6)} redondo />
      <Esf c={[0, 0.47, 0.02]} s={[l, 0.1, p * 0.9]} m={mm(T.laca, 0.4)} />
      <Esf c={[0, 0.66, -p / 2 + 0.08]} s={[l, a - 0.5, 0.12]} m={mm(T.laca, 0.4)} />
    </group>
  );
}

function CadeiraPalhinha({ l, p, a }: Dim) {
  const w = mm(C.madeiraEscura, 0.6);
  const palha = mm("#D9C29A", 1);
  return (
    <group>
      <Pes l={l} p={p} a={0.45} r={0.03} s={0.035} m={w} redondo />
      <B c={[0, 0.455, 0]} s={[l, 0.03, p]} m={w} />
      <B c={[0, 0.475, 0]} s={[l - 0.06, 0.012, p - 0.06]} m={palha} />
      <B c={[0, (0.47 + a) / 2 + 0.05, -p / 2 + 0.03]} s={[l - 0.08, a - 0.6, 0.02]} m={palha} />
      {[-1, 1].map((sx) => (
        <B key={sx} c={[sx * (l / 2 - 0.03), (0.45 + a) / 2, -p / 2 + 0.03]} s={[0.035, a - 0.45, 0.035]} m={w} />
      ))}
      <B c={[0, a - 0.02, -p / 2 + 0.03]} s={[l, 0.04, 0.035]} m={w} />
    </group>
  );
}

function CadeiraEstofada({ l, p, a }: Dim) {
  const m = mm("#B9A27E", 0.95);
  return (
    <group>
      <Pes l={l} p={p} a={0.4} r={0.04} s={0.035} m={mm(C.madeiraEscura, 0.5)} />
      <B c={[0, 0.45, 0]} s={[l, 0.1, p]} m={m} />
      <B c={[0, (0.5 + a + 0.08) / 2, -p / 2 + 0.04]} s={[l, a + 0.08 - 0.5, 0.07]} m={m} />
    </group>
  );
}

function CadeiraIndustrial({ l, p, a }: Dim) {
  const m = mm(T.metal, 0.45);
  return (
    <group>
      <Pes l={l} p={p} a={0.44} r={0.03} s={0.025} m={m} />
      <B c={[0, 0.45, 0]} s={[l, 0.025, p]} m={m} />
      <B c={[0, (0.47 + a) / 2 + 0.06, -p / 2 + 0.02]} s={[l, a - 0.6, 0.02]} m={m} />
      {[-1, 1].map((sx) => (
        <B key={sx} c={[sx * (l / 2 - 0.02), (0.45 + a) / 2, -p / 2 + 0.02]} s={[0.025, a - 0.45, 0.025]} m={m} />
      ))}
    </group>
  );
}

function CadeiraWindsor({ l, p, a }: Dim) {
  const w = mm(T.nogueira, 0.6);
  return (
    <group>
      <Pes l={l} p={p} a={0.43} r={0.05} s={0.035} m={w} redondo />
      <B c={[0, 0.45, 0]} s={[l, 0.04, p]} m={w} />
      {Array.from({ length: 5 }, (_, i) => (
        <Cil key={i} c={[-l / 2 + 0.06 + ((l - 0.12) / 4) * i, (0.47 + a) / 2, -p / 2 + 0.04]} d={0.02} a={a - 0.47} m={w} />
      ))}
      <B c={[0, a - 0.025, -p / 2 + 0.04]} s={[l, 0.05, 0.05]} m={w} />
    </group>
  );
}

function CadeiraLamina({ l, p }: Dim) {
  const m = mm(T.pinus, 0.5);
  return (
    <group>
      <Pes l={l} p={p} a={0.44} r={0.03} s={0.02} m={mm(T.preto, 0.4)} redondo />
      <B c={[0, 0.45, 0.01]} s={[l, 0.015, p - 0.02]} m={m} />
      <group position={[0, 0.66, -p / 2 + 0.04]} rotation={[-0.15, 0, 0]}>
        <B c={[0, 0, 0]} s={[l, 0.24, 0.015]} m={m} />
      </group>
    </group>
  );
}

// ───────────────────────── Cozinha ─────────────────────────

/** Acabamento dos armários inferiores: frente, tampo e puxadores (o mesmo para pia, fogão e ilha). */
const FRENTES: Record<string, { frente: string; tampo: string; estilo: "lisa" | "ripada" | "provencal" | "gola" }> = {
  "bancada:padrao": { frente: C.branco, tampo: T.granito, estilo: "lisa" },
  "bancada:ripada": { frente: T.carvalho, tampo: T.quartzo, estilo: "ripada" },
  "bancada:madeira": { frente: T.nogueira, tampo: "#5C5249", estilo: "lisa" },
  "bancada:provencal": { frente: "#D9DCCF", tampo: "#E3DED3", estilo: "provencal" },
  "bancada:cinza": { frente: "#9EA3A1", tampo: T.quartzo, estilo: "gola" },
};

function BancadaG({ l, p, a, base, tampo }: Dim & { tampo?: string }) {
  const f = FRENTES[base ?? "bancada:padrao"] ?? FRENTES["bancada:padrao"];
  const n = Math.max(1, Math.round(l / 0.45));
  const w = l / n;
  return (
    <group>
      <B c={[0, (a - 0.04) / 2 + 0.05, -0.02]} s={[l, a - 0.09, p - 0.04]} m={mm(f.frente, 0.55)} />
      <B c={[0, 0.025, -0.06]} s={[l, 0.05, p - 0.12]} m={mm(T.preto, 0.8)} />
      <B c={[0, a - 0.02, 0]} s={[l, 0.04, p]} m={mm(tampo ?? f.tampo, 0.35)} />
      {Array.from({ length: n }, (_, i) => {
        const x = -l / 2 + w * (i + 0.5);
        if (f.estilo === "ripada")
          return Array.from({ length: Math.max(2, Math.round(w / 0.06)) }, (_, k) => (
            <B key={`${i}-${k}`} c={[x - w / 2 + 0.03 + k * 0.06, a / 2, p / 2 - 0.035]} s={[0.03, a - 0.16, 0.01]} m={mm(f.frente, 0.6)} sombra={false} />
          ));
        if (f.estilo === "provencal")
          return (
            <group key={i}>
              <B c={[x, a / 2 + 0.02, p / 2 - 0.036]} s={[w - 0.1, a - 0.3, 0.008]} m={mm("#C9CDBE", 0.55)} sombra={false} />
              <Esf c={[x + w / 2 - 0.08, a - 0.16, p / 2 - 0.02]} s={[0.03, 0.03, 0.03]} m={mm(T.latao, 0.35)} />
            </group>
          );
        if (f.estilo === "gola") return <B key={i} c={[x, a - 0.09, p / 2 - 0.035]} s={[w - 0.01, 0.03, 0.01]} m={mm(T.grafite, 0.5)} sombra={false} />;
        return (
          <group key={i}>
            <B c={[x - w / 2, a / 2 + 0.02, p / 2 - 0.036]} s={[0.006, a - 0.2, 0.004]} m={mm("#B9B5AE")} sombra={false} />
            <B c={[x + w / 2 - 0.07, a - 0.15, p / 2 - 0.025]} s={[0.012, 0.012, 0.12]} m={mm(C.inox, 0.3)} sombra={false} />
          </group>
        );
      })}
    </group>
  );
}

function AereoG({ l, p, a, tipo }: Dim & { tipo: "vidro" | "aberto" | "madeira" }) {
  if (tipo === "aberto")
    return (
      <group>
        {[0.02, a / 2, a - 0.02].map((y) => (
          <B key={y} c={[0, y, 0]} s={[l, 0.025, p - 0.05]} m={mm(T.carvalho, 0.6)} />
        ))}
        {Array.from({ length: Math.max(1, Math.floor(l / 0.35)) }, (_, i) => (
          <Cil key={i} c={[-l / 2 + 0.15 + i * 0.33, 0.12, 0]} d={0.1} a={0.17} m={mm(i % 2 ? T.laca : T.terracota, 0.5)} />
        ))}
      </group>
    );
  const n = Math.max(1, Math.round(l / 0.45));
  const m = mm(tipo === "madeira" ? T.nogueira : C.branco, 0.55);
  return (
    <group>
      <B c={[0, a / 2, -0.02]} s={[l, a, p - 0.04]} m={m} />
      {Array.from({ length: n }, (_, i) => (
        <group key={i}>
          <B c={[-l / 2 + (l / n) * (i + 0.5), a / 2, p / 2 - 0.02]} s={[l / n - 0.02, a - 0.02, 0.02]} m={m} />
          {tipo === "vidro" && (
            <B
              c={[-l / 2 + (l / n) * (i + 0.5), a / 2, p / 2 - 0.005]}
              s={[l / n - 0.12, a - 0.12, 0.006]}
              m={mat(T.vidro, { opacity: 0.5, rough: 0.1 })}
              sombra={false}
            />
          )}
        </group>
      ))}
    </group>
  );
}

function TorneiraG({ y, z, alta }: { y: number; z: number; alta?: boolean }) {
  const m = mat(C.inox, { metal: 0.3, rough: 0.25 });
  const h = alta ? 0.42 : 0.26;
  return (
    <group>
      <Cil c={[0, y + h / 2, z]} d={0.03} a={h} m={m} />
      <B c={[0, y + h, z + 0.08]} s={[0.025, 0.025, 0.17]} m={m} />
      {alta && <Cil c={[0, y + h - 0.06, z + 0.16]} d={0.03} a={0.12} m={m} />}
    </group>
  );
}

function PiaG(d: Dim & { cubas: 1 | 2; alta?: boolean }) {
  const { l, p, a } = d;
  const inox = mat(C.inox, { metal: 0.3, rough: 0.25 });
  const w = d.cubas === 2 ? (l - 0.2) / 2 : Math.min(d.alta ? 0.62 : 0.55, l - 0.15);
  return (
    <group>
      <BancadaG {...d} />
      {(d.cubas === 2 ? [-w / 2 - 0.02, w / 2 + 0.02] : [0]).map((x) => (
        <B key={x} c={[x, a + 0.002, 0.03]} s={[w, 0.006, p - 0.24]} m={inox} sombra={false} />
      ))}
      <TorneiraG y={a} z={-p / 2 + 0.07} alta={d.alta} />
    </group>
  );
}

function FogaoG(d: Dim & { bocas: 4 | 5; inducao?: boolean }) {
  const { l, p, a } = d;
  const vidro = mat("#121515", { rough: 0.15, metal: 0.3 });
  const pos =
    d.bocas === 5
      ? [
          [-0.3, -0.22],
          [0.3, -0.22],
          [-0.3, 0.22],
          [0.3, 0.22],
          [0, 0],
        ]
      : [
          [-0.22, -0.2],
          [0.22, -0.2],
          [-0.22, 0.2],
          [0.22, 0.2],
        ];
  return (
    <group>
      <BancadaG {...d} />
      <B c={[0, a + 0.004, 0]} s={[l - 0.04, 0.008, p - 0.1]} m={vidro} sombra={false} />
      {pos.map(([fx, fz]) =>
        d.inducao ? (
          <Cil key={`${fx}${fz}`} c={[fx * l, a + 0.009, fz * p]} d={0.15} a={0.002} m={mm("#3A3F40", 0.3)} />
        ) : (
          <Cil key={`${fx}${fz}`} c={[fx * l, a + 0.015, fz * p]} d={0.12} a={0.015} m={mm("#2C2F2F", 0.5)} />
        ),
      )}
    </group>
  );
}

function FogaoPiso({ l, p, a }: Dim) {
  const corpo = mm(T.laca, 0.35);
  return (
    <group>
      <B c={[0, a / 2, 0]} s={[l, a, p]} m={corpo} />
      <B c={[0, a * 0.42, p / 2 + 0.004]} s={[l - 0.1, a * 0.45, 0.008]} m={mat("#1C2224", { rough: 0.15, metal: 0.3 })} sombra={false} />
      <B c={[0, a * 0.72, p / 2 + 0.01]} s={[l - 0.08, 0.015, 0.015]} m={mm(C.inox, 0.3)} sombra={false} />
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz]) => (
        <Cil key={`${sx}${sz}`} c={[sx * l * 0.22, a + 0.012, sz * p * 0.2]} d={0.13} a={0.02} m={mm("#2C2F2F", 0.5)} />
      ))}
      {Array.from({ length: 4 }, (_, i) => (
        <Cil key={i} c={[-l / 2 + 0.12 + i * ((l - 0.24) / 3), a * 0.88, p / 2 + 0.01]} d={0.035} a={0.02} m={mm(T.preto)} deitado="z" />
      ))}
    </group>
  );
}

function GeladeiraG({ l, p, a, cor, retro }: Dim & { cor: string; retro?: boolean }) {
  const m = mat(cor, { rough: 0.35, metal: 0.15 });
  const puxador = mm(retro ? "#D8D8D2" : "#5E6463", 0.3);
  return (
    <group>
      <B c={[0, (a - (retro ? 0.08 : 0)) / 2, 0]} s={[l, a - (retro ? 0.08 : 0), p]} m={m} />
      {retro && <Cil c={[0, a - 0.08, 0]} d={0.16} a={l} m={m} deitado="x" />}
      {retro && <B c={[0, a - 0.04, -0.04]} s={[l, 0.08, p - 0.16]} m={m} />}
      <B c={[0, a * 0.62, p / 2 + 0.002]} s={[l - 0.01, 0.01, 0.004]} m={mm("#5E6463")} sombra={false} />
      <B c={[l / 2 - 0.07, a * 0.82, p / 2 + 0.02]} s={[0.02, 0.3, 0.03]} m={puxador} />
      <B c={[l / 2 - 0.07, a * 0.4, p / 2 + 0.02]} s={[0.02, 0.4, 0.03]} m={puxador} />
    </group>
  );
}

function IlhaCascata({ l, p, a }: Dim) {
  const m = mm(T.quartzo, 0.3);
  return (
    <group>
      <B c={[0, a / 2, 0]} s={[l - 0.08, a - 0.04, p - 0.06]} m={mm(T.grafite, 0.5)} />
      <B c={[0, a - 0.02, 0]} s={[l, 0.04, p]} m={m} />
      <B c={[-l / 2 + 0.02, a / 2, 0]} s={[0.04, a, p]} m={m} />
      <B c={[l / 2 - 0.02, a / 2, 0]} s={[0.04, a, p]} m={m} />
    </group>
  );
}

function Coifa({ l, p, a, reta }: Dim & { reta?: boolean }) {
  const m = mat(C.inox, { metal: 0.3, rough: 0.3 });
  if (reta)
    return (
      <group>
        <B c={[0, 0.04, 0]} s={[l, 0.08, p]} m={m} />
        <B c={[0, (0.08 + a) / 2, -p / 2 + 0.12]} s={[0.26, a - 0.08, 0.22]} m={mm(T.laca, 0.5)} />
      </group>
    );
  return (
    <group>
      <B c={[0, 0.04, 0]} s={[l, 0.08, p]} m={m} />
      <group position={[0, 0.08 + 0.14, -0.02]}>
        <mesh scale={[l * 0.72, 0.28, p * 0.72]} rotation={[0, Math.PI / 4, 0]} castShadow material={m}>
          <cylinderGeometry args={[0.38, 0.72, 1, 4]} />
        </mesh>
      </group>
      <B c={[0, (0.36 + a) / 2, -p / 2 + 0.13]} s={[0.24, a - 0.36, 0.22]} m={m} />
    </group>
  );
}

function Microondas({ l, p, a }: Dim) {
  return (
    <group>
      <B c={[0, a / 2, 0]} s={[l, a, p]} m={mm(T.grafite, 0.4)} />
      <B c={[-0.06, a / 2, p / 2 + 0.003]} s={[l * 0.62, a * 0.7, 0.006]} m={mat("#141A1C", { rough: 0.1, metal: 0.3 })} sombra={false} />
      <B c={[l / 2 - 0.07, a / 2, p / 2 + 0.003]} s={[0.08, a * 0.7, 0.006]} m={mm("#6E7473", 0.4)} sombra={false} />
    </group>
  );
}

// ───────────────────────── Quartos ─────────────────────────

interface OpCama {
  base: "pes" | "bau" | "plataforma" | "ferro";
  cabeceira: "estofada" | "ripada" | "ferro" | "classica" | "baixa";
  cor: string;
  manta?: string;
}

function CamaG({ l, p, a, o }: Dim & { o: OpCama }) {
  const casal = l > 1.2;
  const madeira = mm(o.cor, 0.65);
  const ferro = mm(T.preto, 0.45);
  const yColchao = o.base === "plataforma" ? 0.18 : o.base === "bau" ? 0.42 : 0.33;
  return (
    <group>
      {o.base === "bau" && <B c={[0, 0.2, 0]} s={[l, 0.4, p]} m={mm(T.linho, 0.95)} />}
      {o.base === "plataforma" && <B c={[0, 0.07, 0.02]} s={[l + 0.12, 0.14, p + 0.04]} m={madeira} />}
      {o.base === "pes" && (
        <>
          <B c={[0, 0.22, 0]} s={[l, 0.2, p]} m={madeira} />
          <Pes l={l} p={p} a={0.12} r={0.06} s={0.06} m={madeira} />
        </>
      )}
      {o.base === "ferro" && (
        <>
          <B c={[0, 0.25, 0]} s={[l - 0.04, 0.12, p - 0.06]} m={mm("#8C8F8C", 0.6)} />
          {[
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ].map(([sx, sz]) => (
            <Cil key={`${sx}${sz}`} c={[sx * (l / 2 - 0.02), (sz < 0 ? a : 0.7) / 2, sz * (p / 2 - 0.02)]} d={0.04} a={sz < 0 ? a : 0.7} m={ferro} />
          ))}
        </>
      )}
      <B c={[0, yColchao + 0.11, 0.02]} s={[l - 0.04, 0.22, p - 0.06]} m={mm(C.lencol, 1)} />
      {(casal ? [-l / 4, l / 4] : [0]).map((x) => (
        <B key={x} c={[x, yColchao + 0.28, -p / 2 + 0.3]} s={[casal ? l / 2 - 0.12 : l - 0.2, 0.12, 0.34]} m={mm("#FFFFFF", 1)} />
      ))}
      <B c={[0, yColchao + 0.235, p * 0.2]} s={[l + 0.02, 0.03, p * 0.6]} m={mm(o.manta ?? C.manta, 1)} />
      {o.cabeceira === "estofada" && (
        <>
          <B c={[0, a / 2, -p / 2 + 0.05]} s={[l + 0.1, a, 0.1]} m={mm(T.linho, 0.95)} />
          {Array.from({ length: Math.round(l / 0.25) }, (_, i) => (
            <Esf key={i} c={[-l / 2 + 0.12 + i * 0.25, a * 0.75, -p / 2 + 0.102]} s={[0.025, 0.025, 0.012]} m={mm("#9C8F7C")} />
          ))}
        </>
      )}
      {o.cabeceira === "ripada" &&
        Array.from({ length: Math.round((l + 0.2) / 0.07) }, (_, i) => (
          <B key={i} c={[-(l + 0.2) / 2 + 0.035 + i * 0.07, a / 2, -p / 2 + 0.03]} s={[0.045, a, 0.04]} m={madeira} />
        ))}
      {o.cabeceira === "ferro" && (
        <>
          <Cil c={[0, a - 0.03, -p / 2 + 0.02]} d={0.035} a={l} m={ferro} deitado="x" />
          {Array.from({ length: Math.round(l / 0.15) }, (_, i) => (
            <Cil key={i} c={[-l / 2 + 0.1 + i * 0.15, (0.4 + a) / 2, -p / 2 + 0.02]} d={0.018} a={a - 0.4} m={ferro} />
          ))}
          <Cil c={[0, 0.68, p / 2 - 0.02]} d={0.035} a={l} m={ferro} deitado="x" />
        </>
      )}
      {o.cabeceira === "classica" && (
        <>
          <B c={[0, a / 2, -p / 2 + 0.04]} s={[l + 0.12, a, 0.08]} m={madeira} />
          <B c={[0, a * 0.62, -p / 2 + 0.085]} s={[l - 0.15, a * 0.5, 0.01]} m={mm(T.linho, 0.9)} sombra={false} />
          <B c={[0, 0.3, p / 2 - 0.03]} s={[l + 0.08, 0.45, 0.06]} m={madeira} />
          {[-1, 1].map((sx) => (
            <Esf key={sx} c={[sx * (l / 2 + 0.03), a + 0.0, -p / 2 + 0.04]} s={[0.08, 0.08, 0.08]} m={madeira} />
          ))}
        </>
      )}
      {o.cabeceira === "baixa" && <B c={[0, 0.5, -p / 2 + 0.04]} s={[l + 0.2, 0.55, 0.08]} m={madeira} />}
    </group>
  );
}

const cama =
  (o: OpCama): Desenho =>
  (d) => <CamaG {...d} o={o} />;

function CriadoG({ l, p, a, tipo }: Dim & { tipo: "suspenso" | "palito" | "redondo" | "classico" | "tronco" }) {
  const abajur = (y: number) => (
    <group>
      <Cil c={[0, y + 0.11, 0]} d={0.04} a={0.22} m={mm(T.latao, 0.4)} />
      <Cil c={[0, y + 0.28, 0]} d={0.2} a={0.15} m={mat("#F4EBDB", { rough: 1, emissive: "#F4E3C0" })} />
    </group>
  );
  if (tipo === "redondo")
    return (
      <group>
        <Cil c={[0, a - 0.015, 0]} d={Math.min(l, p) + 0.02} a={0.03} m={mm(T.laca, 0.4)} />
        <Cil c={[0, (a - 0.03) / 2, 0]} d={0.05} a={a - 0.03} m={mm(T.latao, 0.4)} />
        {abajur(a)}
      </group>
    );
  if (tipo === "tronco")
    return (
      <group>
        <Cil c={[0, a / 2, 0]} d={Math.min(l, p)} a={a} m={mm(T.nogueira, 1)} />
        <Cil c={[0, a + 0.002, 0]} d={Math.min(l, p) - 0.04} a={0.006} m={mm(T.pinus, 0.9)} />
      </group>
    );
  const y0 = tipo === "suspenso" ? 0.3 : tipo === "palito" ? 0.2 : 0;
  const m = mm(tipo === "classico" ? C.madeiraEscura : tipo === "suspenso" ? T.laca : T.carvalho, 0.55);
  return (
    <group>
      {tipo === "palito" && <Pes l={l - 0.06} p={p - 0.06} a={y0} s={0.025} m={mm(C.madeira)} redondo />}
      <B c={[0, (y0 + a) / 2, 0]} s={[l, a - y0, p]} m={m} />
      {(tipo === "classico" ? [0.33, 0.66] : [0.5]).map((f) => (
        <group key={f}>
          <B c={[0, y0 + (a - y0) * f, p / 2 + 0.002]} s={[l - 0.06, 0.006, 0.004]} m={mm("#3B2A20")} sombra={false} />
          {tipo === "classico" && <Esf c={[0, y0 + (a - y0) * (f + 0.17), p / 2 + 0.01]} s={[0.025, 0.025, 0.025]} m={mm(T.latao, 0.35)} />}
        </group>
      ))}
      {abajur(a)}
    </group>
  );
}

function GuardaRoupaG({ l, p, a, tipo }: Dim & { tipo: "giro" | "espelhado" | "ripado" | "madeira" }) {
  const n = Math.max(2, Math.round(l / 0.5));
  const w = l / n;
  const corpo = mm(tipo === "madeira" ? T.nogueira : C.branco, 0.55);
  return (
    <group>
      <B c={[0, a / 2, -0.02]} s={[l, a, p - 0.04]} m={corpo} />
      {Array.from({ length: n }, (_, i) => {
        const x = -l / 2 + w * (i + 0.5);
        if (tipo === "espelhado")
          return <B key={i} c={[x, a / 2, p / 2 - 0.01]} s={[w - 0.01, a - 0.05, 0.015]} m={mat("#DCE6EA", { metal: 0.3, rough: 0.08 })} />;
        if (tipo === "ripado")
          return Array.from({ length: Math.max(2, Math.round(w / 0.06)) }, (_, k) => (
            <B key={`${i}-${k}`} c={[x - w / 2 + 0.03 + k * 0.06, a / 2, p / 2 - 0.012]} s={[0.035, a - 0.05, 0.02]} m={mm(T.carvalho, 0.6)} />
          ));
        return (
          <group key={i}>
            <B c={[x, a / 2, p / 2 - 0.01]} s={[w - 0.012, a - 0.04, 0.02]} m={tipo === "madeira" ? mm(T.nogueira, 0.6) : mm(T.laca, 0.5)} />
            {tipo === "madeira" && <B c={[x, a / 2, p / 2 + 0.002]} s={[w - 0.12, a - 0.3, 0.006]} m={mm("#5E412C", 0.6)} sombra={false} />}
            <B
              c={[x + (i % 2 ? -1 : 1) * (w / 2 - 0.05), a * 0.5, p / 2 + 0.01]}
              s={[0.015, 0.25, 0.015]}
              m={mm(tipo === "madeira" ? T.latao : C.inox, 0.35)}
              sombra={false}
            />
          </group>
        );
      })}
    </group>
  );
}

function EscrivaninhaG({ l, p, a, tipo }: Dim & { tipo: "metal" | "gaveteiro" | "suspensa" }) {
  const tampo = mm(tipo === "gaveteiro" ? C.madeiraEscura : T.carvalho, 0.55);
  return (
    <group>
      <B c={[0, a - 0.015, 0]} s={[l, 0.03, p]} m={tampo} />
      {tipo === "metal" && <Pes l={l} p={p} a={a - 0.03} r={0.03} s={0.03} m={mm(T.preto, 0.4)} />}
      {tipo === "gaveteiro" && (
        <>
          <B c={[l / 2 - 0.2, (a - 0.03) / 2, 0]} s={[0.38, a - 0.03, p - 0.02]} m={tampo} />
          {[0.25, 0.5, 0.75].map((f) => (
            <B key={f} c={[l / 2 - 0.2, (a - 0.03) * f, p / 2]} s={[0.3, 0.005, 0.004]} m={mm("#3B2A20")} sombra={false} />
          ))}
          <B c={[-l / 2 + 0.02, (a - 0.03) / 2, 0]} s={[0.04, a - 0.03, p - 0.02]} m={tampo} />
        </>
      )}
      {tipo === "suspensa" && <B c={[0, a - 0.1, -p / 2 + 0.08]} s={[l - 0.1, 0.14, 0.12]} m={mm(T.laca, 0.5)} />}
      <B c={[0, a + 0.18, -p / 2 + 0.12]} s={[0.55, 0.32, 0.02]} m={mm(T.preto, 0.3)} />
      <B c={[0, a + 0.02, -p / 2 + 0.14]} s={[0.18, 0.02, 0.1]} m={mm(T.preto, 0.3)} />
    </group>
  );
}

function CadeiraGamer({ l, p, a }: Dim) {
  const m = mm(T.preto, 0.6);
  const ac = mm(T.terracota, 0.6);
  return (
    <group>
      <Cil c={[0, 0.03, 0]} d={Math.min(l, p)} a={0.04} m={m} />
      <Cil c={[0, 0.25, 0]} d={0.05} a={0.4} m={mm(C.inox, 0.3)} />
      <B c={[0, 0.48, 0]} s={[l - 0.04, 0.08, p - 0.06]} m={m} />
      <B c={[0, (0.52 + a + 0.25) / 2, -p / 2 + 0.06]} s={[l - 0.08, a + 0.25 - 0.52, 0.08]} m={m} />
      <B c={[0, (0.52 + a + 0.25) / 2, -p / 2 + 0.105]} s={[0.1, a + 0.15 - 0.52, 0.01]} m={ac} sombra={false} />
    </group>
  );
}

function CadeiraEscritorioMadeira({ l, p, a }: Dim) {
  const w = mm(C.madeiraEscura, 0.55);
  return (
    <group>
      <Cil c={[0, 0.03, 0]} d={Math.min(l, p)} a={0.04} m={mm(T.metal)} />
      <Cil c={[0, 0.25, 0]} d={0.05} a={0.4} m={mm(T.metal)} />
      <B c={[0, 0.48, 0]} s={[l - 0.04, 0.06, p - 0.06]} m={w} />
      <B c={[0, (0.52 + a) / 2, -p / 2 + 0.05]} s={[l - 0.08, a - 0.52, 0.04]} m={w} />
      {[-1, 1].map((sx) => (
        <B key={sx} c={[sx * (l / 2 - 0.04), 0.66, 0]} s={[0.04, 0.03, p - 0.15]} m={w} />
      ))}
    </group>
  );
}

function EstanteG({ l, p, a, tipo }: Dim & { tipo: "nichos" | "escada" | "industrial" }) {
  const livros = C.livros;
  if (tipo === "escada") {
    const m = mm(T.pinus, 0.6);
    return (
      <group>
        {[-1, 1].map((sx) => (
          <group key={sx} position={[sx * (l / 2 - 0.02), a / 2, 0]} rotation={[0.12, 0, 0]}>
            <B c={[0, 0, 0]} s={[0.03, a, 0.04]} m={m} />
          </group>
        ))}
        {[0, 1, 2, 3].map((i) => {
          const y = 0.2 + i * ((a - 0.3) / 3);
          const prof = p * (1 - i * 0.2);
          return (
            <group key={i}>
              <B c={[0, y, p / 2 - prof / 2 - i * 0.03]} s={[l - 0.06, 0.025, prof]} m={m} />
              <B c={[-l / 4, y + 0.11, p / 2 - prof / 2 - i * 0.03]} s={[0.1, 0.2, prof * 0.7]} m={mm(livros[i % 4])} sombra={false} />
            </group>
          );
        })}
      </group>
    );
  }
  const m = tipo === "industrial" ? mm(T.carvalho, 0.6) : mm(T.laca, 0.5);
  const lin = 4;
  const col = tipo === "nichos" ? 2 : 1;
  return (
    <group>
      {tipo === "industrial" && <Pes l={l} p={p} a={a} r={0.015} s={0.025} m={mm(T.preto, 0.4)} />}
      {tipo === "nichos" && <B c={[0, a / 2, -p / 2 + 0.01]} s={[l, a, 0.02]} m={m} />}
      {Array.from({ length: lin + 1 }, (_, i) => (
        <B key={i} c={[0, 0.02 + (i * (a - 0.04)) / lin, 0]} s={[l, 0.025, p]} m={m} />
      ))}
      {tipo === "nichos" && [-l / 2 + 0.01, 0, l / 2 - 0.01].map((x) => <B key={x} c={[x, a / 2, 0]} s={[0.02, a, p]} m={m} />)}
      {Array.from({ length: lin }, (_, i) =>
        Array.from({ length: col }, (_, k) => (
          <B
            key={`${i}${k}`}
            c={[-l / 2 + 0.12 + k * (l / 2) + ((i + k) % 2) * 0.1, 0.13 + (i * (a - 0.04)) / lin, 0]}
            s={[0.14, 0.2, p - 0.08]}
            m={mm(livros[(i + k) % 4])}
            sombra={false}
          />
        )),
      )}
    </group>
  );
}

function ComodaG({ l, p, a, retro }: Dim & { retro?: boolean }) {
  const y0 = retro ? 0.18 : 0.04;
  const m = mm(retro ? T.carvalho : T.nogueira, 0.55);
  const n = retro ? 3 : 4;
  return (
    <group>
      {retro ? (
        <Pes l={l - 0.08} p={p - 0.08} a={y0} s={0.03} m={mm(C.madeira)} redondo />
      ) : (
        <B c={[0, 0.02, 0]} s={[l - 0.06, 0.04, p - 0.06]} m={mm(T.preto)} />
      )}
      <B c={[0, (y0 + a) / 2, 0]} s={[l, a - y0, p]} m={m} />
      {Array.from({ length: n }, (_, i) => (
        <group key={i}>
          <B
            c={[0, y0 + ((a - y0) / n) * (i + 0.5), p / 2 + 0.003]}
            s={[l - 0.04, (a - y0) / n - 0.015, 0.006]}
            m={mm(retro ? ["#C9573F", "#46656B", "#DDD0BC"][i % 3] : "#6A4A33", 0.55)}
            sombra={false}
          />
          <B c={[0, y0 + ((a - y0) / n) * (i + 0.7), p / 2 + 0.012]} s={[0.12, 0.012, 0.012]} m={mm(T.latao, 0.35)} sombra={false} />
        </group>
      ))}
    </group>
  );
}

// ───────────────────────── Banheiro e serviço ─────────────────────────

function VasoSuspenso({ l, p }: Dim) {
  const m = mm(C.louca, 0.25);
  return (
    <group>
      <Esf c={[0, 0.38, 0.06]} s={[l * 0.85, 0.24, p * 0.75]} m={m} />
      <B c={[0, 0.48, 0.06]} s={[l * 0.9, 0.025, p * 0.75]} m={m} />
      <B c={[0, 1.0, -p / 2 + 0.01]} s={[0.22, 0.15, 0.015]} m={mm(T.laca, 0.3)} />
    </group>
  );
}

function VasoRedondo({ l, p, a }: Dim) {
  const m = mm(C.louca, 0.25);
  return (
    <group>
      <Cil c={[0, 0.18, 0.08]} d={l * 0.7} a={0.36} m={m} />
      <Esf c={[0, 0.38, 0.1]} s={[l, 0.12, p * 0.62]} m={m} />
      <B c={[0, (0.4 + a) / 2, -p / 2 + 0.1]} s={[l, a - 0.4, 0.18]} m={m} />
      <Cil c={[0, a, -p / 2 + 0.1]} d={0.18} a={l} m={m} deitado="x" />
    </group>
  );
}

function LavatorioG({ l, p, a, tipo }: Dim & { tipo: "apoio" | "suspenso" | "coluna" | "rustico" }) {
  const louca = mm(C.louca, 0.2);
  if (tipo === "coluna")
    return (
      <group>
        <Cil c={[0, (a - 0.12) / 2, -0.04]} d={0.2} a={a - 0.12} m={louca} />
        <B c={[0, a - 0.06, 0]} s={[l, 0.12, p]} m={louca} />
        <TorneiraG y={a} z={-p / 2 + 0.06} />
      </group>
    );
  const tampo = tipo === "rustico" ? mm(T.nogueira, 0.7) : mm(C.marmore, 0.3);
  return (
    <group>
      {tipo === "suspenso" && <B c={[0, a - 0.2, -0.01]} s={[l, 0.36, p - 0.02]} m={mm(T.laca, 0.5)} />}
      {tipo === "rustico" && <Pes l={l} p={p} a={a - 0.04} r={0.04} s={0.06} m={tampo} />}
      {tipo === "apoio" && <B c={[0, a - 0.12, -0.01]} s={[l, 0.2, p - 0.02]} m={mm(T.carvalho, 0.6)} />}
      <B c={[0, a - 0.02, 0]} s={[l, 0.04, p]} m={tampo} />
      {tipo === "apoio" || tipo === "rustico" ? (
        <Cil c={[0, a + 0.07, 0.03]} d={Math.min(0.4, l - 0.1)} a={0.14} m={louca} />
      ) : (
        <B c={[0, a + 0.004, 0.03]} s={[Math.min(0.42, l - 0.1), 0.008, p - 0.16]} m={louca} sombra={false} />
      )}
      <TorneiraG y={a} z={-p / 2 + 0.05} alta={tipo === "apoio" || tipo === "rustico"} />
    </group>
  );
}

function EspelhoG({ l, a, tipo }: Dim & { tipo: "redondo" | "moldura" | "led" }) {
  const vidro = mat("#DCE6EA", { metal: 0.3, rough: 0.08 });
  if (tipo === "redondo") {
    const d = Math.min(l, a);
    return (
      <group>
        <Cil c={[0, a / 2, 0]} d={d} a={0.02} m={mm(T.latao, 0.35)} deitado="z" />
        <Cil c={[0, a / 2, 0.006]} d={d - 0.04} a={0.015} m={vidro} deitado="z" />
      </group>
    );
  }
  return (
    <group>
      <B c={[0, a / 2, 0]} s={[l, a, 0.02]} m={vidro} />
      {tipo === "moldura" &&
        (
          [
            [0, a - 0.03, l + 0.04, 0.06],
            [0, 0.03, l + 0.04, 0.06],
            [-l / 2, a / 2, 0.06, a],
            [l / 2, a / 2, 0.06, a],
          ] as const
        ).map(([x, y, w, h], i) => <B key={i} c={[x, y, 0.012]} s={[w, h, 0.03]} m={mm(C.madeiraEscura, 0.5)} />)}
      {tipo === "led" && <B c={[0, a / 2, -0.006]} s={[l + 0.03, a + 0.03, 0.005]} m={mat("#FFF6DD", { emissive: "#FFF1C9" })} sombra={false} />}
    </group>
  );
}

function BoxG({ l, p, a, perfil }: Dim & { perfil: string | null }) {
  const vidro = mat(C.vidro, { opacity: 0.22, rough: 0.05, metal: 0.1 });
  const pm = perfil ? mm(perfil, 0.35) : null;
  return (
    <group>
      <B c={[0, 0.025, 0]} s={[l, 0.05, p]} m={mm(C.marmore, 0.4)} sombra={false} />
      <B c={[0, a / 2 + 0.03, p / 2 - 0.01]} s={[l, a - 0.06, 0.008]} m={vidro} sombra={false} />
      <B c={[l / 2 - 0.01, a / 2 + 0.03, 0]} s={[0.008, a - 0.06, p]} m={vidro} sombra={false} />
      <B c={[-l / 2 + 0.01, a / 2 + 0.03, 0]} s={[0.008, a - 0.06, p]} m={vidro} sombra={false} />
      {pm && (
        <>
          <B c={[0, a, p / 2 - 0.01]} s={[l, 0.025, 0.025]} m={pm} sombra={false} />
          <B c={[0, a / 2, p / 2 - 0.01]} s={[0.02, a, 0.02]} m={pm} sombra={false} />
        </>
      )}
      <B c={[0, 2.0, -p / 2 + 0.12]} s={[0.025, 0.025, 0.22]} m={mm(perfil ?? C.inox, 0.3)} />
      <B c={[0, 1.97, -p / 2 + 0.24]} s={[0.22, 0.015, 0.22]} m={mm(perfil ?? C.inox, 0.3)} />
    </group>
  );
}

function Toalheiro({ l, a }: Dim) {
  return (
    <group>
      <Cil c={[0, a - 0.05, 0]} d={0.02} a={l} m={mm(C.inox, 0.3)} deitado="x" />
      <B c={[0, a / 2 - 0.02, 0.01]} s={[l * 0.75, a - 0.1, 0.03]} m={mm("#E9E2D6", 1)} />
    </group>
  );
}

function Cesto({ l, a }: Dim) {
  return (
    <group>
      <Cil c={[0, a / 2, 0]} d={l * 0.9} a={a} m={mm(T.vime, 1)} />
      <Cil c={[0, a + 0.01, 0]} d={l * 0.92} a={0.025} m={mm(T.nogueira, 0.8)} />
    </group>
  );
}

function MaquinaTopo({ l, p, a }: Dim) {
  return (
    <group>
      <B c={[0, a / 2, 0]} s={[l, a, p]} m={mm(C.branco, 0.35)} />
      <B c={[0, a + 0.01, 0.04]} s={[l - 0.08, 0.02, p - 0.2]} m={mat("#9FB3BC", { opacity: 0.7, rough: 0.2 })} />
      <B c={[0, a + 0.05, -p / 2 + 0.06]} s={[l, 0.1, 0.1]} m={mm("#D8D4CC")} />
    </group>
  );
}

function LavaSeca({ l, p, a }: Dim) {
  return (
    <group>
      <B c={[0, a / 2, 0]} s={[l, a, p]} m={mm(T.grafite, 0.4)} />
      <Cil c={[0, a * 0.45, p / 2 + 0.01]} d={0.42} a={0.03} m={mm("#1C2224", 0.15)} deitado="z" />
      <Cil c={[0, a * 0.45, p / 2 + 0.018]} d={0.3} a={0.01} m={mat("#3A4A52", { opacity: 0.8, rough: 0.1 })} deitado="z" />
    </group>
  );
}

function TanqueG({ l, p, a, inox }: Dim & { inox?: boolean }) {
  const m = inox ? mat(C.inox, { metal: 0.3, rough: 0.3 }) : mm(C.louca, 0.35);
  return (
    <group>
      <B c={[0, (a - 0.28) / 2, -0.01]} s={[l, a - 0.28, p - 0.02]} m={mm(inox ? T.grafite : C.branco, 0.5)} />
      <B c={[0, a - 0.14, 0]} s={[l, 0.28, p]} m={m} />
      <B c={[0, a - 0.1, 0.03]} s={[l - 0.1, 0.2, p - 0.16]} m={mm("#C9CCCB", 0.4)} sombra={false} />
      <TorneiraG y={a} z={-p / 2 + 0.04} />
    </group>
  );
}

function ArmarioG({ l, p, a, tipo }: Dim & { tipo: "vassoureiro" | "aberto" }) {
  if (tipo === "aberto")
    return (
      <group>
        {[0.02, a * 0.33, a * 0.66, a - 0.02].map((y) => (
          <B key={y} c={[0, y, 0]} s={[l, 0.025, p]} m={mm(T.carvalho, 0.6)} />
        ))}
        {[-1, 1].map((sx) => (
          <B key={sx} c={[sx * (l / 2 - 0.01), a / 2, 0]} s={[0.02, a, p]} m={mm(T.carvalho, 0.6)} />
        ))}
        {[0.12, 0.45, 0.78].map((f, i) => (
          <B key={f} c={[0, a * f, 0]} s={[l - 0.15, 0.18, p - 0.1]} m={mm(i % 2 ? T.vime : T.linho, 1)} />
        ))}
      </group>
    );
  return (
    <group>
      <B c={[0, a / 2, 0]} s={[l, a, p]} m={mm(T.laca, 0.5)} />
      {Array.from({ length: 6 }, (_, i) => (
        <B key={i} c={[0, a * 0.75 + i * 0.03, p / 2 + 0.003]} s={[l - 0.2, 0.01, 0.005]} m={mm("#9C988F")} sombra={false} />
      ))}
      <B c={[l / 2 - 0.07, a * 0.5, p / 2 + 0.012]} s={[0.012, 0.2, 0.012]} m={mm(C.inox, 0.3)} sombra={false} />
    </group>
  );
}

// ───────────────────────── Carros ─────────────────────────

interface OpCarro {
  cor: string;
  cabine: number; // fração do comprimento
  recuo: number; // deslocamento da cabine para trás (fração)
  corpo: number; // altura do corpo
  vao: number; // altura do chão
  teto: number; // altura total
  cacamba?: boolean;
}

function CarroG({ l, p, o }: Dim & { o: OpCarro }) {
  const lat = mat(o.cor, { rough: 0.3, metal: 0.3 });
  const vidro = mat("#34444C", { rough: 0.15, metal: 0.2 });
  const roda = Math.min(0.72, o.vao * 2 + 0.3);
  const y0 = o.vao;
  const y1 = o.vao + o.corpo;
  return (
    <group>
      <B c={[0, (y0 + y1) / 2, 0]} s={[l, o.corpo, p]} m={lat} />
      <B c={[0, (y1 + o.teto - 0.05) / 2, -p * o.recuo]} s={[l - 0.14, o.teto - 0.05 - y1, p * o.cabine]} m={vidro} />
      <B c={[0, o.teto - 0.025, -p * o.recuo]} s={[l - 0.16, 0.05, p * o.cabine * 0.92]} m={lat} />
      {o.cacamba && <B c={[0, y1 + 0.005, -p * 0.3]} s={[l - 0.12, 0.012, p * 0.36]} m={mm(T.preto, 0.8)} sombra={false} />}
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz]) => (
        <Cil key={`${sx}${sz}`} c={[sx * (l / 2 - 0.12), roda / 2, sz * (p / 2 - 0.75)]} d={roda} a={0.24} m={mm(C.pneu, 0.9)} deitado="x" />
      ))}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <B c={[sx * (l / 2 - 0.2), y1 - 0.12, p / 2 + 0.002]} s={[0.26, 0.08, 0.01]} m={mat(C.farol, { emissive: "#FFF4C8" })} sombra={false} />
          <B c={[sx * (l / 2 - 0.18), y1 - 0.1, -p / 2 - 0.002]} s={[0.24, 0.07, 0.01]} m={mat(C.lanterna, { emissive: "#B23A2E" })} sombra={false} />
        </group>
      ))}
    </group>
  );
}

const carro =
  (o: OpCarro): Desenho =>
  (d) => <CarroG {...d} o={o} />;

// ───────────────────────── Externos ─────────────────────────

function SofaPallet({ l, p, a }: Dim) {
  const m = mm(T.pinus, 0.9);
  return (
    <group>
      {[0.07, 0.21].map((y) => (
        <group key={y}>
          <B c={[0, y, 0]} s={[l, 0.12, p]} m={m} />
          {Array.from({ length: Math.round(l / 0.15) }, (_, i) => (
            <B key={i} c={[-l / 2 + 0.07 + i * 0.15, y + 0.061, 0]} s={[0.1, 0.004, p]} m={mm("#C9AE80", 0.9)} sombra={false} />
          ))}
        </group>
      ))}
      <B c={[0, 0.33, 0.04]} s={[l - 0.04, 0.1, p - 0.1]} m={mm(T.linho, 1)} />
      <B c={[0, (0.38 + a) / 2, -p / 2 + 0.1]} s={[l - 0.1, a - 0.38, 0.16]} m={mm(T.mostarda, 1)} />
    </group>
  );
}

function Espreguicadeira({ l, p, cor }: Dim & { cor: string }) {
  const m = mm(cor, 0.6);
  // a frente aponta para os pés: encosto no fundo (-Z) levantado
  return (
    <group>
      <Pes l={l} p={p} a={0.18} r={0.06} s={0.04} m={m} />
      <B c={[0, 0.22, 0.2]} s={[l, 0.05, p * 0.7]} m={m} />
      <group position={[0, 0.3, -p / 2 + 0.3]} rotation={[-0.6, 0, 0]}>
        <B c={[0, 0.12, 0]} s={[l, 0.05, 0.62]} m={m} />
      </group>
      <B c={[0, 0.27, 0.2]} s={[l - 0.06, 0.05, p * 0.66]} m={mm(T.linho, 1)} />
    </group>
  );
}

function Churrasqueira({ l, p, a, inox }: Dim & { inox?: boolean }) {
  const corpo = inox ? mat(C.inox, { metal: 0.3, rough: 0.3 }) : mm(T.tijolo, 0.95);
  return (
    <group>
      <B c={[0, 0.45, 0]} s={[l, 0.9, p]} m={corpo} />
      <B c={[0, 0.92, 0]} s={[l + 0.04, 0.04, p + 0.04]} m={mm(inox ? T.grafite : "#CFC8BD", 0.6)} />
      <B c={[0, 1.15, -0.05]} s={[l - 0.1, 0.42, p - 0.15]} m={mm(T.preto, 0.9)} />
      <B c={[0, 1.15, p / 2 - 0.1]} s={[l - 0.2, 0.3, 0.02]} m={mm("#5A2A1E", 1)} sombra={false} />
      <B c={[0, 1.42, 0]} s={[l, 0.12, p]} m={corpo} />
      <B c={[0, (1.48 + a) / 2, -0.05]} s={[0.35, a - 1.48, 0.35]} m={corpo} />
    </group>
  );
}

// ───────────────────────── Decoração ─────────────────────────

function TapeteG({ l, p, tipo }: Dim & { tipo: "liso" | "listrado" | "redondo" | "sisal" | "persa" }) {
  const h = 0.012;
  if (tipo === "redondo") return <Cil c={[0, h / 2, 0]} d={Math.min(l, p)} a={h} m={mm("#B9AE9C", 1)} />;
  if (tipo === "persa")
    return (
      <group>
        <B c={[0, h / 2, 0]} s={[l, h, p]} m={mm("#8E3B2E", 1)} sombra={false} />
        <B c={[0, h + 0.001, 0]} s={[l - 0.16, 0.002, p - 0.16]} m={mm("#A9533F", 1)} sombra={false} />
        <B c={[0, h + 0.002, 0]} s={[l * 0.35, 0.002, p * 0.35]} m={mm("#2F3E5B", 1)} sombra={false} />
      </group>
    );
  if (tipo === "listrado")
    return (
      <group>
        <B c={[0, h / 2, 0]} s={[l, h, p]} m={mm(T.linho, 1)} sombra={false} />
        {Array.from({ length: 5 }, (_, i) => (
          <B key={i} c={[0, h + 0.001, -p / 2 + (p / 5) * (i + 0.5)]} s={[l - 0.02, 0.002, p / 14]} m={mm(i % 2 ? T.terracota : T.grafite, 1)} sombra={false} />
        ))}
      </group>
    );
  return <B c={[0, h / 2, 0]} s={[l, h, p]} m={mm(tipo === "sisal" ? "#C8B48E" : "#9AA39F", 1)} sombra={false} />;
}

function Vasinho({ d, a, cor }: { d: number; a: number; cor: string }) {
  return <Cil c={[0, a / 2, 0]} d={d} a={a} m={mm(cor, 0.85)} />;
}

function PlantaG({ l, a, tipo }: Dim & { tipo: "costela" | "palmeira" | "ficus" | "cacto" | "espada" }) {
  const d = l * 0.7;
  const vaso = tipo === "cacto" ? T.terracota : tipo === "espada" ? T.preto : tipo === "palmeira" ? T.laca : T.terracota;
  const top = 0.38;
  return (
    <group>
      <Vasinho d={d} a={top} cor={vaso} />
      {tipo === "costela" &&
        Array.from({ length: 7 }, (_, i) => {
          const ang = (i / 7) * Math.PI * 2;
          const h = top + 0.3 + (i % 3) * 0.18;
          return (
            <group key={i}>
              <Cil c={[Math.cos(ang) * 0.06, (top + h) / 2, Math.sin(ang) * 0.06]} d={0.012} a={h - top} m={mm(T.folhaEscura)} />
              <Esf c={[Math.cos(ang) * 0.18, h, Math.sin(ang) * 0.18]} s={[0.26, 0.04, 0.2]} m={mm(i % 2 ? T.folha : T.folhaEscura, 0.8)} />
            </group>
          );
        })}
      {tipo === "palmeira" &&
        Array.from({ length: 6 }, (_, i) => {
          const ang = (i / 6) * Math.PI * 2;
          return (
            <group key={i}>
              <Cil c={[Math.cos(ang) * 0.04, (top + a - 0.2) / 2, Math.sin(ang) * 0.04]} d={0.02} a={a - 0.2 - top} m={mm("#6B5A3E")} />
              <Cone c={[Math.cos(ang) * 0.12, a - 0.18, Math.sin(ang) * 0.12]} d={0.28} a={0.32} m={mm(T.folhaClara, 0.8)} />
            </group>
          );
        })}
      {tipo === "ficus" && (
        <>
          <Cil c={[0, (top + a * 0.55) / 2, 0]} d={0.04} a={a * 0.55 - top} m={mm("#6B5A3E")} />
          <Esf c={[0, a * 0.72, 0]} s={[l * 0.9, a * 0.5, l * 0.9]} m={mm(T.folha, 0.85)} />
        </>
      )}
      {tipo === "cacto" && (
        <>
          <Cil c={[0, top + 0.3, 0]} d={0.14} a={0.6} m={mm("#5E7D4E", 0.7)} />
          <Esf c={[0, top + 0.6, 0]} s={[0.14, 0.1, 0.14]} m={mm("#5E7D4E", 0.7)} />
          <Cil c={[0.1, top + 0.36, 0]} d={0.08} a={0.25} m={mm("#5E7D4E", 0.7)} />
          <Cil c={[-0.09, top + 0.28, 0.02]} d={0.07} a={0.2} m={mm("#5E7D4E", 0.7)} />
        </>
      )}
      {tipo === "espada" &&
        Array.from({ length: 9 }, (_, i) => {
          const ang = (i / 9) * Math.PI * 2;
          const h = 0.45 + (i % 3) * 0.12;
          return (
            <group key={i} position={[Math.cos(ang) * 0.06, top + h / 2, Math.sin(ang) * 0.06]} rotation={[Math.sin(ang) * 0.12, ang, Math.cos(ang) * 0.12]}>
              <B c={[0, 0, 0]} s={[0.06, h, 0.012]} m={mm(i % 2 ? "#4F6B3F" : "#7A8F4A", 0.8)} />
            </group>
          );
        })}
    </group>
  );
}

function LuminariaG({ l, a, tipo }: Dim & { tipo: "coluna" | "arco" | "tripe" }) {
  const metal = mm(tipo === "arco" ? T.latao : T.preto, 0.35);
  const cupula = mat("#F4EBDB", { rough: 1, emissive: "#F4E3C0" });
  if (tipo === "tripe")
    return (
      <group>
        {[0, 1, 2].map((i) => {
          const ang = (i * 2 * Math.PI) / 3;
          return (
            <group key={i} position={[Math.cos(ang) * 0.1, a * 0.4, Math.sin(ang) * 0.1]} rotation={[Math.sin(ang) * 0.18, 0, -Math.cos(ang) * 0.18]}>
              <B c={[0, 0, 0]} s={[0.025, a * 0.8, 0.025]} m={mm(T.carvalho, 0.6)} />
            </group>
          );
        })}
        <Cil c={[0, a - 0.15, 0]} d={l * 0.95} a={0.28} m={cupula} />
      </group>
    );
  if (tipo === "arco")
    return (
      <group>
        <Cil c={[0, 0.03, 0]} d={0.3} a={0.06} m={mm("#E7E3DB", 0.4)} />
        {Array.from({ length: 6 }, (_, i) => {
          const t0 = i / 6;
          const ang = t0 * Math.PI * 0.55;
          return (
            <group key={i} position={[0, 0.1 + Math.sin(ang) * (a - 0.3), Math.cos(ang) * 0 + (1 - Math.cos(ang)) * 0.3]} rotation={[ang, 0, 0]}>
              <B c={[0, 0.12, 0]} s={[0.02, (a - 0.3) / 6 + 0.05, 0.02]} m={metal} />
            </group>
          );
        })}
        <Cone c={[0, a - 0.15, 0.32]} d={0.32} a={0.18} m={cupula} />
      </group>
    );
  return (
    <group>
      <Cil c={[0, 0.015, 0]} d={0.28} a={0.03} m={metal} />
      <Cil c={[0, a / 2, 0]} d={0.025} a={a - 0.2} m={metal} />
      <Cil c={[0, a - 0.12, 0]} d={l * 0.85} a={0.24} m={cupula} />
    </group>
  );
}

function QuadroG({ l, a, tipo }: Dim & { tipo: "abstrato" | "paisagem" | "trio" }) {
  const moldura = mm(tipo === "paisagem" ? C.madeiraEscura : T.preto, 0.5);
  if (tipo === "trio") {
    const w = l / 3 - 0.06;
    return (
      <group>
        {[-1, 0, 1].map((i) => (
          <group key={i} position={[i * (w + 0.06), a / 2, 0]}>
            <B c={[0, 0, 0]} s={[w, a * 0.8, 0.025]} m={moldura} />
            <B c={[0, 0, 0.014]} s={[w - 0.05, a * 0.8 - 0.05, 0.004]} m={mm([T.mostarda, T.linho, T.azul][i + 1], 0.9)} sombra={false} />
          </group>
        ))}
      </group>
    );
  }
  return (
    <group>
      <B c={[0, a / 2, 0]} s={[l, a, 0.03]} m={moldura} />
      <B c={[0, a / 2, 0.016]} s={[l - 0.06, a - 0.06, 0.004]} m={mm(tipo === "paisagem" ? "#A9C2CC" : T.linho, 0.9)} sombra={false} />
      {tipo === "paisagem" ? (
        <>
          <B c={[0, a * 0.32, 0.019]} s={[l - 0.06, a * 0.36, 0.003]} m={mm("#7D9467", 0.9)} sombra={false} />
          <Cil c={[l * 0.25, a * 0.68, 0.02]} d={0.1} a={0.003} m={mm("#E8C66B", 0.6)} deitado="z" />
        </>
      ) : (
        <>
          <B c={[-l * 0.15, a * 0.55, 0.019]} s={[l * 0.35, a * 0.5, 0.003]} m={mm(T.terracota, 0.9)} sombra={false} />
          <Cil c={[l * 0.18, a * 0.42, 0.02]} d={a * 0.35} a={0.003} m={mm(T.azul, 0.9)} deitado="z" />
        </>
      )}
    </group>
  );
}

function AparadorG({ l, p, a, tipo }: Dim & { tipo: "madeira" | "palito" | "laca" }) {
  const y0 = tipo === "palito" ? 0.22 : tipo === "laca" ? 0.08 : 0.12;
  const m = mm(tipo === "laca" ? T.laca : tipo === "palito" ? T.carvalho : T.nogueira, 0.5);
  return (
    <group>
      {tipo === "laca" ? (
        <B c={[0, y0 / 2, 0]} s={[l - 0.2, y0, p - 0.1]} m={mm(T.preto)} />
      ) : (
        <Pes l={l - 0.06} p={p - 0.06} a={y0} s={tipo === "palito" ? 0.03 : 0.05} m={mm(C.madeiraEscura)} redondo={tipo === "palito"} />
      )}
      <B c={[0, (y0 + a) / 2, 0]} s={[l, a - y0, p]} m={m} />
      {[-l / 3, 0, l / 3].map((x) => (
        <B
          key={x}
          c={[x, (y0 + a) / 2, p / 2 + 0.003]}
          s={[l / 3 - 0.03, a - y0 - 0.06, 0.006]}
          m={mm(tipo === "laca" ? "#DDD8CE" : "#5E412C", 0.55)}
          sombra={false}
        />
      ))}
      <Cil c={[l * 0.3, a + 0.12, 0]} d={0.12} a={0.24} m={mm(T.terracota, 0.6)} />
      <B c={[-l * 0.25, a + 0.03, 0]} s={[0.25, 0.06, 0.18]} m={mm(C.livros[1])} />
    </group>
  );
}

function BanquetaG({ l, a, madeira }: Dim & { madeira?: boolean }) {
  const m = madeira ? mm(T.carvalho, 0.6) : mm(T.preto, 0.4);
  return (
    <group>
      <Cil c={[0, a - 0.02, 0]} d={l} a={0.04} m={madeira ? m : mm(T.couro, 0.7)} />
      <Pes l={l * 0.8} p={l * 0.8} a={a - 0.04} r={0.02} s={0.025} m={m} redondo={madeira} />
      <B c={[0, a * 0.35, l * 0.38]} s={[l * 0.8, 0.02, 0.02]} m={m} />
    </group>
  );
}

function PuffG({ l, p, a, quadrado }: Dim & { quadrado?: boolean }) {
  if (quadrado) return <B c={[0, a / 2, 0]} s={[l, a, p]} m={mm(T.couro, 0.75)} />;
  return <Cil c={[0, a / 2, 0]} d={Math.min(l, p)} a={a} m={mm(T.mostarda, 1)} />;
}

// ───────────────────────── Mapa id → desenho ─────────────────────────

export const MODELOS: Record<string, Desenho> = {
  // sofás
  "sofa:palito": sofa({ cor: T.verde, pes: "palito", base: 0.22, braco: 0.12, soltas: true }),
  "sofa:modular": sofa({ cor: T.cinza, almofada: "#9EA5A2", base: 0.2, braco: 0.32, bracoA: 0.42 }),
  "sofa:chesterfield": sofa({ cor: T.couro, base: 0.3, braco: 0.22, bracoA: 0.75, capitone: true, pes: "madeira", pe: 0.06 }),
  "sofa:futon": sofa({ cor: T.linho, almofada: "#E4DCCF", base: 0.16, braco: 0.06, bracoA: 0.3, pes: "madeira", pe: 0.06, estrutura: T.pinus }),
  "sofa:almofadao": sofa({ cor: T.boucle, almofada: "#F3EEE6", base: 0.24, braco: 0.25, soltas: true }),
  "sofa:madeira": sofa({ cor: T.terracota, almofada: "#C77D61", base: 0.12, braco: 0.06, bracoA: 0.62, pes: "madeira", pe: 0.2, estrutura: T.nogueira }),
  // poltronas
  "poltrona:concha": (d) => <PoltronaConcha {...d} cor={T.mostarda} />,
  "poltrona:bergere": Bergere,
  "poltrona:palito": poltrona({ cor: T.azul, pes: "palito", base: 0.22, braco: 0.1, soltas: true }),
  "poltrona:vime": PoltronaVime,
  "poltrona:boucle": PoltronaBoucle,
  // mesas de centro
  "mesaCentro:redonda": MesaCentroRedonda,
  "mesaCentro:vidro": MesaCentroVidro,
  "mesaCentro:ninho": MesaCentroNinho,
  "mesaCentro:bloco": MesaCentroBloco,
  "mesaCentro:bau": Bau,
  // racks e TVs
  "rack:suspenso": (d) => <RackG {...d} o={{ cor: T.laca, frente: T.carvalho, suspenso: true }} />,
  "rack:nichos": (d) => <RackG {...d} o={{ cor: T.carvalho, nichos: true }} />,
  "rack:palito": (d) => <RackG {...d} o={{ cor: T.carvalho, frente: T.verde, pes: "palito" }} />,
  "rack:ripado": (d) => <RackG {...d} o={{ cor: T.grafite, frente: T.carvalho, ripado: true }} />,
  "rack:demolicao": (d) => <RackG {...d} o={{ cor: "#6B4B34", frente: "#7E5A3F" }} />,
  "rack:classico": (d) => <RackG {...d} o={{ cor: C.madeiraEscura, frente: "#5E412C", pes: "torneado" }} />,
  "tv:soundbar": TvSoundbar,
  "tv:parede": TvParede,
  // jantar
  "mesa:central": MesaCentral,
  "mesa:cavalete": MesaCavalete,
  "mesa:vidro": MesaVidro,
  "mesa:macica": MesaMacica,
  "mesa:classica": MesaClassica,
  "mesaRedonda:tulipa": MesaTulipa,
  "mesaRedonda:madeira": MesaRedondaMadeira,
  "cadeira:concha": CadeiraConcha,
  "cadeira:palhinha": CadeiraPalhinha,
  "cadeira:estofada": CadeiraEstofada,
  "cadeira:industrial": CadeiraIndustrial,
  "cadeira:windsor": CadeiraWindsor,
  "cadeira:lamina": CadeiraLamina,
  // cozinha (a frente dos armários vem do modelo de bancada do cômodo)
  "bancada:padrao": (d) => <BancadaG {...d} base="bancada:padrao" />,
  "bancada:ripada": (d) => <BancadaG {...d} base="bancada:ripada" />,
  "bancada:madeira": (d) => <BancadaG {...d} base="bancada:madeira" />,
  "bancada:provencal": (d) => <BancadaG {...d} base="bancada:provencal" />,
  "bancada:cinza": (d) => <BancadaG {...d} base="bancada:cinza" />,
  "armarioSuperior:vidro": (d) => <AereoG {...d} tipo="vidro" />,
  "armarioSuperior:aberto": (d) => <AereoG {...d} tipo="aberto" />,
  "armarioSuperior:madeira": (d) => <AereoG {...d} tipo="madeira" />,
  "pia:padrao": (d) => <PiaG {...d} cubas={1} />,
  "pia:dupla": (d) => <PiaG {...d} cubas={2} />,
  "pia:gourmet": (d) => <PiaG {...d} cubas={1} alta />,
  "fogao:padrao": (d) => <FogaoG {...d} bocas={4} />,
  "fogao:piso": FogaoPiso,
  "fogao:cinco": (d) => <FogaoG {...d} bocas={5} />,
  "fogao:inducao": (d) => <FogaoG {...d} bocas={4} inducao />,
  "geladeira:branca": (d) => <GeladeiraG {...d} cor="#F2F0EB" />,
  "geladeira:retro": (d) => <GeladeiraG {...d} cor="#9CC3B4" retro />,
  "geladeira:preta": (d) => <GeladeiraG {...d} cor="#2B2E2E" />,
  "ilha:padrao": (d) => <BancadaG {...d} tampo={C.marmore} />,
  "ilha:madeira": (d) => <BancadaG {...d} base="bancada:madeira" tampo={T.nogueira} />,
  "ilha:cascata": IlhaCascata,
  "coifa:padrao": (d) => <Coifa {...d} />,
  "coifa:reta": (d) => <Coifa {...d} reta />,
  "microondas:padrao": Microondas,
  // quartos
  "cama:bau": cama({ base: "bau", cabeceira: "estofada", cor: T.linho, manta: "#C9B8A0" }),
  "cama:plataforma": cama({ base: "plataforma", cabeceira: "baixa", cor: T.carvalho, manta: T.cinza }),
  "cama:estofada": cama({ base: "pes", cabeceira: "estofada", cor: C.madeiraEscura, manta: "#A7B3BE" }),
  "cama:ripada": cama({ base: "pes", cabeceira: "ripada", cor: T.carvalho, manta: T.terracota }),
  "cama:ferro": cama({ base: "ferro", cabeceira: "ferro", cor: T.preto, manta: "#D9C9A8" }),
  "cama:classica": cama({ base: "pes", cabeceira: "classica", cor: C.madeiraEscura, manta: "#B8A27C" }),
  "criadoMudo:suspenso": (d) => <CriadoG {...d} tipo="suspenso" />,
  "criadoMudo:palito": (d) => <CriadoG {...d} tipo="palito" />,
  "criadoMudo:redondo": (d) => <CriadoG {...d} tipo="redondo" />,
  "criadoMudo:classico": (d) => <CriadoG {...d} tipo="classico" />,
  "criadoMudo:tronco": (d) => <CriadoG {...d} tipo="tronco" />,
  "guardaRoupa:giro": (d) => <GuardaRoupaG {...d} tipo="giro" />,
  "guardaRoupa:espelhado": (d) => <GuardaRoupaG {...d} tipo="espelhado" />,
  "guardaRoupa:ripado": (d) => <GuardaRoupaG {...d} tipo="ripado" />,
  "guardaRoupa:madeira": (d) => <GuardaRoupaG {...d} tipo="madeira" />,
  "escrivaninha:metal": (d) => <EscrivaninhaG {...d} tipo="metal" />,
  "escrivaninha:gaveteiro": (d) => <EscrivaninhaG {...d} tipo="gaveteiro" />,
  "escrivaninha:suspensa": (d) => <EscrivaninhaG {...d} tipo="suspensa" />,
  "cadeiraEscritorio:gamer": CadeiraGamer,
  "cadeiraEscritorio:madeira": CadeiraEscritorioMadeira,
  "estante:nichos": (d) => <EstanteG {...d} tipo="nichos" />,
  "estante:escada": (d) => <EstanteG {...d} tipo="escada" />,
  "estante:industrial": (d) => <EstanteG {...d} tipo="industrial" />,
  "comoda:padrao": (d) => <ComodaG {...d} />,
  "comoda:retro": (d) => <ComodaG {...d} retro />,
  // banheiro
  "vaso:suspenso": VasoSuspenso,
  "vaso:redondo": VasoRedondo,
  "lavatorio:apoio": (d) => <LavatorioG {...d} tipo="apoio" />,
  "lavatorio:suspenso": (d) => <LavatorioG {...d} tipo="suspenso" />,
  "lavatorio:coluna": (d) => <LavatorioG {...d} tipo="coluna" />,
  "lavatorio:rustico": (d) => <LavatorioG {...d} tipo="rustico" />,
  "espelho:redondo": (d) => <EspelhoG {...d} tipo="redondo" />,
  "espelho:moldura": (d) => <EspelhoG {...d} tipo="moldura" />,
  "espelho:led": (d) => <EspelhoG {...d} tipo="led" />,
  "box:preto": (d) => <BoxG {...d} perfil={T.preto} />,
  "box:inteiro": (d) => <BoxG {...d} perfil={null} />,
  "toalheiro:padrao": Toalheiro,
  "cesto:padrao": Cesto,
  // serviço
  "maquina:topo": MaquinaTopo,
  "maquina:lavaseca": LavaSeca,
  "tanque:inox": (d) => <TanqueG {...d} inox />,
  "tanque:gabinete": (d) => <TanqueG {...d} />,
  "armario:vassoureiro": (d) => <ArmarioG {...d} tipo="vassoureiro" />,
  "armario:aberto": (d) => <ArmarioG {...d} tipo="aberto" />,
  // carros (sempre nas medidas do carro do briefing)
  "carro:hatch": carro({ cor: "#C9573F", cabine: 0.5, recuo: 0.12, corpo: 0.5, vao: 0.2, teto: 1.45 }),
  "carro:suv": carro({ cor: "#46656B", cabine: 0.55, recuo: 0.08, corpo: 0.62, vao: 0.28, teto: 1.62 }),
  "carro:picape": carro({ cor: "#E7E3DB", cabine: 0.3, recuo: -0.08, corpo: 0.62, vao: 0.3, teto: 1.75, cacamba: true }),
  "carro:esportivo": carro({ cor: "#2B2E2E", cabine: 0.38, recuo: 0.04, corpo: 0.42, vao: 0.14, teto: 1.15 }),
  // externos
  "sofaExterno:vime": sofa({ cor: T.vime, almofada: T.linho, base: 0.3, braco: 0.14, estrutura: T.vime }),
  "sofaExterno:pallet": SofaPallet,
  "sofaExterno:aluminio": sofa({ cor: T.boucle, almofada: "#F4F1EA", base: 0.14, braco: 0.05, bracoA: 0.5, pes: "metal", pe: 0.16, estrutura: "#B8BDBC" }),
  "espreguicadeira:padrao": (d) => <Espreguicadeira {...d} cor={T.nogueira} />,
  "espreguicadeira:aluminio": (d) => <Espreguicadeira {...d} cor="#DADDDB" />,
  "churrasqueira:padrao": (d) => <Churrasqueira {...d} />,
  "churrasqueira:inox": (d) => <Churrasqueira {...d} inox />,
  // decoração
  "tapete:padrao": (d) => <TapeteG {...d} tipo="liso" />,
  "tapete:listrado": (d) => <TapeteG {...d} tipo="listrado" />,
  "tapete:redondo": (d) => <TapeteG {...d} tipo="redondo" />,
  "tapete:sisal": (d) => <TapeteG {...d} tipo="sisal" />,
  "tapete:persa": (d) => <TapeteG {...d} tipo="persa" />,
  "planta:padrao": (d) => <PlantaG {...d} tipo="costela" />,
  "planta:palmeira": (d) => <PlantaG {...d} tipo="palmeira" />,
  "planta:ficus": (d) => <PlantaG {...d} tipo="ficus" />,
  "planta:cacto": (d) => <PlantaG {...d} tipo="cacto" />,
  "planta:espada": (d) => <PlantaG {...d} tipo="espada" />,
  "luminaria:padrao": (d) => <LuminariaG {...d} tipo="coluna" />,
  "luminaria:arco": (d) => <LuminariaG {...d} tipo="arco" />,
  "luminaria:tripe": (d) => <LuminariaG {...d} tipo="tripe" />,
  "quadro:padrao": (d) => <QuadroG {...d} tipo="abstrato" />,
  "quadro:paisagem": (d) => <QuadroG {...d} tipo="paisagem" />,
  "quadro:trio": (d) => <QuadroG {...d} tipo="trio" />,
  "aparador:padrao": (d) => <AparadorG {...d} tipo="madeira" />,
  "aparador:palito": (d) => <AparadorG {...d} tipo="palito" />,
  "aparador:laca": (d) => <AparadorG {...d} tipo="laca" />,
  "banqueta:padrao": (d) => <BanquetaG {...d} />,
  "banqueta:madeira": (d) => <BanquetaG {...d} madeira />,
  "puff:padrao": (d) => <PuffG {...d} />,
  "puff:quadrado": (d) => <PuffG {...d} quadrado />,
};
