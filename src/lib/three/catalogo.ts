import type { Style } from "../types";

/**
 * CATÁLOGO DE MÓVEIS 3D (só dados, sem Three.js).
 *
 * Cada tipo de móvel tem um modelo padrão e várias variações. A mobília automática decide ONDE cada móvel vai
 * (mobilia.ts); este catálogo decide QUAL modelo usar, de acordo com o estilo da casa no briefing.
 * Todas as variações de um tipo ocupam a mesma área no chão, então trocar o modelo nunca quebra as regras
 * de encaixe (paredes, portas, janelas, circulação).
 *
 * Para adicionar um modelo: acrescente uma linha aqui e o desenho correspondente em
 * src/components/casa3d/Modelos.tsx (mesmo id).
 */

export type TipoMovel =
  | "sofa"
  | "poltrona"
  | "mesaCentro"
  | "rack"
  | "tv"
  | "mesa"
  | "mesaRedonda"
  | "cadeira"
  | "bancada"
  | "armarioSuperior"
  | "pia"
  | "fogao"
  | "geladeira"
  | "ilha"
  | "cama"
  | "criadoMudo"
  | "guardaRoupa"
  | "escrivaninha"
  | "cadeiraEscritorio"
  | "estante"
  | "vaso"
  | "lavatorio"
  | "espelho"
  | "box"
  | "maquina"
  | "tanque"
  | "armario"
  | "carro"
  | "sofaExterno"
  // decoração e complementos
  | "tapete"
  | "planta"
  | "luminaria"
  | "quadro"
  | "aparador"
  | "banqueta"
  | "puff"
  | "comoda"
  | "coifa"
  | "microondas"
  | "toalheiro"
  | "cesto"
  | "espreguicadeira"
  | "churrasqueira";

export interface Modelo {
  /** "tipo:nome-curto" — o mesmo id é usado no desenho 3D */
  id: string;
  tipo: TipoMovel;
  nome: string;
  /** estilos em que este modelo combina; vazio = combina com todos */
  estilos: Style[];
  /** o modelo original de cada tipo (antes do catálogo) */
  padrao?: boolean;
}

const MO: Style = "moderno";
const MI: Style = "minimalista";
const RU: Style = "rustico";
const CO: Style = "contemporaneo";
const CL: Style = "classico";

const m = (tipo: TipoMovel, slug: string, nome: string, estilos: Style[] = [], padrao = false): Modelo => ({
  id: `${tipo}:${slug}`,
  tipo,
  nome,
  estilos,
  padrao,
});
const P = (tipo: TipoMovel, nome: string) => m(tipo, "padrao", nome, [], true);

