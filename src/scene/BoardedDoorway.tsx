import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import type { Group } from "three";
import { unboard } from "../lib/flow";
import { useView } from "../stores/view";
import { Box } from "./Box";
import { DoorFrame } from "./Door";
import { slotTransform } from "./layout";

const PLANKS = [
    { y: 1.85, rz: 0.14 },
    { y: 1.35, rz: -0.2 },
    { y: 0.85, rz: 0.1 },
    { y: 0.4, rz: -0.12 },
];

export function BoardedDoorway({ slot }: { slot: number }) {
    const { position, rotY } = slotTransform(slot);
    const mode = useView((s) => s.mode);
    const prying = useView((s) => s.unboarding === slot);
    const [hovered, setHovered] = useState(false);
    const planks = useRef<(Group | null)[]>([]);
    const t = useRef(0);
    const active = mode === "hallway";

    // Planks pop off one by one, tumble forward and drop to the floor.
    useFrame((_, dt) => {
        t.current = prying ? t.current + dt : 0;
        planks.current.forEach((plank, i) => {
            if (!plank) return;
            const base = PLANKS[i];
            const local = Math.max(0, t.current - i * 0.18);
            plank.position.set(
                (i % 2 ? -1 : 1) * local * 0.3,
                Math.max(0.04 + i * 0.05, base.y - 4.9 * local * local),
                0.06 + local * 0.9,
            );
            plank.rotation.set(Math.min(local * 3, Math.PI / 2), 0, base.rz + local * (i % 2 ? -2 : 2));
            plank.visible = local < 2.5;
        });
    });

    return (
        <group position={position} rotation={[0, rotY, 0]}>
            <DoorFrame color="#5b4a3a" />
            <Box size={[1.1, 2.2, 0.02]} position={[0, 1.1, 0.012]} color="#140f0b" />
            <group
                onClick={(e) => {
                    e.stopPropagation();
                    if (active) void unboard(slot);
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
                {/* Invisible hit area so the gaps between planks are clickable too. */}
                <mesh position={[0, 1.1, 0.05]}>
                    <planeGeometry args={[1.2, 2.2]} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
                {PLANKS.map((p, i) => (
                    <group
                        key={i}
                        ref={(el) => {
                            planks.current[i] = el;
                        }}
                        position={[0, p.y, 0.06]}
                        rotation={[0, 0, p.rz]}
                    >
                        <Box size={[1.4, 0.17, 0.04]} color={hovered && active ? "#b48e5e" : "#9c7a4f"} />
                        <Box size={[0.03, 0.03, 0.01]} position={[-0.6, 0, 0.025]} color="#333" metalness={0.8} />
                        <Box size={[0.03, 0.03, 0.01]} position={[0.6, 0, 0.025]} color="#333" metalness={0.8} />
                    </group>
                ))}
            </group>
            <Html position={[0, 2.5, 0.1]} center zIndexRange={[5, 0]} pointerEvents="none">
                <div className={`door-plaque boarded ${active && hovered ? "show" : ""}`}>
                    Boarded up. Click to pry it open
                </div>
            </Html>
        </group>
    );
}
