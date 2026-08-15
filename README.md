# Mustafa Mazyad — Portfolio

A dark, cinematic portfolio site for photographer/filmmaker Mustafa Mazyad, built with Next.js (App Router), TypeScript, Tailwind CSS v4, and Framer Motion.

## Structure

- `/` — hero + category grid (Corporate, Events, F&B, Medical, Podcast)
- `/[category]` — Photography / Video split chooser, or a project picker for folder-organized categories
- `/[category]/photography`, `/[category]/video` — the work gallery for that category and medium
- `/[category]/[project]` — gallery scoped to a single client/event folder
- `/contact` — booking/contact page

## Media

Real work is served from `/public/media` and wired up through `lib/data/source-map.ts`:

- Corporate and Events photos are resized locally (max 2400px, q82 via sharp) into `/public/media`; each client/event folder maps to a `projects` entry.
- Events/F&B/Podcast videos are re-encoded to h264 mp4 (max 1920px, ~4Mbps via ffmpeg) with an extracted poster frame; per-folder manifests land in `lib/data/generated/`.
- Any category or asset that isn't live yet falls back to `lib/placeholder.ts` (seeded [Lorem Picsum](https://picsum.photos) photos and two public-domain sample clips), graded by the shared `.cinematic-grade` treatment (see `app/globals.css`) so placeholders read like the real work.
- Contact details (email, WhatsApp, Instagram) in `components/Footer.tsx`, `components/ContactContent.tsx`, and `components/Nav.tsx` are flagged inline and need confirming with the client before launch.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
```
