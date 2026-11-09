"use client";

import { Button } from "@/components/ui/button";

export default function TasksError({ reset }: { reset: () => void }) {
  return <section className="space-y-3 p-4 sm:p-8" role="alert">
    <h1 className="text-lg font-semibold">Não foi possível carregar Tarefas</h1>
    <Button variant="outline" onClick={reset}>Tentar novamente</Button>
  </section>;
}
