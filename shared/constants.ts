// Values shared by the Worker and the front end.

// Hallway layout: slot 0 is the end wall (the notice board); 1-6 are along the side walls.
export const DOOR_SLOTS = 7;

export const WALLPAPER_PATTERNS = ["stripes", "dots", "checks", "diamonds", "waves", "plain"] as const;
export type WallpaperPattern = (typeof WALLPAPER_PATTERNS)[number];

export type Wall = "left" | "right" | "back";
export type WindowSpec = { wall: Wall; x: number; width: number; height: number };
