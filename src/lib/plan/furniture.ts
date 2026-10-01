import type { Opening, PlacedRoom, Side } from "../types";

/** Peça de mobiliário em metros, nas coordenadas do terreno (y = 0 na rua). */
/** Peças que viram pontos de água, esgoto ou energia nas camadas técnicas. */
export type Fixture = "vaso" | "lavatorio" | "chuveiro" | "pia" | "tanque" | "maquina" | "fogao" | "geladeira";

export type Piece =
  | { kind: "rect"; x: number; y: number; w: number; h: number; r?: number; tone?: "soft" | "strong" | "accent"; fixture?: Fixture }
  | { kind: "circle"; cx: number; cy: number; r: number; tone?: "soft" | "strong" | "accent"; fixture?: Fixture }
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number };

/**
 * Sistema local de um cômodo: "u" corre ao longo de uma parede, "v" entra no cômodo a partir dela.
 * Isso permite escrever "cama encostada na parede livre" sem se preocupar com a rotação.
 */
function frame(room: PlacedRoom, side: Side) {
  const { x, y, w, h } = room;
  const len = side === "top" || side === "bottom" ? w : h;
  const depth = side === "top" || side === "bottom" ? h : w;
  const toXY = (u: number, v: number): [number, number] => {
    switch (side) {
      case "top":
        return [x + u, y + v];
      case "bottom":
        return [x + u, y + h - v];
      case "left":
        return [x + v, y + u];
      case "right":
        return [x + w - v, y + u];
    }
  };
  const rect = (u: number, v: number, du: number, dv: number, tone?: "soft" | "strong" | "accent", r = 0.05): Piece => {
    const [ax, ay] = toXY(u, v);
    const [bx, by] = toXY(u + du, v + dv);
    return { kind: "rect", x: Math.min(ax, bx), y: Math.min(ay, by), w: Math.abs(bx - ax), h: Math.abs(by - ay), tone, r };
  };
  const circle = (u: number, v: number, r: number, tone?: "soft" | "strong" | "accent"): Piece => {
    const [cx, cy] = toXY(u, v);
    return { kind: "circle", cx, cy, r, tone };
  };
  return { len, depth, rect, circle };
}

const EPS = 1e-3;

/** Paredes do cômodo ordenadas: sem porta primeiro, depois as mais longas. */
function freeSides(room: PlacedRoom, openings: Opening[]): Side[] {
  const sides: Side[] = ["top", "right", "bottom", "left"];
  const blocked = (s: Side) =>
    openings.some((o) => {
      if (o.kind === "window" || !o.rooms.includes(room.id)) return false;
      if (s === "top") return Math.abs(o.y1 - room.y) < EPS && Math.abs(o.y2 - room.y) < EPS;
      if (s === "bottom") return Math.abs(o.y1 - (room.y + room.h)) < EPS && Math.abs(o.y2 - (room.y + room.h)) < EPS;
      if (s === "left") return Math.abs(o.x1 - room.x) < EPS && Math.abs(o.x2 - room.x) < EPS;
      return Math.abs(o.x1 - (room.x + room.w)) < EPS && Math.abs(o.x2 - (room.x + room.w)) < EPS;
    });
  const len = (s: Side) => (s === "top" || s === "bottom" ? room.w : room.h);
  return sides.sort((a, b) => Number(blocked(a)) - Number(blocked(b)) || len(b) - len(a));
}

