"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createWbsNodeSchema,
  type CreateWbsNodeInput,
  type CreateWbsNodeFormInput,
} from "@/lib/validations/wbs.schema";
import type { DeliveryGroup, WbsNodeStatus, WbsTreeNode } from "@/types/wbs";
import { STATUS_LABELS } from "./wbs-tree-table";
import {
  DISCIPLINE_SELECT_OPTIONS,
  collectAllWbsCodes,
  getNextChildCode,
  getSuggestedCodeForDiscipline,
} from "@/lib/wbs-code-generator";

interface WbsNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  members: { id: string; name: string; jobTitle: string | null }[];
  editingNode: WbsTreeNode | null;
  parentNode: WbsTreeNode | null;
  existingNodes?: WbsTreeNode[];
  onSubmit: (data: CreateWbsNodeInput, isEditing: boolean, nodeId?: string) => Promise<boolean>;
}

export function WbsNodeModal({
  isOpen,
  onClose,
  teamId,
  members,
  editingNode,
  parentNode,
  existingNodes = [],
  onSubmit,
}: WbsNodeModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEditing = Boolean(editingNode);

  // Lista unificada de códigos EAP existentes na árvore para evitar colisões
  const existingCodes = React.useMemo(() => {
    return collectAllWbsCodes(existingNodes);
  }, [existingNodes]);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateWbsNodeFormInput, unknown, CreateWbsNodeInput>({
    resolver: zodResolver(createWbsNodeSchema),
    defaultValues: {
      teamId,
      parentId: null,
      code: "",
      title: "",
      description: "",
      discipline: "PROJECT_MANAGEMENT",
      ownerId: null,
      status: "PLANNED",
      estimatedCostCents: 0,
      estimatedHours: 0,
      sortOrder: 0,
    },
  });

  // Carrega dados para edição ou define sugestão de código ao adicionar sub-entregável / nó raiz
  React.useEffect(() => {
    if (editingNode) {
      reset({
        teamId: editingNode.teamId,
        parentId: editingNode.parentId,
        code: editingNode.code,
        title: editingNode.title,
        description: editingNode.description || "",
        discipline: editingNode.discipline,
        ownerId: editingNode.ownerId || null,
        status: editingNode.status,
        estimatedCostCents: editingNode.estimatedCostCents,
        estimatedHours: editingNode.estimatedHours,
        sortOrder: editingNode.sortOrder,
      });
    } else if (parentNode) {
      // Sugere o próximo código filho hierárquico (ex: pai 1 -> 1.1; pai 1.1 -> 1.1.1; pai 2 -> 2.1)
      const existingChildCodes = parentNode.children.map((c) => c.code);
      const suggestedCode = getNextChildCode(parentNode.code, existingChildCodes);

      reset({
        teamId,
        parentId: parentNode.id,
        code: suggestedCode,
        title: "",
        description: "",
        discipline: parentNode.discipline,
        ownerId: null,
        status: "PLANNED",
        estimatedCostCents: 0,
        estimatedHours: 0,
        sortOrder: parentNode.children.length,
      });
    } else {
      // Entregável Raiz: sugere código correspondente do setor inicial (1 para Gestão de Projetos)
      const initialDiscipline: DeliveryGroup = "PROJECT_MANAGEMENT";
      const suggestedCode = getSuggestedCodeForDiscipline(initialDiscipline, existingCodes);

      reset({
        teamId,
        parentId: null,
        code: suggestedCode,
        title: "",
        description: "",
        discipline: initialDiscipline,
        ownerId: null,
        status: "PLANNED",
        estimatedCostCents: 0,
        estimatedHours: 0,
        sortOrder: 0,
      });
    }
  }, [editingNode, parentNode, teamId, reset, existingCodes]);

  // Ao alterar o setor (Disciplina), atualiza automaticamente o código EAP para o setor correspondente
  const handleDisciplineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDiscipline = e.target.value as DeliveryGroup;
    setValue("discipline", newDiscipline, { shouldValidate: true });

    if (!isEditing) {
      if (parentNode) {
        // Se ainda for a mesma disciplina do pai, usa hierarquia do pai; se alterada, calcula pelo novo setor
        if (parentNode.discipline === newDiscipline) {
          const existingChildCodes = parentNode.children.map((c) => c.code);
          const childCode = getNextChildCode(parentNode.code, existingChildCodes);
          setValue("code", childCode, { shouldValidate: true });
        } else {
          const autoCode = getSuggestedCodeForDiscipline(newDiscipline, existingCodes);
          setValue("code", autoCode, { shouldValidate: true });
        }
      } else {
        // Entregável Raiz: seta diretamente o código correspondente do setor (1, 2, 3 ou 4)
        const autoCode = getSuggestedCodeForDiscipline(newDiscipline, existingCodes);
        setValue("code", autoCode, { shouldValidate: true });
      }
    }
  };

  const onFormSubmit = async (data: CreateWbsNodeInput) => {
    try {
      setIsSubmitting(true);
      const resolvedCode = data.code || getValues("code");
      const success = await onSubmit(
        {
          ...data,
          code: resolvedCode,
          estimatedCostCents: editingNode?.estimatedCostCents ?? 0,
        },
        isEditing,
        editingNode?.id
      );
      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {isEditing
              ? `Editar Entregável: ${editingNode?.code}`
              : parentNode
              ? `Adicionar Sub-entregável em "${parentNode.code} - ${parentNode.title}"`
              : "Novo Entregável"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 pt-2">
          {/* Linha 1: Código EAP e Nome do Entregável */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col justify-between space-y-1.5">
              <Label
                htmlFor="code"
                className="text-xs font-semibold leading-tight min-h-[1.25rem] flex items-end"
              >
                Código EAP *
              </Label>
              <div className="mt-auto">
                <Input
                  id="code"
                  placeholder="Ex: 1, 1.1, 1.1.1"
                  disabled
                  readOnly
                  aria-disabled="true"
                  className="font-mono text-xs cursor-not-allowed bg-muted/60 text-muted-foreground select-none h-9"
                  {...register("code")}
                />
              </div>
              {errors.code && (
                <p className="text-[11px] font-medium text-destructive">
                  {errors.code.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-2 flex flex-col justify-between space-y-1.5">
              <Label
                htmlFor="title"
                className="text-xs font-semibold leading-tight min-h-[1.25rem] flex items-end"
              >
                Nome do Entregável *
              </Label>
              <div className="mt-auto">
                <Input
                  id="title"
                  placeholder="Ex: Fixação do Eixo Traseiro"
                  className="text-xs h-9"
                  {...register("title")}
                />
              </div>
              {errors.title && (
                <p className="text-[11px] font-medium text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>
          </div>

          {/* Linha 2: Descrição do Escopo */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold">
              Descrição do Escopo
            </Label>
            <Textarea
              id="description"
              placeholder="Descreva as especificações técnicas, materiais ou escopo deste pacote de trabalho..."
              rows={2}
              className="text-xs resize-none"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-[11px] font-medium text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Linha 3: Disciplina (Setor) e Responsável Técnico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col justify-between space-y-1.5">
              <Label
                htmlFor="discipline"
                className="text-xs font-semibold leading-tight min-h-[1.25rem] flex items-end"
              >
                Setor / Disciplina *
              </Label>
              <div className="mt-auto">
                <select
                  id="discipline"
                  className="w-full h-9 rounded-md border border-border bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                  {...register("discipline")}
                  onChange={handleDisciplineChange}
                >
                  {DISCIPLINE_SELECT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col justify-between space-y-1.5">
              <Label
                htmlFor="ownerId"
                className="text-xs font-semibold leading-tight min-h-[1.25rem] flex items-end"
              >
                Responsável Técnico Único
              </Label>
              <div className="mt-auto">
                <select
                  id="ownerId"
                  className="w-full h-9 rounded-md border border-border bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...register("ownerId")}
                >
                  <option value="">Nenhum (Definir depois)</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} {member.jobTitle ? `(${member.jobTitle})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Linha 4: Horas e Status com Alinhamento Perfeito */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col justify-between space-y-1.5">
              <Label
                htmlFor="estimatedHours"
                className="text-xs font-semibold leading-tight min-h-[1.25rem] flex items-end"
              >
                Esforço Estimado (Horas)
              </Label>
              <div className="mt-auto">
                <Input
                  id="estimatedHours"
                  type="number"
                  min="0"
                  className="text-xs font-mono h-9"
                  {...register("estimatedHours", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="flex flex-col justify-between space-y-1.5">
              <Label
                htmlFor="status"
                className="text-xs font-semibold leading-tight min-h-[1.25rem] flex items-end"
              >
                Status de Entrega
              </Label>
              <div className="mt-auto">
                <select
                  id="status"
                  className="w-full h-9 rounded-md border border-border bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                  {...register("status")}
                >
                  {(Object.keys(STATUS_LABELS) as WbsNodeStatus[]).map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto text-xs gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isEditing ? "Salvar Alterações" : "Criar Entregável"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
