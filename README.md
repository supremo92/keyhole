# The Keyhole

**A notes app you can only see through keyholes.**

Built solo for **Hack Pompey 2026** (theme: *Unusuality*).

**Live:** https://keyhole.joshkingswood.workers.dev

Most notes apps try to be efficient. The Keyhole is deliberately odd instead. Your notes live in rooms at the end of a cartoon 3D hallway, and the only way to see them is to peek through the keyhole.

## How it works

1. **The hallway is your desktop.** Each door is a folder. You start with one door at the end of the corridor.
2. **Peek.** Click a door. The camera flies up to it and zooms into the keyhole, and you see the room through a fuzzy keyhole shape. Move the mouse to look around.
3. **Slide a note under the door.** The view pulls back to the door, a sheet of paper appears for you to write on, and then it slides under the gap.
4. **Peek again.** A random piece of furniture has appeared in the room with your note resting on it: a table, desk, bookshelf, dresser, stool, armchair, piano or crate. Each room has eight furniture spots. After that, notes pile up on the floor.
5. **Hover a note** to see its title and date. **Click it** and it slides back out from under the door so you can read and edit it. Sliding it back under saves it.
6. **Add a door.** Click a boarded-up doorway. The planks come off, you name the door, and a new room appears behind it.

Every room is decorated at random (wallpaper pattern and colours, carpet, and the number and position of windows). The style is generated on the server when the door is created and saved with it, so a room always looks the same.

There's no sign-up. Each visitor gets an anonymous account and a starter door with a few notes already inside.

## The idea behind it: the Chinese Room

The Keyhole is built around John Searle's 1980 thought experiment, the **Chinese Room**. A person who knows no Chinese sits in a closed room with a rulebook. Notes in Chinese are slid under the door, and the person answers them by matching symbols against the rules and copying out a reply. From outside, the room seems to understand Chinese. Inside, nobody understands a word.

In The Keyhole, behind every door works an **Operator**:

- **They reply.** Every note you slide under the door is answered by a deliberately mindless, numbered Rulebook ([shared/rulebook.ts](shared/rulebook.ts)), applied in the Worker. A question mark gets "Yes." (or "Ask the cat."), food gets "BISCUITS ACKNOWLEDGED. FILED UNDER NOURISHMENT.", numbers get added up "because it seemed important". While they work, lamplight appears under the door and the shadow of their feet walks across. The reply slides back out as a typed memo, and stays stapled to your note.
- **They file.** Each room has the Operator's desk in the corner, with the open Rulebook. Aim the keyhole at it and click to read the rules, including where each of your notes was filed, written in the building's symbols with your real title pencilled in by someone else.
- **They can't read.** Note labels appear first in invented symbols, then resolve into words. Notes come out stamped FILED, or sometimes NOT UNDERSTOOD (BUT FILED ANYWAY).
- **Your turn.** Sometimes a paper slides out from under a boarded-up doorway. Pick it up and you become the Operator: find the matching rule, copy out the reply in symbols, and slide it back. You answer perfectly without understanding anything.

And then there's **the cat**, which may be the only one in the building who understands anything. Each time you peek it's asleep on your notes, staring back at the keyhole, or knocking a note off the furniture while maintaining eye contact. The hallway light flickers.

For demo videos, `?cat=sleep`, `?cat=stare` or `?cat=knock` forces the cat's mood, and `?stray=1` makes a paper appear in the hallway straight away.

## Tech stack

