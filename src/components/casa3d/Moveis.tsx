import { memo } from "react";
import type { Movel3D, TipoMovel } from "../../lib/three/mobilia";
import { MODELOS } from "./Modelos";
import { B, C, Cil, mat, type Dim } from "./primitivas";
import { P } from "./Cena";

/**
 * Móveis 3D paramétricos, feitos só com caixas e cilindros (leves para o celular).
 * Cada componente desenha o móvel no próprio espaço: largura no eixo X, profundidade no Z, frente para +Z,
 * base em y = 0. O <Movel> posiciona, gira e passa as medidas que vieram de mobilia.ts.
 * Para trocar um móvel por um modelo mais detalhado no futuro, basta trocar o componente no mapa COMPONENTES.
 */

export { CORES_MOVEIS } from "./primitivas";

// ───────────────────────── Sala ─────────────────────────

export function Sofa({ l, p, a, cor = C.tecido, almofada = C.almofada }: Dim & { cor?: string; almofada?: string }) {
  const braco = Math.min(0.2, l * 0.1);
  const lugares = l > 1.9 ? 3 : 2;
  const assento = (l - 2 * braco) / lugares;
  const m = mat(cor, { rough: 0.95 });
  const ma = mat(almofada, { rough: 0.95 });
  return (
    <group>
      <B c={[0, 0.22, 0]} s={[l, 0.32, p]} m={m} />
      <B c={[0, (0.38 + a) / 2, -p / 2 + 0.12]} s={[l, a - 0.38, 0.24]} m={m} />
      <B c={[-l / 2 + braco / 2, 0.3, 0]} s={[braco, 0.6, p]} m={m} />
      <B c={[l / 2 - braco / 2, 0.3, 0]} s={[braco, 0.6, p]} m={m} />
      {Array.from({ length: lugares }, (_, i) => (
        <B key={i} c={[-l / 2 + braco + assento * (i + 0.5), 0.44, 0.08]} s={[assento - 0.03, 0.12, p - 0.3]} m={ma} />
      ))}
    </group>
  );
}

export function Poltrona(d: Dim) {
  return <Sofa {...d} cor={C.poltrona} almofada="#C58B63" />;
}

export function MesaCentro({ l, p, a }: Dim) {
  return (
    <group>
      <B c={[0, a - 0.025, 0]} s={[l, 0.05, p]} m={mat(C.madeira, { rough: 0.6 })} />
      <B c={[0, (a - 0.05) / 2, 0]} s={[l - 0.2, a - 0.05, p - 0.2]} m={mat(C.madeiraEscura)} />
    </group>
  );
}

export function Rack({ l, p, a }: Dim) {
  return (
    <group>
      <B c={[0, a / 2 + 0.04, 0]} s={[l, a - 0.08, p]} m={mat(C.madeiraEscura, { rough: 0.6 })} />
      <B c={[0, 0.02, 0]} s={[l - 0.1, 0.04, p - 0.1]} m={mat(C.preto)} />
      {[-l / 4, l / 4].map((x) => (
        <B key={x} c={[x, a / 2 + 0.04, p / 2 + 0.002]} s={[l / 2 - 0.04, a - 0.16, 0.004]} m={mat(C.madeira, { rough: 0.6 })} sombra={false} />
      ))}
    </group>
  );
}

export function TV({ l, a }: Dim) {
  const h = a - 0.08;
  return (
    <group>
      <B c={[0, 0.01, 0]} s={[0.35, 0.02, 0.2]} m={mat(C.preto, { metal: 0.3 })} />
      <B c={[0, 0.06, -0.01]} s={[0.06, 0.1, 0.03]} m={mat(C.preto, { metal: 0.3 })} />
      <B c={[0, 0.08 + h / 2, 0]} s={[l, h, 0.04]} m={mat(C.preto, { rough: 0.3, metal: 0.2 })} />
      <B c={[0, 0.08 + h / 2, 0.021]} s={[l - 0.03, h - 0.03, 0.002]} m={mat("#141A1C", { rough: 0.15, metal: 0.4 })} sombra={false} />
    </group>
  );
}

// ───────────────────────── Mesas e cadeiras ─────────────────────────

