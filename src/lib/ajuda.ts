/**
 * O que o mascote (Faísca) sabe responder sem IA: perguntas frequentes, dicas por seção e busca por palavras.
 * Para mudar um texto do mascote, edite aqui.
 */

export type Secao = "inicio" | "como-funciona" | "briefing" | "planta" | "construir" | "fases";

export interface Resposta {
  id: string;
  /** como aparece no botão de pergunta rápida */
  pergunta: string;
  resposta: string;
  /** palavras (sem acento, minúsculas) que levam a esta resposta numa pergunta digitada */
  palavras: string[];
  /** botão "me leva lá" */
  acao?: { rotulo: string; secao: string };
}

export const RESPOSTAS: Resposta[] = [
  {
    id: "comecar",
    pergunta: "Como eu começo?",
    resposta:
      "É rapidinho! Em “Gerar planta”, coloque a largura e o fundo do terreno, escolha quartos e banheiros e escreva do seu jeito como quer a casa. Depois é só clicar em “Gerar 3 opções de planta” ✨",
    palavras: ["comeco", "comecar", "inicio", "iniciar", "primeiro passo", "como usa", "como funciona o site", "por onde", "usar o site"],
    acao: { rotulo: "Me leva lá", secao: "briefing" },
  },
  {
    id: "area",
    pergunta: "O que é a área da casa?",
    resposta:
      "É o tamanho da casa construída, em m². Quando você coloca largura e fundo, eu calculo o terreno e já preencho a casa com 40% dele. Quer outro tamanho? É só digitar.",
    palavras: ["area", "m2", "metro quadrado", "metros quadrados", "tamanho da casa", "largura", "fundo", "terreno"],
  },
  {
    id: "moradores",
    pergunta: "Onde coloco os moradores?",
    resposta: "Em “Opções avançadas”, logo acima do botão de gerar. O número de moradores define o tamanho da caixa d'água.",
    palavras: ["morador", "moradores", "pessoas", "familia", "opcoes avancadas", "recuo", "norte", "acessibilidade"],
    acao: { rotulo: "Me leva lá", secao: "briefing" },
  },
  {
    id: "opcoes",
    pergunta: "Por que 3 opções?",
    resposta:
      "Cada opção organiza os cômodos de um jeito (equilibrada, área social maior ou mais privacidade) e ganha uma nota. Escolha a que mais combina com você e edite à vontade.",
    palavras: ["3 opcoes", "tres opcoes", "opcao", "opcoes", "nota", "escolher", "variacao"],
  },
  {
    id: "editar",
    pergunta: "Como edito a planta?",
    resposta:
      "Na aba Planta, clique em “Modo editar”: arraste as linhas laranja para mexer nas paredes ou clique num cômodo para renomear e ajustar a área. Errou? Ctrl+Z desfaz.",
    palavras: ["editar", "edito", "mudar", "mexer", "alterar", "parede", "comodo", "renomear", "desfazer", "aumentar", "diminuir"],
  },
  {
    id: "tresd",
    pergunta: "Como vejo em 3D?",
    resposta:
      "Depois de gerar a planta, clique em “Entrar na casa 3D”. Dá para ver de fora, por dentro ou andar pela casa com WASD (ou com o joystick no celular) 🏠",
    palavras: ["3d", "tres d", "maquete", "andar", "passear", "por dentro", "visualizar", "ver a casa", "entrar na casa"],
  },
  {
    id: "moveis",
    pergunta: "E os móveis do 3D?",
    resposta:
      "Eles entram sozinhos, pelo tipo de cada cômodo, sem bloquear portas nem janelas. “Variar” troca os modelos, e uma vistoria completa os cômodos que ficaram vazios.",
    palavras: ["movel", "moveis", "mobilia", "sofa", "cama", "decoracao", "vazio", "variar"],
  },
  {
    id: "eletrica",
    pergunta: "O que tem na elétrica?",
    resposta:
      "A aba Elétrica mostra pontos de luz, tomadas, interruptores, circuitos, disjuntores e cabos (NBR 5410 simplificada). Em “Editar fiação” você move, acrescenta ou apaga pontos ⚡",
    palavras: ["eletrica", "tomada", "tomadas", "luz", "interruptor", "disjuntor", "circuito", "fiacao", "cabo", "energia"],
  },
  {
    id: "hidraulica",
    pergunta: "E a hidráulica?",
    resposta: "A aba Hidráulica traz água fria, esgoto, as caixas e a caixa d'água calculada pelo número de moradores, com a lista de material.",
    palavras: ["hidraulica", "agua", "esgoto", "encanamento", "cano", "caixa d agua", "caixa dagua", "registro"],
  },
  {
    id: "custo",
    pergunta: "O custo é real?",
    resposta:
      "É uma estimativa com referência média nacional, por etapa da obra e por material. Serve para ter uma boa ideia, mas ajuste aos preços da sua região: não substitui o orçamento de uma construtora.",
    palavras: ["custo", "preco", "valor", "quanto custa", "orcamento", "dinheiro", "reais", "gastar"],
  },
  {
    id: "zero",
    pergunta: "Posso desenhar do zero?",
    resposta: "Pode! Em “Construir do zero” você monta cômodo por cômodo numa grade, e a elétrica, a hidráulica e o 3D acompanham.",
    palavras: ["do zero", "desenhar", "desenho", "construir do zero", "minha planta", "montar"],
    acao: { rotulo: "Me leva lá", secao: "construir" },
  },
  {
    id: "ia",
    pergunta: "A IA desenha a planta?",
    resposta:
      "A IA só entende o seu pedido. Quem calcula a planta é um algoritmo com regras de medidas, recuos e ligações entre os cômodos, por isso dá para conferir tudo.",
    palavras: ["ia", "inteligencia artificial", "algoritmo", "como funciona", "quem desenha", "confiavel"],
  },
  {
    id: "arquiteto",
    pergunta: "Preciso de arquiteto?",
    resposta:
      "Para construir, sim. Aqui é um estudo preliminar para você planejar com clareza; o projeto final, com estrutura e aprovação na prefeitura, é com um arquiteto ou engenheiro.",
    palavras: ["arquiteto", "engenheiro", "prefeitura", "aprovar", "aprovacao", "projeto final", "construir de verdade", "obra"],
  },
];

