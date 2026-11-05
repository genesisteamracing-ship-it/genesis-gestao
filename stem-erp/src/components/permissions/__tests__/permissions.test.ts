import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { UserRole } from "@prisma/client";
import {
  canModifyUserModulePermission,
  getDefaultModulePermissionsByRole,
  getFirstAllowedRoute,
  hasModuleAccess,
  SYSTEM_MODULES_META,
} from "../../../lib/permissions";
import {
  systemModuleKeySchema,
  toggleUserModulePermissionSchema,
  updateAllUserPermissionsSchema,
} from "../../../lib/validations/auth";
import { modulePermissionToggleStyles } from "../module-permission-toggle";

describe("Motor de Permissões de Módulo e Regras de Segurança", () => {
  it("deve carregar os metadados dos 4 módulos do sistema com labels e rotas padrão", () => {
    assert.equal(SYSTEM_MODULES_META.finance.label, "Financeiro");
    assert.equal(SYSTEM_MODULES_META.roi.label, "ROI & Patrocínio");
    assert.equal(SYSTEM_MODULES_META.communication.label, "Comunicação");
    assert.equal(SYSTEM_MODULES_META.team.label, "Equipe & Acessos");
  });

  it("deve conceder todas as permissões para SUPER_ADMIN por padrão", () => {
    const permissions = getDefaultModulePermissionsByRole(UserRole.SUPER_ADMIN);
    assert.equal(permissions.finance, true);
    assert.equal(permissions.roi, true);
    assert.equal(permissions.communication, true);
    assert.equal(permissions.team, true);
  });

  it("deve conceder apenas módulos operacionais para TEAM_LEAD e AUDITOR por padrão", () => {
    const leadPermissions = getDefaultModulePermissionsByRole(UserRole.TEAM_LEAD);
    assert.equal(leadPermissions.finance, true);
    assert.equal(leadPermissions.roi, true);
    assert.equal(leadPermissions.communication, true);
    assert.equal(leadPermissions.team, false);

    const auditorPermissions = getDefaultModulePermissionsByRole(UserRole.AUDITOR);
    assert.equal(auditorPermissions.team, false);
  });

  it("deve impedir auto-bloqueio administrativo quando o próprio admin tenta colocar team=false", () => {
    const result = canModifyUserModulePermission({
      currentAdminUserId: "admin-123",
      targetUserId: "admin-123",
      moduleKey: "team",
      nextAllowed: false,
    });

    assert.equal(result.allowed, false);
    assert.match(result.reason ?? "", /não pode revogar seu próprio acesso/);
  });

  it("deve permitir que o admin altere outros módulos de si mesmo ou qualquer módulo de terceiros", () => {
    const adminFinanceChange = canModifyUserModulePermission({
      currentAdminUserId: "admin-123",
      targetUserId: "admin-123",
      moduleKey: "finance",
      nextAllowed: false,
    });
    assert.equal(adminFinanceChange.allowed, true);

    const otherUserTeamChange = canModifyUserModulePermission({
      currentAdminUserId: "admin-123",
      targetUserId: "user-456",
      moduleKey: "team",
      nextAllowed: false,
    });
    assert.equal(otherUserTeamChange.allowed, true);
  });

  it("deve resolver a primeira rota permitida em ordem de prioridade", () => {
    assert.equal(
      getFirstAllowedRoute({ finance: true, roi: false, communication: false, team: false }),
      "/dashboard"
    );
    assert.equal(
      getFirstAllowedRoute({ finance: false, roi: true, communication: false, team: false }),
      "/roi"
    );
    assert.equal(
      getFirstAllowedRoute({ finance: false, roi: false, communication: true, team: false }),
      "/comunicacao"
    );
    assert.equal(
      getFirstAllowedRoute({ finance: false, roi: false, communication: false, team: true }),
      "/equipe"
    );
  });

  it("deve validar o schema de toggle com módulo válido e booleano", () => {
    const valid = toggleUserModulePermissionSchema.safeParse({
      userId: "user-123",
      moduleKey: "finance",
      allowed: true,
    });
    assert.equal(valid.success, true);

    const invalidModule = toggleUserModulePermissionSchema.safeParse({
      userId: "user-123",
      moduleKey: "invalid_module",
      allowed: true,
    });
    assert.equal(invalidModule.success, false);
  });

  it("deve validar o schema de permissões em lote", () => {
    const valid = updateAllUserPermissionsSchema.safeParse({
      userId: "user-123",
      finance: true,
      roi: false,
      communication: true,
      team: false,
    });
    assert.equal(valid.success, true);
  });
});

describe("ModulePermissionToggle Styles (tailwind-variants)", () => {
  it("deve gerar classes corretas para o estado SIM e NÃO sem hardcode de cores", () => {
    const stylesAllowed = modulePermissionToggleStyles({ allowed: true });
    assert.ok(stylesAllowed.pillYes().includes("bg-success"));

    const stylesDenied = modulePermissionToggleStyles({ allowed: false });
    assert.ok(stylesDenied.pillNo().includes("bg-destructive"));
  });
});
