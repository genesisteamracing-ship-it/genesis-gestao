"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { switchSuperAdminTeamAction } from "@/actions/auth-actions";
import type { AuthenticatedUserDTO } from "@/types/auth";

export function useAppHeader(currentUser: AuthenticatedUserDTO) {
  const router = useRouter();
  const [isSwitchingTeam, startTransition] = React.useTransition();

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
        router.refresh();
      });
    },
    [router]
  );

  return {
    isSuperAdmin,
    initials,
    isSwitchingTeam,
    handleTeamChange,
  };
}
