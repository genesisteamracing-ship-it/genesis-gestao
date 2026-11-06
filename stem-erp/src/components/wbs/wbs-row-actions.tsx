"use client";

import * as React from "react";
import { Plus, Pencil, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WbsTreeNode } from "@/types/wbs";

interface WbsRowActionsProps {
  node: WbsTreeNode;
  onAddChild: (node: WbsTreeNode) => void;
  onEdit: (node: WbsTreeNode) => void;
  onDelete: (node: WbsTreeNode) => void;
  disabled?: boolean;
}

export function WbsRowActions({
  node,
  onAddChild,
  onEdit,
  onDelete,
  disabled = false,
}: WbsRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={disabled}
          className="h-8 w-8 rounded-lg border-border/80 bg-card hover:bg-muted/80 hover:text-foreground cursor-pointer"
          aria-label={`Ações para entregável ${node.code} - ${node.title}`}
        >
          <Settings className="h-4 w-4 text-foreground transition-transform duration-200 hover:rotate-45" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => onAddChild(node)}
          className="cursor-pointer gap-2 text-xs font-medium"
        >
          <Plus className="h-3.5 w-3.5 text-primary" />
          <span>Adicionar Sub-entregável</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onEdit(node)}
          className="cursor-pointer gap-2 text-xs font-medium"
        >
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Editar Entregável</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => onDelete(node)}
          className="cursor-pointer gap-2 text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Excluir</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
