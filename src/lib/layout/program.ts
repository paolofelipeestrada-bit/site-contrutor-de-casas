import { ROOM_INFO, STYLE_INFO } from "../catalog";
import { areaFactor, type LearningState } from "../learning/engine";
import type { Brief, Program, RoomSpec, RoomType } from "../types";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

/** Dimensões da garagem a partir do carro: folga para abrir portas (≈0,8 m de cada lado) e circular na frente. */
export function garageSize(carro: NonNullable<Brief["carro"]>): { w: number; h: number } {
  const vagas = Math.max(1, Math.round(carro.vagas));
  const w = vagas * carro.largura + (vagas + 1) * 0.8;
  const h = carro.comprimento + 1.0;
  return { w: round1(Math.max(w, 2.8)), h: round1(h) };
}

/**
 * Brief → Programa de necessidades (lista de cômodos com área-alvo).
 * As áreas vêm de: edição do usuário (overrides) > área pedida no briefing > prior aprendido × escala da casa.
 */
export function buildProgram(brief: Brief, learning?: LearningState, overrides: Record<string, number> = {}): Program {
  const counters: Partial<Record<RoomType, number>> = {};
  const nextId = (tipo: RoomType) => {
    counters[tipo] = (counters[tipo] ?? 0) + 1;
    return `${tipo}-${counters[tipo]}`;
  };

  type Draft = RoomSpec & { explicit: boolean };
  const drafts: Draft[] = [];
  const boost = STYLE_INFO[brief.estilo]?.socialBoost ?? 1;

  const add = (tipo: RoomType, nome: string, explicitArea?: number | null, attachTo?: string): Draft => {
    const info = ROOM_INFO[tipo];
    const id = nextId(tipo);
    const learned = learning ? areaFactor(learning, tipo) : 1;
    const base = info.baseArea * learned * (info.zone === "social" ? boost : 1);
    const override = overrides[id];
    const area = override ?? explicitArea ?? base;
    const d: Draft = {
      id,
      tipo,
      nome,
      zone: info.zone,
      area,
      minWidth: info.minWidth,
      attachTo,
      explicit: override !== undefined || explicitArea != null,
    };
    drafts.push(d);
    return d;
  };

  const suitesCount = brief.ambientes.filter((a) => a.tipo === "suite").length;
  let suiteIdx = 0;
  for (const amb of brief.ambientes) {
    const info = ROOM_INFO[amb.tipo];
    if (!info || amb.tipo === "banheiro_suite" || amb.tipo === "circulacao") continue;
    if (amb.tipo === "garagem") {
      const carro = brief.carro ?? { comprimento: 4.5, largura: 1.8, vagas: 1 };
      const size = garageSize(carro);
      const g = add("garagem", carro.vagas > 1 ? `Garagem (${carro.vagas} vagas)` : "Garagem", size.w * size.h);
      g.fixed = size;
      g.minWidth = Math.min(size.w, size.h);
      g.area = overrides[g.id] ?? size.w * size.h;
      g.explicit = true;
      continue;
    }
    if (amb.tipo === "suite") {
      suiteIdx++;
      const s = add("suite", amb.nome || (suitesCount > 1 ? `Suíte ${suiteIdx}` : "Suíte"), amb.area);
      add("banheiro_suite", suitesCount > 1 ? `Banho suíte ${suiteIdx}` : "Banho suíte", null, s.id);
      continue;
    }
    if (amb.tipo === "closet") {
      const suite = drafts.find((d) => d.tipo === "suite");
      add("closet", amb.nome || "Closet", amb.area, suite?.id);
      continue;
    }
    add(amb.tipo, amb.nome || info.label, amb.area);
  }

  // Escala as áreas "livres" para que a soma bata com a área desejada (descontando ~10% de circulação).
  const target = brief.casa.area;
  const fixedSum = drafts.filter((d) => d.explicit).reduce((s, d) => s + d.area, 0);
  const flex = drafts.filter((d) => !d.explicit);
  const flexSum = flex.reduce((s, d) => s + d.area, 0);
  const available = Math.max(target * 0.9 - fixedSum, flexSum * 0.6);
  const scale = flexSum > 0 ? clamp(available / flexSum, 0.65, 1.8) : 1;
  for (const d of flex) {
    const info = ROOM_INFO[d.tipo];
    d.area = clamp(d.area * scale, info.minArea, info.maxArea);
  }

  const rooms: RoomSpec[] = drafts.map(({ explicit: _explicit, ...r }) => ({ ...r, area: round1(r.area) }));
  return { rooms, houseArea: target };
}
