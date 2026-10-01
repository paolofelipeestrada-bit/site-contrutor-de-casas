# CasaAI — planta 2D com IA que aprende

Descreva a casa → a IA entende → o algoritmo desenha a planta com medidas reais → cada ajuste seu ensina o sistema.

```
Texto ──► IA (Claude) ──► Brief JSON ──► Programa de necessidades ──► Algoritmo de layout ──► Planta 2D
                ▲                                                                              │
                └──────────── dicas + exemplos aprendidos ◄── Motor de aprendizado ◄── edições / 👍👎
```

## Rodando

```bash
npm install
cp .env.example .env.local   # opcional: ANTHROPIC_API_KEY=...
npm run dev                  # http://localhost:5173
npm test                     # testes do pipeline (parser, layout, aprendizado, comandos)
npm run build
```

Sem `ANTHROPIC_API_KEY`, o site usa o **interpretador local** (regras em português) — tudo funciona, só que a leitura do texto livre é menos esperta. O selo "Leitura: regras locais" / "Leitura: IA Claude" na planta mostra qual dos dois rodou.

Deploy: qualquer host de Vite com funções serverless. Na Vercel, `api/interpret.ts` vira a rota `POST /api/interpret` automaticamente; configure `ANTHROPIC_API_KEY` nas variáveis de ambiente.

## Onde editar cada coisa

| Quero mudar… | Arquivo |
|---|---|
| Animações (tempos, curvas, ordem do desenho) | `src/lib/motion.ts` |
| Preços da estimativa de custo (R$/m², materiais, etapas) | `src/lib/plan/cost.ts` (objeto `CUSTOS`) |
| Modo construir do zero (exemplo inicial, grade) | `src/lib/builder.ts`, `src/sections/Builder.tsx` |
| Ferramentas do editor de fiação | `src/components/WiringEditor.tsx` |
| Logo (símbolo do brand board) | `src/components/Logo.tsx` |
| Cores e fontes do site (identidade do Figma: Carvão, Papel, Argila, Sálvia, Areia) | `src/index.css` (bloco `@theme`) e a fonte em `index.html` |
| Nome do site e imagem do topo | `src/config.ts` (`heroImage: "/images/hero.webp"` usa uma imagem de `public/images/`) |
| Textos das seções | `src/sections/*.tsx` (Hero, Pipeline = "Como funciona", Roadmap = "Fases") |
| Tamanhos-padrão e larguras mínimas dos cômodos | `src/lib/catalog.ts` (`ROOM_INFO`) |
| Cores dos ambientes na planta | `src/lib/catalog.ts` (`ZONE_COLORS`) |
| Recuos automáticos e largura do corredor | `src/lib/layout/layout.ts` (`autoSetbacks`, `CORRIDOR`) |
| As 3 opções (Equilibrada, Área social, Privacidade) | `src/lib/plan/profiles.ts` (`PERFIS`) |
| Regras da elétrica (VA, tomadas por metro, disjuntores, cabos) | `src/lib/plan/electrical.ts` (objeto `ELETRICA`) |
| Regras da hidráulica (consumo, caixa d'água, diâmetros) | `src/lib/plan/plumbing.ts` (objeto `HIDRAULICA`) |
| Verificações e "Explique meu projeto" | `src/lib/plan/report.ts` |
| Comandos do modo editar | `src/lib/plan/commands.ts` |
| Móveis e aparelhos sanitários | `src/lib/plan/furniture.ts` |
| Texto enviado à IA | `server/interpret.ts` (`SYSTEM`) |

## Arquitetura

| Etapa | Arquivo | O que faz |
|---|---|---|
| Texto → JSON | `server/interpret.ts`, `src/lib/brief/` | Claude (saída estruturada validada por Zod) transforma formulário + texto livre em um `Brief`. `localParser.ts` é o fallback. As opções avançadas (recuos, norte, moradores, acessibilidade) entram como `brief.regras`. |
| JSON → programa | `src/lib/layout/program.ts` | Área-alvo de cada cômodo: edição > área pedida > prior aprendido × escala da casa × multiplicador do perfil. Garagem pelo carro. |
| Programa → planta | `src/lib/layout/layout.ts`, `slicing.ts` | Árvore de cortes proporcional à área; várias estratégias; relaxamento para larguras mínimas; portas, janelas e entrada por regra; nota explicável. |
| 3 opções | `src/lib/plan/profiles.ts` | Cada perfil ajusta áreas e ordena as variações; sempre que possível mostra arranjos diferentes. |
| Elétrica | `src/lib/plan/electrical.ts` | Luz (100 VA + 60 VA/4 m²), tomadas por perímetro, chuveiro/máquina/portão em circuito próprio, quadro junto à entrada, disjuntor e cabo por circuito. |
| Hidráulica | `src/lib/plan/plumbing.ts` | Hidrômetro → caixa d'água → ramais; esgoto por caixa sifonada até caixas externas (CI/CG) e coletor até a rede; lista de materiais. |
| Desenho | `src/components/PlanViewer.tsx`, `TechLayers.tsx` | SVG em metros; camadas técnicas por cima da mesma planta. |
| Aprendizado | `src/lib/learning/engine.ts` | Edições, avaliações e escolha de opção ajustam as próximas plantas; fica no navegador (`localStorage`). |

Para depurar o layout: `TXT="terreno 8 por 20, 70 m2, 2 quartos" OUT=planta.svg npm run debug:layout`.

## Próximos passos sugeridos

1. Aprendizado coletivo num banco de dados (as funções já são puras).
2. Água quente, ventilação de esgoto e caimentos na hidráulica; DR e padrão de entrada na elétrica.
3. Exportar PDF/DXF com cotas e as tabelas.
4. 3D a partir das mesmas paredes; estimativa de custo a partir das listas de materiais.

## Imagens

O topo usa um desenho SVG animado. Para usar uma foto ou render, salve o arquivo em `public/images/` e aponte `heroImage` em `src/config.ts`. Os prompts para gerar as imagens no Higgsfield (exige plano Basic ou superior) estão em [`docs/higgsfield-prompts.md`](docs/higgsfield-prompts.md).
