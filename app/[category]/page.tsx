import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCategory } from "@/lib/data/categories";
import { categoryHasPhotography, getLiveAssets } from "@/lib/data/source-map";
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
    return { title: `${slug} — Mostafa Mazyad` };
  }

  return {
    title: `${category.label} — Mostafa Mazyad`,
    description: category.blurb,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    notFound();
  }

  // Every category opens on the Photography/Video split first — project
  // pickers (client folders) live one level down, at /photography.
  if (!(await categoryHasPhotography(category.slug))) {
    redirect(`/${category.slug}/video`);
  }

  const [photoAssets, videoAssets] = await Promise.all([
    getLiveAssets(category.slug, "photo"),
    getLiveAssets(category.slug, "video"),
  ]);

  return (
    <SplitChooser
      category={category}
      photoCover={photoAssets[0]?.url ?? undefined}
      videoCover={videoAssets[0]?.posterUrl}
    />
  );
}
