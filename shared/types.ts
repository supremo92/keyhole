import type { FurnitureType, WallpaperPattern, WindowSpec } from "./constants";

// Shapes of the JSON the API returns.
export type Door = {
    id: string;
    name: string;
    colour: string;
    doorSlot: number;
    wallpaper: WallpaperPattern;
    wallColours: [string, string];
    carpetColour: string;
    windows: WindowSpec[];
    createdAt: string;
};

export type Note = {
    id: string;
    doorId: string;
    title: string;
    body: string;
    colour: string;
    furniture: FurnitureType;
    roomSlot: number;
    // The Operator's reply (see shared/rulebook.ts), and the number of the rule it followed.
    reply: string | null;
    replyRule: number | null;
    createdAt: string;
    updatedAt: string;
};