export function furnitureFor(room: PlacedRoom, openings: Opening[], car?: { comprimento: number; largura: number; vagas: number } | null): Piece[] {
  const sides = freeSides(room, openings);
  const main = frame(room, sides[0]);
  const out: Piece[] = [];
  const short = Math.min(room.w, room.h);

  switch (room.tipo) {
    case "quarto":
    case "suite": {
      const bedW = room.tipo === "suite" ? (short >= 3.1 ? 1.58 : 1.38) : short >= 3.0 ? 1.38 : 0.88;
      const bedL = room.tipo === "suite" ? 1.98 : 1.88;
      const u0 = (main.len - bedW) / 2;
      if (main.depth > bedL + 0.6 && main.len > bedW + 0.2) {
        out.push(main.rect(u0, 0.02, bedW, bedL, "strong", 0.08));
        out.push(main.rect(u0 + 0.06, 0.08, bedW - 0.12, 0.38, "soft", 0.06)); // travesseiros
        if (main.len > bedW + 1.0) {
          out.push(main.rect(u0 - 0.5, 0.02, 0.42, 0.4, "soft"));
          out.push(main.rect(u0 + bedW + 0.08, 0.02, 0.42, 0.4, "soft"));
        }
      }
      // guarda-roupa na parede oposta, se sobrar espaço
      const wardrobe = frame(room, opposite(sides[0]));
      if (main.depth > bedL + 1.3) out.push(wardrobe.rect(0.15, 0.02, Math.min(wardrobe.len - 0.3, 2.2), 0.58, "accent"));
      break;
    }
    case "sala": {
      const sofaL = Math.min(2.3, main.len - 0.6);
      if (sofaL > 1.2 && main.depth > 2.6) {
        const u0 = (main.len - sofaL) / 2;
        out.push(main.rect(u0, 0.05, sofaL, 0.88, "strong", 0.15));
        out.push(main.rect(u0 + sofaL / 2 - 0.5, 1.3, 1.0, 0.5, "soft"));
        if (main.depth > 3.4) out.push(main.rect(u0 + sofaL / 2 - 0.8, main.depth - 0.45, 1.6, 0.38, "accent"));
      }
      if (room.nome.toLowerCase().includes("jantar") && main.depth > 5.2) {
        const cu = main.len / 2;
        const cv = main.depth - 1.6;
        out.push(main.rect(cu - 0.8, cv - 0.45, 1.6, 0.9, "strong", 0.06));
        for (const du of [-0.45, 0.45]) {
          out.push(main.circle(cu + du, cv - 0.7, 0.2, "soft"));
          out.push(main.circle(cu + du, cv + 0.7, 0.2, "soft"));
        }
      }
      break;
    }
    case "jantar": {
      const cu = main.len / 2;
      const cv = main.depth / 2;
      out.push(main.rect(cu - 0.8, cv - 0.45, 1.6, 0.9, "strong", 0.06));
      for (const du of [-0.45, 0.45]) {
        out.push(main.circle(cu + du, cv - 0.7, 0.2, "soft"));
        out.push(main.circle(cu + du, cv + 0.7, 0.2, "soft"));
      }
      break;
    }
    case "cozinha": {
      const L = Math.max(0, main.len - 0.1);
      out.push(main.rect(0.05, 0.02, L, 0.6, "accent", 0.02));
      out.push(tag(main.rect(0.12, 0.08, 0.7, 0.48, "strong", 0.02), "geladeira"));
      out.push(tag(main.circle(Math.min(L - 0.5, 1.5), 0.32, 0.12, "soft"), "fogao"));
      out.push(main.circle(Math.min(L - 0.5, 1.5) + 0.3, 0.32, 0.12, "soft"));
      out.push(tag(main.rect(Math.max(0.9, L - 1.2), 0.12, 0.6, 0.38, "soft", 0.12), "pia"));
      if (room.w * room.h > 14 && main.depth > 3.2) out.push(main.rect(main.len / 2 - 0.9, 1.6, 1.8, 0.8, "strong", 0.04));
      break;
    }
    case "banheiro":
    case "banheiro_suite":
    case "lavabo": {
      const f = frame(room, sides[0]);
      out.push(tag(f.rect(0.12, 0.02, 0.4, 0.62, "strong", 0.18), "vaso"));
      out.push(tag(f.len > 1.3 ? f.rect(0.7, 0.02, 0.55, 0.42, "soft", 0.12) : f.rect(0.12, 0.7, 0.4, 0.35, "soft", 0.12), "lavatorio"));
      if (room.tipo !== "lavabo" && f.len > 2.1) {
        out.push(tag(f.rect(f.len - 0.95, 0.02, 0.9, Math.min(0.9, f.depth - 0.1), "accent", 0.02), "chuveiro"));
        out.push({ kind: "line", ...lineIn(f, f.len - 0.95, 0.02, f.len - 0.05, Math.min(0.9, f.depth - 0.1)) });
      } else if (room.tipo !== "lavabo") {
        const g = frame(room, opposite(sides[0]));
        out.push(tag(g.rect(0.05, 0.02, Math.min(0.9, g.len - 0.1), Math.max(0.6, Math.min(0.9, g.depth - 0.7)), "accent", 0.02), "chuveiro"));
      }
      break;
    }
    case "lavanderia": {
      out.push(tag(main.rect(0.08, 0.02, 0.6, 0.55, "strong", 0.04), "tanque"));
      out.push(tag(main.len > 1.4 ? main.circle(1.1, 0.32, 0.27, "soft") : main.circle(0.38, 0.95, 0.27, "soft"), "maquina"));
      break;
    }
    case "escritorio": {
      const dw = Math.min(1.4, main.len - 0.4);
      out.push(main.rect((main.len - dw) / 2, 0.02, dw, 0.6, "strong", 0.04));
      out.push(main.circle(main.len / 2, 0.95, 0.25, "soft"));
      break;
    }
    case "closet": {
      out.push(main.rect(0.05, 0.02, main.len - 0.1, 0.55, "accent", 0.02));
      break;
    }
    case "garagem": {
      const c = car ?? { comprimento: 4.5, largura: 1.8, vagas: 1 };
      const vagas = Math.max(1, Math.round(c.vagas));
      const gap = (room.w - vagas * c.largura) / (vagas + 1);
      for (let i = 0; i < vagas; i++) {
        const x = room.x + gap + i * (c.largura + gap);
        const y = room.y + 0.3;
        out.push({ kind: "rect", x, y, w: c.largura, h: c.comprimento, r: 0.35, tone: "strong" });
        out.push({ kind: "rect", x: x + 0.15, y: y + c.comprimento * 0.28, w: c.largura - 0.3, h: c.comprimento * 0.42, r: 0.2, tone: "soft" });
      }
      break;
    }
    case "varanda":
    case "area_gourmet": {
      if (main.depth >= 1.8 && main.len >= 2.4) {
        out.push(main.circle(main.len * 0.3, main.depth / 2, Math.min(0.5, main.depth / 2 - 0.35), "strong"));
        out.push(main.rect(main.len * 0.55, 0.15, Math.min(1.9, main.len * 0.35), 0.75, "soft", 0.12));
      }
      if (room.tipo === "area_gourmet") out.push(tag(main.rect(0.05, 0.02, Math.min(2.4, main.len - 0.1), 0.6, "accent", 0.02), "pia"));
      break;
    }
  }
  return out;
}

