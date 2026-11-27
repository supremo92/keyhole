import type { WallpaperPattern, WindowSpec } from "../../shared/constants";
import type { RoomId, Word } from "../../shared/lexicon";

// The four rooms of the Institute. Each has its own feel; nobody ever sees who lives there.
export type RoomDef = {
    id: RoomId;
    slot: number;
    plate: string;
    // How it looks from the hallway.
    door: string;
    wallpaper: WallpaperPattern;
    walls: [string, string];
    carpet: string;
    windows: WindowSpec[];
    light: { color: string; intensity: number };
    // Left outside the door once you've answered the resident.
    gift: string;
};

export const ROOMS: RoomDef[] = [
    {
        // An ordinary flat. Cosy, apart from the open window and the snow.
        id: "flat",
        slot: 1,
        plate: "1",
        door: "#3e6b8a",
        wallpaper: "stripes",
        walls: ["#efe0c4", "#d9bf94"],
        carpet: "#6b4b2a",
        windows: [{ wall: "back", x: 0.45, width: 1.5, height: 1.3 }],
        light: { color: "#ffe6bd", intensity: 16 },
        gift: "A mug of something warm",
    },
    {
        // A birthday party. Bunting, balloons, a banner. Nobody came.
        id: "party",
        slot: 2,
        plate: "2",
        door: "#c4577d",
        wallpaper: "dots",
        walls: ["#fbe3ef", "#f29bc0"],
        carpet: "#5a2e6b",
        windows: [],
        light: { color: "#ffd6f0", intensity: 18 },
        gift: "A balloon, slowly losing interest",
    },
    {
        // An office with a leak, a typewriter and a tally on the wall.
        id: "office",
        slot: 3,
        plate: "3",
        door: "#6b6f5a",
        wallpaper: "plain",
        walls: ["#d8dccb", "#b9bea6"],
        carpet: "#4a5048",
        windows: [{ wall: "right", x: 0.3, width: 1.2, height: 1.0 }],
        light: { color: "#e6ffe8", intensity: 14 },
        gift: "A paper clip, bent into a smile",
    },
    {
        // The quiet room. Dust sheets, a covered mirror, a chair facing the wall.
        id: "quiet",
        slot: 4,
        plate: "4",
        door: "#2a2622",
        wallpaper: "diamonds",
        walls: ["#4a4440", "#3a3430"],
        carpet: "#2a2420",
        windows: [],
        light: { color: "#c9b08a", intensity: 4 },
        gift: "A single tooth. Probably a thank-you",
    },
];

export const roomDef = (id: RoomId) => ROOMS.find((r) => r.id === id)!;

// Inventory tags: aiming the keyhole at a tagged object shows its glyph.
export const tagId = (word: Word) => `tag:${word}`;
export const wordFromTagId = (id: string | null) => (id?.startsWith("tag:") ? (id.slice(4) as Word) : null);
