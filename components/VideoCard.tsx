"use client";

import { useState } from "react";
import Image from "next/image";
import type { WorkItem } from "@/lib/data/work";

interface VideoCardProps {
  item: WorkItem;
}

export default function VideoCard({ item }: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="cinematic-grade relative w-full overflow-hidden rounded-md" data-theme="dark">
      {isPlaying ? (
        <video
          src={item.videoUrl}
          controls
          autoPlay
          muted
          playsInline
          className="h-auto w-full align-top"
          aria-label={`${item.title}, ${item.year}`}
        >
          Your browser does not support embedded video.
        </video>
      ) : (
        <>
          <Image
            src={item.imageUrl}
            alt={item.title}
            width={item.imageWidth}
            height={item.imageHeight}
            sizes="(min-width: 768px) 33vw, 50vw"
            className="h-auto w-full align-top"
          />

          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            aria-label={`Play ${item.title}, ${item.year}`}
            className="group absolute inset-0 flex items-center justify-center focus-visible:outline-none"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-bg/70 text-ink transition-transform duration-300 group-hover:scale-105 group-focus-visible:ring-2 group-focus-visible:ring-primary sm:h-20 sm:w-20">
              <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5"
            style={{
              background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.75) 100%)",
            }}
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="line-clamp-2 font-display text-lg leading-snug text-ink">
                {item.title}
              </p>
              <p className="mt-0.5 font-sans text-xs text-muted">{item.year}</p>
            </div>
            <span className="shrink-0 rounded-sm bg-bg/80 px-2 py-1 text-sm text-ink">
              {item.duration}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
