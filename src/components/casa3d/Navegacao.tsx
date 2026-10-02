import { CameraControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { comodoEm, type Model3D, type Room3D } from "../../lib/three/model";
import type { Jogador, Modo } from "./Cena";

/** Ajustes da navegação. */
export const ANDAR = {
  velocidade: 1.5, // m/s caminhando
  correndo: 3.2, // m/s com Shift
  raio: 0.22, // "largura" da pessoa para não atravessar paredes
  sensibilidadeMouse: 0.0022,
  sensibilidadeToque: 0.0055,
  limiteOlhar: 1.35, // rad para cima/baixo
};

/** Joystick virtual (celular): x = lado, y = frente, de -1 a 1. */
export interface Eixos {
  x: number;
  y: number;
}

/** Câmera em órbita para "Ver exterior" e "Por dentro" (sem cobertura). */
export function Orbita({ model, modo }: { model: Model3D; modo: Exclude<Modo, "andar"> }) {
  const ref = useRef<CameraControls>(null);
  const { casa } = model;
  const cx = casa.x + casa.w / 2;
  const cy = casa.y + casa.h / 2;
  const S = Math.max(casa.w, casa.h) + 4;

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    if (modo === "exterior") c.setLookAt(cx - S * 0.55, S * 0.38, -casa.y + S * 0.75, cx, 1.2, -cy, true);
    else c.setLookAt(cx + S * 0.1, S * 1.15, -casa.y + S * 0.55, cx, 0, -cy, true);
  }, [modo, cx, cy, S, casa.y]);

  return (
    <CameraControls ref={ref} makeDefault minDistance={2} maxDistance={S * 3} maxPolarAngle={Math.PI / 2 - 0.04} smoothTime={0.6} draggingSmoothTime={0.15} />
  );
}

/**
 * Modo andar: primeira pessoa na altura dos olhos.
 * Computador: WASD/setas para andar, Shift corre, mouse para olhar (clique para travar o cursor; Esc solta).
 * Celular: joystick para andar, arrastar o dedo para olhar.
 */