export const POR_ID = Object.fromEntries(RESPOSTAS.map((r) => [r.id, r])) as Record<string, Resposta>;

/** Perguntas rápidas e saudação de cada seção do site. */
export const SECOES: Record<Secao, { dica: string; perguntas: string[] }> = {
  inicio: {
    dica: "Quer planejar sua casa? Me pergunte qualquer coisa ou toque numa das perguntas abaixo.",
    perguntas: ["comecar", "ia", "tresd", "arquiteto"],
  },
  "como-funciona": {
    dica: "Aqui está o passo a passo do CasaAI. Ficou alguma dúvida?",
    perguntas: ["ia", "opcoes", "eletrica", "custo"],
  },
  briefing: {
    dica: "Comece pelo tamanho do terreno e escreva como quer a casa. Eu ajudo no caminho!",
    perguntas: ["comecar", "area", "moradores", "opcoes"],
  },
  planta: {
    dica: "Sua planta está pronta! Dá para editar, ver a elétrica, a hidráulica, o custo e entrar em 3D.",
    perguntas: ["editar", "tresd", "eletrica", "custo"],
  },
  construir: {
    dica: "Aqui você desenha do zero, cômodo por cômodo.",
    perguntas: ["zero", "editar", "tresd", "arquiteto"],
  },
  fases: {
    dica: "Essas são as partes do CasaAI: planta, elétrica, hidráulica, custo e 3D.",
    perguntas: ["tresd", "eletrica", "hidraulica", "arquiteto"],
  },
};

export const SAUDACAO = "Oi! Eu sou o Faísca ⚡, o assistente da CasaAI.";
export const NAO_SEI =
  "Hmm, essa eu não sei responder daqui 😅 Tente uma das perguntas abaixo, ou escreva de outro jeito.";

export const normalizar = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Resposta pronta que melhor combina com uma pergunta digitada (ou null). `pontos` = palavras encontradas. */
export function buscarResposta(pergunta: string): { resposta: Resposta; pontos: number } | null {
  const t = ` ${normalizar(pergunta)} `;
  let melhor: { resposta: Resposta; pontos: number } | null = null;
  for (const r of RESPOSTAS) {
    // palavra inteira (ou expressão inteira): "ia" não casa com "via"
    const pontos = r.palavras.filter((p) => t.includes(` ${p} `)).reduce((s, p) => s + (p.includes(" ") ? 2 : 1), 0);
    if (pontos > 0 && (!melhor || pontos > melhor.pontos)) melhor = { resposta: r, pontos };
  }
  return melhor;
}
