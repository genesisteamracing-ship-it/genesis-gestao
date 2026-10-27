"use client";

import * as React from "react";
import { Pencil, Settings, Trash2 } from "lucide-react";
import type { BudgetResourceDTO, CategoryDTO } from "@/types/financial";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditBudgetResourceDialog } from "@/components/modals/edit-budget-resource-dialog";
import { DeleteBudgetResourceDialog } from "@/components/modals/delete-budget-resource-dialog";

interface ResourceRowActionsProps {
  resource: BudgetResourceDTO;
  categories: CategoryDTO[];
}

export function ResourceRowActions({
  resource,
  categories,
}: ResourceRowActionsProps) {
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg border-border/80 bg-card hover:bg-muted/80 hover:text-foreground"
            aria-label={`Ações para o recurso ${resource.code}`}
          >
            <Settings className="h-4 w-4 text-white transition-transform duration-200 hover:rotate-45" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem
            onClick={() => setIsEditOpen(true)}
            className="cursor-pointer gap-2 text-xs font-medium"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Editar</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setIsDeleteOpen(true)}
            className="cursor-pointer gap-2 text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Excluir</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditBudgetResourceDialog
        resource={resource}
        categories={categories}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      <DeleteBudgetResourceDialog
        resource={resource}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
}
