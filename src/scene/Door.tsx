import { useState } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import type { RoomDef } from "./rooms";
import { peek } from "../lib/flow";
import { useView } from "../stores/view";
import { Box } from "./Box";
import { KEYHOLE, slotTransform } from "./layout";

// The number, engraved on the plate.
const plates = new Map<string, CanvasTexture>();
function plateArt(text: string) {
    const cached = plates.get(text);
    if (cached) return cached;
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 84;
    const g = c.getContext("2d")!;
    g.fillStyle = "#2b2010";
    g.font = "bold 64px Georgia, serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, c.width / 2, c.height / 2 + 4);
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    plates.set(text, tex);
    return tex;
}

export function DoorFrame({ color = "#3b2a1c" }: { color?: string }) {
    return (
        <group>
            <Box size={[1.34, 0.12, 0.14]} position={[0, 2.26, 0.04]} color={color} />
            <Box size={[0.12, 2.32, 0.14]} position={[-0.61, 1.16, 0.04]} color={color} />
            <Box size={[0.12, 2.32, 0.14]} position={[0.61, 1.16, 0.04]} color={color} />
        </group>
    );
}

export function Door({ room }: { room: RoomDef }) {
    const { position, rotY } = slotTransform(room.slot);
    const mode = useView((s) => s.mode);
    const [hovered, setHovered] = useState(false);
    const active = mode === "hallway";

    return (
        <group position={position} rotation={[0, rotY, 0]}>
            <DoorFrame />
            <group
                onClick={(e) => {
                    e.stopPropagation();
                    if (active) void peek(room.id);
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
                <Box
                    size={[1.1, 2.16, 0.06]}
                    position={[0, 1.12, 0.03]}
                    color={room.door}
                    emissive={hovered && active ? "#2a2010" : "#000000"}
                />
                {[0.24, -0.24].map((x) =>
                    [1.55, 0.6].map((y) => (
                        <Box key={`${x}${y}`} size={[0.36, 0.68, 0.016]} position={[x, y, 0.07]} color="#000000" opacity={0.18} />
                    )),
                )}
                {/* Handle, backplate and the all-important keyhole. */}
                <Box size={[0.09, 0.32, 0.024]} position={[KEYHOLE[0], 0.95, 0.075]} color="#c9a43b" metalness={0.6} roughness={0.35} />
                <mesh position={[KEYHOLE[0], 1.03, 0.125]}>
                    <sphereGeometry args={[0.05, 16, 16]} />
                    <meshStandardMaterial color="#d8b54a" metalness={0.7} roughness={0.25} />
                </mesh>
                <mesh position={[KEYHOLE[0], KEYHOLE[1] + 0.008, 0.0885]}>
                    <circleGeometry args={[0.013, 16]} />
                    <meshBasicMaterial color="#050302" polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
                </mesh>
                <mesh position={[KEYHOLE[0], KEYHOLE[1] - 0.012, 0.0885]}>
                    <planeGeometry args={[0.012, 0.03]} />
                    <meshBasicMaterial color="#050302" polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
                </mesh>
            </group>
            {/* A brass number sign on a bracket sticking straight out from the wall, turned to
                face along the corridor so it can be read from either end. Room 3's hangs crooked. */}
            <Box size={[0.025, 0.025, 0.3]} position={[0.75, 2.62, 0.15]} color="#3a2a1a" />
            <group position={[0.75, 2.6, 0.27]} rotation={[0, Math.PI / 2, room.id === "office" ? 0.5 : 0]}>
                <Box size={[0.36, 0.27, 0.03]} position={[0, -0.15, 0]} color="#b8923a" metalness={0.6} roughness={0.35} emissive={hovered && active ? "#4a3a10" : "#000000"} />
                {[1, -1].map((side) => (
                    <mesh key={side} position={[0, -0.15, side * 0.016]} rotation={[0, side > 0 ? 0 : Math.PI, 0]}>
                        <planeGeometry args={[0.32, 0.23]} />
                        <meshStandardMaterial map={plateArt(room.plate)} metalness={0.4} roughness={0.4} transparent />
                    </mesh>
                ))}
            </group>
        </group>
    );
}
