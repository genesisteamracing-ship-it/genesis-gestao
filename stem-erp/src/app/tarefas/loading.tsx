import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingTasks() {
  return <div className="space-y-4 p-4 sm:p-8" aria-label="Carregando tarefas" aria-busy="true">
    <Skeleton className="h-10 w-48" />
    <Skeleton className="h-64 w-full rounded-xl" />
  </div>;
}