export function Mesa({ l, p, a }: Dim) {
  const pe = 0.05;
  const m = mat(C.madeira, { rough: 0.55 });
  return (
    <group>
      <B c={[0, a - 0.02, 0]} s={[l, 0.04, p]} m={m} />
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz]) => (
        <B key={`${sx}${sz}`} c={[sx * (l / 2 - 0.08), (a - 0.04) / 2, sz * (p / 2 - 0.08)]} s={[pe, a - 0.04, pe]} m={mat(C.madeiraEscura)} />
      ))}
    </group>
  );
}

export function MesaRedonda({ l, a }: Dim) {
  return (
    <group>
      <Cil c={[0, a - 0.02, 0]} d={l} a={0.04} m={mat(C.externo, { rough: 0.7 })} />
      <Cil c={[0, (a - 0.04) / 2, 0]} d={0.08} a={a - 0.04} m={mat(C.preto)} />
      <Cil c={[0, 0.01, 0]} d={0.5} a={0.02} m={mat(C.preto)} />
    </group>
  );
}

export function Cadeira({ l, p, a, cor = C.madeira }: Dim & { cor?: string }) {
  const m = mat(cor, { rough: 0.6 });
  const pe = 0.035;
  return (
    <group>
      <B c={[0, 0.45, 0]} s={[l, 0.04, p]} m={m} />
      <B c={[0, (0.47 + a) / 2, -p / 2 + 0.02]} s={[l, a - 0.47, 0.03]} m={m} />
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz]) => (
        <B key={`${sx}${sz}`} c={[sx * (l / 2 - 0.03), 0.215, sz * (p / 2 - 0.03)]} s={[pe, 0.43, pe]} m={mat(C.madeiraEscura)} />
      ))}
    </group>
  );
}

export function CadeiraEscritorio({ l, p, a }: Dim) {
  const m = mat(C.preto, { rough: 0.7 });
  return (
    <group>
      <Cil c={[0, 0.03, 0]} d={Math.min(l, p)} a={0.04} m={m} />
      <Cil c={[0, 0.25, 0]} d={0.05} a={0.4} m={mat(C.inox, { metal: 0.7, rough: 0.3 })} />
      <B c={[0, 0.48, 0]} s={[l - 0.04, 0.07, p - 0.06]} m={m} />
      <B c={[0, (0.52 + a) / 2, -p / 2 + 0.05]} s={[l - 0.06, a - 0.52, 0.05]} m={m} />
    </group>
  );
}

// ───────────────────────── Cozinha ─────────────────────────

/** Armário inferior com tampo; `portas` desenha os vãos das portas. */
export function Bancada({ l, p, a, tampo = C.bancada }: Dim & { tampo?: string }) {
  const n = Math.max(1, Math.round(l / 0.5));
  return (
    <group>
      <B c={[0, (a - 0.04) / 2, -0.02]} s={[l, a - 0.04, p - 0.04]} m={mat(C.branco, { rough: 0.5 })} />
      <B c={[0, a - 0.02, 0]} s={[l, 0.04, p]} m={mat(tampo, { rough: 0.35 })} />
      {Array.from({ length: n - 1 }, (_, i) => (
        <B key={i} c={[-l / 2 + (l / n) * (i + 1), (a - 0.14) / 2 + 0.05, p / 2 - 0.035]} s={[0.008, a - 0.2, 0.005]} m={mat("#B9B5AE")} sombra={false} />
      ))}
    </group>
  );
}

export function ArmarioSuperior({ l, p, a }: Dim) {
  const n = Math.max(1, Math.round(l / 0.45));
  return (
    <group>
      <B c={[0, a / 2, 0]} s={[l, a, p]} m={mat(C.branco, { rough: 0.5 })} />
      {Array.from({ length: n - 1 }, (_, i) => (
        <B key={i} c={[-l / 2 + (l / n) * (i + 1), a / 2, p / 2 + 0.002]} s={[0.008, a - 0.04, 0.004]} m={mat("#B9B5AE")} sombra={false} />
      ))}
    </group>
  );
}

function Torneira({ x = 0, y, z }: { x?: number; y: number; z: number }) {
  const m = mat(C.inox, { metal: 0.85, rough: 0.25 });
  return (
    <group>
      <Cil c={[x, y + 0.13, z]} d={0.03} a={0.26} m={m} />
      <B c={[x, y + 0.25, z + 0.07]} s={[0.025, 0.025, 0.15]} m={m} />
    </group>
  );
}

