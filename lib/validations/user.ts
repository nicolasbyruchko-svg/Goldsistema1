import { z } from "zod";

export const userSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do usuário"),
  username: z
    .string()
    .trim()
    .min(3, "O login deve ter ao menos 3 caracteres")
    .regex(/^[a-zA-Z0-9._-]+$/, "Login inválido (use apenas letras, números, . _ -)"),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
  role: z.enum(["ADMIN", "OPERATOR"], {
    errorMap: () => ({ message: "Selecione o tipo de usuário" }),
  }),
  active: z.boolean(),
});

export type UserFormValues = z.infer<typeof userSchema>;

/** Esquema para edição: senha opcional (vazia = manter a atual). */
export const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do usuário"),
  username: z
    .string()
    .trim()
    .min(3, "O login deve ter ao menos 3 caracteres")
    .regex(/^[a-zA-Z0-9._-]+$/, "Login inválido (use apenas letras, números, . _ -)"),
  password: z.string().optional(),
  role: z.enum(["ADMIN", "OPERATOR"], {
    errorMap: () => ({ message: "Selecione o tipo de usuário" }),
  }),
  active: z.boolean(),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
