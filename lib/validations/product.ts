import { z } from "zod";

export const productSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(100, "Nome muito longo"),
  sku: z
    .string()
    .min(1, "SKU é obrigatório")
    .max(50, "SKU muito longo"),
  type: z.enum(["EPI", "UNIFORM"], {
    required_error: "Selecione o tipo",
  }),
  size: z.string().max(20).optional(),
  caNumber: z.string().max(20).optional(),
  caValidity: z.string().optional(), // ISO date string, converted to Date on server
  unitCost: z
    .number({ invalid_type_error: "Informe o custo unitário" })
    .min(0, "Custo unitário não pode ser negativo")
    .optional(),
  supplier: z.string().max(120, "Fornecedor muito longo").optional(),
  stockQuantity: z
    .number({ invalid_type_error: "Informe a quantidade" })
    .int("Deve ser inteiro")
    .min(0, "Quantidade não pode ser negativa"),
  minStock: z
    .number({ invalid_type_error: "Informe o estoque mínimo" })
    .int("Deve ser inteiro")
    .min(0, "Estoque mínimo não pode ser negativo"),
});

export type ProductFormValues = z.infer<typeof productSchema>;
