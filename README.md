# Mustafa Mazyad — Portfolio

A dark, cinematic portfolio site for photographer/filmmaker Mustafa Mazyad, built with Next.js (App Router), TypeScript, Tailwind CSS v4, and Framer Motion.

## Structure

- `/` — hero + category grid (Automotive, Content Creator, Corporate, Events, F&B, Medical, Real Estate, Sports, Products)
- `/[category]` — split Photography / Video chooser for a category
- `/[category]/photography`, `/[category]/video` — the work gallery for that category and medium
- `/contact` — booking/contact page

## Placeholder content

All imagery (`lib/placeholder.ts`) and copy is placeholder, pending real assets from the client:

- Photos are seeded via [Lorem Picsum](https://picsum.photos) and run through a shared `.cinematic-grade` treatment (see `app/globals.css`) so mismatched stock photography still reads as one consistent, graded body of work.
- Video placeholders point to two public domain sample clips.
- Contact details (email, WhatsApp, Instagram) in `components/Footer.tsx`, `components/ContactContent.tsx`, and `components/Nav.tsx` are flagged inline and need confirming with the client before launch.

Swap real work into `lib/data/categories.ts` and `lib/data/work.ts`.

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
