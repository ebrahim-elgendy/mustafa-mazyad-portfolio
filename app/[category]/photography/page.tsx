import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategory } from "@/lib/data/categories";
import { getProjects } from "@/lib/data/source-map";
import { getWork } from "@/lib/data/work";
import Gallery from "@/components/Gallery";
import ProjectChooser from "@/components/ProjectChooser";

interface PhotographyPageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({
  params,
}: PhotographyPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    return { title: `${slug} — Mustafa Mazyad` };
  }

  return {
    title: `${category.label} Photography — Mustafa Mazyad`,
    description: category.blurb,
  };
}

export default async function PhotographyPage({ params }: PhotographyPageProps) {
  const { category: slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    notFound();
  }

  // Categories whose photography is organized by client/event folder (e.g.
  // events) show a project picker here instead of one flat gallery.
  const projects = await getProjects(category.slug);
  if (projects.length > 0) {
    return (
      <ProjectChooser
        category={category}
        projects={projects}
        backHref={`/${category.slug}`}
        backLabel={`Back to ${category.label}`}
      />
    );
  }

  const items = await getWork(category.slug, "photography");

  return <Gallery category={category} items={items} type="photography" />;
}
