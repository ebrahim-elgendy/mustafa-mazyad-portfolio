// One-off schema setup for the client-upload dashboard. Run with the direct
// (unpooled) connection — see the Neon skill's guidance on why migrations
// must not go through the pooled `-pooler` connection.
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) {
  console.error("DATABASE_URL_UNPOOLED is not set — run `vercel env pull` first.");
  process.exit(1);
}

const sql = neon(url);

await sql`
  CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    category_slug TEXT NOT NULL,
    slug TEXT NOT NULL,
    label TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (category_slug, slug)
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    category_slug TEXT NOT NULL,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('photo', 'video')),
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'pending')),
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    poster_url TEXT,
    width INTEGER,
    height INTEGER,
    size_mb REAL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;

await sql`CREATE INDEX IF NOT EXISTS assets_category_kind_idx ON assets (category_slug, kind, status)`;
await sql`CREATE INDEX IF NOT EXISTS assets_project_idx ON assets (project_id)`;

// Lets the admin pin one asset as the category's homepage/split-chooser
// thumbnail instead of always defaulting to the oldest upload.
await sql`ALTER TABLE assets ADD COLUMN IF NOT EXISTS is_cover BOOLEAN NOT NULL DEFAULT false`;
await sql`
  CREATE UNIQUE INDEX IF NOT EXISTS assets_one_cover_per_category
  ON assets (category_slug) WHERE is_cover
`;

console.log("Schema is up to date: projects, assets.");