function tag(p: Piece, fixture: Fixture): Piece {
  return p.kind === "line" ? p : { ...p, fixture };
}

/** Centro de uma peça (m). */
export function pieceCenter(p: Piece): { x: number; y: number } {
  if (p.kind === "rect") return { x: p.x + p.w / 2, y: p.y + p.h / 2 };
  if (p.kind === "circle") return { x: p.cx, y: p.cy };
  return { x: (p.x1 + p.x2) / 2, y: (p.y1 + p.y2) / 2 };
}

/** Todos os aparelhos (vaso, pia, chuveiro…) da planta, com posição e cômodo. */
export function fixturesOf(rooms: PlacedRoom[], openings: Opening[]) {
  return rooms.flatMap((room) =>
    furnitureFor(room, openings)
      .filter((p): p is Extract<Piece, { fixture?: Fixture }> & { fixture: Fixture } => p.kind !== "line" && !!p.fixture)
      .map((p) => ({ kind: p.fixture, roomId: room.id, ...pieceCenter(p) })),
  );
}

function opposite(s: Side): Side {
  return s === "top" ? "bottom" : s === "bottom" ? "top" : s === "left" ? "right" : "left";
}

function lineIn(f: ReturnType<typeof frame>, u1: number, v1: number, u2: number, v2: number) {
  const a = f.rect(u1, v1, 0, 0) as Extract<Piece, { kind: "rect" }>;
  const b = f.rect(u2, v2, 0, 0) as Extract<Piece, { kind: "rect" }>;
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
}
