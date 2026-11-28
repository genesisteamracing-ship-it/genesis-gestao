"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteMilestoneAction, updateMilestoneCheckAction } from "@/actions/tasks.actions";
import type {
  MilestoneCheckStatus,
  MilestoneCriterionCheckRecord,
  TaskMilestoneRecord,
} from "@/types/tasks";

export type MilestoneFormState = {
  open: boolean;
  milestone?: TaskMilestoneRecord;
  defaultDate?: string;
};

export function useGanttMilestones({
  teamId,
  canEdit,
  milestones,
  defaultDate,
}: {
  teamId?: string;
  canEdit: boolean;
  milestones: TaskMilestoneRecord[];
  defaultDate: string;
}) {
  const router = useRouter();
  const [optimisticChecks, setOptimisticChecks] = useState<{
    forMilestones: TaskMilestoneRecord[];
    overrides: Record<string, MilestoneCriterionCheckRecord[]>;
  }>({
    forMilestones: milestones,
    overrides: {},
  });
  const [formState, setFormState] = useState<MilestoneFormState>({ open: false });
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [pendingCheckKey, setPendingCheckKey] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeOverrides = useMemo(
    () => (optimisticChecks.forMilestones === milestones ? optimisticChecks.overrides : {}),
    [optimisticChecks, milestones],
  );

  const currentMilestones = useMemo(
    () =>
      milestones.map((milestone) => {
        const overrideChecks = activeOverrides[milestone.id];
        return overrideChecks ? { ...milestone, checks: overrideChecks } : milestone;
      }),
    [milestones, activeOverrides],
  );

  const selectedMilestone = useMemo(
    () => currentMilestones.find((item) => item.id === selectedMilestoneId) ?? null,
    [currentMilestones, selectedMilestoneId],
  );

  const openCreate = useCallback(
    (targetDate?: string) => {
      if (!canEdit || !teamId) return;
      setFormState({
        open: true,
        milestone: undefined,
        defaultDate: targetDate || defaultDate,
      });
    },
    [canEdit, teamId, defaultDate],
  );

  const openEdit = useCallback(
    (milestone: TaskMilestoneRecord) => {
      if (!canEdit || !teamId) return;
      setSelectedMilestoneId(null);
      setFormState({
        open: true,
        milestone,
        defaultDate: milestone.targetDate,
      });
    },
    [canEdit, teamId],
  );

  const closeForm = useCallback(() => {
    setFormState({ open: false });
  }, []);

  const openVerify = useCallback((milestoneId: string) => {
    setSelectedMilestoneId(milestoneId);
  }, []);

  const closeVerify = useCallback(() => {
    setSelectedMilestoneId(null);
  }, []);

  const handleCheckChange = useCallback(
    async ({
      milestoneId,
      criterionId,
      taskId,
      status,
      notes,
    }: {
      milestoneId: string;
      criterionId: string;
      taskId: string;
      status: MilestoneCheckStatus;
      notes?: string;
    }) => {
      if (!teamId || !canEdit) return;
      const targetMilestone = currentMilestones.find((item) => item.id === milestoneId);
      if (!targetMilestone) return;

      const checkKey = `${milestoneId}:${criterionId}:${taskId}`;
      setPendingCheckKey(checkKey);

      const previousChecks = targetMilestone.checks;
      const filtered = previousChecks.filter(
        (item) => !(item.criterionId === criterionId && item.taskId === taskId),
      );
      const nextCheck: MilestoneCriterionCheckRecord = {
        criterionId,
        taskId,
        status,
        notes: notes?.trim() || null,
        checkedByName: null,
        checkedAt: status === "PENDING" ? null : new Date().toISOString(),
      };

      setOptimisticChecks((prev) => ({
        forMilestones: milestones,
        overrides: {
          ...(prev.forMilestones === milestones ? prev.overrides : {}),
          [milestoneId]: [...filtered, nextCheck],
        },
      }));

      try {
        const res = await updateMilestoneCheckAction({
          teamId,
          milestoneId,
          criterionId,
          taskId,
          status,
          notes,
        });
        if (res.ok) {
          router.refresh();
        } else {
          setOptimisticChecks((prev) => ({
            forMilestones: milestones,
            overrides: {
              ...(prev.forMilestones === milestones ? prev.overrides : {}),
              [milestoneId]: previousChecks,
            },
          }));
          toast.error(res.message || "Não foi possível atualizar o critério.");
        }
      } catch {
        setOptimisticChecks((prev) => ({
          forMilestones: milestones,
          overrides: {
            ...(prev.forMilestones === milestones ? prev.overrides : {}),
            [milestoneId]: previousChecks,
          },
        }));
        toast.error("Erro ao atualizar critério do marco.");
      } finally {
        setPendingCheckKey(null);
      }
    },
    [teamId, canEdit, currentMilestones, milestones, router],
  );

  const handleDeleteMilestone = useCallback(
    async (milestoneId: string) => {
      if (!teamId || !canEdit) return;
      setIsDeleting(true);
      try {
        const res = await deleteMilestoneAction({ teamId, id: milestoneId });
        if (res.ok) {
          toast.success("Marco excluído com sucesso.");
          setSelectedMilestoneId(null);
          router.refresh();
        } else {
          toast.error(res.message || "Não foi possível excluir o marco.");
        }
      } catch {
        toast.error("Erro ao excluir marco.");
      } finally {
        setIsDeleting(false);
      }
    },
    [teamId, canEdit, router],
  );

  return {
    currentMilestones,
    formState,
    selectedMilestone,
    pendingCheckKey,
    isDeleting,
    openCreate,
    openEdit,
    closeForm,
    openVerify,
    closeVerify,
    handleCheckChange,
    handleDeleteMilestone,
  };
}
