import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategory } from "@/lib/data/categories";
import { getProjects } from "@/lib/data/source-map";
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

  const projects = getProjects(category.slug);
  if (projects.length > 0) {
    return <ProjectChooser category={category} projects={projects} />;
  }

  return <SplitChooser category={category} />;
}
