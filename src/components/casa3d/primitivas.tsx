import * as THREE from "three";

/**
 * Peças básicas dos móveis 3D: geometrias unitárias compartilhadas (cada peça só muda a escala),
 * materiais em cache e as cores-base. Usadas por Moveis.tsx (modelos padrão) e Modelos.tsx (variações).
 */

/** Cores e acabamentos dos móveis. */
export const CORES_MOVEIS = {
  tecido: "#7D8C87",
  almofada: "#97A5A0",
  poltrona: "#B57A52",
  madeira: "#C4A47E",
  madeiraEscura: "#6E5240",
  branco: "#EEEBE5",
  preto: "#232726",
  inox: "#B8BDBC",
  bancada: "#3B3F3E",
  marmore: "#E7E3DB",
  louca: "#F8F8F6",
  vidro: "#CFE3EA",
  espelho: "#DCE6EA",
  lencol: "#F2EFE9",
  manta: "#A9B7A5",
  carro: "#AEB7BB",
  farol: "#F6F1D5",
  lanterna: "#B23A2E",
  pneu: "#1C1F1E",
  externo: "#8E7A62",
  livros: ["#C9573F", "#46656B", "#DDD0BC", "#A9B7A5"],
};
export const C = CORES_MOVEIS;

// geometrias unitárias compartilhadas (cada peça só muda a escala)
export const CAIXA = new THREE.BoxGeometry(1, 1, 1);
export const CILINDRO = new THREE.CylinderGeometry(0.5, 0.5, 1, 20);

const materiais = new Map<string, THREE.Material>();
export function mat(cor: string, o: { rough?: number; metal?: number; opacity?: number; emissive?: string } = {}) {
  const k = `${cor}|${o.rough ?? 0.8}|${o.metal ?? 0}|${o.opacity ?? 1}|${o.emissive ?? ""}`;
  let m = materiais.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color: cor,
      roughness: o.rough ?? 0.8,
      // a cena não tem mapa de reflexo: metal acima de ~0,3 fica escuro, então o "brilho" vem da cor e da rugosidade
      metalness: Math.min(o.metal ?? 0, 0.3),
      transparent: o.opacity !== undefined && o.opacity < 1,
      opacity: o.opacity ?? 1,
      depthWrite: !(o.opacity !== undefined && o.opacity < 1),
      emissive: o.emissive ?? "#000000",
      emissiveIntensity: o.emissive ? 0.6 : 0,
    });
    materiais.set(k, m);
  }
  return m;
}

export type V3 = [number, number, number];
/** Caixa: centro (x, y, z) e tamanho (l, a, p). */
export function B({ c, s, m, sombra = true }: { c: V3; s: V3; m: THREE.Material; sombra?: boolean }) {
  return <mesh geometry={CAIXA} material={m} position={c} scale={s} castShadow={sombra} receiveShadow />;
}
/** Cilindro em pé: centro, diâmetro, altura; `deitado` gira para o eixo X ou Z. */
export function Cil({ c, d, a, m, deitado }: { c: V3; d: number; a: number; m: THREE.Material; deitado?: "x" | "z" }) {
  const rot: V3 = deitado === "x" ? [0, 0, Math.PI / 2] : deitado === "z" ? [Math.PI / 2, 0, 0] : [0, 0, 0];
  return <mesh geometry={CILINDRO} material={m} position={c} rotation={rot} scale={[d, a, d]} castShadow receiveShadow />;
}

export interface Dim {
  l: number;
  p: number;
  a: number;
  variante?: string;
  /** acabamento dos armários (pia, fogão e ilha seguem a bancada do cômodo) */
  base?: string;
}

const ESFERA = new THREE.SphereGeometry(0.5, 16, 12);
const CONE = new THREE.ConeGeometry(0.5, 1, 16);

/** Esfera (ou elipsoide): centro e tamanho nos três eixos. */
export function Esf({ c, s, m }: { c: V3; s: V3; m: THREE.Material }) {
  return <mesh geometry={ESFERA} material={m} position={c} scale={s} castShadow receiveShadow />;
}

/** Cone em pé (ponta para cima, ou para baixo com `invertido`). */
export function Cone({ c, d, a, m, invertido }: { c: V3; d: number; a: number; m: THREE.Material; invertido?: boolean }) {
  return <mesh geometry={CONE} material={m} position={c} rotation={[invertido ? Math.PI : 0, 0, 0]} scale={[d, a, d]} castShadow receiveShadow />;
}

/** Quatro pés nos cantos de um retângulo l × p, recuados `r`, com seção `s` e altura `a`. */
export function Pes({
  l,
  p,
  a,
  r = 0.06,
  s = 0.04,
  m,
  redondo,
}: {
  l: number;
  p: number;
  a: number;
  r?: number;
  s?: number;
  m: THREE.Material;
  redondo?: boolean;
}) {
  return (
    <>
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz]) =>
        redondo ? (
          <Cil key={`${sx}${sz}`} c={[sx * (l / 2 - r), a / 2, sz * (p / 2 - r)]} d={s} a={a} m={m} />
        ) : (
          <B key={`${sx}${sz}`} c={[sx * (l / 2 - r), a / 2, sz * (p / 2 - r)]} s={[s, a, s]} m={m} />
        ),
      )}
    </>
  );
}
