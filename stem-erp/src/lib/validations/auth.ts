import { z } from "zod";
import { deliveryGroupValues } from "./financial";

export const userRoleValues = [
  "SUPER_ADMIN",
  "FINANCE_MANAGER",
  "TEAM_LEAD",
  "AUDITOR",
] as const;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Informe um e-mail corporativo válido"),
  password: z
    .string()
    .min(1, "Informe sua senha de acesso")
    .max(128, "Senha excede o limite permitido"),
});

export const createMemberSchema = z.object({
  name: z.string().trim().min(3, "O nome deve ter no mínimo 3 caracteres"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Informe um e-mail corporativo válido"),
  password: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "Deve conter ao menos uma letra maiúscula")
    .regex(/[a-z]/, "Deve conter ao menos uma letra minúscula")
    .regex(/[0-9]/, "Deve conter ao menos um número"),
  role: z.enum(userRoleValues, {
    required_error: "Selecione a função de acesso na plataforma",
  }),
  deliveryGroup: z.enum(deliveryGroupValues, {
    required_error: "Selecione a equipe / grupo de entrega",
  }),
  jobTitle: z.string().trim().min(2, "Informe o cargo na equipe"),
});

export const updateMemberAccessSchema = z.object({
  userId: z.string().min(1, "ID do usuário é obrigatório"),
  role: z.enum(userRoleValues),
  deliveryGroup: z.enum(deliveryGroupValues),
  jobTitle: z.string().trim().min(2, "Informe o cargo na equipe"),
  isActive: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberAccessInput = z.infer<typeof updateMemberAccessSchema>;
