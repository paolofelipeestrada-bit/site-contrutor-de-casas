import type { Brief, Regras, RoomType, Style, VarandaPosicao } from "../types";
import type { FormValues } from "./form";

/**
 * Interpretador local (sem IA) para português.
 * Serve como fallback quando a API não está disponível e como "rede de segurança":
 * a saída da IA é sempre mesclada e validada contra estas mesmas regras.
 */

const NUM_WORDS: Record<string, number> = {
  um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8,
};

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/²/g, "2")
    .replace(/\s+/g, " ");
}

function toNum(raw: string): number {
  if (raw in NUM_WORDS) return NUM_WORDS[raw];
  return Number(raw.replace(",", "."));
}

const N = "(\\d+(?:[.,]\\d+)?|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito)";

function count(t: string, nouns: string): number | null {
  const m = t.match(new RegExp(`${N}\\s+(?:${nouns})\\b`));
  return m ? toNum(m[1]) : null;
}

function has(t: string, re: RegExp): boolean {
  return re.test(t);
}

export interface ParsedText {
  largura?: number;
  profundidade?: number;
  area?: number;
  quartos?: number;
  suites?: number;
  suitesIncluidas?: boolean;
  banheiros?: number;
  vagas?: number;
  estilo?: Style;
  varandaPosicao?: VarandaPosicao;
  extras: Partial<Record<keyof FormValues["extras"], boolean>>;
  integrada?: boolean;
  reservados?: boolean;
  luzNatural?: boolean;
  carro?: { comprimento: number; largura: number };
  areasExplicitas: Partial<Record<RoomType, number>>;
}

