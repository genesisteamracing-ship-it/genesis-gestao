"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  toggleUserModulePermissionAction,
  updateAllUserPermissionsAction,
} from "@/actions/auth-actions";
import type {
  SystemModuleKey,
  TeamMemberDTO,
  UserModulePermissionsDTO,
} from "@/types/auth";

export interface UsePermissionsTableProps {
  initialMembers: TeamMemberDTO[];
  currentUserId: string;
}

const PAGE_SIZE = 10;

export function usePermissionsTable({
  initialMembers,
  currentUserId,
}: UsePermissionsTableProps) {
  const [members, setMembers] = useState<TeamMemberDTO[]>(initialMembers);
  const [searchTerm, setSearchTerm] = useState("");
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);

  // Filtro por busca e equipe
  const filteredMembers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return members.filter((member) => {
      const matchesTeam =
        teamFilter === "ALL" || member.teamId === teamFilter;

      if (!matchesTeam) return false;
      if (!term) return true;

      const nameMatch = member.name.toLowerCase().includes(term);
      const emailMatch = member.email.toLowerCase().includes(term);
      const roleMatch = (member.jobTitle || "").toLowerCase().includes(term);

      return nameMatch || emailMatch || roleMatch;
    });
  }, [members, searchTerm, teamFilter]);

  // Paginação fixa em 10 itens
  const totalFiltered = filteredMembers.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedMembers = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * PAGE_SIZE;
    return filteredMembers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredMembers, validCurrentPage]);

  const startRow = totalFiltered === 0 ? 0 : (validCurrentPage - 1) * PAGE_SIZE + 1;
  const endRow = Math.min(validCurrentPage * PAGE_SIZE, totalFiltered);

  // Alternar permissão de módulo individual
  const handleTogglePermission = async (
    targetMember: TeamMemberDTO,
    moduleKey: SystemModuleKey,
    nextAllowed: boolean
  ) => {
    // Invariante de auto-bloqueio administrativo
    if (
      targetMember.id === currentUserId &&
      moduleKey === "team" &&
      nextAllowed === false
    ) {
      toast.error(
        "Você não pode revogar seu próprio acesso ao módulo de Equipe & Permissões."
      );
      return;
    }

    const cellKey = `${targetMember.id}-${moduleKey}`;
    const previousPermissions = { ...targetMember.permissions };

    // Atualização otimista imediata
    setMembers((prev) =>
      prev.map((m) =>
        m.id === targetMember.id
          ? {
              ...m,
              permissions: {
                ...m.permissions,
                [moduleKey]: nextAllowed,
              },
            }
          : m
      )
    );
    setLoadingMap((prev) => ({ ...prev, [cellKey]: true }));

    try {
      const response = await toggleUserModulePermissionAction({
        userId: targetMember.id,
        moduleKey,
        allowed: nextAllowed,
      });

      if (!response.success) {
        // Rollback
        setMembers((prev) =>
          prev.map((m) =>
            m.id === targetMember.id
              ? { ...m, permissions: previousPermissions }
              : m
          )
        );
        toast.error(response.message || "Erro ao salvar permissão.");
      } else {
        toast.success(response.message || "Permissão salva com sucesso.");
      }
    } catch {
      // Rollback
      setMembers((prev) =>
        prev.map((m) =>
          m.id === targetMember.id
            ? { ...m, permissions: previousPermissions }
            : m
        )
      );
      toast.error("Falha na comunicação ao atualizar permissão.");
    } finally {
      setLoadingMap((prev) => ({ ...prev, [cellKey]: false }));
    }
  };

  // Conceder todos os módulos
  const handleGrantAll = async (targetMember: TeamMemberDTO) => {
    const previousPermissions = { ...targetMember.permissions };
    const nextPermissions: UserModulePermissionsDTO = {
      finance: true,
      roi: true,
      communication: true,
      tasks: true,
      team: true,
    };

    setMembers((prev) =>
      prev.map((m) =>
        m.id === targetMember.id
          ? { ...m, permissions: nextPermissions }
          : m
      )
    );

    try {
      const response = await updateAllUserPermissionsAction({
        userId: targetMember.id,
        ...nextPermissions,
      });

      if (!response.success) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === targetMember.id
              ? { ...m, permissions: previousPermissions }
              : m
          )
        );
        toast.error(response.message);
      } else {
        toast.success(`Todos os módulos liberados para ${targetMember.name}.`);
      }
    } catch {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === targetMember.id
            ? { ...m, permissions: previousPermissions }
            : m
        )
      );
      toast.error("Erro ao aplicar permissões.");
    }
  };

  // Restringir módulos operacionais
  const handleRestrictOperational = async (targetMember: TeamMemberDTO) => {
    const previousPermissions = { ...targetMember.permissions };
    // Se for o próprio admin, mantém team: true
    const nextTeamPermission =
      targetMember.id === currentUserId ? true : false;

    const nextPermissions: UserModulePermissionsDTO = {
      finance: false,
      roi: false,
      communication: false,
      tasks: false,
      team: nextTeamPermission,
    };

    setMembers((prev) =>
      prev.map((m) =>
        m.id === targetMember.id
          ? { ...m, permissions: nextPermissions }
          : m
      )
    );

    try {
      const response = await updateAllUserPermissionsAction({
        userId: targetMember.id,
        ...nextPermissions,
      });

      if (!response.success) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === targetMember.id
              ? { ...m, permissions: previousPermissions }
              : m
          )
        );
        toast.error(response.message);
      } else {
        toast.success(`Módulos operacionais restringidos para ${targetMember.name}.`);
      }
    } catch {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === targetMember.id
            ? { ...m, permissions: previousPermissions }
            : m
        )
      );
      toast.error("Erro ao aplicar permissões.");
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    teamFilter,
    setTeamFilter,
    loadingMap,
    totalFiltered,
    totalPages,
    currentPage: validCurrentPage,
    setCurrentPage,
    paginatedMembers,
    startRow,
    endRow,
    handleTogglePermission,
    handleGrantAll,
    handleRestrictOperational,
  };
}
