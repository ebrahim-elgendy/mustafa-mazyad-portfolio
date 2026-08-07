import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategory } from "@/lib/data/categories";
import SplitChooser from "@/components/SplitChooser";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    return { title: `${slug} — Mustafa Mazyad` };
  }

  return {
    title: `${category.label} — Mustafa Mazyad`,
    description: category.blurb,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    notFound();
  }

  return <SplitChooser category={category} />;
}
