"use client";

import { useState } from "react";

export interface LibraryAsset {
  id: number;
  kind: "photo" | "video";
  status: "published" | "pending";
  filename: string;
  url: string;
  posterUrl?: string;
}

export interface LibraryProject {
  id: number;
  slug: string;
  label: string;
  assets: LibraryAsset[];
}

export interface LibraryCategory {
  categorySlug: string;
  categoryLabel: string;
  projects: LibraryProject[];
  flatAssets: LibraryAsset[];
}

export default function MediaLibrary({ categories: initialCategories }: { categories: LibraryCategory[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<Record<number, string>>({});

  function setBusy(id: number, busy: boolean) {
    setBusyIds((s) => {
      const next = new Set(s);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function setError(id: number, message: string) {
    setErrors((e) => ({ ...e, [id]: message }));
  }

  async function createProject(categorySlug: string, label: string) {
    const res = await fetch("/api/upload/project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categorySlug, label }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error ?? "Create folder failed");

    setCategories((cats) =>
      cats.map((cat) =>
        cat.categorySlug === categorySlug
          ? { ...cat, projects: [...cat.projects, { id: body.id, slug: body.slug, label, assets: [] }] }
          : cat
      )
    );
  }

  async function renameProject(projectId: number, label: string) {
    setBusy(projectId, true);
    setError(projectId, "");
    try {
      const res = await fetch(`/api/upload/project/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Rename failed");
      }
      setCategories((cats) =>
        cats.map((cat) => ({
          ...cat,
          projects: cat.projects.map((p) => (p.id === projectId ? { ...p, label } : p)),
        }))
      );
    } catch (error) {
      setError(projectId, (error as Error).message);
    } finally {
      setBusy(projectId, false);
    }
  }

  async function deleteProject(project: LibraryProject) {
    if (!window.confirm(`Delete folder "${project.label}"? This deletes every asset inside it — can't be undone.`))
      return;
    setBusy(project.id, true);
    setError(project.id, "");
    try {
      const res = await fetch(`/api/upload/project/${project.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Delete folder failed");
      }
      setCategories((cats) =>
        cats.map((cat) => ({ ...cat, projects: cat.projects.filter((p) => p.id !== project.id) }))
      );
    } catch (error) {
      setError(project.id, (error as Error).message);
      setBusy(project.id, false);
    }
  }

  async function deleteAsset(asset: LibraryAsset) {
    if (!window.confirm(`Delete "${asset.filename}"? This can't be undone.`)) return;
    setBusy(asset.id, true);
    setError(asset.id, "");
    try {
      const res = await fetch(`/api/upload/asset/${asset.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Delete failed");
      }
      setCategories((cats) =>
        cats.map((cat) => ({
          ...cat,
          projects: cat.projects.map((p) => ({ ...p, assets: p.assets.filter((a) => a.id !== asset.id) })),
          flatAssets: cat.flatAssets.filter((a) => a.id !== asset.id),
        }))
      );
    } catch (error) {
      setError(asset.id, (error as Error).message);
      setBusy(asset.id, false);
    }
  }

  return (
    <div className="mt-12">
      <h2 className="mb-2 font-display text-xl text-ink">Media library</h2>
      <p className="mb-6 text-sm text-muted">Everything currently live (or awaiting compression) on the site.</p>

      <div className="flex flex-col gap-10">
        {categories.map((category) => (
          <div key={category.categorySlug}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg text-ink">{category.categoryLabel}</h3>
            </div>

            <NewFolderForm onSubmit={(label) => createProject(category.categorySlug, label)} />

            <div className="mt-4 flex flex-col gap-4">
              {category.projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  busy={busyIds.has(project.id)}
                  error={errors[project.id]}
                  onRename={(label) => renameProject(project.id, label)}
                  onDelete={() => deleteProject(project)}
                  onDeleteAsset={deleteAsset}
                  busyIds={busyIds}
                  errors={errors}
                />
              ))}

              {category.flatAssets.length > 0 && (
                <div className="rounded-md border border-ink/10 px-4 py-3">
                  <p className="mb-3 font-medium text-ink">Unsorted</p>
                  <AssetGrid assets={category.flatAssets} busyIds={busyIds} errors={errors} onDelete={deleteAsset} />
                </div>
              )}

              {category.projects.length === 0 && category.flatAssets.length === 0 && (
                <p className="text-sm text-muted">Nothing here yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewFolderForm({ onSubmit }: { onSubmit: (label: string) => Promise<void> }) {
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!label.trim()) return;
        setSubmitting(true);
        setError("");
        try {
          await onSubmit(label.trim());
          setLabel("");
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="New folder name"
        className="rounded-md border border-ink/15 bg-bg px-3 py-1.5 text-sm text-ink"
      />
      <button
        type="submit"
        disabled={submitting || !label.trim()}
        className="rounded-md border border-ink/15 px-3 py-1.5 text-sm text-ink disabled:opacity-50"
      >
        Add folder
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  );
}

function ProjectCard({
  project,
  busy,
  error,
  onRename,
  onDelete,
  onDeleteAsset,
  busyIds,
  errors,
}: {
  project: LibraryProject;
  busy: boolean;
  error?: string;
  onRename: (label: string) => void;
  onDelete: () => void;
  onDeleteAsset: (asset: LibraryAsset) => void;
  busyIds: Set<number>;
  errors: Record<number, string>;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(project.label);

  return (
    <div className="rounded-md border border-ink/10 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {editing ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (label.trim() && label.trim() !== project.label) onRename(label.trim());
              setEditing(false);
            }}
          >
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={() => {
                if (label.trim() && label.trim() !== project.label) onRename(label.trim());
                setEditing(false);
              }}
              className="rounded-md border border-ink/15 bg-bg px-2 py-1 text-sm text-ink"
            />
          </form>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="font-medium text-ink underline decoration-dotted">
            {project.label}
          </button>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="text-sm text-red-500 underline disabled:opacity-50"
        >
          Delete folder
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

      <div className="mt-3">
        {project.assets.length > 0 ? (
          <AssetGrid assets={project.assets} busyIds={busyIds} errors={errors} onDelete={onDeleteAsset} />
        ) : (
          <p className="text-sm text-muted">No assets yet.</p>
        )}
      </div>
    </div>
  );
}

function AssetGrid({
  assets,
  busyIds,
  errors,
  onDelete,
}: {
  assets: LibraryAsset[];
  busyIds: Set<number>;
  errors: Record<number, string>;
  onDelete: (asset: LibraryAsset) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {assets.map((asset) => (
        <div key={asset.id} className="flex flex-col gap-1">
          <div className="relative aspect-square overflow-hidden rounded-md bg-ink/5">
            {asset.kind === "photo" ? (
              <img src={asset.url} alt={asset.filename} className="h-full w-full object-cover" />
            ) : asset.posterUrl ? (
              <img src={asset.posterUrl} alt={asset.filename} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted">Video</div>
            )}
          </div>
          <p className="truncate text-xs text-ink" title={asset.filename}>
            {asset.filename}
          </p>
          <div className="flex items-center justify-between gap-2">
            {asset.status === "pending" && <span className="text-xs text-muted">Pending</span>}
            <button
              type="button"
              disabled={busyIds.has(asset.id)}
              onClick={() => onDelete(asset)}
              className="ml-auto text-xs text-red-500 underline disabled:opacity-50"
            >
              Delete
            </button>
          </div>
          {errors[asset.id] && <p className="text-xs text-red-500">{errors[asset.id]}</p>}
        </div>
      ))}
    </div>
  );
}
