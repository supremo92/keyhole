import { defineConfig } from 'drizzle-kit'

// Config for drizzle-kit (the CLI that generates SQL migrations from our schema).
export default defineConfig({
    // D1 is SQLite.
    dialect: "sqlite",
    // Where our table definitions live.
    schema: ["./worker/schemas/auth.ts", "./worker/schemas/progress.ts"],
    // Where generated migrations go. Must match `migrations_dir` in wrangler.jsonc.
    out: "./drizzle",
    // Only used by Drizzle Studio: the local D1 file. `generate` ignores this.
    dbCredentials: {
        url: "./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/7c076c7fde1b1021606d8da11de44581f092ff8eaa2184d5beee908f587ff527.sqlite",
    },
});
