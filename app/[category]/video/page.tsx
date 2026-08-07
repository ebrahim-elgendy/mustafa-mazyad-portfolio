import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategory } from "@/lib/data/categories";
import { getWork } from "@/lib/data/work";
import Gallery from "@/components/Gallery";

interface VideoPageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({
  params,
}: VideoPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    return { title: `${slug} — Mustafa Mazyad` };
  }

  return {
    title: `${category.label} Video — Mustafa Mazyad`,
    description: category.blurb,
  };
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { category: slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    notFound();
  }

  const items = getWork(category.slug, "video");

  return <Gallery category={category} items={items} type="video" />;
}