export function Pia(d: Dim) {
  const { l, p, a } = d;
  return (
    <group>
      <Bancada {...d} />
      <B c={[0, a + 0.002, 0.02]} s={[Math.min(0.55, l - 0.15), 0.006, p - 0.22]} m={mat(C.inox, { metal: 0.8, rough: 0.25 })} sombra={false} />
      <Torneira y={a} z={-p / 2 + 0.08} />
    </group>
  );
}

export function Fogao(d: Dim) {
  const { l, p, a } = d;
  const vidro = mat("#121515", { rough: 0.15, metal: 0.3 });
  return (
    <group>
      <Bancada {...d} />
      <B c={[0, a + 0.004, 0]} s={[l - 0.04, 0.008, p - 0.1]} m={vidro} sombra={false} />
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz]) => (
        <Cil key={`${sx}${sz}`} c={[sx * l * 0.22, a + 0.012, sz * p * 0.2]} d={0.13} a={0.012} m={mat("#2C2F2F", { rough: 0.5 })} />
      ))}
      <B c={[0, a * 0.5, p / 2 + 0.003]} s={[l - 0.08, a * 0.45, 0.006]} m={vidro} sombra={false} />
    </group>
  );
}

export function Geladeira({ l, p, a }: Dim) {
  const m = mat(C.inox, { metal: 0.6, rough: 0.35 });
  const puxador = mat("#7E8584", { metal: 0.7, rough: 0.3 });
  return (
    <group>
      <B c={[0, a / 2, 0]} s={[l, a, p]} m={m} />
      <B c={[0, a * 0.62, p / 2 + 0.002]} s={[l - 0.01, 0.01, 0.004]} m={mat("#5E6463")} sombra={false} />
      <B c={[l / 2 - 0.07, a * 0.82, p / 2 + 0.02]} s={[0.02, 0.35, 0.03]} m={puxador} />
      <B c={[l / 2 - 0.07, a * 0.4, p / 2 + 0.02]} s={[0.02, 0.45, 0.03]} m={puxador} />
    </group>
  );
}

export function Ilha(d: Dim) {
  return (
    <group>
      <Bancada {...d} tampo={C.marmore} />
    </group>
  );
}

// ───────────────────────── Quartos ─────────────────────────

export function Cama({ l, p, a }: Dim) {
  const casal = l > 1.2;
  return (
    <group>
      <B c={[0, 0.2, 0]} s={[l, 0.24, p]} m={mat(C.madeira, { rough: 0.65 })} />
      <B c={[0, 0.43, 0.02]} s={[l - 0.04, 0.22, p - 0.06]} m={mat(C.lencol, { rough: 1 })} />
      <B c={[0, a / 2, -p / 2 + 0.04]} s={[l + 0.06, a, 0.08]} m={mat(C.madeiraEscura, { rough: 0.7 })} />
      {(casal ? [-l / 4, l / 4] : [0]).map((x) => (
        <B key={x} c={[x, 0.6, -p / 2 + 0.3]} s={[casal ? l / 2 - 0.12 : l - 0.2, 0.12, 0.34]} m={mat("#FFFFFF", { rough: 1 })} />
      ))}
      <B c={[0, 0.555, p * 0.2]} s={[l + 0.02, 0.03, p * 0.6]} m={mat(C.manta, { rough: 1 })} />
    </group>
  );
}

export function CriadoMudo({ l, p, a }: Dim) {
  return (
    <group>
      <B c={[0, a / 2, 0]} s={[l, a, p]} m={mat(C.madeira, { rough: 0.6 })} />
      <B c={[0, a * 0.62, p / 2 + 0.002]} s={[l - 0.06, 0.008, 0.004]} m={mat(C.madeiraEscura)} sombra={false} />
      {/* abajur */}
      <Cil c={[0, a + 0.12, 0]} d={0.04} a={0.24} m={mat(C.preto)} />
      <Cil c={[0, a + 0.3, 0]} d={0.2} a={0.16} m={mat("#F4EBDB", { rough: 1, emissive: "#F4E3C0" })} />
    </group>
  );
}

