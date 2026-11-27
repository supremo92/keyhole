// Values shared by the Worker and the front end.

// Slot 0 is the door at the end of the hallway; 1-6 are along the side walls.
export const DOOR_SLOTS = 7;

// Notes in slots 0-7 sit on furniture; 8 and up pile up on the floor.
export const MAX_FURNITURE_SLOTS = 8;

export const FURNITURE_TYPES = [
    "table",
    "desk",
    "bookshelf",
    "dresser",
    "stool",
    "armchair",
    "piano",
    "crate",
] as const;
export type FurnitureType = (typeof FURNITURE_TYPES)[number];

export const WALLPAPER_PATTERNS = ["stripes", "dots", "checks", "diamonds", "waves", "plain"] as const;
export type WallpaperPattern = (typeof WALLPAPER_PATTERNS)[number];

export const DOOR_COLOURS = ["#b5523b", "#3b6fb5", "#3e8e5a", "#8a4fb0", "#d19a2a", "#2a9d9a", "#c4577d", "#6b5a3e"];
export const PAPER_COLOURS = ["#fffdf3", "#fff4c7", "#e8f4ff", "#ffe8ef", "#eaffea"];
export const CARPET_COLOURS = ["#7a2e2e", "#2e4a7a", "#3f6b3a", "#6b4b2a", "#5a2e6b", "#8a7a5a", "#2e6b66", "#9a5a3a"];
export const WALL_PALETTES: [string, string][] = [
    ["#f2e3c6", "#d9b98a"],
    ["#d7e8d0", "#9fc18f"],
    ["#e6d6ee", "#b996cc"],
    ["#f5d5c8", "#dd9a82"],
    ["#d0e2f0", "#8fb3d1"],
    ["#f0eccf", "#c9bf7a"],
    ["#ead0d0", "#c48b8b"],
];

export type Wall = "left" | "right" | "back";
export type WindowSpec = { wall: Wall; x: number; width: number; height: number };

export const LIMITS = { doorName: 30, noteTitle: 60, noteBody: 4000 };
