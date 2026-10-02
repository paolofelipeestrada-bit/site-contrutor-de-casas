# CasaAI — planta 2D com IA que aprende

Descreva a casa → a IA entende → o algoritmo desenha a planta com medidas reais → cada ajuste seu ensina o sistema.

```
Texto ──► IA (Claude) ──► Brief JSON ──► Programa de necessidades ──► Algoritmo de layout ──► Planta 2D ──► Casa 3D
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
| Animações (tempos, curvas, ordem do desenho, rolagem suave, profundidade, abertura) | `src/lib/motion.ts` (`ROLAGEM`, `PARALLAX`, `INTRO_DUR`) |
| Rolagem suave da página (Lenis) | `src/components/SmoothScroll.tsx` |
| Abertura com o logo, títulos palavra por palavra, botões magnéticos | `src/components/Intro.tsx`, `MaskText.tsx`, `Magnetic.tsx` |
| Menu que some ao rolar e barra de progresso | `src/sections/Chrome.tsx` |
| Preços da estimativa de custo (R$/m², materiais, etapas) | `src/lib/plan/cost.ts` (objeto `CUSTOS`) |
| Modo construir do zero (exemplo inicial, grade) | `src/lib/builder.ts`, `src/sections/Builder.tsx` |
| Ferramentas do editor de fiação | `src/components/WiringEditor.tsx` |
| Zoom das pranchetas (limites, passo, atalhos) | `src/components/ZoomPan.tsx` |
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
| 3D: pé-direito, espessura das paredes, altura de portas, janelas, portão, laje e telhado | `src/lib/three/model.ts` (objeto `CASA3D`) |
| 3D: cores e acabamentos (paredes, pisos, telhado, vidro, rua) | `src/components/casa3d/Cena.tsx` (objeto `CORES`) |
| 3D: sensibilidade do mouse (`mouseSensitivity = 0.0025`), suavização, limite para olhar para cima/baixo | `src/lib/three/controle.ts` (objeto `CONTROLE`) |
| 3D: velocidade de andar e "largura" da pessoa | `src/components/casa3d/Navegacao.tsx` (objeto `ANDAR`) |
| 3D: tamanhos-padrão dos móveis e espaço livre na frente de cada um | `src/lib/three/mobilia.ts` (objeto `MOVEIS`) |
| 3D: onde cada móvel vai em cada tipo de cômodo | `src/lib/three/mobilia.ts` (funções `quarto`, `sala`, `cozinha`, `banheiro`…) |
| 3D: aparência dos móveis (formas e cores) | `src/components/casa3d/Moveis.tsx` (componentes `Sofa`, `Cama`… e `CORES_MOVEIS`) |
| 3D: botões e telas ("Construindo sua casa…", medidas do cômodo) | `src/components/casa3d/Casa3D.tsx` |

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
| Casa 3D | `src/lib/three/model.ts`, `src/components/casa3d/` | `planTo3D(plan)` extrude a planta: cada cômodo vira piso com as mesmas medidas; as bordas dos cômodos fechados viram paredes (internas quando há cômodo dos dois lados); cada porta e janela da planta recorta a parede no mesmo lugar (verga e peitoril acima/abaixo). Cobertura: laje com platibanda ou telhado de 4 águas. O Three.js só desenha esse modelo — a IA não decide nada no 3D. Carregado sob demanda (só baixa ao clicar em "Entrar na casa 3D"). |
| Móveis 3D | `src/lib/three/mobilia.ts`, `src/components/casa3d/Moveis.tsx` | `mobiliaAutomatica(plan)` escolhe os móveis pelo tipo de cada cômodo e os encaixa por regras: dentro do vão livre (não atravessam parede), fora da área das portas, sem tapar janela com móvel alto, sem sobreposição, com espaço de uso na frente (abrir o guarda-roupa, sentar no vaso) e corredor sempre vazio. Se um móvel não couber com folga, ele fica de fora. Os móveis bloqueiam a passagem no modo Andar. |
| Câmera | `src/lib/three/controle.ts`, `src/components/casa3d/Navegacao.tsx`, `PainelControles.tsx` | Olhar com o cursor travado, segurando o botão esquerdo ou arrastando o dedo; suavização exponencial (≈95% em 100 ms); limite vertical de 83°; painel "Controles" com sensibilidade, suavização e inverter eixo (salvo no navegador). |
| Aprendizado | `src/lib/learning/engine.ts` | Edições, avaliações e escolha de opção ajustam as próximas plantas; fica no navegador (`localStorage`). |

Para depurar o layout: `TXT="terreno 8 por 20, 70 m2, 2 quartos" OUT=planta.svg npm run debug:layout`.

## Próximos passos sugeridos

1. Aprendizado coletivo num banco de dados (as funções já são puras).
2. Água quente, ventilação de esgoto e caimentos na hidráulica; DR e padrão de entrada na elétrica.
3. Exportar PDF/DXF com cotas e as tabelas.
4. 3D — próximas etapas: dia/noite com luzes internas, esconder/trocar/editar móveis, materiais e personalização.

## Imagens

O topo usa um desenho SVG animado. Para usar uma foto ou render, salve o arquivo em `public/images/` e aponte `heroImage` em `src/config.ts`. Os prompts para gerar as imagens no Higgsfield (exige plano Basic ou superior) estão em [`docs/higgsfield-prompts.md`](docs/higgsfield-prompts.md).
