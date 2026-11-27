import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { doorRoutes } from "./routes/doors";
import { noteRoutes } from "./routes/notes";
import type { AppEnv } from "./types";
import { auth } from "./utils/auth";

const app = new Hono<AppEnv>();

app.get("/api/health", async (c) => {
    const res = await c.env.DB.prepare("SELECT 1").first();
    return c.json({ ok: true, d1: res });
});

// Better Auth handles sign-in, sessions and sign-out under /api/auth/*.
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Every other /api route needs a session. The user comes from the cookie,
// never from the request body.
app.use("/api/*", async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Not signed in." }, 401);
    c.set("user", session.user);
    c.set("db", drizzle(c.env.DB));
    await next();
});

app.route("/api/doors", doorRoutes);
app.route("/api/notes", noteRoutes);

export default app;
