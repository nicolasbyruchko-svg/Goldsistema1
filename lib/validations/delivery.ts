import { z } from "zod";

export const deliveryItemSchema = z.object({
  productId: z.string().min(1, "Selecione um produto"),
  quantity: z
    .number({ invalid_type_error: "Informe a quantidade" })
    .int("Deve ser inteiro")
    .min(1, "Mínimo 1"),
  reason: z.enum(["FIRST_DELIVERY", "REPLACEMENT_WEAR", "REPLACEMENT_LOSS", "RETURN_TO_WORK", "SIZE_EXCHANGE"], {
    required_error: "Selecione o motivo",
  }),
});

export const deliverySchema = z.object({
  workerId: z.string().min(1, "Selecione um trabalhador"),
  items: z
    .array(deliveryItemSchema)
    .min(1, "Adicione ao menos um item à entrega"),
});

export type DeliveryItemFormValues = z.infer<typeof deliveryItemSchema>;
export type DeliveryFormValues = z.infer<typeof deliverySchema>;
