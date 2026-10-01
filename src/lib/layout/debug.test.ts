import { it } from "vitest";
import { DEFAULT_FORM } from "../brief/form";
import { interpretLocally } from "../brief/localParser";
import { explainPlan } from "../layout/layout";
import { plansFromBrief } from "../pipeline";
import { writeFileSync } from "node:fs";
import { ZONE_COLORS } from "../catalog";

it.skipIf(!process.env.DEBUG_LAYOUT)("debug", () => {
  const brief = interpretLocally(DEFAULT_FORM, process.env.TXT ?? DEFAULT_FORM.descricao);
  console.log(JSON.stringify(brief.ambientes.map((a) => a.tipo)), brief.carro, brief.terreno, brief.casa);
  const plans = plansFromBrief(brief).slice(0, 4);
  let svgs = "";
  plans.forEach((p, i) => {
    console.log(JSON.stringify(p.strategy), p.score, p.builtArea, "\n  " + explainPlan(p, brief).join("\n  "), "\n  issues:", p.issues.join(" | "));
    const s = 22;
    let g = `<g transform="translate(${(i % 2) * 430 + 10},${Math.floor(i / 2) * 640 + 10})"><text x="0" y="12" fill="#fff" font-size="12">${p.strategy.kind} v${p.strategy.variant} m${+p.strategy.mirror} w${p.strategy.width} score ${p.score}</text>`;
    g += `<rect x="0" y="20" width="${p.lot.width * s}" height="${p.lot.depth * s}" fill="none" stroke="#555"/>`;
    for (const r of p.rooms) {
      const c = ZONE_COLORS[r.zone];
      g += `<rect x="${r.x * s}" y="${20 + r.y * s}" width="${r.w * s}" height="${r.h * s}" fill="${c.fill}" stroke="${c.stroke}"/>`;
      g += `<text x="${(r.x + r.w / 2) * s}" y="${20 + (r.y + r.h / 2) * s}" fill="#fff" font-size="9" text-anchor="middle">${r.nome} ${(r.w * r.h).toFixed(1)}</text>`;
    }
    for (const o of p.openings) {
      const col = o.kind === "window" ? "#38bdf8" : o.kind === "passage" ? "#000" : o.kind === "entrance" ? "#f00" : o.kind === "garage_door" ? "#fbbf24" : "#fff";
      g += `<line x1="${o.x1 * s}" y1="${20 + o.y1 * s}" x2="${o.x2 * s}" y2="${20 + o.y2 * s}" stroke="${col}" stroke-width="4"/>`;
    }
    svgs += g + "</g>";
  });
  writeFileSync(process.env.OUT ?? "/dev/null", `<svg xmlns="http://www.w3.org/2000/svg" width="870" height="1300" style="background:#111">${svgs}</svg>`);
});
