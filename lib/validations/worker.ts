import { z } from "zod";

export const workerSchema = z.object({
  matricula: z
    .string()
    .min(1, "Matrícula é obrigatória")
    .max(20, "Matrícula muito longa"),
  name: z
    .string()
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(100, "Nome muito longo"),
  cpf: z
    .string()
    .min(1, "CPF é obrigatório")
    .refine(
      (val) => val.replace(/\D/g, "").length === 11,
      "CPF deve ter 11 dígitos"
    ),
  role: z
    .string()
    .min(1, "Função é obrigatória")
    .max(60, "Função muito longa"),
  admissionDate: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  projectId: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

export type WorkerFormValues = z.infer<typeof workerSchema>;
