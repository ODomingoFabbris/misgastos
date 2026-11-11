import type { Metadata } from "next";
import { CategoryManager } from "@/components/category-manager";
import { PageHeader } from "@/components/page-header";
import { getCategories, getExpenseCountsByCategory } from "@/lib/queries/categories";

export const metadata: Metadata = { title: "Categorías" };

export default async function CategoriasPage() {
  const [categories, expenseCounts] = await Promise.all([getCategories(), getExpenseCountsByCategory()]);

  return (
    <>
      <PageHeader
        title="Categorías"
        description="Las archivadas no aparecen al cargar gastos nuevos, pero conservan su historial."
      />
      <CategoryManager categories={categories} expenseCounts={expenseCounts} />
    </>
  );
}
