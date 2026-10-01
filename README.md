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

Sem `ANTHROPIC_API_KEY`, o site usa o **interpretador local** (regras em português) — tudo funciona, só que a leitura do texto livre é menos esperta. O selo "IA local" / "IA Claude" na planta mostra qual dos dois rodou.

Deploy: qualquer host de Vite com funções serverless. Na Vercel, `api/interpret.ts` vira a rota `POST /api/interpret` automaticamente; configure `ANTHROPIC_API_KEY` nas variáveis de ambiente.

## Arquitetura

| Etapa | Arquivo | O que faz |
|---|---|---|
| Texto → JSON | `server/interpret.ts`, `src/lib/brief/` | Claude (`claude-opus-5-5`, saída estruturada validada por Zod) transforma formulário + texto livre em um `Brief`. `localParser.ts` é o fallback e a rede de segurança; `sanitizeBrief` aplica os limites antes do algoritmo. |
| JSON → programa | `src/lib/layout/program.ts` | Define a área-alvo de cada cômodo: edição do usuário > área pedida > prior aprendido × escala da casa. Cria o banho de cada suíte e dimensiona a garagem pelo carro (folga de 0,8 m para abrir portas). |
| Programa → planta | `src/lib/layout/layout.ts`, `slicing.ts` | Árvore de cortes proporcional à área (a planta sempre "fecha"). Estratégias: social na frente / social nos fundos / linear (terreno estreito) / social e íntimo lado a lado, cada uma espelhada. Um relaxamento iterativo garante larguras mínimas e a garagem; depois portas, janelas, entrada e portão são posicionados por regra. Cada opção recebe uma nota explicável e as melhores aparecem primeiro. |
| Desenho | `src/components/PlanViewer.tsx`, `src/lib/plan/furniture.ts` | SVG em metros: paredes animadas, portas com arco, janelas, cotas, recuos, rua e móveis em tamanho real. |
| Modo editar | `src/lib/plan/commands.ts`, `src/hooks/useStudio.ts` | Clique no cômodo (área e dimensões), ±1 m², arraste paredes, ou comandos: "aumentar a suíte em 2 m²", "adicionar escritório", "remover lavabo", "espelhar", "outra opção". |
| Aprendizado | `src/lib/learning/engine.ts` | Edições ajustam um fator de área por tipo de cômodo (média móvel); 👍/👎 atualizam uma distribuição Beta por estratégia de layout; briefings aprovados viram exemplos few-shot e dicas para a IA. Hoje persiste no navegador (`localStorage`). |

Para depurar o layout: `TXT="terreno 8 por 20, 70 m2, 2 quartos" OUT=planta.svg npm run debug:layout`.

## Próximos passos sugeridos

1. **Aprendizado coletivo**: mover `LearningState` para um banco (as funções já são puras) e agregar preferências por região/perfil, não só por navegador.
2. **Camada elétrica**: regras por tipo de cômodo sobre `PlacedRoom` + `Opening` (tomadas a cada ~3 m de parede, interruptor ao lado da porta, ponto de luz no centro, quadro perto da entrada).
3. **Camada hidráulica**: as áreas molhadas já saem agrupadas ("faixa hidráulica"); falta traçar prumadas e ramais.
4. **Arrastar parede livre** (fora da árvore de cortes) e exportar DXF/PDF com cotas.
5. **3D**: extrudar paredes do mesmo modelo de dados.

## Imagens

As ilustrações atuais são SVG animado (leves, nítidas em qualquer tela). Os prompts para gerar imagens no Higgsfield estão em [`docs/higgsfield-prompts.md`](docs/higgsfield-prompts.md).
