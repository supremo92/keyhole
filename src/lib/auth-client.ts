import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Talks to Better Auth on the Worker at /api/auth/* (same origin).
export const authClient = createAuthClient({ plugins: [anonymousClient()] });

let pending: Promise<void> | null = null;

// Make sure the visitor has a session, signing in anonymously if not.
// Shared promise so React's double effects don't create two users.
export function ensureSession() {
    pending ??= (async () => {
        const { data } = await authClient.getSession();
        if (data) return;
        const result = await authClient.signIn.anonymous();
        if (result.error) throw new Error(result.error.message ?? "Sign-in failed");
    })().catch((err) => {
        pending = null;
        throw err;
    });
    return pending;
}
