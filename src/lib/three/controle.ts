/**
 * Controle da câmera em primeira pessoa (modo "Andar") — todos os números ficam aqui.
 * Funções puras: recebem o olhar atual e devolvem o novo, para poderem ser testadas sem o Three.js.
 */

/** Configuração central. Para deixar o mouse mais rápido ou mais lento para todo mundo, mude mouseSensitivity. */
export const CONTROLE = {
  /** rad por pixel com o cursor travado (antes 0,0022) */
  mouseSensitivity: 0.0025,
  /** multiplicador ao olhar segurando o botão esquerdo (0,0025 × 1,5 = 0,00375 rad/px; antes 0,0035) */
  arrastar: 1.5,
  /** rad por pixel arrastando o dedo no celular (antes 0,0055) */
  toqueSensitivity: 0.006,
  /** quanto dá para olhar para cima/baixo (rad); 1,45 ≈ 83°, nunca vira de cabeça para baixo */
  limiteVertical: 1.45,
  /** ignora saltos bruscos do mouse (alguns navegadores mandam picos ao travar o cursor) */
  maxDeltaPx: 120,
  /** força da suavização: quanto maior, mais rápido a câmera alcança o mouse (1/s) */
  suavizacao: { desligada: 0, leve: 30, media: 15 } as const,
};

export type Suavizacao = keyof typeof CONTROLE.suavizacao;

/** Preferências que a pessoa ajusta no painel "Controles" (ficam salvas no navegador). */
export interface PrefsControle {
  /** multiplicador da sensibilidade (1 = padrão) */
  sensibilidade: number;
  inverterY: boolean;
  suavizacao: Suavizacao;
}

export const PREFS_PADRAO: PrefsControle = { sensibilidade: 1, inverterY: false, suavizacao: "leve" };
export const SENS_MIN = 0.3;
export const SENS_MAX = 3;

export interface Olhar {
  yaw: number;
  pitch: number;
}

export type Fonte = "travado" | "arrasto" | "toque";

/** Radianos por pixel para cada forma de olhar, já com a preferência da pessoa. */
export function radPorPixel(fonte: Fonte, prefs: PrefsControle = PREFS_PADRAO): number {
  const base = fonte === "toque" ? CONTROLE.toqueSensitivity : fonte === "arrasto" ? CONTROLE.mouseSensitivity * CONTROLE.arrastar : CONTROLE.mouseSensitivity;
  const s = Math.min(SENS_MAX, Math.max(SENS_MIN, prefs.sensibilidade));
  return base * s;
}

const limitar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Aplica um movimento do mouse/dedo (em pixels) ao olhar-alvo. */
export function girar(o: Olhar, dxPx: number, dyPx: number, fonte: Fonte, prefs: PrefsControle = PREFS_PADRAO): Olhar {
  const k = radPorPixel(fonte, prefs);
  const dx = limitar(dxPx, -CONTROLE.maxDeltaPx, CONTROLE.maxDeltaPx);
  const dy = limitar(dyPx, -CONTROLE.maxDeltaPx, CONTROLE.maxDeltaPx) * (prefs.inverterY ? -1 : 1);
  return { yaw: o.yaw - dx * k, pitch: limitar(o.pitch - dy * k, -CONTROLE.limiteVertical, CONTROLE.limiteVertical) };
}

/**
 * Aproxima a câmera do olhar-alvo de forma exponencial (independe da taxa de quadros).
 * Na suavização "leve" a câmera percorre ~63% do caminho em 33 ms e ~95% em 100 ms: suave, sem atraso perceptível.
 */
export function suavizar(atual: Olhar, alvo: Olhar, dt: number, prefs: PrefsControle = PREFS_PADRAO): Olhar {
  const lambda = CONTROLE.suavizacao[prefs.suavizacao] ?? 0;
  if (!lambda) return { ...alvo };
  const k = 1 - Math.exp(-lambda * Math.max(0, dt));
  return { yaw: atual.yaw + (alvo.yaw - atual.yaw) * k, pitch: atual.pitch + (alvo.pitch - atual.pitch) * k };
}

const CHAVE = "casaai-controles";

export function carregarPrefs(): PrefsControle {
  try {
    const p = JSON.parse(localStorage.getItem(CHAVE) ?? "null") as Partial<PrefsControle> | null;
    if (!p) return { ...PREFS_PADRAO };
    return {
      sensibilidade: typeof p.sensibilidade === "number" ? limitar(p.sensibilidade, SENS_MIN, SENS_MAX) : PREFS_PADRAO.sensibilidade,
      inverterY: !!p.inverterY,
      suavizacao: p.suavizacao && p.suavizacao in CONTROLE.suavizacao ? p.suavizacao : PREFS_PADRAO.suavizacao,
    };
  } catch {
    return { ...PREFS_PADRAO };
  }
}

export function salvarPrefs(p: PrefsControle) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(p));
  } catch {
    // sem armazenamento (aba privada): vale só nesta visita
  }
}
