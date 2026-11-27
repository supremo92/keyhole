import { Html } from "@react-three/drei";
import { useState } from "react";
import { MAX_FURNITURE_SLOTS, type Wall, type WindowSpec } from "../../shared/constants";
import type { Door, Note } from "../../shared/types";
import { useNotes } from "../lib/api";
import { openNote } from "../lib/flow";
import { useView } from "../stores/view";
import { Box } from "./Box";
import { Furniture, NOTE_SPOT } from "./Furniture";
import { ROOM, ROOM_ORIGIN, type Vec3 } from "./layout";
import { carpet, sky, wallpaper } from "./textures";

const HALF_W = ROOM.width / 2;
const D = ROOM.depth;

// Eight fixed furniture spots: [x, z, rotation]. Each piece faces into the room.
const SLOTS: [number, number, number][] = [
    [-1.5, -5.35, 0],
    [1.5, -5.35, 0],
    [-2.45, -3.6, Math.PI / 2],
    [2.45, -3.6, -Math.PI / 2],
    [0, -5.35, 0],
    [-2.45, -1.7, Math.PI / 2],
    [2.45, -1.7, -Math.PI / 2],
    [0, -3.0, 0],
];

// A tiny deterministic "random" number from a string, so notes don't jump around.
function hash(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return ((h >>> 0) % 1000) / 1000;
}

const WALLS: Record<Wall, { position: Vec3; rotY: number }> = {
    back: { position: [0, 1.6, -D + 0.01], rotY: 0 },
    left: { position: [-HALF_W + 0.01, 1.6, -D / 2], rotY: Math.PI / 2 },
    right: { position: [HALF_W - 0.01, 1.6, -D / 2], rotY: -Math.PI / 2 },
};

function RoomWindow({ spec }: { spec: WindowSpec }) {
    const wall = WALLS[spec.wall];
    const offset = spec.x * (HALF_W - spec.width / 2 - 0.4);
    const frame = "#f4efe6";
    return (
        <group position={wall.position} rotation={[0, wall.rotY, 0]}>
            <group position={[offset, 0, 0]}>
                <mesh position={[0, 0, 0.005]}>
                    <planeGeometry args={[spec.width, spec.height]} />
                    <meshBasicMaterial map={sky()} />
                </mesh>
                <Box size={[spec.width + 0.12, 0.08, 0.08]} position={[0, spec.height / 2, 0.03]} color={frame} />
                <Box size={[spec.width + 0.2, 0.08, 0.16]} position={[0, -spec.height / 2, 0.06]} color={frame} />
                <Box size={[0.08, spec.height, 0.08]} position={[-spec.width / 2, 0, 0.03]} color={frame} />
                <Box size={[0.08, spec.height, 0.08]} position={[spec.width / 2, 0, 0.03]} color={frame} />
                <Box size={[0.04, spec.height, 0.04]} position={[0, 0, 0.03]} color={frame} />
                <Box size={[spec.width, 0.04, 0.04]} position={[0, 0, 0.03]} color={frame} />
                <pointLight position={[0, 0, 0.8]} intensity={3} distance={4} color="#cfe6ff" />
            </group>
        </group>
    );
}

