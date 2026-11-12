"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { parseTaskDate } from "@/lib/task-schedule";
import { cn } from "@/lib/utils";

function formatIsoToDate(iso?: string): Date | undefined {
  if (!iso) return undefined;
  const parsed = parseTaskDate(iso);
  if (!parsed) return undefined;
  return new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type TaskDatePickerProps = {
  id: string;
  name: string;
  value: string;
  onChange: (nextIso: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function TaskDatePicker({
  id,
  name,
  value,
  onChange,
  placeholder = "Selecione uma data",
  disabled = false,
}: TaskDatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = formatIsoToDate(value);

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "h-9 w-full justify-start text-left text-xs font-normal border-border bg-background hover:bg-muted/40",
              !selectedDate && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate">
              {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate}
            onSelect={(date) => {
              if (date) {
                onChange(toIsoDate(date));
                setOpen(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </>
  );
}
