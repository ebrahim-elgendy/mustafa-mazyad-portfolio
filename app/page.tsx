import Hero from "@/components/Hero";
import CategoryGrid from "@/components/CategoryGrid";
import { CATEGORIES } from "@/lib/data/categories";
import { getCategoryCover } from "@/lib/data/source-map";

export default function Home() {
  const covers = Object.fromEntries(
    CATEGORIES.map((category) => [category.slug, getCategoryCover(category.slug)])
  );

  return (
    <main className="flex-1">
      <Hero />
      <CategoryGrid covers={covers} />
    </main>
  );
}