export function parseText(raw: string): ParsedText {
  const t = normalize(raw);
  const out: ParsedText = { extras: {}, areasExplicitas: {} };

  // Terreno: "12 x 25", "12×25 m", "12 por 25"
  const lot = t.match(/(\d+(?:[.,]\d+)?)\s*m?\s*(?:x|×|por)\s*(\d+(?:[.,]\d+)?)\s*m?\b/);
  if (lot) {
    out.largura = toNum(lot[1]);
    out.profundidade = toNum(lot[2]);
  }

  // Área da casa: "casa de 120 m2", "120 metros quadrados" — evita capturar "aumentar 2 m2"
  const areaRe = /(\d+(?:[.,]\d+)?)\s*(?:m2|m 2|metros quadrados|metros2)/g;
  let best: number | undefined;
  for (const m of t.matchAll(areaRe)) {
    const v = toNum(m[1]);
    if (v >= 30 && (best === undefined || v > best)) best = v;
  }
  if (best) out.area = best;

  const q = count(t, "quartos?|dormitorios?");
  if (q !== null) out.quartos = q;
  const s = count(t, "suites?");
  if (s !== null) out.suites = s;
  else if (has(t, /\bsuite\b/) && !has(t, /sem suite/)) out.suites = 1;
  // "3 quartos sendo 1 suíte" → suíte já está entre os quartos
  out.suitesIncluidas = has(t, /sendo (?:uma|1|duas|2|tres|3)? ?suites?/) || q === null;

  const b = count(t, "banheiros?|banhos?|wcs?");
  if (b !== null) out.banheiros = b;

  const v = count(t, "vagas?|carros?");
  if (v !== null) out.vagas = v;

  if (has(t, /sem garagem/)) out.extras.garagem = false;
  else if (has(t, /garagem|vaga|carro|carport/)) out.extras.garagem = true;
  if (has(t, /escritorio|home ?office|estudo/)) out.extras.escritorio = true;
  if (has(t, /sem varanda/)) out.extras.varanda = false;
  else if (has(t, /varanda|terraco|alpendre/)) out.extras.varanda = true;
  if (has(t, /lavanderia|area de servico/)) out.extras.lavanderia = true;
  if (has(t, /lavabo/)) out.extras.lavabo = true;
  if (has(t, /gourmet|churrasqueira/)) out.extras.areaGourmet = true;
  if (has(t, /closet/)) out.extras.closet = true;

  const varanda = t.match(/varanda[^.,;]{0,25}?(fundos|frente|frontal|lateral|lado)/);
  if (varanda) {
    out.varandaPosicao = varanda[1] === "fundos" ? "fundos" : varanda[1] === "lateral" || varanda[1] === "lado" ? "lateral" : "frente";
  }

  if (has(t, /minimalis/)) out.estilo = "minimalista";
  else if (has(t, /rustic|fazenda|madeira/)) out.estilo = "rustico";
  else if (has(t, /contemporane/)) out.estilo = "contemporaneo";
  else if (has(t, /classic|colonial/)) out.estilo = "classico";
  else if (has(t, /modern/)) out.estilo = "moderno";

  if (has(t, /cozinha (?:fechada|separada|isolada)/)) out.integrada = false;
  else if (has(t, /integrad|conceito aberto|open ?concept|cozinha americana|aberta/)) out.integrada = true;
  if (has(t, /reservad|privacidade|silencio|isolad/)) out.reservados = true;
  if (has(t, /luz natural|iluminad|claridade|ventilad|janelas grandes/)) out.luzNatural = true;

  // Carro: palavras-chave de porte, ou "carro de 4,7 m"
  if (has(t, /picape|pick ?up|caminhonete/)) out.carro = { comprimento: 5.4, largura: 1.95 };
  else if (has(t, /\bsuv\b/)) out.carro = { comprimento: 4.7, largura: 1.9 };
  const carLen = t.match(/carro[^.]{0,20}?(\d+(?:[.,]\d+)?)\s*m\b/);
  if (carLen) {
    const len = toNum(carLen[1]);
    if (len >= 3 && len <= 6.5) out.carro = { comprimento: len, largura: out.carro?.largura ?? 1.8 };
  }

  // Áreas explícitas: "suíte de 18 m2", "sala com 30 m2"
  const typed: [RoomType, string][] = [
    ["suite", "suite"], ["sala", "sala"], ["cozinha", "cozinha"], ["quarto", "quarto"],
    ["varanda", "varanda"], ["garagem", "garagem"], ["escritorio", "escritorio"], ["area_gourmet", "gourmet"],
  ];
  for (const [tipo, word] of typed) {
    const m = t.match(new RegExp(`${word}\\s+(?:de|com)\\s+(\\d+(?:[.,]\\d+)?)\\s*m2`));
    if (m) out.areasExplicitas[tipo] = toNum(m[1]);
  }

  return out;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Monta o Brief final combinando formulário + texto livre.
 * O texto tem prioridade quando cita algo explicitamente (o usuário escreveu de propósito).
 */
export function assembleBrief(form: FormValues, parsed: ParsedText): Brief {
  const obs: string[] = [];
  const pick = <T,>(fromText: T | undefined, fromForm: T, label: string): T => {
    if (fromText !== undefined && fromText !== fromForm) {
      obs.push(`Usei ${label} = ${String(fromText)} do texto (formulário dizia ${String(fromForm)}).`);
      return fromText;
    }
    return fromForm;
  };

  const largura = clamp(pick(parsed.largura, form.largura, "largura do terreno"), 5, 60);
  const profundidade = clamp(pick(parsed.profundidade, form.profundidade, "fundo do terreno"), 8, 100);
  const area = clamp(pick(parsed.area, form.area, "área"), 35, 600);

  let quartosTotal = pick(parsed.quartos, form.quartos, "quartos");
  let suites = parsed.suites ?? form.suites;
  if (parsed.suites !== undefined && parsed.quartos !== undefined && !parsed.suitesIncluidas) {
    quartosTotal += parsed.suites; // "3 quartos e 1 suíte"
  }
  suites = clamp(Math.min(suites, quartosTotal), 0, 4);
  const quartos = clamp(quartosTotal - suites, 0, 6);

  let banheiros = pick(parsed.banheiros, form.banheiros, "banheiros");
  const needed = suites + (quartos > 0 ? 1 : 0);
  if (banheiros < needed) {
    obs.push(`Ajustei para ${needed} banheiros: cada suíte precisa do seu e os quartos precisam de um banho social.`);
    banheiros = needed;
  }
  const banhosSociais = Math.max(banheiros - suites, 0);

  const extras = { ...form.extras, ...parsed.extras };
  const estilo = parsed.estilo ?? form.estilo;
  const varandaPosicao = parsed.varandaPosicao ?? form.varandaPosicao;

  const ambientes: Brief["ambientes"] = [];
  const integrada = parsed.integrada ?? true;
  const ex = parsed.areasExplicitas;
  ambientes.push({ tipo: "sala", area: ex.sala ?? null, nome: integrada ? "Sala de estar e jantar" : "Sala" });
  ambientes.push({ tipo: "cozinha", area: ex.cozinha ?? null });
  if (!integrada && area >= 110) ambientes.push({ tipo: "jantar", area: null });
  for (let i = 0; i < suites; i++) ambientes.push({ tipo: "suite", area: ex.suite ?? null, nome: suites > 1 ? `Suíte ${i + 1}` : "Suíte" });
  for (let i = 0; i < quartos; i++) ambientes.push({ tipo: "quarto", area: ex.quarto ?? null, nome: `Quarto ${i + 1}` });
  for (let i = 0; i < banhosSociais; i++) ambientes.push({ tipo: "banheiro", area: null, nome: banhosSociais > 1 ? `Banho ${i + 1}` : "Banho social" });
  if (extras.lavabo) ambientes.push({ tipo: "lavabo", area: null });
  if (extras.closet && suites > 0) ambientes.push({ tipo: "closet", area: null });
  if (extras.escritorio) ambientes.push({ tipo: "escritorio", area: ex.escritorio ?? null });
  if (extras.lavanderia) ambientes.push({ tipo: "lavanderia", area: null });
  if (extras.garagem) ambientes.push({ tipo: "garagem", area: ex.garagem ?? null });
  if (extras.varanda) ambientes.push({ tipo: "varanda", area: ex.varanda ?? null });
  if (extras.areaGourmet) ambientes.push({ tipo: "area_gourmet", area: ex.area_gourmet ?? null });

  const carro = extras.garagem
    ? {
        comprimento: clamp(parsed.carro?.comprimento ?? form.carro.comprimento, 3, 6.5),
        largura: clamp(parsed.carro?.largura ?? form.carro.largura, 1.4, 2.4),
        vagas: clamp(parsed.vagas ?? form.carro.vagas, 1, 3),
      }
    : null;

  return {
    terreno: { largura, profundidade },
    casa: { area },
    estilo,
    ambientes,
    preferencias: {
      salaCozinhaIntegradas: integrada,
      varandaPosicao,
      quartosReservados: parsed.reservados ?? true,
      luzNatural: parsed.luzNatural ?? true,
    },
    carro,
    observacoes: obs,
    regras: regrasDoForm(form),
  };
}

/** Opções avançadas do formulário → regras do algoritmo (campos vazios ficam automáticos). */
export function regrasDoForm(form: FormValues): Regras {
  const a = form.avancado;
  if (!a) return {};
  const num = (v: number | null) => (v === null || !Number.isFinite(v) ? undefined : clamp(v, 0, 15));
  return {
    recuos: { frente: num(a.recuoFrente), fundos: num(a.recuoFundos), laterais: num(a.recuoLaterais) },
    norte: a.norte ?? undefined,
    moradores: clamp(Math.round(a.moradores || 4), 1, 20),
    acessivel: a.acessivel,
  };
}

export function interpretLocally(form: FormValues, text = form.descricao): Brief {
  return assembleBrief(form, parseText(text));
}
