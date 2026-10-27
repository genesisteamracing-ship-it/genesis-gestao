"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logoutAction, switchSuperAdminTeamAction } from "@/actions/auth-actions";
import { useInvalidateDashboard } from "@/hooks/use-invalidate-dashboard";
import type { AuthenticatedUserDTO } from "@/types/auth";

export function useAppHeader(currentUser: AuthenticatedUserDTO) {
  const router = useRouter();
  const [isSwitchingTeam, startTransition] = React.useTransition();
  const [isLoggingOut, startLogoutTransition] = React.useTransition();
  const invalidateDashboard = useInvalidateDashboard();

  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";
  const initials = React.useMemo(
    () =>
      currentUser.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [currentUser.name]
  );

  const handleTeamChange = React.useCallback(
    (newTeamId: string) => {
      startTransition(async () => {
        const res = await switchSuperAdminTeamAction(newTeamId);
        if (!res.success) {
          toast.error(res.message);
          return;
        }
        toast.success(res.message);
        invalidateDashboard();
        router.refresh();
      });
    },
    [router, invalidateDashboard]
  );

  const handleLogout = React.useCallback(() => {
    startLogoutTransition(async () => {
      try {
        await logoutAction();
      } catch (err) {
        console.error("Erro ao deslogar:", err);
      } finally {
        window.location.href = "/login";
      }
    });
  }, []);

  return {
    isSuperAdmin,
    initials,
    isSwitchingTeam,
    isLoggingOut,
    handleTeamChange,
    handleLogout,
  };
}
