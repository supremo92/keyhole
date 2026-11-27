import type { DrizzleD1Database } from "drizzle-orm/d1";
import { doors, notes } from "../schemas";
import { operatorReply } from "../../shared/rulebook";
import { randomFurniture, randomPaper, randomRoomStyle } from "./random";

const STARTER_NOTES = [
    {
        title: "Welcome to the building",
        body: "Every door here is a folder, and behind every door works an Operator.\n\nThey can't read. They file your notes by the Rulebook anyway, and they always reply. Look for the red book on their desk.",
    },
    {
        title: "Making more room",
        body: "If you need help making more room: click a boarded-up doorway in the hallway. The planks come off, you give it a name, and a new room appears, with a new Operator inside.",
    },
    {
        title: "How to write a note",
        body: "Move the mouse to the bottom of the screen to look down at the doormat, and click the letter. Write something, slide it under, and wait for the reply.\n\nWhy not ask the Operator a question?",
    },
    {
        title: "Shopping list",
        body: "- Keyhole polish\n- A spare key\n- Biscuits for the hallway ghost",
    },
    {
        title: "A note about the cat",
        body: "The cat comes and goes as it pleases. Nobody hired it. It may be the only one in the building who understands anything.",
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
        STARTER_NOTES.map((n, i) => {
            const reply = operatorReply(n.title, n.body);
            return {
                doorId: door.id,
                userId,
                title: n.title,
                bodyFront: n.body,
                colour: randomPaper(),
                design: "plain",
                furniture: randomFurniture(),
                roomSlot: i,
                reply: reply.text,
                replyRule: reply.rule,
            };
        }),
    );
}
