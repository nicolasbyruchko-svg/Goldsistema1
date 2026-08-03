import { z } from "zod";

export const projectSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(100, "Nome muito longo"),
  description: z.string().max(500, "Descrição muito longa").optional(),
  costCenterCode: z.string().max(30, "Código muito longo").optional(),
  active: z.boolean().optional(),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
