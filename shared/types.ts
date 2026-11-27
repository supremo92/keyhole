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
    createdAt: string;
    updatedAt: string;
};
