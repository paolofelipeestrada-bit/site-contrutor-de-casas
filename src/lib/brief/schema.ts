import { z } from "zod";
import { ROOM_TYPES, STYLES } from "../types";

/** Schema do Brief — usado para a saída estruturada da IA e para validar no cliente. */
export const BriefSchema = z.object({
  terreno: z.object({
    largura: z.number().describe("Largura (frente) do terreno em metros"),
    profundidade: z.number().describe("Profundidade (fundo) do terreno em metros"),
  }),
  casa: z.object({
    area: z.number().describe("Área construída desejada em m²"),
  }),
  estilo: z.enum(STYLES),
  ambientes: z
    .array(
      z.object({
        tipo: z.enum(ROOM_TYPES),
        area: z.number().nullable().describe("Área sugerida em m², ou null para o sistema decidir"),
        nome: z.string().nullable(),
      }),
    )
    .describe("Lista de cômodos. Cada suíte é 'suite' (o banheiro dela é criado automaticamente)."),
  preferencias: z.object({
    salaCozinhaIntegradas: z.boolean(),
    varandaPosicao: z.enum(["frente", "fundos", "lateral"]),
    quartosReservados: z.boolean(),
    luzNatural: z.boolean(),
  }),
  carro: z
    .object({
      comprimento: z.number(),
      largura: z.number(),
      vagas: z.number(),
    })
    .nullable(),
  observacoes: z.array(z.string()).describe("Decisões e suposições em português, curtas"),
});

export type BriefFromSchema = z.infer<typeof BriefSchema>;
