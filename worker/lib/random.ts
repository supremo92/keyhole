import {
    CARPET_COLOURS,
    DOOR_COLOURS,
    FURNITURE_TYPES,
    PAPER_COLOURS,
    WALL_PALETTES,
    WALLPAPER_PATTERNS,
    type Wall,
    type WindowSpec,
} from "../../shared/constants";

export const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

const between = (min: number, max: number) => min + Math.random() * (max - min);

// A random room style, stored on the door so the room always looks the same.
export function randomRoomStyle() {
    const walls: Wall[] = ["left", "right", "back"];
    const count = 1 + Math.floor(Math.random() * 3);
    const windows: WindowSpec[] = [];
    for (let i = 0; i < count; i++) {
        const wall = walls.splice(Math.floor(Math.random() * walls.length), 1)[0];
        windows.push({
            wall,
            x: Number(between(-0.5, 0.5).toFixed(2)),
            width: Number(between(0.9, 1.8).toFixed(2)),
            height: Number(between(0.9, 1.5).toFixed(2)),
        });
    }
    return {
        colour: pick(DOOR_COLOURS),
        wallpaper: pick(WALLPAPER_PATTERNS),
        design: JSON.stringify(pick(WALL_PALETTES)),
        carpetColour: pick(CARPET_COLOURS),
        windowLayout: JSON.stringify(windows),
    };
}

export const randomFurniture = () => pick(FURNITURE_TYPES);
export const randomPaper = () => pick(PAPER_COLOURS);
