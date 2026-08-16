import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory } from "@/lib/data/categories";
import { getProjectWork, type WorkType } from "@/lib/data/work";
import {
  getProjects,
  getProjectKind,
  getLiveProjectAssets,
} from "@/lib/data/source-map";
import Gallery from "@/components/Gallery";

interface ProjectPageProps {
  params: Promise<{ category: string; project: string }>;
}

async function findProject(categorySlug: string, projectSlug: string) {
  const projects = await getProjects(categorySlug);
  return projects.find((p) => p.slug === projectSlug);
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { category: slug, project: projectSlug } = await params;
  const category = getCategory(slug);
  const project = category ? await findProject(category.slug, projectSlug) : undefined;

  if (!category || !project) {
    return { title: `${slug} — Mostafa Mazyad` };
  }

  return {
    title: `${project.label} — ${category.label} — Mostafa Mazyad`,
    description: category.blurb,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { category: slug, project: projectSlug } = await params;
  const category = getCategory(slug);

  if (!category) {
    notFound();
  }

  const project = await findProject(category.slug, projectSlug);

  if (!project) {
    notFound();
  }

  const kind = await getProjectKind(category.slug, project.slug);
  const type: WorkType = kind === "video" ? "video" : "photography";
  const liveAssets = await getLiveProjectAssets(category.slug, project.slug, kind);

  // Every category's project picker (client folders) lives under
  // /photography — "back" from a project should return there, not to the
  // Photography/Video split itself.
  const backHref = `/${category.slug}/photography`;
  const backLabel = `Back to ${category.label} Photography`;

  if (liveAssets.length === 0) {
    return (
      <main className="flex-1 bg-bg pb-24 pt-32 sm:pt-36">
        <div className="mx-auto max-w-[1800px] px-5 sm:px-8 lg:px-16">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-sm text-sm text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" width="14" height="14" fill="none">
              <path d="M12.5 4L7 10l5.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {backLabel}
          </Link>
          <header className="mt-6 max-w-2xl">
            <h1 className="text-balance font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05] tracking-[-0.03em] text-ink">
              {category.label} — {project.label}
            </h1>
            <p className="mt-4 text-pretty font-sans text-base text-muted sm:text-lg">
              Photos coming soon.
            </p>
          </header>
        </div>
      </main>
    );
  }

  const items = await getProjectWork(category.slug, project.slug, type);

  return (
    <Gallery
      category={category}
      items={items}
      type={type}
      backHref={backHref}
      backLabel={backLabel}
      heading={`${category.label} — ${project.label}`}
    />
  );
}
