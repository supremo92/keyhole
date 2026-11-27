import { defineConfig } from 'drizzle-kit'

// Config for drizzle-kit (the CLI that generates SQL migrations from our schema).
export default defineConfig({
    // D1 is SQLite.
    dialect: "sqlite",
    // Where our table definitions live.
    schema: ["./worker/schemas/auth.ts", "./worker/schemas/doors.ts", "./worker/schemas/notes.ts"],
    // Where generated migrations go. Must match `migrations_dir` in wrangler.jsonc.
    out: "./drizzle",
    // Only used by Drizzle Studio: the local D1 file. `generate` ignores this.
    dbCredentials: {
        url: "./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/dc62f762dacf1350c574bd4c2eedf73cc760ade9063de825512d5db4bd7e1dc6.sqlite",
    },
});
