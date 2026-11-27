import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { SessionUser } from "./utils/auth";

// What every route can read from the Hono context.
export type AppEnv = {
    Bindings: Env;
    Variables: {
        user: SessionUser;
        db: DrizzleD1Database;
    };
};
