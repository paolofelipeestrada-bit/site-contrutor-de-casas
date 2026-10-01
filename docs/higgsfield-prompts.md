# Prompts de imagem (Higgsfield)

Prontos para gerar quando a conta estiver no plano Basic ou superior (no plano gratuito a geração é bloqueada: "Requires basic plan or higher").
Modelo sugerido: `gpt_image_2_5`, qualidade `medium` (~0,5 crédito cada). Salve em `public/images/` e, para o topo, aponte `heroImage` em `src/config.ts`.

Direção visual do site: sóbria, grafite com um único acento laranja, sem neon nem degradês.

| Arquivo | Proporção | Onde entra | Prompt |
|---|---|---|---|
| `hero.webp` | 4:3 | Topo da página (`heroImage`) | Architectural photograph at dusk of a modern single-story Brazilian house, flat roof, exposed concrete and freijó wood, large glass doors with warm interior light, simple garden, dark graphite sky. Muted colors, natural light, no neon, no glow, no people, no text. |
| `interior.webp` | 16:9 | Futura seção 3D | Interior photograph of an integrated living room and kitchen in a contemporary Brazilian house, concrete floor, wood cabinetry, sliding glass doors to a back veranda, soft evening light. Muted, realistic, architectural photography, no people, no text. |
| `prancheta.webp` | 4:3 | "Como funciona" (opcional) | Top-down photograph of an architect's desk at night: printed floor plan on graphite paper, scale ruler, pencil, measuring tape, warm desk lamp. Muted tones, shallow depth of field, no readable text. |