/** Guarda-roupa de portas de correr. */
export function GuardaRoupa({ l, p, a }: Dim) {
  const folhas = l > 1.6 ? 3 : 2;
  const w = l / folhas;
  return (
    <group>
      <B c={[0, a / 2, -0.02]} s={[l, a, p - 0.04]} m={mat(C.branco, { rough: 0.55 })} />
      {Array.from({ length: folhas }, (_, i) => (
        <group key={i}>
          <B
            c={[-l / 2 + w * (i + 0.5), a / 2, p / 2 - (i % 2 ? 0.03 : 0.01)]}
            s={[w + 0.02, a - 0.06, 0.02]}
            m={mat(i % 2 ? C.madeira : "#E2DED6", { rough: 0.6 })}
          />
          <B
            c={[-l / 2 + w * (i + 0.5) + (i % 2 ? -1 : 1) * (w / 2 - 0.06), a * 0.5, p / 2 + 0.005]}
            s={[0.015, 0.4, 0.015]}
            m={mat(C.inox, { metal: 0.7, rough: 0.3 })}
            sombra={false}
          />
        </group>
      ))}
    </group>
  );
}

export function Escrivaninha({ l, p, a }: Dim) {
  const m = mat(C.madeira, { rough: 0.6 });
  return (
    <group>
      <B c={[0, a - 0.02, 0]} s={[l, 0.04, p]} m={m} />
      <B c={[-l / 2 + 0.02, (a - 0.04) / 2, 0]} s={[0.04, a - 0.04, p]} m={mat(C.branco)} />
      <B c={[l / 2 - 0.02, (a - 0.04) / 2, 0]} s={[0.04, a - 0.04, p]} m={mat(C.branco)} />
      <B c={[0, a + 0.12, -p / 2 + 0.12]} s={[0.5, 0.3, 0.02]} m={mat(C.preto, { rough: 0.3 })} />
    </group>
  );
}

export function Estante({ l, p, a }: Dim) {
  const prat = 5;
  return (
    <group>
      <B c={[0, a / 2, -p / 2 + 0.01]} s={[l, a, 0.02]} m={mat(C.madeira)} />
      <B c={[-l / 2 + 0.01, a / 2, 0]} s={[0.02, a, p]} m={mat(C.madeira)} />
      <B c={[l / 2 - 0.01, a / 2, 0]} s={[0.02, a, p]} m={mat(C.madeira)} />
      {Array.from({ length: prat }, (_, i) => (
        <group key={i}>
          <B c={[0, (a / (prat - 1)) * i * 0.98 + 0.01, 0]} s={[l, 0.02, p]} m={mat(C.madeira)} />
          {i < prat - 1 &&
            [0, 1, 2].map((k) => (
              <B
                key={k}
                c={[-l / 2 + 0.12 + k * 0.09, (a / (prat - 1)) * i + 0.13, 0]}
                s={[0.06, 0.22, p - 0.08]}
                m={mat(C.livros[(i + k) % 4])}
                sombra={false}
              />
            ))}
        </group>
      ))}
    </group>
  );
}

// ───────────────────────── Banheiro e serviço ─────────────────────────

export function Vaso({ l, p, a }: Dim) {
  const m = mat(C.louca, { rough: 0.25 });
  return (
    <group>
      <Cil c={[0, 0.2, 0.06]} d={l * 0.75} a={0.4} m={m} />
      <B c={[0, 0.38, 0.08]} s={[l, 0.04, p - 0.2]} m={m} />
      <B c={[0, (0.4 + a) / 2, -p / 2 + 0.1]} s={[l, a - 0.4, 0.18]} m={m} />
    </group>
  );
}

export function Lavatorio({ l, p, a }: Dim) {
  return (
    <group>
      <B c={[0, (a - 0.12) / 2 + 0.12, -0.01]} s={[l, a - 0.16, p - 0.02]} m={mat(C.madeira, { rough: 0.6 })} />
      <B c={[0, a - 0.02, 0]} s={[l, 0.04, p]} m={mat(C.marmore, { rough: 0.3 })} />
      <B c={[0, a + 0.05, 0.03]} s={[Math.min(0.42, l - 0.08), 0.1, p - 0.15]} m={mat(C.louca, { rough: 0.2 })} />
      <Torneira y={a} z={-p / 2 + 0.05} />
    </group>
  );
}

