import Hero from "@/components/Hero";
import SelectedClients from "@/components/SelectedClients";
import FeaturedWork from "@/components/FeaturedWork";
import CategoryGrid from "@/components/CategoryGrid";
import { CATEGORIES } from "@/lib/data/categories";
import { getCategoryCover } from "@/lib/data/source-map";

export default async function Home() {
  const covers = Object.fromEntries(
    await Promise.all(
      CATEGORIES.map(async (category) => [category.slug, await getCategoryCover(category.slug)])
    )
  ) as Record<string, { url: string; focalY: number } | undefined>;

  return (
    <main className="flex-1">
      <Hero />
      <SelectedClients />
      <FeaturedWork />
      <CategoryGrid covers={covers} />
    </main>
  );
}
