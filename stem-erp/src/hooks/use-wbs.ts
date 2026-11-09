"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  createWbsNodeAction,
  deleteWbsNodeAction,
  getWbsTreeAction,
  updateWbsNodeAction,
} from "@/actions/wbs.actions";
import type { CreateWbsNodeInput, UpdateWbsNodeInput } from "@/lib/validations/wbs.schema";
import { expandWbsAncestors } from "@/lib/wbs-expansion";
import type {
  DeliveryGroup,
  WbsSummaryMetrics,
  WbsTreeDataResult,
  WbsTreeNode,
} from "@/types/wbs";

interface ModalState {
  isOpen: boolean;
  editingNode: WbsTreeNode | null;
  parentNode: WbsTreeNode | null;
}

function buildInitialExpanded(tree: WbsTreeNode[]): Set<string> {
  const initialExpanded = new Set<string>();
  function markExpanded(list: WbsTreeNode[]) {
    for (const item of list) {
      if (item.depth <= 2 && item.children.length > 0) {
        initialExpanded.add(item.id);
      }
      if (item.children.length > 0) {
        markExpanded(item.children);
      }
    }
  }
  markExpanded(tree);
  return initialExpanded;
}

export function useWbs(initialTeamId?: string, initialData?: WbsTreeDataResult) {
  const [tree, setTree] = React.useState<WbsTreeNode[]>(() => initialData?.tree ?? []);
  const [metrics, setMetrics] = React.useState<WbsSummaryMetrics>(() => initialData?.metrics ?? {
    totalDeliverables: 0,
    totalWorkPackages: 0,
    totalRollupCostCents: 0,
    totalRollupHours: 0,
    completedDeliverables: 0,
    disciplineCounts: {},
  });
  const [members, setMembers] = React.useState<
    { id: string; name: string; jobTitle: string | null }[]
  >(() => initialData?.members ?? []);
  const [expandedNodeIds, setExpandedNodeIds] = React.useState<Set<string>>(() =>
    initialData?.tree ? buildInitialExpanded(initialData.tree) : new Set()
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedDiscipline, setSelectedDiscipline] = React.useState<
    DeliveryGroup | "ALL"
  >("ALL");
  const [isPresentationMode, setIsPresentationMode] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(!initialData);
  const [deleteConfirmNode, setDeleteConfirmNode] =
    React.useState<WbsTreeNode | null>(null);

  const [modalState, setModalState] = React.useState<ModalState>({
    isOpen: false,
    editingNode: null,
    parentNode: null,
  });

  const loadData = React.useCallback(async (revealNodeId?: string) => {
    try {
      setIsLoading(true);
      const res = await getWbsTreeAction(initialTeamId);
      if (res.success && res.data) {
        setTree(res.data.tree);
        setMetrics(res.data.metrics);
        setMembers(res.data.members);
        if (revealNodeId) {
          const refreshedTree = res.data.tree;
          setExpandedNodeIds((previous) =>
            expandWbsAncestors(refreshedTree, revealNodeId, previous)
          );
        }
      } else {
        toast.error(res.message || "Não foi possível carregar a WBS");
      }
    } catch {
      toast.error("Erro inesperado ao consultar a árvore da WBS");
    } finally {
      setIsLoading(false);
    }
  }, [initialTeamId]);

  React.useEffect(() => {
    if (!initialData) {
      let isCancelled = false;
      getWbsTreeAction(initialTeamId)
        .then((res) => {
          if (isCancelled) return;
          setIsLoading(false);
          if (res.success && res.data) {
            setTree(res.data.tree);
            setMetrics(res.data.metrics);
            setMembers(res.data.members);
            setExpandedNodeIds(buildInitialExpanded(res.data.tree));
          } else {
            toast.error(res.message || "Não foi possível carregar a WBS");
          }
        })
        .catch(() => {
          if (isCancelled) return;
          setIsLoading(false);
          toast.error("Erro inesperado ao consultar a árvore da WBS");
        });

      return () => {
        isCancelled = true;
      };
    }
  }, [initialData, initialTeamId]);

  const toggleExpand = React.useCallback((nodeId: string) => {
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const expandAll = React.useCallback(() => {
    const allIds = new Set<string>();
    function collect(list: WbsTreeNode[]) {
      for (const item of list) {
        if (item.children.length > 0) {
          allIds.add(item.id);
          collect(item.children);
        }
      }
    }
    collect(tree);
    setExpandedNodeIds(allIds);
  }, [tree]);

  const collapseAll = React.useCallback(() => {
    setExpandedNodeIds(new Set());
  }, []);

  const expandToDepth = React.useCallback(
    (maxDepth: number) => {
      const depthIds = new Set<string>();
      function collect(list: WbsTreeNode[]) {
        for (const item of list) {
          if (item.depth < maxDepth && item.children.length > 0) {
            depthIds.add(item.id);
          }
          if (item.children.length > 0) {
            collect(item.children);
          }
        }
      }
      collect(tree);
      setExpandedNodeIds(depthIds);
    },
    [tree]
  );

  const openCreateRoot = React.useCallback(() => {
    setModalState({
      isOpen: true,
      editingNode: null,
      parentNode: null,
    });
  }, []);

  const openCreateChild = React.useCallback((parent: WbsTreeNode) => {
    setModalState({
      isOpen: true,
      editingNode: null,
      parentNode: parent,
    });
  }, []);

  const openEdit = React.useCallback((node: WbsTreeNode) => {
    setModalState({
      isOpen: true,
      editingNode: node,
      parentNode: null,
    });
  }, []);

  const closeModal = React.useCallback(() => {
    setModalState({
      isOpen: false,
      editingNode: null,
      parentNode: null,
    });
  }, []);

  const handleSaveNode = async (
    data: CreateWbsNodeInput,
    isEditing: boolean,
    nodeId?: string
  ): Promise<boolean> => {
    try {
      if (isEditing && nodeId) {
        const updatePayload: UpdateWbsNodeInput = {
          id: nodeId,
          code: data.code,
          title: data.title,
          description: data.description,
          discipline: data.discipline,
          ownerId: data.ownerId,
          status: data.status,
          estimatedCostCents: data.estimatedCostCents,
          estimatedHours: data.estimatedHours,
          sortOrder: data.sortOrder,
        };

        const res = await updateWbsNodeAction(updatePayload);
        if (res.success) {
          toast.success(res.message);
          await loadData();
          return true;
        } else {
          toast.error(res.message);
          return false;
        }
      } else {
        const res = await createWbsNodeAction(data);
        if (res.success) {
          toast.success(res.message);
          await loadData(res.data?.id);
          return true;
        } else {
          toast.error(res.message);
          return false;
        }
      }
    } catch {
      toast.error("Ocorreu um erro ao salvar o entregável.");
      return false;
    }
  };

  const confirmDeleteNode = async (): Promise<boolean> => {
    if (!deleteConfirmNode) return false;

    try {
      const res = await deleteWbsNodeAction({
        id: deleteConfirmNode.id,
        teamId: deleteConfirmNode.teamId,
      });

      if (res.success) {
        toast.success(res.message);
        setDeleteConfirmNode(null);
        await loadData();
        return true;
      } else {
        toast.error(res.message);
        return false;
      }
    } catch {
      toast.error("Erro ao excluir o entregável.");
      return false;
    }
  };

  // Filtra nós pela busca e disciplina mantendo a consistência dos caminhos da árvore
  const filteredTree = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const hasDisciplineFilter = selectedDiscipline !== "ALL";

    if (!q && !hasDisciplineFilter) {
      return tree;
    }

    function filterNode(node: WbsTreeNode): WbsTreeNode | null {
      const matchesSearch =
        !q ||
        node.code.toLowerCase().includes(q) ||
        node.title.toLowerCase().includes(q) ||
        (node.description && node.description.toLowerCase().includes(q)) ||
        (node.ownerName && node.ownerName.toLowerCase().includes(q));

      const matchesDiscipline =
        !hasDisciplineFilter || node.discipline === selectedDiscipline;

      // Filtra recursivamente os filhos
      const filteredChildren: WbsTreeNode[] = [];
      for (const child of node.children) {
        const filteredChild = filterNode(child);
        if (filteredChild) {
          filteredChildren.push(filteredChild);
        }
      }

      // Mantém o nó se ele mesmo satisfaz ou se algum dos filhos satisfaz
      if ((matchesSearch && matchesDiscipline) || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }

      return null;
    }

    const result: WbsTreeNode[] = [];
    for (const root of tree) {
      const filtered = filterNode(root);
      if (filtered) {
        result.push(filtered);
      }
    }
    return result;
  }, [tree, searchQuery, selectedDiscipline]);

  return {
    tree: filteredTree,
    rawTree: tree,
    metrics,
    members,
    expandedNodeIds,
    searchQuery,
    setSearchQuery,
    selectedDiscipline,
    setSelectedDiscipline,
    isPresentationMode,
    setIsPresentationMode,
    isLoading,
    modalState,
    deleteConfirmNode,
    setDeleteConfirmNode,
    toggleExpand,
    expandAll,
    collapseAll,
    expandToDepth,
    openCreateRoot,
    openCreateChild,
    openEdit,
    closeModal,
    handleSaveNode,
    confirmDeleteNode,
    reload: loadData,
  };
}
