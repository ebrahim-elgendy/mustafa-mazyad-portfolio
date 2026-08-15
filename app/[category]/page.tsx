import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCategory } from "@/lib/data/categories";
import { categoryHasPhotography, categoryHasVideoSplit, getProjects } from "@/lib/data/source-map";
import SplitChooser from "@/components/SplitChooser";
import ProjectChooser from "@/components/ProjectChooser";

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

  // Categories whose projects sit under a Photography/Video split (events)
  // show the split here first — the project picker lives at /photography.
  const projects = await getProjects(category.slug);
  if (projects.length > 0 && !categoryHasVideoSplit(category.slug)) {
    return <ProjectChooser category={category} projects={projects} />;
  }

  if (!(await categoryHasPhotography(category.slug))) {
    redirect(`/${category.slug}/video`);
  }

  return <SplitChooser category={category} />;
}
