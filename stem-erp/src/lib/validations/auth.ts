import { z } from "zod";
import {
  isValidSeasonLabel,
  parseSeasonDate,
  validateSeasonRange,
} from "@/lib/season";
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

export const createTeamSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "O nome da equipe deve ter no mínimo 3 caracteres"),
    schoolOrOrg: z
      .string()
      .trim()
      .min(2, "Informe a escola, instituição ou organização da equipe"),
    season: z
      .string()
      .refine(isValidSeasonLabel, "Selecione a temporada (ex: 2025/2026)"),
    seasonStartDate: z
      .string()
      .min(1, "Informe a data de início da temporada")
      .refine((v) => parseSeasonDate(v) !== null, "Data de início inválida"),
    seasonEndDate: z
      .string()
      .min(1, "Informe a data de fim da temporada")
      .refine((v) => parseSeasonDate(v) !== null, "Data de fim inválida"),
  })
  .superRefine((data, ctx) => {
    const start = parseSeasonDate(data.seasonStartDate);
    const end = parseSeasonDate(data.seasonEndDate);
    if (!start || !end) return;

    const error = validateSeasonRange(start, end);
    if (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["seasonEndDate"],
        message: error,
      });
    }
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
  teamId: z.string().min(1, "Selecione a equipe (ex: Equipe Gênesis)"),
  role: z.enum(userRoleValues, {
    required_error: "Selecione a permissão na plataforma",
  }),
  deliveryGroup: z.enum(deliveryGroupValues, {
    required_error: "Selecione o setor interno da equipe",
  }),
  jobTitle: z.string().trim().min(2, "Informe o cargo no setor"),
});

export const updateMemberAccessSchema = z.object({
  userId: z.string().min(1, "ID do usuário é obrigatório"),
  teamId: z.string().min(1, "Selecione a equipe"),
  role: z.enum(userRoleValues),
  deliveryGroup: z.enum(deliveryGroupValues),
  jobTitle: z.string().trim().min(2, "Informe o cargo no setor"),
  isActive: z.boolean(),
});

export const deleteTeamSchema = z.object({
  teamId: z.string().min(1, "ID da equipe é obrigatório"),
  confirmationText: z
    .string()
    .trim()
    .refine((val: string): boolean => val === "EXCLUIR", {
      message: 'Digite exatamente "EXCLUIR" em letras maiúsculas para confirmar.',
    }),
});

export const deleteMemberSchema = z.object({
  userId: z.string().min(1, "ID do integrante é obrigatório"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberAccessInput = z.infer<typeof updateMemberAccessSchema>;
export type DeleteTeamInput = z.infer<typeof deleteTeamSchema>;
export type DeleteMemberInput = z.infer<typeof deleteMemberSchema>;
