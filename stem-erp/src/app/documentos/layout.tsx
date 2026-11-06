import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentos & WBS | Genesis Gestão",
  description:
    "Estrutura Analítica do Projeto (WBS / EAP) e Governança de Escopo para escuderias STEM Racing.",
};

export default function DocumentosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
