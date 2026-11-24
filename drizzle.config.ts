import { defineConfig } from 'drizzle-kit'

// Config for drizzle-kit (the CLI that generates SQL migrations from our schema).
export default defineConfig({
  // D1 is SQLite.
  dialect: 'sqlite',
  // Where our table definitions live.
  schema: './worker/db/schema.ts',
  // Where generated migrations go. Must match `migrations_dir` in wrangler.jsonc.
  out: './drizzle',
})
