import { z } from "zod";

export const devolutionItemSchema = z.object({
  productId: z.string().min(1, "Selecione um produto"),
  quantity: z
    .number({ invalid_type_error: "Informe a quantidade" })
    .int("Deve ser inteiro")
    .min(1, "Mínimo 1"),
  condition: z.enum(["GOOD", "UNUSABLE", "SEWING"], {
    required_error: "Selecione o estado do item",
  }),
});

export const devolutionSchema = z.object({
  workerId: z.string().min(1, "Selecione um trabalhador"),
  reason: z.enum(["DISMISSAL", "EXCHANGE"], {
    required_error: "Selecione o motivo",
  }),
  devolvedAt: z.string().min(1, "Informe a data da devolução"),
  items: z
    .array(devolutionItemSchema)
    .min(1, "Adicione ao menos um item à devolução"),
});

export type DevolutionItemFormValues = z.infer<typeof devolutionItemSchema>;
export type DevolutionFormValues = z.infer<typeof devolutionSchema>;
