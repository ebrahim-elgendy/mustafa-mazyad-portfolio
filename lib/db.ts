import { neon } from "@neondatabase/serverless";

function createSql() {
  return neon(process.env.DATABASE_URL!);
}

let _sql: ReturnType<typeof createSql> | null = null;

/** Pooled connection for normal app queries — do not use for schema migrations (see scripts/db/migrate.mjs). */
export function getSql() {
  if (!_sql) _sql = createSql();
  return _sql;
}
