import { useFrame, useThree } from "@react-three/fiber";
import type { MutableRefObject } from "react";
import * as THREE from "three";
import type { Model3D } from "../../lib/three/model";
import { P, type Modo } from "./Cena";

/**
 * Rótulos sobre o 3D (rua, frente, norte, medidas) feitos em HTML comum, por cima do canvas.
 * Um projetor dentro da cena calcula, a cada quadro, onde cada ponto 3D cai na tela e move o rótulo.
 */
export interface Rotulo {
  id: string;
  pos: THREE.Vector3;
  texto: string;
  detalhe?: string;
  estilo?: "fraco" | "medida" | "cota";
}

const f = (v: number) => v.toFixed(2).replace(".", ",");

export function rotulosDaCena(model: Model3D, medidas: boolean, modo: Modo): Rotulo[] {
  const { lote, casa, norte } = model;
  const out: Rotulo[] = [];
  if (modo !== "andar") {
    out.push({ id: "rua", pos: P(lote.largura / 2, -5.3, 0.05), texto: "RUA" });
    out.push({ id: "frente", pos: P(casa.x + casa.w / 2, -0.25, 0.05), texto: "frente do terreno", estilo: "fraco" });
    if (norte) out.push({ id: "norte", pos: P(lote.largura + 1.6 + norte.x * 1.4, 1.6 + norte.y * 1.4, 0.05), texto: "N" });
  }
  if (medidas && modo !== "andar") {
    for (const r of model.comodos)
      out.push({
        id: `m-${r.id}`,
        pos: P(r.x + r.largura / 2, r.y + r.profundidade / 2, 0.1),
        texto: r.nome,
        detalhe: `${f(r.largura)} × ${f(r.profundidade)} m`,
        estilo: "medida",
      });
    out.push({ id: "cota-w", pos: P(casa.x + casa.w / 2, casa.y - 0.6, 0.15), texto: `${f(casa.w)} m`, estilo: "cota" });
    out.push({ id: "cota-h", pos: P(casa.x - 0.6, casa.y + casa.h / 2, 0.15), texto: `${f(casa.h)} m`, estilo: "cota" });
  }
  return out;
}

/** Fica dentro do <Canvas>: posiciona os elementos de `els` sobre os pontos 3D. */
export function Projetor({ rotulos, els }: { rotulos: Rotulo[]; els: MutableRefObject<Record<string, HTMLElement | null>> }) {
  const { camera, size } = useThree();
  const v = new THREE.Vector3();
  useFrame(() => {
    for (const r of rotulos) {
      const el = els.current[r.id];
      if (!el) continue;
      v.copy(r.pos).project(camera);
      const visivel = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
      el.style.opacity = visivel ? "1" : "0";
      if (!visivel) continue;
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
    }
  });
  return null;
}

/** Fica fora do <Canvas>: os rótulos em HTML (começam escondidos até o projetor posicionar). */
export function CamadaDeRotulos({ rotulos, els }: { rotulos: Rotulo[]; els: MutableRefObject<Record<string, HTMLElement | null>> }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {rotulos.map((r) => (
        <span
          key={r.id}
          ref={(el) => {
            els.current[r.id] = el;
          }}
          className={`rotulo-3d absolute left-0 top-0 ${r.estilo ? `rotulo-3d--${r.estilo}` : ""}`}
          style={{ opacity: 0, transition: "opacity 0.3s" }}
        >
          {r.texto}
          {r.detalhe && (
            <>
              <br />
              <b>{r.detalhe}</b>
            </>
          )}
        </span>
      ))}
    </div>
  );
}
