import { Html } from "@react-three/drei";
import { useState } from "react";
import type { Door as DoorData } from "../../shared/types";
import { peek } from "../lib/flow";
import { useView } from "../stores/view";
import { Box } from "./Box";
import { KEYHOLE, slotTransform } from "./layout";

export function DoorFrame({ color = "#3b2a1c" }: { color?: string }) {
    return (
        <group>
            <Box size={[1.34, 0.12, 0.14]} position={[0, 2.26, 0.04]} color={color} />
            <Box size={[0.12, 2.32, 0.14]} position={[-0.61, 1.16, 0.04]} color={color} />
            <Box size={[0.12, 2.32, 0.14]} position={[0.61, 1.16, 0.04]} color={color} />
        </group>
    );
}

export function Door({ door }: { door: DoorData }) {
    const { position, rotY } = slotTransform(door.doorSlot);
    const mode = useView((s) => s.mode);
    const [hovered, setHovered] = useState(false);
    const active = mode === "hallway";

    return (
        <group position={position} rotation={[0, rotY, 0]}>
            <DoorFrame />
            <group
                onClick={(e) => {
                    e.stopPropagation();
                    if (active) void peek(door);
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
                    color={door.colour}
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
            <Html position={[0, 2.5, 0.1]} center zIndexRange={[5, 0]} pointerEvents="none">
                <div className={`door-plaque ${hovered ? "hovered" : ""} ${active ? "show" : ""}`}>{door.name}</div>
            </Html>
        </group>
    );
}