export function Espelho({ l, a }: Dim) {
  return (
    <group>
      <B c={[0, a / 2, 0]} s={[l, a, 0.02]} m={mat(C.espelho, { metal: 0.9, rough: 0.08 })} />
    </group>
  );
}

export function Box({ l, p, a }: Dim) {
  const vidro = mat(C.vidro, { opacity: 0.22, rough: 0.05, metal: 0.1 });
  const perfil = mat(C.inox, { metal: 0.8, rough: 0.3 });
  return (
    <group>
      <B c={[0, 0.025, 0]} s={[l, 0.05, p]} m={mat(C.marmore, { rough: 0.4 })} sombra={false} />
      {/* vidro na frente e no lado aberto (o outro lado e o fundo são paredes) */}
      <B c={[0, a / 2 + 0.03, p / 2 - 0.01]} s={[l, a - 0.06, 0.008]} m={vidro} sombra={false} />
      <B c={[l / 2 - 0.01, a / 2 + 0.03, 0]} s={[0.008, a - 0.06, p]} m={vidro} sombra={false} />
      <B c={[-l / 2 + 0.01, a / 2 + 0.03, 0]} s={[0.008, a - 0.06, p]} m={vidro} sombra={false} />
      <B c={[0, a, p / 2 - 0.01]} s={[l, 0.02, 0.02]} m={perfil} sombra={false} />
      {/* chuveiro */}
      <B c={[0, 1.95, -p / 2 + 0.12]} s={[0.025, 0.025, 0.22]} m={perfil} />
      <Cil c={[0, 1.92, -p / 2 + 0.24]} d={0.18} a={0.03} m={perfil} />
    </group>
  );
}

export function Maquina({ l, p, a }: Dim) {
  return (
    <group>
      <B c={[0, a / 2, 0]} s={[l, a, p]} m={mat(C.branco, { rough: 0.35 })} />
      <Cil c={[0, a * 0.45, p / 2 + 0.01]} d={0.4} a={0.03} m={mat("#2F3A40", { rough: 0.15, metal: 0.3 })} deitado="z" />
      <B c={[0, a - 0.06, p / 2 + 0.003]} s={[l - 0.06, 0.08, 0.006]} m={mat("#D8D4CC")} sombra={false} />
    </group>
  );
}

export function Tanque({ l, p, a }: Dim) {
  const m = mat(C.louca, { rough: 0.35 });
  return (
    <group>
      <B c={[0, a - 0.14, 0]} s={[l, 0.28, p]} m={m} />
      <B c={[0, a - 0.1, 0.03]} s={[l - 0.1, 0.2, p - 0.16]} m={mat("#DAD8D2", { rough: 0.4 })} sombra={false} />
      <Cil c={[0, (a - 0.28) / 2, -p / 2 + 0.12]} d={0.12} a={a - 0.28} m={m} />
      <Torneira y={a} z={-p / 2 + 0.04} />
    </group>
  );
}

export function Armario({ l, p, a }: Dim) {
  return (
    <group>
      <B c={[0, a / 2, 0]} s={[l, a, p]} m={mat(C.branco, { rough: 0.5 })} />
      <B c={[0, a / 2, p / 2 + 0.002]} s={[0.008, a - 0.06, 0.004]} m={mat("#B9B5AE")} sombra={false} />
      <B c={[-0.05, a * 0.5, p / 2 + 0.012]} s={[0.012, 0.2, 0.012]} m={mat(C.inox, { metal: 0.7 })} sombra={false} />
      <B c={[0.05, a * 0.5, p / 2 + 0.012]} s={[0.012, 0.2, 0.012]} m={mat(C.inox, { metal: 0.7 })} sombra={false} />
    </group>
  );
}

// ───────────────────────── Garagem e varanda ─────────────────────────

