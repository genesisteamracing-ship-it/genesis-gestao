"use client";

import { Plus, Trash2 } from "lucide-react";
import { tv } from "tailwind-variants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getContingencyPlanLabel,
  MAX_CONTINGENCY_PLANS,
  MIN_CONTINGENCY_PLANS,
} from "@/lib/risk-contingency-plans";

const contingencyStyles = tv({
  slots: {
    section: "rounded-xl border border-border bg-muted/30 p-3.5 space-y-3",
    header: "flex flex-wrap items-center justify-between gap-2",
    title: "text-xs font-bold text-foreground",
    grid: "grid grid-cols-1 gap-3 sm:grid-cols-2",
    fieldCol: "flex flex-col justify-between space-y-1.5",
    labelRow: "flex min-h-[1.75rem] items-end justify-between gap-2",
    label: "text-xs font-semibold leading-tight text-foreground",
    controlWrap: "mt-auto",
  },
});

interface RiskContingencyPlansFieldProps {
  plans: string[];
  isRequired: boolean;
  disabled?: boolean;
  rootError?: string;
  itemErrors?: Array<string | undefined>;
  onChangePlan: (index: number, value: string) => void;
  onAddPlan: () => void;
  onRemovePlan: (index: number) => void;
}

export function RiskContingencyPlansField({
  plans,
  isRequired,
  disabled = false,
  rootError,
  itemErrors,
  onChangePlan,
  onAddPlan,
  onRemovePlan,
}: RiskContingencyPlansFieldProps) {
  const styles = contingencyStyles();

  return (
    <div className={styles.section()}>
      <div className={styles.header()}>
        <span className={styles.title()}>
          Planos de Contingência{isRequired ? " *" : ""}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddPlan}
          disabled={disabled || plans.length >= MAX_CONTINGENCY_PLANS}
          className="h-8 gap-1.5 px-2.5 text-xs font-semibold"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Adicionar +</span>
        </Button>
      </div>

      <div className={styles.grid()}>
        {plans.map((value, index) => {
          const label = getContingencyPlanLabel(index);
          const canRemove = index >= MIN_CONTINGENCY_PLANS;
          const fieldError = itemErrors?.[index];

          return (
            <div key={index} className={styles.fieldCol()}>
              <div className={styles.labelRow()}>
                <Label
                  htmlFor={`risk-contingency-plan-${index}`}
                  className={styles.label()}
                >
                  {label}
                  {isRequired ? " *" : ""}
                </Label>
                {canRemove && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    onClick={() => onRemovePlan(index)}
                    aria-label={`Remover ${label}`}
                    title={`Remover ${label}`}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <div className={styles.controlWrap()}>
                <Textarea
                  id={`risk-contingency-plan-${index}`}
                  rows={2}
                  disabled={disabled}
                  placeholder={`Ações do ${label} caso o evento ocorra`}
                  value={value}
                  onChange={(e) => onChangePlan(index, e.target.value)}
                />
                {fieldError && (
                  <p className="mt-1 text-xs text-destructive">{fieldError}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {rootError && <p className="text-xs text-destructive">{rootError}</p>}
    </div>
  );
}
