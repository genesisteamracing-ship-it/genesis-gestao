"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChartGantt, ChevronDown, Grid3X3, ListTodo, Network, UserCheck } from "lucide-react";
import { getTaskView, TASK_VIEWS } from "@/lib/task-navigation";
import { sidebarItemStyles } from "./sidebar-item-styles";

const icons = { tasks: ListTodo, "my-activities": UserCheck, gantt: ChartGantt, risks: Network, raci: Grid3X3 };

export function TaskNavGroup({ onSelect }: { onSelect?: () => void }) {
  const active = usePathname() === "/tarefas";
  const view = getTaskView(useSearchParams()?.get("tab"));
  const [expanded, setExpanded] = useState<boolean>();
  const open = expanded ?? active;
  const menuId = useId();

  return <>
    {active && !open && <span aria-hidden="true" className="absolute inset-y-0 left-0 hidden w-1.5 rounded-r-md bg-primary lg:block" />}
    <button
      type="button"
      aria-expanded={open}
      aria-controls={menuId}
      className={sidebarItemStyles({ isActive: active && !open, className: "group" })}
      onClick={() => setExpanded(!open)}
    >
      <ListTodo aria-hidden="true" className="size-4 shrink-0" />
      <span className="flex-1 text-left">Tarefas</span>
      <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-current/65 transition-transform group-aria-expanded:rotate-180" />
    </button>
    <div id={menuId} hidden={!open} className="ml-4 mt-1 space-y-1 border-l border-border pl-2.5">
      {TASK_VIEWS.map(({ id, href, label }) => {
        const Icon = icons[id];
        const isActive = active && view.id === id;
        return <Link
          key={id}
          href={href}
          onClick={onSelect}
          className={sidebarItemStyles({ isActive, isSubItem: true })}
          aria-current={isActive ? "page" : undefined}
        >
          <Icon aria-hidden="true" className="size-3.5 shrink-0" />
          <span>{label}</span>
        </Link>;
      })}
    </div>
  </>;
}