/** Carro simples nas medidas informadas no briefing (largura × comprimento). Frente para +Z. */
export function Carro({ l, p, a }: Dim) {
  const lat = mat(C.carro, { rough: 0.3, metal: 0.55 });
  const vidro = mat("#34444C", { rough: 0.15, metal: 0.2 });
  const roda = 0.64;
  return (
    <group>
      <B c={[0, 0.48, 0]} s={[l, 0.5, p]} m={lat} />
      {/* cabine (vidros) e teto separados por 1 cm para não disputarem o mesmo plano */}
      <B c={[0, (0.73 + a - 0.05) / 2, -p * 0.06]} s={[l - 0.14, a - 0.05 - 0.73, p * 0.48]} m={vidro} />
      <B c={[0, a - 0.02, -p * 0.07]} s={[l - 0.16, 0.04, p * 0.44]} m={lat} />
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz]) => (
        <Cil key={`${sx}${sz}`} c={[sx * (l / 2 - 0.12), roda / 2, sz * (p / 2 - 0.78)]} d={roda} a={0.22} m={mat(C.pneu, { rough: 0.9 })} deitado="x" />
      ))}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <B c={[sx * (l / 2 - 0.2), 0.6, p / 2 + 0.002]} s={[0.26, 0.08, 0.01]} m={mat(C.farol, { emissive: "#FFF4C8" })} sombra={false} />
          <B c={[sx * (l / 2 - 0.18), 0.62, -p / 2 - 0.002]} s={[0.24, 0.07, 0.01]} m={mat(C.lanterna, { emissive: "#B23A2E" })} sombra={false} />
        </group>
      ))}
    </group>
  );
}

export function SofaExterno(d: Dim) {
  return <Sofa {...d} cor={C.externo} almofada="#E7DECF" />;
}

// ───────────────────────── Montagem ─────────────────────────

const COMPONENTES: Record<TipoMovel, (d: Dim) => React.ReactElement> = {
  sofa: Sofa,
  poltrona: Poltrona,
  mesaCentro: MesaCentro,
  rack: Rack,
  tv: TV,
  mesa: Mesa,
  mesaRedonda: MesaRedonda,
  cadeira: Cadeira,
  bancada: Bancada,
  armarioSuperior: ArmarioSuperior,
  pia: Pia,
  fogao: Fogao,
  geladeira: Geladeira,
  ilha: Ilha,
  cama: Cama,
  criadoMudo: CriadoMudo,
  guardaRoupa: GuardaRoupa,
  escrivaninha: Escrivaninha,
  cadeiraEscritorio: CadeiraEscritorio,
  estante: Estante,
  vaso: Vaso,
  lavatorio: Lavatorio,
  espelho: Espelho,
  box: Box,
  maquina: Maquina,
  tanque: Tanque,
  armario: Armario,
  carro: Carro,
  sofaExterno: SofaExterno,
  // itens novos do catálogo: o desenho padrão fica em Modelos.tsx
  tapete: MODELOS["tapete:padrao"],
  planta: MODELOS["planta:padrao"],
  luminaria: MODELOS["luminaria:padrao"],
  quadro: MODELOS["quadro:padrao"],
  aparador: MODELOS["aparador:padrao"],
  banqueta: MODELOS["banqueta:padrao"],
  puff: MODELOS["puff:padrao"],
  comoda: MODELOS["comoda:padrao"],
  coifa: MODELOS["coifa:padrao"],
  microondas: MODELOS["microondas:padrao"],
  toalheiro: MODELOS["toalheiro:padrao"],
  cesto: MODELOS["cesto:padrao"],
  espreguicadeira: MODELOS["espreguicadeira:padrao"],
  churrasqueira: MODELOS["churrasqueira:padrao"],
};

/** Posiciona um móvel: centro na planta, altura de base e rotação (a frente aponta para `rotacao`). */
export function Movel({ m }: { m: Movel3D }) {
  // modelo do catálogo (Modelos.tsx) ou, se for o padrão de um tipo antigo, o desenho original daqui
  const Comp = MODELOS[m.modelo] ?? COMPONENTES[m.tipo];
  return (
    <group position={P(m.x, m.y, m.elevacao)} rotation-y={m.rotacao + Math.PI / 2}>
      <Comp l={m.largura} p={m.profundidade} a={m.altura} variante={m.variante} base={m.base} />
    </group>
  );
}

/** Toda a mobília automática da casa. */
export const Mobilia = memo(function Mobilia({ moveis }: { moveis: Movel3D[] }) {
  return (
    <group>
      {moveis.map((m) => (
        <Movel key={m.id} m={m} />
      ))}
    </group>
  );
});
