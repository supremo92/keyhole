import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../schemas/auth";

// Secret and base URL are read from BETTER_AUTH_SECRET / BETTER_AUTH_URL.
export const auth = betterAuth({
    database: drizzleAdapter(drizzle(env.DB), { provider: "sqlite", schema }),
    plugins: [anonymous()],
});

export type SessionUser = typeof auth.$Infer.Session.user;
