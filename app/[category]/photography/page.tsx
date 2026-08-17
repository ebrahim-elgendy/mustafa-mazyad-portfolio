import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategory } from "@/lib/data/categories";
import { getWork } from "@/lib/data/work";
import Gallery from "@/components/Gallery";

interface PhotographyPageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({
  params,
}: PhotographyPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    return { title: `${slug} — Mostafa Mazyad` };
  }

  return {
    title: `${category.label} Photography — Mostafa Mazyad`,
    description: category.blurb,
  };
}

export default async function PhotographyPage({ params }: PhotographyPageProps) {
  const { category: slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    notFound();
  }

  const items = await getWork(category.slug, "photography");

  return <Gallery category={category} items={items} type="photography" />;
}
