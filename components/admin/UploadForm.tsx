"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";

interface FileStatus {
  file: File;
  state: "uploading" | "processing" | "done" | "error";
  message?: string;
}

interface UploadFormProps {
  categories: { slug: string; label: string }[];
  projectsByCategory: Record<string, string[]>;
}

function slugifyPart(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "flat";
}

export default function UploadForm({ categories, projectsByCategory }: UploadFormProps) {
  const router = useRouter();
  const [categorySlug, setCategorySlug] = useState(categories[0]?.slug ?? "");
  const [project, setProject] = useState("");
  const [queue, setQueue] = useState<FileStatus[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const existingProjects = projectsByCategory[categorySlug] ?? [];

  function updateItem(file: File, patch: Partial<FileStatus>) {
    setQueue((q) => q.map((item) => (item.file === file ? { ...item, ...patch } : item)));
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const items = Array.from(files);
    setQueue((q) => [...q, ...items.map((file) => ({ file, state: "uploading" as const }))]);

    for (const file of items) {
      const kind = file.type.startsWith("image/") ? "photo" : "video";
      const pathname = `raw/${categorySlug}/${slugifyPart(project)}/${crypto.randomUUID()}-${file.name}`;

      try {
        // No onUploadProgress here: @vercel/blob's progress tracking pre-converts the
        // file into a ReadableStream, and a retried upload then tries to re-read that
        // already-consumed stream ("ReadableStream is disturbed"). Omitting it keeps
        // the plain File body, which fetch can safely re-read on retry.
        const blob = await upload(pathname, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
          multipart: file.size > 50 * 1024 * 1024,
        });

        updateItem(file, { state: "processing" });

        const res = await fetch("/api/upload/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categorySlug,
            projectLabel: project || undefined,
            kind,
            filename: file.name,
            blobUrl: blob.url,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Processing failed");
        }

        updateItem(file, {
          state: "done",
          message: kind === "video" ? "Uploaded — awaiting compression" : "Published",
        });
        router.refresh();
      } catch (error) {
        updateItem(file, { state: "error", message: (error as Error).message });
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <select
          value={categorySlug}
          onChange={(e) => setCategorySlug(e.target.value)}
          className="rounded-md border border-ink/15 bg-bg px-3 py-2 text-ink"
        >
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          list="project-suggestions"
          value={project}
          onChange={(e) => setProject(e.target.value)}
          placeholder="Project / client name (optional)"
          className="flex-1 rounded-md border border-ink/15 bg-bg px-3 py-2 text-ink"
        />
        <datalist id="project-suggestions">
          {existingProjects.map((label) => (
            <option key={label} value={label} />
          ))}
        </datalist>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-lg border-2 border-dashed border-ink/25 p-12 text-center text-muted transition-colors hover:border-ink/40"
      >
        Drop photos or videos here, or click to choose files
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {queue.length > 0 && (
        <ul className="flex flex-col gap-2">
          {queue.map((item, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-4 rounded-md border border-ink/10 px-3 py-2 text-sm"
            >
              <span className="truncate text-ink">{item.file.name}</span>
              <span className="shrink-0 text-muted">
                {item.state === "uploading" && "Uploading…"}
                {item.state === "processing" && "Processing…"}
                {item.state === "done" && item.message}
                {item.state === "error" && `Error: ${item.message}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
