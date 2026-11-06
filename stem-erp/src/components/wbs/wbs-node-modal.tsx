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
import { DISCIPLINE_LABELS, STATUS_LABELS } from "./wbs-tree-table";
import { formatCentsToReais, parseReaisToCents } from "@/lib/utils";

interface WbsNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  members: { id: string; name: string; jobTitle: string | null }[];
  editingNode: WbsTreeNode | null;
  parentNode: WbsTreeNode | null;
  onSubmit: (data: CreateWbsNodeInput, isEditing: boolean, nodeId?: string) => Promise<boolean>;
}

export function WbsNodeModal({
  isOpen,
  onClose,
  teamId,
  members,
  editingNode,
  parentNode,
  onSubmit,
}: WbsNodeModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currencyDisplay, setCurrencyDisplay] = React.useState("0,00");

  const isEditing = Boolean(editingNode);

  const {
    register,
    handleSubmit,
    setValue,
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
      discipline: "ENGINEERING_CAD",
      ownerId: null,
      status: "PLANNED",
      estimatedCostCents: 0,
      estimatedHours: 0,
      sortOrder: 0,
    },
  });

  // Carrega dados para edição ou define sugestão de código ao adicionar sub-entregável
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
      setCurrencyDisplay(formatCentsToReais(editingNode.estimatedCostCents).replace("R$\u00A0", "").replace("R$ ", ""));
    } else if (parentNode) {
      // Sugere o próximo código filho (ex: pai 1.2 -> filho 1.2.1)
      const nextChildIndex = parentNode.children.length + 1;
      const suggestedCode = `${parentNode.code}.${nextChildIndex}`;

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
      setCurrencyDisplay("0,00");
    } else {
      reset({
        teamId,
        parentId: null,
        code: "1.0",
        title: "",
        description: "",
        discipline: "PROJECT_MANAGEMENT",
        ownerId: null,
        status: "PLANNED",
        estimatedCostCents: 0,
        estimatedHours: 0,
        sortOrder: 0,
      });
      setCurrencyDisplay("0,00");
    }
  }, [editingNode, parentNode, teamId, reset]);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, "");
    const cents = Number.parseInt(rawDigits || "0", 10);
    setValue("estimatedCostCents", cents, { shouldValidate: true });
    setCurrencyDisplay(formatCentsToReais(cents).replace("R$\u00A0", "").replace("R$ ", ""));
  };

  const onFormSubmit = async (data: CreateWbsNodeInput) => {
    try {
      setIsSubmitting(true);
      const success = await onSubmit(data, isEditing, editingNode?.id);
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
              : "Novo Entregável Raiz (Escopo Geral da Temporada)"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            A WBS decompõe o escopo total em entregáveis concretos (&quot;o que precisa ser construído&quot;)
            seguindo a Regra dos 100%.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 pt-2">
          {/* Linha 1: Código EAP e Nome do Entregável */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-semibold">
                Código EAP *
              </Label>
              <Input
                id="code"
                placeholder="Ex: 1.2.3"
                className="font-mono text-xs"
                {...register("code")}
              />
              {errors.code && (
                <p className="text-[11px] font-medium text-destructive">
                  {errors.code.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold">
                Nome do Entregável *
              </Label>
              <Input
                id="title"
                placeholder="Ex: Fixação do Eixo Traseiro"
                className="text-xs"
                {...register("title")}
              />
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
              Descrição do Escopo (O que precisa ser construído)
            </Label>
            <Textarea
              id="description"
              placeholder="Descreva as especificações técnicas, materiais ou escopo físico deste pacote de trabalho..."
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

          {/* Linha 3: Disciplina e Responsável Técnico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="discipline" className="text-xs font-semibold">
                Disciplina da Escuderia *
              </Label>
              <select
                id="discipline"
                className="w-full h-9 rounded-md border border-border bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register("discipline")}
              >
                {(Object.keys(DISCIPLINE_LABELS) as DeliveryGroup[]).map((group) => (
                  <option key={group} value={group}>
                    {DISCIPLINE_LABELS[group]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ownerId" className="text-xs font-semibold">
                Responsável Técnico Único
              </Label>
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

          {/* Linha 4: Custo Estimado, Horas e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="currencyDisplay" className="text-xs font-semibold">
                Custo de Fabricação (R$)
              </Label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-xs text-muted-foreground font-medium">
                  R$
                </span>
                <Input
                  id="currencyDisplay"
                  value={currencyDisplay}
                  onChange={handleCurrencyChange}
                  className="pl-8 text-xs font-mono"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="estimatedHours" className="text-xs font-semibold">
                Esforço Estimado (Horas)
              </Label>
              <Input
                id="estimatedHours"
                type="number"
                min="0"
                className="text-xs font-mono"
                {...register("estimatedHours", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold">
                Status de Entrega
              </Label>
              <select
                id="status"
                className="w-full h-9 rounded-md border border-border bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
