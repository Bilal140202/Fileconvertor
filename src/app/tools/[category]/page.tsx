import { notFound } from "next/navigation";

import { ToolLayout } from "@/components/layout/tool-layout";
import { converterCategories } from "@/lib/navigation";

type PageProps = {
  params: Promise<{ category: string }>;
};

export default async function ToolCategoryPage({ params }: PageProps) {
  const { category } = await params;
  const current = converterCategories.find((item) => item.slug === category);

  if (!current) {
    notFound();
  }

  return <ToolLayout category={current} />;
}

export function generateStaticParams() {
  return converterCategories.map((category) => ({ category: category.slug }));
}
