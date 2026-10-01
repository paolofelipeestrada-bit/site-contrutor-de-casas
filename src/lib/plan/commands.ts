import { ROOM_INFO } from "../catalog";
import { normalize } from "../brief/localParser";
import type { PlacedRoom, RoomType } from "../types";

/** Comandos em linguagem natural do modo editar ("aumentar a suíte em 2 m²"). */
export type Command =
  | { kind: "resize"; roomId: string; delta: number }
  | { kind: "set"; roomId: string; area: number }
  | { kind: "add"; tipo: RoomType }
  | { kind: "remove"; tipo: RoomType }
  | { kind: "mirror" }
  | { kind: "next" }
  | { kind: "unknown"; reason: string };

const TIPO_WORDS: [RegExp, RoomType][] = [
  [/banho (?:da )?suite|banheiro (?:da )?suite/, "banheiro_suite"],
  [/suite/, "suite"],
  [/quarto|dormitorio/, "quarto"],
  [/banheiro|banho|wc/, "banheiro"],
  [/lavabo/, "lavabo"],
  [/sala/, "sala"],
  [/cozinha/, "cozinha"],
  [/jantar/, "jantar"],
  [/escritorio|home ?office/, "escritorio"],
  [/lavanderia|area de servico/, "lavanderia"],
  [/garagem/, "garagem"],
  [/varanda/, "varanda"],
  [/gourmet|churrasqueira/, "area_gourmet"],
  [/closet/, "closet"],
  [/corredor|circulacao/, "circulacao"],
];

function tipoFrom(text: string): RoomType | null {
  for (const [re, tipo] of TIPO_WORDS) if (re.test(text)) return tipo;
  return null;
}

/** Encontra o cômodo citado: primeiro pelo nome exato ("quarto 2"), depois pelo tipo. */
export function findRoom(text: string, rooms: PlacedRoom[]): PlacedRoom | null {
  const t = normalize(text);
  const byName = rooms
    .filter((r) => t.includes(normalize(r.nome)))
    .sort((a, b) => b.nome.length - a.nome.length)[0];
  if (byName) return byName;
  const tipo = tipoFrom(t);
  if (!tipo) return null;
  const num = t.match(new RegExp(`${normalize(ROOM_INFO[tipo].label)}\\s*(\\d)`))?.[1];
  const ofTipo = rooms.filter((r) => r.tipo === tipo);
  if (num) return ofTipo[Number(num) - 1] ?? ofTipo[0] ?? null;
  return ofTipo[0] ?? null;
}

const NUM = "(\\d+(?:[.,]\\d+)?)";

export function parseCommand(input: string, rooms: PlacedRoom[]): Command {
  const t = normalize(input).replace(/m²/g, "m2");
  if (/espelh|inverter|trocar (?:o )?lado/.test(t)) return { kind: "mirror" };
  if (/outra (?:opcao|versao|planta)|proxima|variacao/.test(t)) return { kind: "next" };

  const grow = t.match(new RegExp(`(aument|ampli|cresc|expand|diminu|reduz|encolh)\\w*\\s+(.+?)\\s+(?:em\\s+)?${NUM}\\s*(?:m2|m 2|metros)`));
  if (grow) {
    const room = findRoom(grow[2], rooms);
    if (!room) return { kind: "unknown", reason: `Não achei o cômodo "${grow[2]}".` };
    const sign = /^(aument|ampli|cresc|expand)/.test(grow[1]) ? 1 : -1;
    return { kind: "resize", roomId: room.id, delta: sign * Number(grow[3].replace(",", ".")) };
  }
  const set = t.match(new RegExp(`(?:deixar|definir|colocar|mudar|quero)\\s+(.+?)\\s+(?:com|para|em)\\s+${NUM}\\s*(?:m2|m 2|metros)`));
  if (set) {
    const room = findRoom(set[1], rooms);
    if (!room) return { kind: "unknown", reason: `Não achei o cômodo "${set[1]}".` };
    return { kind: "set", roomId: room.id, area: Number(set[2].replace(",", ".")) };
  }
  const add = t.match(/(?:adicionar|incluir|acrescentar|colocar|quero|criar)\s+(?:mais\s+)?(?:um|uma|o|a)?\s*(.+)/);
  if (add) {
    const tipo = tipoFrom(add[1]);
    if (tipo && tipo !== "circulacao" && tipo !== "banheiro_suite") return { kind: "add", tipo };
  }
  const rem = t.match(/(?:remover|tirar|excluir|apagar|sem)\s+(?:o|a|um|uma)?\s*(.+)/);
  if (rem) {
    const tipo = tipoFrom(rem[1]);
    if (tipo && tipo !== "circulacao") return { kind: "remove", tipo };
  }
  return {
    kind: "unknown",
    reason: 'Tente: "aumentar a suíte em 2 m²", "diminuir cozinha 1 m²", "adicionar escritório", "remover lavabo" ou "espelhar".',
  };
}
