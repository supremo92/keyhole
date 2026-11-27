import type { Door, Note } from "../../shared/types";
import type { doors, notes } from "../schemas";

// Turn database rows into the JSON shapes the front end expects.
export function toDoor(row: typeof doors.$inferSelect): Door {
    return {
        id: row.id,
        name: row.name,
        colour: row.colour,
        doorSlot: row.doorSlot,
        wallpaper: row.wallpaper as Door["wallpaper"],
        wallColours: JSON.parse(row.design),
        carpetColour: row.carpetColour,
        windows: JSON.parse(row.windowLayout),
        createdAt: row.createdAt.toISOString(),
    };
}

export function toNote(row: typeof notes.$inferSelect): Note {
    return {
        id: row.id,
        doorId: row.doorId,
        title: row.title,
        body: row.bodyFront ?? "",
        colour: row.colour,
        furniture: row.furniture as Note["furniture"],
        roomSlot: row.roomSlot,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}