export const CATALOGO: Modelo[] = [
  // ── Sala ──
  P("sofa", "Sofá reto"),
  m("sofa", "palito", "Sofá retrô com pés palito", [MO, CO]),
  m("sofa", "modular", "Sofá modular baixo", [MI, MO]),
  m("sofa", "chesterfield", "Sofá chesterfield capitonê", [CL]),
  m("sofa", "futon", "Sofá futon", [MI, RU]),
  m("sofa", "almofadao", "Sofá com almofadões soltos", [CO, MO]),
  m("sofa", "madeira", "Sofá de estrutura de madeira", [RU]),
  P("poltrona", "Poltrona estofada"),
  m("poltrona", "concha", "Poltrona concha", [MO, CO]),
  m("poltrona", "bergere", "Poltrona bergère", [CL]),
  m("poltrona", "palito", "Poltrona com pés palito", [MO, MI]),
  m("poltrona", "vime", "Poltrona de vime", [RU]),
  m("poltrona", "boucle", "Poltrona bouclê arredondada", [CO, MI]),
  P("mesaCentro", "Mesa de centro de madeira"),
  m("mesaCentro", "redonda", "Mesa de centro redonda", [MO, CO]),
  m("mesaCentro", "vidro", "Mesa de centro de vidro", [MI, MO]),
  m("mesaCentro", "ninho", "Mesas de centro ninho", [CO]),
  m("mesaCentro", "bloco", "Mesa de centro bloco", [MI]),
  m("mesaCentro", "bau", "Baú de madeira", [RU, CL]),
  P("rack", "Rack de madeira"),
  m("rack", "suspenso", "Rack suspenso", [MO, MI]),
  m("rack", "nichos", "Rack com nichos", [CO]),
  m("rack", "palito", "Rack retrô pés palito", [MO, CO]),
  m("rack", "ripado", "Rack com frente ripada", [CO, MO]),
  m("rack", "demolicao", "Rack de madeira de demolição", [RU]),
  m("rack", "classico", "Rack com pés torneados", [CL]),
  P("tv", "TV com pé"),
  m("tv", "soundbar", "TV com soundbar", [MO, CO]),
  m("tv", "parede", "TV fina de parede", [MI]),
  // ── Jantar ──
  P("mesa", "Mesa de jantar de 4 pés"),
  m("mesa", "central", "Mesa com pé central", [MO, CO]),
  m("mesa", "cavalete", "Mesa cavalete", [RU, CO]),
  m("mesa", "vidro", "Mesa com tampo de vidro", [MI, MO]),
  m("mesa", "macica", "Mesa maciça rústica", [RU]),
  m("mesa", "classica", "Mesa com pés torneados", [CL]),
  P("mesaRedonda", "Mesa redonda de varanda"),
  m("mesaRedonda", "tulipa", "Mesa tulipa", [MO, MI]),
  m("mesaRedonda", "madeira", "Mesa redonda de madeira", [RU]),
  P("cadeira", "Cadeira de madeira"),
  m("cadeira", "concha", "Cadeira concha", [MO, CO]),
  m("cadeira", "palhinha", "Cadeira de palhinha", [RU, CO]),
  m("cadeira", "estofada", "Cadeira estofada", [CL]),
  m("cadeira", "industrial", "Cadeira industrial de metal", [MO]),
  m("cadeira", "windsor", "Cadeira windsor", [RU, CL]),
  m("cadeira", "lamina", "Cadeira de lâmina", [MI]),
  // ── Cozinha ──
  P("bancada", "Armário inferior branco"),
  m("bancada", "ripada", "Armário com frentes ripadas", [CO, MO]),
  m("bancada", "madeira", "Armário com frentes de madeira", [RU]),
  m("bancada", "provencal", "Armário com frentes almofadadas", [CL]),
  m("bancada", "cinza", "Armário cinza sem puxador", [MI]),
  P("armarioSuperior", "Armário aéreo branco"),
  m("armarioSuperior", "vidro", "Armário aéreo com portas de vidro", [CL, CO]),
  m("armarioSuperior", "aberto", "Prateleiras abertas", [MO, RU]),
  m("armarioSuperior", "madeira", "Armário aéreo de madeira", [RU]),
  P("pia", "Pia com cuba simples"),
  m("pia", "dupla", "Pia com cuba dupla", [CO, CL]),
  m("pia", "gourmet", "Cuba gourmet com torneira alta", [MO]),
  P("fogao", "Cooktop 4 bocas"),
  m("fogao", "piso", "Fogão de piso", [RU, CL]),
  m("fogao", "cinco", "Cooktop 5 bocas", [MO, CO]),
  m("fogao", "inducao", "Cooktop de indução", [MI]),
  P("geladeira", "Geladeira inox"),
  m("geladeira", "branca", "Geladeira branca", [MI, CL]),
  m("geladeira", "retro", "Geladeira retrô colorida", [RU, CO]),
  m("geladeira", "preta", "Geladeira preta fosca", [MO]),
  P("ilha", "Ilha com tampo de mármore"),
  m("ilha", "madeira", "Ilha de madeira", [RU]),
  m("ilha", "cascata", "Ilha com tampo cascata", [MO, MI]),
  // ── Quartos ──
  P("cama", "Cama com cabeceira de madeira"),
  m("cama", "bau", "Cama box baú", [MI, CO]),
  m("cama", "plataforma", "Cama plataforma baixa", [MI, MO]),
  m("cama", "estofada", "Cama com cabeceira estofada alta", [CL, CO]),
  m("cama", "ripada", "Cama com cabeceira ripada", [CO, MO]),
  m("cama", "ferro", "Cama de ferro", [RU, CL]),
  m("cama", "classica", "Cama clássica com peseira", [CL]),
  P("criadoMudo", "Criado-mudo com abajur"),
  m("criadoMudo", "suspenso", "Criado-mudo suspenso", [MO, MI]),
  m("criadoMudo", "palito", "Criado-mudo pés palito", [MO, CO]),
  m("criadoMudo", "redondo", "Mesa de cabeceira redonda", [CO]),
  m("criadoMudo", "classico", "Criado-mudo clássico com gavetas", [CL]),
  m("criadoMudo", "tronco", "Banqueta de tronco", [RU]),
  P("guardaRoupa", "Guarda-roupa de correr"),
  m("guardaRoupa", "giro", "Guarda-roupa de portas de giro", [CL]),
  m("guardaRoupa", "espelhado", "Guarda-roupa espelhado", [CO, MO]),
  m("guardaRoupa", "ripado", "Guarda-roupa ripado", [CO]),
  m("guardaRoupa", "madeira", "Guarda-roupa de madeira maciça", [RU]),
  P("escrivaninha", "Escrivaninha de madeira"),
  m("escrivaninha", "metal", "Escrivaninha com pés metálicos", [MO]),
  m("escrivaninha", "gaveteiro", "Escrivaninha com gaveteiro", [CL, CO]),
  m("escrivaninha", "suspensa", "Escrivaninha suspensa", [MI]),
  P("cadeiraEscritorio", "Cadeira de escritório"),
  m("cadeiraEscritorio", "gamer", "Cadeira gamer", [MO]),
  m("cadeiraEscritorio", "madeira", "Cadeira de escritório de madeira", [RU, CL]),
  P("estante", "Estante de madeira"),
  m("estante", "nichos", "Estante de nichos", [MO, CO]),
  m("estante", "escada", "Estante escada", [RU, CO]),
  m("estante", "industrial", "Estante industrial", [MO]),
  P("comoda", "Cômoda de gavetas"),
  m("comoda", "retro", "Cômoda retrô pés palito", [MO, CO, RU]),
  // ── Banheiro ──
  P("vaso", "Vaso com caixa acoplada"),
  m("vaso", "suspenso", "Vaso suspenso", [MO, MI]),
  m("vaso", "redondo", "Vaso clássico arredondado", [CL]),
  P("lavatorio", "Gabinete com cuba"),
  m("lavatorio", "apoio", "Bancada com cuba de apoio", [MO, CO]),
  m("lavatorio", "suspenso", "Lavatório suspenso", [MI]),
  m("lavatorio", "coluna", "Lavatório de coluna", [CL]),
  m("lavatorio", "rustico", "Bancada de madeira com cuba", [RU]),
  P("espelho", "Espelho retangular"),
  m("espelho", "redondo", "Espelho redondo", [MO, CO]),
  m("espelho", "moldura", "Espelho com moldura", [CL, RU]),
  m("espelho", "led", "Espelho com luz de LED", [MI, MO]),
  P("box", "Box de vidro com perfil inox"),
  m("box", "preto", "Box com perfil preto", [MO, CO]),
  m("box", "inteiro", "Box de vidro inteiro", [MI]),
  P("toalheiro", "Toalheiro com toalha"),
  P("cesto", "Cesto de roupa"),
  // ── Serviço ──
  P("maquina", "Lava-roupas frontal"),
  m("maquina", "topo", "Lava-roupas de abertura superior", [CL, RU]),
  m("maquina", "lavaseca", "Lava e seca escura", [MO]),
  P("tanque", "Tanque de louça"),
  m("tanque", "inox", "Tanque de inox", [MO, MI]),
  m("tanque", "gabinete", "Tanque com gabinete", [CO, CL]),
  P("armario", "Armário alto"),
  m("armario", "vassoureiro", "Armário vassoureiro", [CL, RU]),
  m("armario", "aberto", "Armário de prateleiras abertas", [MO, CO]),
  // ── Garagem ──
  P("carro", "Sedã"),
  m("carro", "hatch", "Hatch"),
  m("carro", "suv", "SUV"),
  m("carro", "picape", "Picape"),
  m("carro", "esportivo", "Esportivo"),
  // ── Varanda e área gourmet ──
  P("sofaExterno", "Sofá externo de madeira"),
  m("sofaExterno", "vime", "Sofá externo de vime", [RU, CO]),
  m("sofaExterno", "pallet", "Sofá de pallet", [RU, MI]),
  m("sofaExterno", "aluminio", "Sofá externo de alumínio", [MO]),
  P("espreguicadeira", "Espreguiçadeira de madeira"),
  m("espreguicadeira", "aluminio", "Espreguiçadeira de alumínio", [MO, MI]),
  P("churrasqueira", "Churrasqueira de alvenaria"),
  m("churrasqueira", "inox", "Churrasqueira de inox", [MO, MI]),
  // ── Decoração e complementos ──
  P("tapete", "Tapete liso"),
  m("tapete", "listrado", "Tapete listrado", [CO, RU]),
  m("tapete", "redondo", "Tapete redondo", [MO, CO]),
  m("tapete", "sisal", "Tapete de sisal", [RU, MI]),
  m("tapete", "persa", "Tapete persa", [CL]),
  P("planta", "Costela-de-adão"),
  m("planta", "palmeira", "Palmeira ráfis"),
  m("planta", "ficus", "Fícus"),
  m("planta", "cacto", "Cacto"),
  m("planta", "espada", "Espada-de-são-jorge"),
  P("luminaria", "Luminária de piso coluna"),
  m("luminaria", "arco", "Luminária de arco", [MO, CO]),
  m("luminaria", "tripe", "Luminária tripé", [RU, CO]),
  P("quadro", "Quadro abstrato"),
  m("quadro", "paisagem", "Quadro de paisagem", [CL, RU]),
  m("quadro", "trio", "Trio de quadros", [MO, CO, MI]),
  P("aparador", "Aparador de madeira"),
  m("aparador", "palito", "Aparador pés palito", [MO, CO]),
  m("aparador", "laca", "Aparador laqueado", [MI, CL]),
  P("banqueta", "Banqueta alta de metal"),
  m("banqueta", "madeira", "Banqueta alta de madeira", [RU, CO]),
  P("puff", "Puff redondo"),
  m("puff", "quadrado", "Puff quadrado", [MI, CL]),
  P("coifa", "Coifa de parede"),
  m("coifa", "reta", "Coifa reta embutida", [MI, CO]),
  P("microondas", "Micro-ondas"),
];

