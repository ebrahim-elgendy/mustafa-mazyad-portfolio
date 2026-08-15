"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";

export interface PendingVideo {
  id: number;
  categorySlug: string;
  filename: string;
  rawUrl: string;
  projectLabel?: string;
}

export default function PendingVideos({ videos }: { videos: PendingVideo[] }) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [doneIds, setDoneIds] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<Record<number, string>>({});

  async function publish(video: PendingVideo, videoFile: File, posterFile: File | null) {
    setBusyId(video.id);
    setErrors((e) => ({ ...e, [video.id]: "" }));
    try {
      const videoBlob = await upload(`processed/${video.categorySlug}/${video.id}-${videoFile.name}`, videoFile, {
        access: "public",
        handleUploadUrl: "/api/upload",
        multipart: videoFile.size > 50 * 1024 * 1024,
      });

      let posterUrl: string | undefined;
      if (posterFile) {
        const posterBlob = await upload(
          `processed/${video.categorySlug}/${video.id}-poster-${posterFile.name}`,
          posterFile,
          { access: "public", handleUploadUrl: "/api/upload" }
        );
        posterUrl = posterBlob.url;
      }

      const res = await fetch("/api/upload/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: video.id, videoUrl: videoBlob.url, posterUrl }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Publish failed");
      }

      setDoneIds((s) => new Set(s).add(video.id));
    } catch (error) {
      setErrors((e) => ({ ...e, [video.id]: (error as Error).message }));
    } finally {
      setBusyId(null);
    }
  }

  if (videos.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="mb-2 font-display text-xl text-ink">Pending videos ({videos.length})</h2>
      <p className="mb-4 text-sm text-muted">
        Uploaded raw by the client — still needs your local compression pass. Download the raw file, run it through
        the usual pipeline, then upload the finished .mp4 (and a poster frame) here to publish it.
      </p>
      <ul className="flex flex-col gap-4">
        {videos.map((video) => (
          <li key={video.id} className="rounded-md border border-ink/10 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium text-ink">{video.filename}</p>
                <p className="text-xs text-muted">
                  {video.categorySlug}
                  {video.projectLabel ? ` — ${video.projectLabel}` : ""}
                </p>
              </div>
              <a href={video.rawUrl} className="text-sm text-primary underline">
                Download raw
              </a>
            </div>

            {doneIds.has(video.id) ? (
              <p className="mt-2 text-sm text-green-600">Published</p>
            ) : (
              <PublishRow disabled={busyId === video.id} onSubmit={(v, p) => publish(video, v, p)} />
            )}
            {errors[video.id] && <p className="mt-2 text-sm text-red-500">{errors[video.id]}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PublishRow({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (video: File, poster: File | null) => void;
}) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);

  return (
    <form
      className="mt-3 flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (videoFile) onSubmit(videoFile, posterFile);
      }}
    >
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
        className="text-sm text-ink"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setPosterFile(e.target.files?.[0] ?? null)}
        className="text-sm text-ink"
      />
      <button
        type="submit"
        disabled={disabled || !videoFile}
        className="rounded-md bg-ink px-3 py-1.5 text-sm text-bg disabled:opacity-50"
      >
        {disabled ? "Publishing…" : "Publish"}
      </button>
    </form>
  );
}