export function Andar({
  model,
  jogador,
  joystick,
  onComodo,
}: {
  model: Model3D;
  jogador: MutableRefObject<Jogador>;
  joystick: MutableRefObject<Eixos>;
  onComodo: (r: Room3D | null) => void;
}) {
  const { camera, gl } = useThree();
  const teclas = useRef(new Set<string>());
  const olhar = useRef({ yaw: 0, pitch: 0 });
  const pos = useRef({ x: model.inicio.x, y: model.inicio.y });
  const chegada = useRef({ t: 0, de: camera.position.clone(), deQ: camera.quaternion.clone() });
  const ultimoComodo = useRef<string | null>(null);
  const olhos = model.config.olhos;

  // começa na calçada, olhando para a casa (direção +y da planta = -z no 3D)
  useEffect(() => {
    pos.current = { x: model.inicio.x, y: model.inicio.y };
    olhar.current = { yaw: Math.atan2(-model.inicio.olhando.x, model.inicio.olhando.y), pitch: 0 };
    chegada.current = { t: 0, de: camera.position.clone(), deQ: camera.quaternion.clone() };
    camera.rotation.order = "YXZ";
    jogador.current = { ...pos.current, ativo: true };
    return () => {
      jogador.current = { ...jogador.current, ativo: false };
      ultimoComodo.current = null;
      onComodo(null);
      if (document.pointerLockElement) document.exitPointerLock();
    };
  }, [model, camera, jogador, onComodo]);

  // teclado
  useEffect(() => {
    const digitando = (e: KeyboardEvent) => /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName ?? "");
    const down = (e: KeyboardEvent) => {
      if (digitando(e)) return;
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"].includes(e.code)) {
        teclas.current.add(e.code);
        if (e.code.startsWith("Arrow")) e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => teclas.current.delete(e.code);
    const limpar = () => teclas.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", limpar);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", limpar);
    };
  }, []);

  // olhar: cursor travado (computador) ou arrastar (mouse e dedo)
  useEffect(() => {
    const el = gl.domElement;
    let arrasto: { id: number; x: number; y: number } | null = null;
    const girar = (dx: number, dy: number, k: number) => {
      olhar.current.yaw -= dx * k;
      olhar.current.pitch = THREE.MathUtils.clamp(olhar.current.pitch - dy * k, -ANDAR.limiteOlhar, ANDAR.limiteOlhar);
    };
    const down = (e: PointerEvent) => {
      if (document.pointerLockElement === el) return;
      arrasto = { id: e.pointerId, x: e.clientX, y: e.clientY };
    };
    const move = (e: PointerEvent) => {
      if (document.pointerLockElement === el) return girar(e.movementX, e.movementY, ANDAR.sensibilidadeMouse);
      if (!arrasto || arrasto.id !== e.pointerId) return;
      const k = e.pointerType === "touch" ? ANDAR.sensibilidadeToque : ANDAR.sensibilidadeMouse * 1.6;
      girar(e.clientX - arrasto.x, e.clientY - arrasto.y, k);
      arrasto = { id: e.pointerId, x: e.clientX, y: e.clientY };
    };
    const up = (e: PointerEvent) => {
      if (arrasto?.id === e.pointerId) arrasto = null;
    };
    // clique simples (sem arrastar) com mouse trava o cursor, como num tour virtual
    let inicio: { x: number; y: number } | null = null;
    const clickDown = (e: PointerEvent) => (inicio = e.pointerType === "mouse" ? { x: e.clientX, y: e.clientY } : null);
    const clickUp = (e: PointerEvent) => {
      if (inicio && Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) < 4 && el.requestPointerLock) {
        try {
          const r = el.requestPointerLock() as unknown as Promise<void> | undefined;
          r?.catch?.(() => {});
        } catch {
          // navegador sem trava de cursor: arrastar continua funcionando
        }
      }
      inicio = null;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerdown", clickDown);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    el.addEventListener("pointerup", clickUp);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerdown", clickDown);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("pointerup", clickUp);
      window.removeEventListener("pointercancel", up);
    };
  }, [gl]);

  const bloqueado = (x: number, y: number) => {
    const r = ANDAR.raio;
    return model.obstaculos.some((o) => x > o.x - r && x < o.x + o.w + r && y > o.y - r && y < o.y + o.h + r);
  };

  useFrame((_, dtBruto) => {
    const dt = Math.min(dtBruto, 0.1);
    const { yaw, pitch } = olhar.current;

    // movimento (na planta): frente = (-sin yaw, cos yaw), direita = (cos yaw, sin yaw)
    const k = teclas.current;
    let f = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0) + joystick.current.y;
    let d = (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0) - (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0) + joystick.current.x;
    const n = Math.hypot(f, d);
    if (n > 1) {
      f /= n;
      d /= n;
    }
    const v = (k.has("ShiftLeft") || k.has("ShiftRight") ? ANDAR.correndo : ANDAR.velocidade) * dt;
    const dx = (-Math.sin(yaw) * f + Math.cos(yaw) * d) * v;
    const dy = (Math.cos(yaw) * f + Math.sin(yaw) * d) * v;
    const p = pos.current;
    const lim = { x0: -4, x1: model.lote.largura + 4, y0: -7, y1: model.lote.profundidade + 4 };
    // colisão separada por eixo: desliza encostado na parede em vez de travar
    if (dx && !bloqueado(p.x + dx, p.y)) p.x = THREE.MathUtils.clamp(p.x + dx, lim.x0, lim.x1);
    if (dy && !bloqueado(p.x, p.y + dy)) p.y = THREE.MathUtils.clamp(p.y + dy, lim.y0, lim.y1);
    jogador.current = { x: p.x, y: p.y, ativo: true };

    // câmera: nos primeiros instantes desliza de onde estava até a calçada
    const alvo = new THREE.Vector3(p.x, olhos, -p.y);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, "YXZ"));
    const c = chegada.current;
    if (c.t < 1) {
      c.t = Math.min(1, c.t + dt / 1.4);
      const e = 1 - Math.pow(1 - c.t, 3);
      camera.position.lerpVectors(c.de, alvo, e);
      camera.quaternion.slerpQuaternions(c.deQ, q, e);
    } else {
      camera.position.copy(alvo);
      camera.quaternion.copy(q);
    }

    const r = comodoEm(model, p.x, p.y);
    if ((r?.id ?? null) !== ultimoComodo.current) {
      ultimoComodo.current = r?.id ?? null;
      onComodo(r);
    }
  });

  return null;
}
