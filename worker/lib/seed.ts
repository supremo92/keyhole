import type { DrizzleD1Database } from "drizzle-orm/d1";
import { doors, notes } from "../schemas";
import { randomFurniture, randomPaper, randomRoomStyle } from "./random";

const STARTER_NOTES = [
    {
        title: "Welcome to The Keyhole",
        body: "This is a notes app you can only see through keyholes.\n\nEvery door in the hallway is a folder. Every note you slide under a door ends up resting on a piece of furniture inside.",
    },
    {
        title: "How to add a door",
        body: "Click a boarded-up doorway in the hallway. The planks come off, you give the door a name, and a brand new (randomly decorated) room appears behind it.",
    },
    {
        title: "How to write a note",
        body: "While peeking into a room, press 'Slide a note under the door'. Write it, and it slides underneath. Peek again and it will be resting on some furniture.",
    },
    {
        title: "Shopping list",
        body: "- Keyhole polish\n- A spare key\n- Biscuits for the hallway ghost",
    },
];

// New users get one door with a few notes, so the first room isn't empty.
export async function seedStarterDoor(db: DrizzleD1Database, userId: string) {
    const [door] = await db
        .insert(doors)
        .values({ userId, name: "Start here", doorSlot: 0, ...randomRoomStyle() })
        .onConflictDoNothing()
        .returning();
    // Another request already seeded this user.
    if (!door) return;

    await db.insert(notes).values(
        STARTER_NOTES.map((n, i) => ({
            doorId: door.id,
            userId,
            title: n.title,
            bodyFront: n.body,
            colour: randomPaper(),
            design: "plain",
            furniture: randomFurniture(),
            roomSlot: i,
        })),
    );
}
