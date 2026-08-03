import { z } from "zod";

export const purchaseItemSchema = z.object({
  productId: z.string().min(1, "Selecione um produto"),
  quantity: z
    .number({ invalid_type_error: "Informe a quantidade" })
    .int("Deve ser inteiro")
    .min(1, "Mínimo 1"),
  unitCost: z
    .number({ invalid_type_error: "Informe o custo unitário" })
    .positive("Custo unitário deve ser maior que zero"),
});

export const purchaseSchema = z.object({
  nfNumber: z
    .string()
    .min(1, "Nº da NF é obrigatório")
    .max(30, "Nº da NF muito longo"),
  supplier: z
    .string()
    .min(2, "Informe o fornecedor")
    .max(120, "Fornecedor muito longo"),
  issueDate: z.string().min(1, "Informe a data de emissão"),
  items: z
    .array(purchaseItemSchema)
    .min(1, "Adicione ao menos um item à nota"),
});

export type PurchaseItemFormValues = z.infer<typeof purchaseItemSchema>;
export type PurchaseFormValues = z.infer<typeof purchaseSchema>;
