import { Vector3 } from "three";

export type Vec3 = [number, number, number];

// The hallway runs along -z. Doors sit on the end wall (slot 0) and the side walls.
export const HALL = { width: 4, height: 3, near: 6, far: -14 };
export const DOOR = { width: 1.1, height: 2.2 };
// How far you can walk along the hallway (camera z).
export const WALK = { start: 5, min: -9.5, max: 5 };
// Keyhole position in a door's local space (x right, y up, z out of the door).
export const KEYHOLE: Vec3 = [0.4, 0.865, 0];
// Centre of the keyhole overlay's round part, in screen coordinates (-1..1, y up).
// Matches the circle in KeyholeMask (cy=-14 in a 100-unit-tall viewBox).
export const AIM_NDC: [number, number] = [0, 0.28];

// While peeking, moving the mouse into the bottom strip of the screen (pixels) tilts the
// view down to the doormat icons and shows the pointer. It stays there until the mouse
// goes back above DOORMAT_EXIT, so the icons can sit comfortably above the strip.
export const DOORMAT_ZONE = 150;
export const DOORMAT_EXIT = 400;
// Extra downward tilt (radians) when looking at the doormat.
export const DOORMAT_PITCH = -0.38;

// Ids of the clickable things in a room that aren't notes.
export const EXIT_ID = "exit";
// The letter on the doormat: back to the note you are holding.
export const WRITE_ID = "note";
export const CAT_ID = "cat";

// Your staff locker, on the left wall near where you start.
export const LOCKER_Z = -0.6;

// Rooms are drawn far away from the hallway; the keyhole hides the jump.
export const ROOM_ORIGIN: Vec3 = [100, 0, 0];
export const ROOM = { width: 6, depth: 6, height: 3 };

const UP = new Vector3(0, 1, 0);

export function slotTransform(slot: number): { position: Vec3; rotY: number } {
    if (slot === 0) return { position: [0, 0, HALL.far], rotY: 0 };
    const left = slot % 2 === 1;
    const row = Math.ceil(slot / 2) - 1;
    const z = -3 - row * 4;
    return left
        ? { position: [-HALL.width / 2, 0, z], rotY: Math.PI / 2 }
        : { position: [HALL.width / 2, 0, z], rotY: -Math.PI / 2 };
}

// Convert a point in a door's local space into world space.
export function doorToWorld(slot: number, local: Vec3): Vec3 {
    const { position, rotY } = slotTransform(slot);
    const v = new Vector3(...local).applyAxisAngle(UP, rotY);
    return [v.x + position[0], v.y + position[1], v.z + position[2]];
}

export const roomToWorld = (local: Vec3): Vec3 => [
    local[0] + ROOM_ORIGIN[0],
    local[1] + ROOM_ORIGIN[1],
    local[2] + ROOM_ORIGIN[2],
];

export type View = { pos: Vec3; look: Vec3 };

// Fixed camera presets.
export const VIEWS = {
    // Standing in the hallway at depth z, looking towards the end wall.
    hallway: (z: number): View => ({ pos: [0, 1.7, z], look: [0, 1.3, z - 13] }),
    doorFront: (slot: number): View => ({
        pos: doorToWorld(slot, [0, 1.45, 2.1]),
        look: doorToWorld(slot, [0, 1.2, 0]),
    }),
    // Looking down at the gap under the door (for writing and reading notes).
    doorLow: (slot: number): View => ({
        pos: doorToWorld(slot, [0, 1.4, 1.8]),
        look: doorToWorld(slot, [0, 0.55, 0]),
    }),
    keyhole: (slot: number): View => ({
        pos: doorToWorld(slot, [KEYHOLE[0], KEYHOLE[1], 0.3]),
        look: doorToWorld(slot, KEYHOLE),
    }),
    room: { pos: roomToWorld([0, 1.45, 0.9]), look: roomToWorld([0, 0.85, -4]) } as View,
    // Up close to the notice board at the end of the hallway, and to your locker.
    board: { pos: [0, 1.6, HALL.far + 2.6], look: [0, 1.5, HALL.far] } as View,
    locker: { pos: [-0.5, 1.55, LOCKER_Z], look: [-HALL.width / 2, 1.35, LOCKER_Z] } as View,
};
