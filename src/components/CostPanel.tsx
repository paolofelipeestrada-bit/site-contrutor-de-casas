import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { DUR, EASE, STAGGER } from "../lib/motion";
import { brl, CUSTOS, orcamento, PADRAO_LABEL, type ItemCusto, type Padrao } from "../lib/plan/cost";
import type { ProjetoEletrico } from "../lib/plan/electrical";
import type { ProjetoHidraulico } from "../lib/plan/plumbing";
import type { Plan } from "../lib/types";

/** Aba "Custo": total por padrão de acabamento, divisão por etapa e materiais das instalações. */
export function CostPanel({ plan, e, h }: { plan: Plan; e: ProjetoEletrico; h: ProjetoHidraulico }) {
  const [padrao, setPadrao] = useState<Padrao>("normal");
  const o = useMemo(() => orcamento(plan, e, h, padrao), [plan, e, h, padrao]);
  const maior = Math.max(...o.etapas.map((x) => x.valor));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Custo estimado da obra</p>
          <motion.p key={o.total} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DUR.base, ease: EASE }} className="tabular mt-1 font-display text-4xl font-semibold">
            {brl(o.total)}
          </motion.p>
          <p className="tabular mt-1 font-mono text-xs text-muted">
            faixa provável {brl(o.faixa[0])} – {brl(o.faixa[1])} · {String(o.areaEquivalente).replace(".", ",")} m² equivalentes × {brl(o.porM2)}/m²
          </p>
        </div>
        <div className="flex rounded-lg border border-line p-0.5 text-sm" role="radiogroup" aria-label="Padrão de acabamento">
          {(Object.keys(PADRAO_LABEL) as Padrao[]).map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={padrao === p}
              onClick={() => setPadrao(p)}
              className={`relative rounded-md px-3 py-1.5 font-medium transition-colors ${padrao === p ? "text-bg" : "text-muted hover:text-ink"}`}
            >
              {padrao === p && <motion.span layoutId="padrao" className="absolute inset-0 rounded-md bg-ink" transition={{ duration: DUR.base, ease: EASE }} />}
              <span className="relative">{PADRAO_LABEL[p]}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="eyebrow mb-3">Divisão por etapa</p>
        <ul className="space-y-2">
          {o.etapas.map((x, i) => (
            <li key={x.nome} className="grid grid-cols-[minmax(0,15rem)_1fr_auto] items-center gap-3 text-sm">
              <span className="truncate text-ink">{x.nome}</span>
              <span className="h-2 overflow-hidden rounded-full bg-line">
                <motion.span
                  className="block h-full rounded-full bg-ok"
                  initial={{ width: 0 }}
                  animate={{ width: `${(x.valor / maior) * 100}%` }}
                  transition={{ delay: i * STAGGER.curto, duration: DUR.lento, ease: EASE }}
                />
              </span>
              <span className="tabular w-24 text-right font-mono text-xs text-muted">{brl(x.valor)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Tabela titulo="Material elétrico" itens={o.eletrica} total={o.materialEletrica} />
        <Tabela titulo="Material hidráulico" itens={o.hidraulica} total={o.materialHidraulica} />
      </div>
      <p className="text-xs text-muted">
        {CUSTOS.fonte} As listas de material saem das camadas elétrica e hidráulica desta planta; mão de obra das instalações ≈{" "}
        {Math.round(CUSTOS.maoDeObraInstalacoes * 100)}% do material. Não substitui orçamento de construtora.
      </p>
    </div>
  );
}

function Tabela({ titulo, itens, total }: { titulo: string; itens: ItemCusto[]; total: number }) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-xl border border-line">
      <table className="tabular w-full min-w-[360px] text-left text-xs">
        <caption className="border-b border-line px-3 py-2 text-left font-medium text-ink">{titulo}</caption>
        <tbody>
          {itens.map((i) => (
            <tr key={i.item} className="border-t border-line first:border-t-0">
              <td className="px-3 py-1.5 text-ink">{i.item}</td>
              <td className="whitespace-nowrap px-3 py-1.5 text-right font-mono text-muted">
                {i.qtd} {i.unidade}
              </td>
              <td className="whitespace-nowrap px-3 py-1.5 text-right font-mono">{brl(i.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-line">
            <td className="px-3 py-2 font-medium" colSpan={2}>
              Total de material
            </td>
            <td className="px-3 py-2 text-right font-mono font-semibold">{brl(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
