"use client";

import { tv } from "tailwind-variants";

const legendStyles = tv({
  slots: {
    root: "rounded-xl border border-border bg-card p-3.5 shadow-2xs",
    title: "mb-3 text-sm font-bold text-foreground",
    list: "grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-1",
    item: "flex items-center gap-2.5 text-xs leading-snug text-foreground",
    swatch: "h-3.5 w-7 shrink-0 rounded-sm",
    diamond: "h-3.5 w-3.5 shrink-0 rotate-45 border-2 border-destructive bg-card",
    itemTitle: "font-semibold text-foreground",
    itemDetail: "block text-[11px] text-muted-foreground",
  },
});

export interface TaskGanttLegendProps {
  className?: string;
}

export function TaskGanttLegend({ className }: TaskGanttLegendProps) {
  const styles = legendStyles();

  return (
    <aside aria-label="Legenda de status do Gantt" className={styles.root({ className })}>
      <h3 className={styles.title()}>Legenda (status)</h3>
      <ul className={styles.list()}>
        <li className={styles.item()}>
          <span className={`${styles.swatch()} bg-success`} aria-hidden="true" />
          <div>
            <span className={styles.itemTitle()}>Verde: em dia</span>
            <span className={styles.itemDetail()}>(dentro do planejado)</span>
          </div>
        </li>
        <li className={styles.item()}>
          <span className={`${styles.swatch()} bg-warning`} aria-hidden="true" />
          <div>
            <span className={styles.itemTitle()}>Amarelo: atenção</span>
            <span className={styles.itemDetail()}>(risco de atraso)</span>
          </div>
        </li>
        <li className={styles.item()}>
          <span className={`${styles.swatch()} bg-destructive`} aria-hidden="true" />
          <div>
            <span className={styles.itemTitle()}>Vermelho: atraso</span>
            <span className={styles.itemDetail()}>(fora do planejado)</span>
          </div>
        </li>
        <li className={styles.item()}>
          <span className={`${styles.swatch()} bg-muted-foreground/35`} aria-hidden="true" />
          <div>
            <span className={styles.itemTitle()}>Cinza: linha de base</span>
            <span className={styles.itemDetail()}>(planejado)</span>
          </div>
        </li>
        <li className={styles.item()}>
          <span className="flex w-7 shrink-0 items-center justify-center" aria-hidden="true">
            <span className={styles.diamond()} />
          </span>
          <div>
            <span className={styles.itemTitle()}>Caminho crítico</span>
            <span className={styles.itemDetail()}>(define o prazo final)</span>
          </div>
        </li>
      </ul>
    </aside>
  );
}