/** Quantos modelos novos o catálogo acrescenta além do modelo original de cada tipo. */
export const MODELOS_NOVOS = CATALOGO.filter(
  (x) =>
    !x.padrao ||
    ![
      "sofa",
      "poltrona",
      "mesaCentro",
      "rack",
      "tv",
      "mesa",
      "mesaRedonda",
      "cadeira",
      "bancada",
      "armarioSuperior",
      "pia",
      "fogao",
      "geladeira",
      "ilha",
      "cama",
      "criadoMudo",
      "guardaRoupa",
      "escrivaninha",
      "cadeiraEscritorio",
      "estante",
      "vaso",
      "lavatorio",
      "espelho",
      "box",
      "maquina",
      "tanque",
      "armario",
      "carro",
      "sofaExterno",
    ].includes(x.tipo),
).length;

/** Número pseudoaleatório estável a partir de um texto (FNV-1a): a mesma casa sempre recebe os mesmos modelos. */
export function hash(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Escolhe o modelo de um tipo para a casa: prefere os que combinam com o estilo do briefing
 * (os sem estilo combinam com todos) e sorteia entre eles de forma estável pela `semente`.
 */
export function escolherModelo(tipo: TipoMovel, estilo: Style | undefined, semente: string): string {
  const todos = CATALOGO.filter((x) => x.tipo === tipo);
  if (!todos.length) return `${tipo}:padrao`;
  const doEstilo = estilo ? todos.filter((x) => x.estilos.length === 0 || x.estilos.includes(estilo)) : todos;
  const lista = doEstilo.length ? doEstilo : todos;
  return lista[hash(`${semente}|${tipo}`) % lista.length].id;
}

export const modeloPorId = (id: string) => CATALOGO.find((x) => x.id === id);
