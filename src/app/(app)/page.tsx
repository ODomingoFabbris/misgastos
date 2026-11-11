import { PageHeader } from "@/components/page-header";

export default function InicioPage() {
  return (
    <>
      <PageHeader title="Inicio" description="Totales y gráficos de tus gastos, próximamente." />
      <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Sesión iniciada. Acá va a ir el resumen de la semana y del mes.
      </p>
    </>
  );
}