| Layer | Choice |
|---|---|
| Front end | Vite, React 19, TypeScript |
| 3D | three.js, @react-three/fiber, @react-three/drei |
| UI state | zustand (which view you're in: hallway, flying, peeking, writing, reading) |
| Server data | TanStack Query |
| API | Hono on a Cloudflare Worker |
| Validation | zod with @hono/zod-validator, schemas shared by the front end and the Worker |
| Database | Cloudflare D1 (SQLite) through Drizzle ORM, with migrations from drizzle-kit |
| Auth | Better Auth with the anonymous plugin |
| Hosting | Cloudflare Workers with static assets: one `wrangler deploy` ships the app and the API on one domain |

### Design notes

- **One persistent 3D canvas.** The hallway and rooms live in the same scene, so the camera can fly between them. Rooms are drawn far away from the hallway, and a quick blackout behind the keyhole hides the jump.
- **The keyhole is a 2D overlay.** It's an SVG mask with a blurred keyhole-shaped hole and a vignette, layered over the canvas. The paper note and its slide-under animation are HTML and CSS.
- **Everything is drawn in code.** The furniture is built from simple shapes, the wallpaper and floor textures are painted on a `<canvas>`, and the sound effects are generated with the Web Audio API. There are no image or audio files.
- **Security.** D1 has no row-level security, so every query is filtered by the signed-in user's ID from the session cookie, never from the request. Request bodies are validated with zod.
- **The server decides.** Room styles, furniture types and which furniture spot a note takes are all chosen in the Worker.

## Project structure

```
src/        React app
  scene/      3D: Hallway, Door, BoardedDoorway, Room, Furniture, CameraRig, layout, textures
  overlays/   2D: KeyholeMask, PaperSheet, NamePrompt, Intro, Hud
  lib/        API hooks, auth client, camera sequences (flow.ts), sound effects
  stores/     zustand view state
worker/     Cloudflare Worker (Hono)
  routes/     doors and notes API
  schemas/    Drizzle tables (Better Auth's tables are generated)
  lib/        random room styles, starter data, row-to-JSON helpers
  utils/      Better Auth config
shared/     constants, types and zod schemas used by both sides
drizzle/    generated SQL migrations
```

## API

Every route except `/api/health` and `/api/auth/*` needs a session.

| Method | Route | What it does |
|---|---|---|
| `GET` | `/api/health` | Checks that the Worker can reach D1 |
| `*` | `/api/auth/*` | Better Auth (anonymous sign-in, sessions) |
| `GET` | `/api/doors` | Lists your doors (creates the starter door on your first visit) |
| `POST` | `/api/doors` | Unboards a doorway: `{ doorSlot, name }` |
| `GET` | `/api/doors/:doorId/notes` | Lists the notes in a room |
| `POST` | `/api/doors/:doorId/notes` | Slides a note under the door: `{ title, body }` |
| `PATCH` | `/api/notes/:noteId` | Edits a note: `{ title, body }` |

## Running it locally

You'll need Node 22.12 or newer, and a Cloudflare account if you want to deploy.

```bash
npm install

# Local secrets (gitignored). Create .env with:
#   BETTER_AUTH_SECRET=<at least 32 random characters>
#   BETTER_AUTH_URL=http://localhost:5173
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

npm run db:migrate:local   # create the tables in the local D1 database
npm run dev                # http://localhost:5173
```

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server, with the Worker and a local D1 database |
| `npm run build` | Type-checks, then builds the client and the Worker |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | Oxlint |
| `npm run cf-typegen` | Regenerates the Worker's `Env` types from `wrangler.jsonc` |
| `npm run db:generate` | Generates a SQL migration from the Drizzle schema |
| `npm run db:migrate:local` / `db:migrate:remote` | Applies migrations to the local or production D1 database |
| `npm run db:studio` | Opens Drizzle Studio on the local database |
| `npm run deploy` | Builds and deploys to Cloudflare |

### Changing the database

```bash
# Only if the Better Auth config changes (plugins decide its tables):
npx auth@latest generate --config ./worker/utils/auth.ts --output ./worker/schemas/auth.ts

npm run db:generate
npm run db:migrate:local
npm run db:migrate:remote
```

### Deploying

```bash
npx wrangler login
npx wrangler secret put BETTER_AUTH_SECRET   # first time only
npm run db:migrate:remote
npm run deploy
```

`BETTER_AUTH_URL` for production is set in `wrangler.jsonc` under `vars`.

## Ideas for later

- "Claim your building": sign in with GitHub and keep your anonymous notes.
- Turn around in the hallway to find a second row of doors, or take the stairs to other floors.
- Deleting notes, plus other things to keep in rooms (links, files, little apps).
- Proper low-poly models and sound recordings.
