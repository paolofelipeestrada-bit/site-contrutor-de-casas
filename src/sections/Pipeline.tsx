const STEPS = [
  ["Você descreve", "Formulário + texto livre: terreno, cômodos, carro, estilo e jeito de viver."],
  ["A IA interpreta", "Transforma o pedido em dados estruturados (JSON). Ela não desenha nada."],
  ["O algoritmo calcula", "Testa várias distribuições respeitando recuos e larguras mínimas e dá uma nota a cada uma."],
  ["Você escolhe e edita", "Compara 3 opções, escolhe uma, arrasta paredes ou pede “quero a suíte com 16 m²”."],
];

const CHECKS = [
  "Todo cômodo tem porta de acesso",
  "Larguras mínimas por tipo de cômodo",
  "Quartos e sala com janela para fora",
  "Recuos do terreno respeitados",
  "Garagem comporta o carro informado",
  "Áreas molhadas agrupadas",
  "Área construída próxima da pedida",
];

export function Pipeline() {
  return (
    <section id="como-funciona" className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
      <div className="max-w-2xl">
        <p className="eyebrow">Como funciona</p>
        <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">A IA entende o pedido. A geometria decide a planta.</h2>
        <p className="mt-4 text-muted">
          Geradores de imagem inventam plantas que não fecham as contas. Aqui cada medida sai de um cálculo que pode ser conferido, e por isso a planta pode ser editada sem
          perder a coerência.
        </p>
      </div>

      <ol className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(([t, d], i) => (
          <li key={t} className="bg-bg p-5">
            <span className="font-mono text-xs text-primary">0{i + 1}</span>
            <h3 className="mt-3 font-display text-lg font-semibold">{t}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{d}</p>
          </li>
        ))}
      </ol>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="font-display text-xl font-semibold">O que é verificado em toda planta</h3>
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {CHECKS.map((c) => (
              <li key={c} className="flex gap-2">
                <span className="text-ok">✓</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-display text-xl font-semibold">Aprende com o uso</h3>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Quando você aumenta a suíte, escolhe a opção “Área social” ou rejeita um layout, o sistema guarda essa preferência. As próximas plantas já começam com as áreas e a
            distribuição que você costuma aprovar, e a IA recebe essas preferências como contexto.
          </p>
        </div>
      </div>
    </section>
  );
}
