"use client";

import * as React from "react";
import type {
  DeliveryGroup,
  RiskConsequence,
  RiskEntryType,
  RiskLifecycleStatus,
  RiskProbability,
} from "@prisma/client";
import { toast } from "sonner";
import {
  createRiskItem,
  deleteRiskItem,
  getRiskModuleData,
  getRiskReviews,
  registerRiskReview,
  updateRiskItem,
} from "@/actions/risk-actions";
import {
  buildCartesianPoints,
  buildConsequenceDistribution,
  buildProbabilityDistribution,
} from "@/lib/risk-matrix";
import type {
  CreateRiskItemInput,
  RegisterRiskReviewInput,
  UpdateRiskItemInput,
} from "@/lib/risk-schemas";
import type {
  RiskItemDTO,
  RiskReviewDTO,
  RiskTeamMemberOption,
} from "@/types/risks";

export interface RiskFiltersState {
  search: string;
  entryType: RiskEntryType | "ALL";
  sector: DeliveryGroup | "ALL";
  probability: RiskProbability | "ALL";
  consequence: RiskConsequence | "ALL";
  status: RiskLifecycleStatus | "ALL";
}

const INITIAL_FILTERS: RiskFiltersState = {
  search: "",
  entryType: "ALL",
  sector: "ALL",
  probability: "ALL",
  consequence: "ALL",
  status: "ALL",
};

export function useRisks(
  season: string,
  initialItems?: RiskItemDTO[],
  initialMembers?: RiskTeamMemberOption[],
  initialCanEdit = true
) {
  const [items, setItems] = React.useState<RiskItemDTO[]>(initialItems ?? []);
  const [members, setMembers] = React.useState<RiskTeamMemberOption[]>(
    initialMembers ?? []
  );
  const [canEdit, setCanEdit] = React.useState<boolean>(initialCanEdit);
  const [isLoading, setIsLoading] = React.useState<boolean>(
    initialItems === undefined
  );
  const [error, setError] = React.useState<string | null>(null);
  const [filters, setFilters] = React.useState<RiskFiltersState>(INITIAL_FILTERS);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);

  const [formOpen, setFormOpen] = React.useState<boolean>(false);
  const [editingItem, setEditingItem] = React.useState<RiskItemDTO | null>(null);

  const [reviewItem, setReviewItem] = React.useState<RiskItemDTO | null>(null);
  const [reviews, setReviews] = React.useState<RiskReviewDTO[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = React.useState<boolean>(false);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await getRiskModuleData(season);
    if (!res.success || !res.data) {
      setError(res.message);
      setIsLoading(false);
      return;
    }
    setItems(res.data.items);
    setMembers(res.data.members);
    setCanEdit(res.data.canEdit);
    setIsLoading(false);
  }, [season]);

  React.useEffect(() => {
    if (initialItems !== undefined) return;
    let active = true;
    void (async () => {
      const res = await getRiskModuleData(season);
      if (!active) return;
      if (!res.success || !res.data) {
        setError(res.message);
        setIsLoading(false);
        return;
      }
      setItems(res.data.items);
      setMembers(res.data.members);
      setCanEdit(res.data.canEdit);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [initialItems, season]);

  const filteredItems = React.useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return items.filter((item) => {
      if (filters.entryType !== "ALL" && item.entryType !== filters.entryType) {
        return false;
      }
      if (filters.sector !== "ALL" && item.sector !== filters.sector) {
        return false;
      }
      if (
        filters.probability !== "ALL" &&
        item.probability !== filters.probability
      ) {
        return false;
      }
      if (
        filters.consequence !== "ALL" &&
        item.consequence !== filters.consequence
      ) {
        return false;
      }
      if (filters.status !== "ALL" && item.status !== filters.status) {
        return false;
      }
      if (q) {
        const haystack = [
          item.title,
          item.observations ?? "",
          item.proactiveStrategy ?? "",
          item.contingencyPlan ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [items, filters]);

  const probabilityDistribution = React.useMemo(
    () => buildProbabilityDistribution(filteredItems),
    [filteredItems]
  );

  const consequenceDistribution = React.useMemo(
    () => buildConsequenceDistribution(filteredItems),
    [filteredItems]
  );

  const cartesianPoints = React.useMemo(
    () => buildCartesianPoints(filteredItems),
    [filteredItems]
  );

  const openCreateForm = React.useCallback(() => {
    setEditingItem(null);
    setFormOpen(true);
  }, []);

  const openEditForm = React.useCallback((item: RiskItemDTO) => {
    setEditingItem(item);
    setFormOpen(true);
  }, []);

  const openReviewModal = React.useCallback(async (item: RiskItemDTO) => {
    setReviewItem(item);
    setIsLoadingReviews(true);
    const res = await getRiskReviews(item.id);
    if (res.success && res.data) {
      setReviews(res.data);
    } else {
      setReviews([]);
    }
    setIsLoadingReviews(false);
  }, []);

  const closeReviewModal = React.useCallback(() => {
    setReviewItem(null);
    setReviews([]);
  }, []);

  const handleCreateOrUpdate = React.useCallback(
    async (values: CreateRiskItemInput | UpdateRiskItemInput) => {
      setIsSaving(true);
      try {
        const res =
          "id" in values
            ? await updateRiskItem(values)
            : await createRiskItem(values);
        if (!res.success || !res.data) {
          toast.error(res.message);
          return false;
        }
        const saved = res.data;
        setItems((prev) => {
          const exists = prev.some((i) => i.id === saved.id);
          const next = exists
            ? prev.map((i) => (i.id === saved.id ? saved : i))
            : [saved, ...prev];
          return next.sort((a, b) => b.priorityScore - a.priorityScore);
        });
        toast.success(res.message);
        setFormOpen(false);
        setEditingItem(null);
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const handleDelete = React.useCallback(async (item: RiskItemDTO) => {
    setIsSaving(true);
    try {
      const res = await deleteRiskItem(item.id);
      if (!res.success) {
        toast.error(res.message);
        return false;
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success(res.message);
      return true;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleRegisterReview = React.useCallback(
    async (values: RegisterRiskReviewInput) => {
      setIsSaving(true);
      try {
        const res = await registerRiskReview(values);
        if (!res.success || !res.data) {
          toast.error(res.message);
          return false;
        }
        const { item: updatedItem, review } = res.data;
        setItems((prev) =>
          prev
            .map((i) => (i.id === updatedItem.id ? updatedItem : i))
            .sort((a, b) => b.priorityScore - a.priorityScore)
        );
        setReviewItem(updatedItem);
        setReviews((prev) => [review, ...prev]);
        toast.success(res.message);
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const resetFilters = React.useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  return {
    items,
    filteredItems,
    members,
    canEdit,
    isLoading,
    error,
    isSaving,
    filters,
    setFilters,
    resetFilters,
    probabilityDistribution,
    consequenceDistribution,
    cartesianPoints,
    formOpen,
    setFormOpen,
    editingItem,
    openCreateForm,
    openEditForm,
    reviewItem,
    reviews,
    isLoadingReviews,
    openReviewModal,
    closeReviewModal,
    loadData,
    handleCreateOrUpdate,
    handleDelete,
    handleRegisterReview,
  };
}
