# The Keyhole: night shift at the Institute of Rooms

**It's your first night shift at the Institute of Rooms. Something lives behind every door. They can only talk by sliding notes under the door, in a script nobody can read. Your job is to answer them.**

Built solo for **Hack Pompey 2026** (theme: *Unusuality*).

**Live:** https://keyhole-night.joshkingswood.workers.dev
*(The earlier notes-app version of The Keyhole is still at https://keyhole.joshkingswood.workers.dev, tagged `v1-notes-app`.)*

## How to play

1. **Pick up the note.** A note has been slid out under one of the four doors. It's written in glyphs, one per word. Your Phrasebook knows a few of them; click any symbol you don't know to pencil in a guess.
2. **Peek through the keyhole.** You're not allowed in, and you never see who lives there: only shadows at the edge of the keyhole and the evidence they leave. But everything in the Institute has an **inventory tag**. Line one up in the keyhole and you can read its glyph.
3. **Reply in their script.** Build an answer from glyph tiles and slide it back under the door. Behind it, lamplight and the shadow of feet; then their note slides back out. Get it right and the words go into your Phrasebook for good, and the next door's note slides out. Get it wrong and you get a confused mark back.
4. **Use what's around you.** The **notice board** at the end of the corridor has your duties, the Institute's numerals and a hint for tonight. Your **locker** holds your Phrasebook and staff badge. Crib notes from a previous Operator are lying around the rooms, if the cat isn't sitting on them.

The four rooms each have their own feel: an ordinary flat, a birthday party nobody came to, an office with a leak, and the quiet room.

The Institute is falling apart, and it's odd. The light flickers, the ceiling drips into a puddle, the plaster is cracked and damp, the tannoy makes announcements. And things change while you're peeking: you never see it happen, only what's different when you look back. The chair has moved. The notice board has been knocked. Something has been left outside a door. The cat (Employee of the Month, every month) goes wherever it likes.

## The idea: the Chinese Room

The game is built on John Searle's 1980 thought experiment, the **Chinese Room**. A person who knows no Chinese sits in a room with a rulebook. Notes in Chinese are slid under the door, and they answer by matching symbols against the rules. From outside, the room seems to understand Chinese perfectly. Inside, nobody understands a word.

As the Night Operator you're in the same position: symbols come in under a door, and you send symbols back out. The difference is that you can **peek**, so you learn what the words refer to by watching. By the end you can "read" the residents fluently. So: did you understand them, or did you just get very good at the rules? And the last note suggests someone else has been doing exactly the same thing with you.

## Tech stack

| Layer | Choice |
|---|---|
| Front end | Vite, React 19, TypeScript |
| 3D | three.js, @react-three/fiber, @react-three/drei |
| UI state | zustand (where you are: hallway, peeking, holding a note, reading the board...) |
| Server data | TanStack Query |
| API | Hono on a Cloudflare Worker |
| Validation | zod with @hono/zod-validator |
| Database | Cloudflare D1 (SQLite) through Drizzle ORM, with migrations from drizzle-kit |
| Auth | Better Auth with the anonymous plugin (no sign-up) |
| Hosting | Cloudflare Workers with static assets: one `wrangler deploy` ships the app and the API on one domain |

### Design notes

- **The answers live on the server.** Puzzle definitions and answers are in [worker/puzzles.ts](worker/puzzles.ts). The browser only ever gets glyphs, and the Worker checks every reply. The glyph alphabet itself ([shared/lexicon.ts](shared/lexicon.ts)) is shared, because the front end has to draw it.
- **The database only stores progress.** Two tables: which rooms you've answered, and which words you've learned. Rooms open one at a time, worked out from what you've solved.
- **One persistent 3D canvas.** The hallway and rooms live in the same scene, so the camera can fly between them. Rooms are drawn far away and only built while the screen is blacked out behind the keyhole, so nothing stutters.
- **The keyhole is a 2D overlay**: an SVG mask with a blurred keyhole-shaped hole over the canvas. Notes, the Phrasebook and the notice board are HTML and CSS.
- **Everything is drawn in code.** Furniture, the cat and the rooms are built from simple shapes; wallpaper, cracks, damp and the night sky are painted on a `<canvas>`; every sound is generated with the Web Audio API. There are no image or audio files.
- **Security.** D1 has no row-level security, so every query is filtered by the signed-in user's ID from the session cookie, never from the request.

## Project structure

```
src/        React app
  scene/      3D: Hallway (+ HallwayProps), Door, Room (+ RoomScenes), Cat, CameraRig, rooms, layout, textures
  overlays/   2D: KeyholeMask, NoteDesk, Glyph, Readings (reply, notice board, locker, tannoy, finale), Hud, Intro
  lib/        API hooks, auth client, camera sequences (flow.ts), glyph reader, sound effects
  stores/     zustand view state (including your pencilled guesses)
worker/     Cloudflare Worker (Hono)
  routes/     shift.ts: progress, replies, reset
  puzzles.ts  the four residents and their answers
  schemas/    Drizzle tables (Better Auth's tables are generated)
  utils/      Better Auth config
shared/     the glyph lexicon and API types, used by both sides
drizzle/    generated SQL migrations
```

## API

Every route except `/api/health` and `/api/auth/*` needs a session.

| Method | Route | What it does |
|---|---|---|
| `GET` | `/api/health` | Checks that the Worker can reach D1 |
| `*` | `/api/auth/*` | Better Auth (anonymous sign-in, sessions) |
| `GET` | `/api/shift` | Your night so far: each room's status and note, your reply tiles, your Phrasebook |
| `POST` | `/api/rooms/:roomId/answer` | Slides a reply under a door: `{ reply: [glyphs] }`. Returns whether it was right and the resident's note back |
| `POST` | `/api/shift/reset` | Starts a new night |

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

### Deploying

```bash
npx wrangler login
npx wrangler secret put BETTER_AUTH_SECRET   # first time only
npm run db:migrate:remote
npm run deploy
```

`BETTER_AUTH_URL` for production is set in `wrangler.jsonc` under `vars`.