function PaperNote({ note, position, rotY }: { note: Note; position: Vec3; rotY: number }) {
    const mode = useView((s) => s.mode);
    const [hovered, setHovered] = useState(false);
    const active = mode === "peeking";
    const date = new Date(note.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

    return (
        <group position={position} rotation={[0, rotY, 0]}>
            <group
                onClick={(e) => {
                    e.stopPropagation();
                    if (active) void openNote(note.id);
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered(true);
                    document.body.style.cursor = active ? "pointer" : "";
                }}
                onPointerOut={() => {
                    setHovered(false);
                    document.body.style.cursor = "";
                }}
            >
                {/* Invisible, slightly bigger hit area so the thin paper is easy to point at. */}
                <mesh position={[0, 0.06, 0]}>
                    <boxGeometry args={[0.5, 0.14, 0.6]} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
                <Box size={[0.34, 0.008, 0.44]} color={note.colour} emissive={hovered && active ? "#7a6e40" : "#2a2618"} />
                {[0.12, 0.06, 0, -0.06, -0.12].map((z) => (
                    <Box key={z} size={[0.24, 0.002, 0.01]} position={[0, 0.005, z]} color="#7a8aa8" />
                ))}
            </group>
            {/* Always mounted (drei Html dislikes mounting on hover); shown with CSS. */}
            <Html position={[0, 0.3, 0]} center zIndexRange={[5, 0]} pointerEvents="none">
                <div className={`note-label ${hovered && active ? "show" : ""}`}>
                    <strong>{note.title}</strong>
                    <span>{date}</span>
                </div>
            </Html>
        </group>
    );
}

function Placed({ note }: { note: Note }) {
    const r = hash(note.id);
    if (note.roomSlot < MAX_FURNITURE_SLOTS) {
        const [x, z, rot] = SLOTS[note.roomSlot];
        return (
            <group position={[x, 0, z]} rotation={[0, rot, 0]}>
                <Furniture type={note.furniture} />
                <PaperNote note={note} position={NOTE_SPOT[note.furniture]} rotY={(r - 0.5) * 0.8} />
            </group>
        );
    }
    // No furniture left: the note joins the pile on the floor.
    const k = note.roomSlot - MAX_FURNITURE_SLOTS;
    const pos: Vec3 = [-0.5 + ((k * 37) % 10) / 10, 0.01 + k * 0.007, -1.6 - ((k * 53) % 8) / 10];
    return <PaperNote note={note} position={pos} rotY={r * Math.PI * 2} />;
}

export function Room({ door }: { door: Door }) {
    const { data: notes = [] } = useNotes(door.id);
    const walls = wallpaper(door.wallpaper, door.wallColours, [ROOM.width / 1.2, ROOM.height / 1.2]);
    const floor = carpet(door.carpetColour, [3, 3]);

    return (
        <group position={ROOM_ORIGIN}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -D / 2]} receiveShadow>
                <planeGeometry args={[ROOM.width, D]} />
                <meshStandardMaterial map={floor} roughness={1} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM.height, -D / 2]}>
                <planeGeometry args={[ROOM.width, D]} />
                <meshStandardMaterial color="#f3ede2" />
            </mesh>
            <mesh position={[0, ROOM.height / 2, -D]} receiveShadow>
                <planeGeometry args={[ROOM.width, ROOM.height]} />
                <meshStandardMaterial map={walls} />
            </mesh>
            <mesh position={[-HALF_W, ROOM.height / 2, -D / 2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[D, ROOM.height]} />
                <meshStandardMaterial map={walls} />
            </mesh>
            <mesh position={[HALF_W, ROOM.height / 2, -D / 2]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[D, ROOM.height]} />
                <meshStandardMaterial map={walls} />
            </mesh>
            <mesh position={[0, ROOM.height / 2, 0]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[ROOM.width, ROOM.height]} />
                <meshStandardMaterial map={walls} />
            </mesh>
            {/* Skirting boards. */}
            <Box size={[ROOM.width, 0.12, 0.03]} position={[0, 0.06, -D + 0.015]} color="#f4efe6" />
            <Box size={[0.03, 0.12, D]} position={[-HALF_W + 0.015, 0.06, -D / 2]} color="#f4efe6" />
            <Box size={[0.03, 0.12, D]} position={[HALF_W - 0.015, 0.06, -D / 2]} color="#f4efe6" />

            {door.windows.map((w, i) => (
                <RoomWindow key={i} spec={w} />
            ))}

            {/* Ceiling light. */}
            <mesh position={[0, ROOM.height - 0.15, -D / 2]}>
                <sphereGeometry args={[0.18, 16, 16]} />
                <meshBasicMaterial color="#fff4d6" />
            </mesh>
            <pointLight position={[0, ROOM.height - 0.4, -D / 2]} intensity={20} distance={14} decay={1.4} color="#ffe6bd" castShadow />

            {notes.map((n) => (
                <Placed key={n.id} note={n} />
            ))}
        </group>
    );
}
