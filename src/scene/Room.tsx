import { useState } from "react";
import type { Wall, WindowSpec } from "../../shared/constants";
import { useShift } from "../lib/api";
import { Box } from "./Box";
import { DoormatIcons } from "./DoormatIcons";
import { ROOM, ROOM_ORIGIN, type Vec3 } from "./layout";
import { FlatScene, OfficeScene, PartyScene, QuietScene, type CatSpot } from "./RoomScenes";
import type { RoomDef } from "./rooms";
import { carpet, nightSky, wallpaper } from "./textures";

const HALF_W = ROOM.width / 2;
const D = ROOM.depth;
// The side walls, ceiling and skirting run on past the door (behind the keyhole), so turning
// to look sideways never shows where the room ends.
const SIDE = D + 2;
const SIDE_Z = -D / 2 + 1;

const WALLS: Record<Wall, { position: Vec3; rotY: number }> = {
    back: { position: [0, 1.6, -D + 0.01], rotY: 0 },
    left: { position: [-HALF_W + 0.01, 1.6, -D / 2], rotY: Math.PI / 2 },
    right: { position: [HALF_W - 0.01, 1.6, -D / 2], rotY: -Math.PI / 2 },
};

// A plain window onto the night.
function RoomWindow({ spec }: { spec: WindowSpec }) {
    const wall = WALLS[spec.wall];
    const offset = spec.x * (HALF_W - spec.width / 2 - 0.4);
    const frame = "#f4efe6";
    return (
        <group position={wall.position} rotation={[0, wall.rotY, 0]}>
            <group position={[offset, 0, 0]}>
                <mesh position={[0, 0, 0.005]}>
                    <planeGeometry args={[spec.width, spec.height]} />
                    <meshBasicMaterial map={nightSky()} />
                </mesh>
                <Box size={[spec.width + 0.12, 0.08, 0.08]} position={[0, spec.height / 2, 0.03]} color={frame} />
                <Box size={[spec.width + 0.2, 0.08, 0.16]} position={[0, -spec.height / 2, 0.06]} color={frame} />
                <Box size={[0.08, spec.height, 0.08]} position={[-spec.width / 2, 0, 0.03]} color={frame} />
                <Box size={[0.08, spec.height, 0.08]} position={[spec.width / 2, 0, 0.03]} color={frame} />
                <Box size={[0.04, spec.height, 0.04]} position={[0, 0, 0.03]} color={frame} />
            </group>
        </group>
    );
}

// One of the four rooms, as seen through its keyhole.
export function Room({ room }: { room: RoomDef }) {
    const shift = useShift(true).data;
    const status = (id: RoomDef["id"]) => shift?.rooms.find((r) => r.id === id)?.status;
    const solved = status(room.id) === "solved";
    const waiting = status(room.id) === "waiting";
    // Once it's been asked to move off the cake, the cat wanders. On any peek it might be in
    // here: in its usual spot, or sitting on the crib note so you can only read part of it.
    const [roll] = useState(() => Math.random());
    const cat: CatSpot = status("party") !== "solved" ? "none" : roll < 0.3 ? "usual" : roll < 0.6 ? "note" : "none";

    const walls = wallpaper(room.wallpaper, room.walls, [ROOM.width / 1.2, ROOM.height / 1.2]);
    // Same pattern scale on the longer side walls.
    const sideWalls = wallpaper(room.wallpaper, room.walls, [SIDE / 1.2, ROOM.height / 1.2]);
    const floor = carpet(room.carpet, [3, 3]);

    return (
        <group position={ROOM_ORIGIN}>
            {/* The floor runs a little past the door so looking down never shows a gap. */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -D / 2 + 1]} receiveShadow>
                <planeGeometry args={[ROOM.width, D + 2]} />
                <meshStandardMaterial map={floor} roughness={1} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM.height, SIDE_Z]}>
                <planeGeometry args={[ROOM.width, SIDE]} />
                <meshStandardMaterial color="#e6dfd2" />
            </mesh>
            <mesh position={[0, ROOM.height / 2, -D]} receiveShadow>
                <planeGeometry args={[ROOM.width, ROOM.height]} />
                <meshStandardMaterial map={walls} />
            </mesh>
            <mesh position={[-HALF_W, ROOM.height / 2, SIDE_Z]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[SIDE, ROOM.height]} />
                <meshStandardMaterial map={sideWalls} />
            </mesh>
            <mesh position={[HALF_W, ROOM.height / 2, SIDE_Z]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[SIDE, ROOM.height]} />
                <meshStandardMaterial map={sideWalls} />
            </mesh>
            <mesh position={[0, ROOM.height / 2, 0]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[ROOM.width, ROOM.height]} />
                <meshStandardMaterial map={walls} />
            </mesh>
            <Box size={[ROOM.width, 0.12, 0.03]} position={[0, 0.06, -D + 0.015]} color="#e8e0d0" />
            <Box size={[0.03, 0.12, SIDE]} position={[-HALF_W + 0.015, 0.06, SIDE_Z]} color="#e8e0d0" />
            <Box size={[0.03, 0.12, SIDE]} position={[HALF_W - 0.015, 0.06, SIDE_Z]} color="#e8e0d0" />

            {room.windows.map((w, i) => (
                <RoomWindow key={i} spec={w} />
            ))}

            {/* Ceiling light (the office has its own strip light). */}
            {room.id !== "office" && (
                <>
                    <mesh position={[0, ROOM.height - 0.15, -D / 2]}>
                        <sphereGeometry args={[0.16, 16, 16]} />
                        <meshBasicMaterial color={room.id === "quiet" ? "#2a2622" : "#fff4d6"} />
                    </mesh>
                    <pointLight
                        position={[0, ROOM.height - 0.4, -D / 2]}
                        intensity={room.light.intensity}
                        distance={14}
                        decay={1.4}
                        color={room.light.color}
                        castShadow
                    />
                </>
            )}

            <DoormatIcons showNote={waiting} />
            {room.id === "flat" && <FlatScene solved={solved} cat={cat} />}
            {room.id === "party" && <PartyScene solved={solved} cat={cat} />}
            {room.id === "office" && <OfficeScene solved={solved} cat={cat} />}
            {room.id === "quiet" && <QuietScene solved={solved} cat={cat} />}
        </group>
    );
}
