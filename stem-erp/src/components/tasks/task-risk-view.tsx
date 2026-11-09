import { useState } from "react";
import { Handle, MarkerType, Position, type Edge, type Node, type NodeProps } from "@xyflow/react";
import { tv } from "tailwind-variants";
import { Button } from "@/components/ui/button";
import { FlowCanvasShell } from "@/components/canvas/flow-canvas-shell";
import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import { edgeKey, pathEdges } from "@/lib/task-schedule";
import type { TaskRisk, TaskWorkspace } from "@/types/tasks";
import { TaskSelect } from "./task-fields";

type RiskNode = Node<{ title: string; sector: string; first: boolean }, "riskTask">;
const card = tv({
  base: "w-60 rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm",
  variants: { first: { true: "border-primary ring-1 ring-primary" } },
});
function RiskTaskNode({ data }: NodeProps<RiskNode>) {
  return <div className={card({ first: data.first })}>
    <Handle type="target" position={Position.Top} isConnectable={false} />
    <p className="break-words text-sm font-semibold">{data.title}</p>
    <p className="text-xs text-muted-foreground">{data.first && "Origem · "}{data.sector}</p>
    <Handle type="source" position={Position.Bottom} isConnectable={false} />
  </div>;
}
const nodeTypes = { riskTask: RiskTaskNode };

export function TaskRiskView({ workspace, selectedId, select, edit, highlight }: {
  workspace: TaskWorkspace; selectedId?: string; select: (id: string) => void;
  edit: (risk?: TaskRisk) => void; highlight: (id: string) => void;
}) {
  const [text, setText] = useState(false);
  const risk = workspace.paths.find((path) => path.id === selectedId) ?? workspace.paths[0];
  const byId = new Map(workspace.tasks.map((task) => [task.id, task]));
  const missing = new Set(risk?.missing.map(edgeKey));
  const nodes: RiskNode[] = (risk?.taskIds ?? []).flatMap((id, index) => {
    const task = byId.get(id);
    return task ? [{
      id, type: "riskTask", position: { x: 0, y: index * 116 }, draggable: false, connectable: false, deletable: false,
      ariaLabel: (index + 1) + ". " + task.title + (index === 0 ? " — Origem" : ""),
      data: { title: task.title, sector: DELIVERY_GROUP_LABELS[task.deliveryGroup], first: index === 0 },
    }] : [];
  });
  const edges: Edge[] = pathEdges(risk?.taskIds ?? []).map((edge) => {
    const id = edgeKey(edge);
    const absent = missing.has(id);
    return { id, source: edge.predecessorId, target: edge.successorId, deletable: false, type: "smoothstep",
      label: absent ? "Ligação ausente" : undefined, markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: absent ? "var(--destructive)" : "var(--border)", strokeWidth: 2, strokeDasharray: absent ? "5 4" : undefined },
    };
  });

  return <section aria-label="Caminhos de risco" className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-end gap-2">
      {risk && <div className="min-w-44 flex-1">
        <TaskSelect label="Caminho salvo" value={risk.id} onChange={select}
          options={workspace.paths.map((item) => ({ value: item.id, label: item.name }))} />
      </div>}
      {workspace.canEdit && <Button onClick={() => edit()} disabled={!workspace.edges.length}>Novo caminho</Button>}
      {workspace.canEdit && risk && <Button variant="outline" onClick={() => edit(risk)}>Editar caminho</Button>}
      {risk && <Button variant="outline" disabled={missing.size > 0} onClick={() => highlight(risk.id)}>Destacar no Gantt</Button>}
    </div>
    {!risk && <div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
      {workspace.edges.length ? "Nenhum caminho salvo." : "Vincule pelo menos duas tarefas para montar o primeiro caminho."}
    </div>}
    {risk && <>
      <p className="whitespace-pre-wrap break-words text-sm">{risk.reason}</p>
      {missing.size > 0 && <div role="status" className="rounded-md border border-destructive/40 p-2 text-sm">
        <strong>Caminho incompleto</strong>
        {risk.missing.map((edge) => <p key={edgeKey(edge)}>{byId.get(edge.predecessorId)?.title} → {byId.get(edge.successorId)?.title} · Ligação ausente</p>)}
      </div>}
      <div className="flex gap-2">
        <Button size="sm" variant={text ? "outline" : "default"} aria-pressed={!text} onClick={() => setText(false)}>Diagrama</Button>
        <Button size="sm" variant={text ? "default" : "outline"} aria-pressed={text} onClick={() => setText(true)}>Sequência textual</Button>
      </div>
      {text ? <ol className="list-decimal space-y-2 rounded-lg border border-border bg-card p-4 pl-8 text-sm">
        {nodes.map((node) => <li key={node.id}>{node.data.title} · {node.data.sector}{node.data.first && " · Origem"}</li>)}
      </ol> : <FlowCanvasShell key={risk.id} title={risk.name} metricsText={nodes.length + " tarefas"}
        nodes={nodes} edges={edges} nodeTypes={nodeTypes} showTableToggle={false} hideAttribution={false} />}
    </>}
  </section>;
}
