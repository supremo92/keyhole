import { Hono } from "hono";

const app = new Hono<{ Bindings: Env}>();

// A placeholder route to prove the Worker runs. Later it will query D1.
app.get("/api/health", (c) =>
    c.json({ ok: true, message: "Hello from the Worker" }),
);

// Cloudflare expects the module's default export to handle `fetch`.
// A Hono app already does, so exporting it directly is enough.
export default app;
