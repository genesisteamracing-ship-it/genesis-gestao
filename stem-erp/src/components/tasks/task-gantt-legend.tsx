"use client";

import { tv } from "tailwind-variants";

const legendStyles = tv({
  slots: {
    root: "rounded-xl border border-border bg-card px-3 py-2 shadow-2xs",
    inner: "flex flex-wrap items-center gap-x-4 gap-y-2",
    title: "shrink-0 whitespace-nowrap text-xs font-bold text-foreground",
    divider: "hidden h-4 w-px shrink-0 bg-border sm:block",
    list: "flex flex-wrap items-center gap-x-3.5 gap-y-1.5",
    item: "flex items-center gap-1.5 text-xs leading-tight text-foreground",
    swatch: "h-2.5 w-4 shrink-0 rounded-sm",
    criticalSwatch: "h-2.5 w-4 shrink-0 rounded-sm border border-destructive bg-destructive ring-1 ring-destructive/40",
    diamond: "h-2.5 w-2.5 shrink-0 rotate-45 border-2 border-primary bg-card",
    itemTitle: "block whitespace-nowrap text-[11px] font-semibold leading-tight text-foreground",
    itemDetail: "block whitespace-nowrap text-[10px] leading-tight text-muted-foreground",
  },
});

export interface TaskGanttLegendProps {
  className?: string;
}

export function TaskGanttLegend({ className }: TaskGanttLegendProps) {
  const styles = legendStyles();

  return (
    <aside aria-label="Legenda de status do Gantt" className={styles.root({ className })}>
      <div className={styles.inner()}>
        <h3 className={styles.title()}>Legenda (status)</h3>
        <span className={styles.divider()} aria-hidden="true" />
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
            <span className={styles.criticalSwatch()} aria-hidden="true" />
            <div>
              <span className={styles.itemTitle()}>Caminho crítico</span>
              <span className={styles.itemDetail()}>(destaque em vermelho)</span>
            </div>
          </li>
          <li className={styles.item()}>
            <span className="flex h-2.5 w-4 shrink-0 items-center justify-center" aria-hidden="true">
              <span className={styles.diamond()} />
            </span>
            <div>
              <span className={styles.itemTitle()}>Marco</span>
              <span className={styles.itemDetail()}>(critérios de aceitação)</span>
            </div>
          </li>
        </ul>
      </div>
    </aside>
  );
}
