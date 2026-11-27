import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import type { MeshStandardMaterial } from "three";
import { openStrayPaper } from "../lib/flow";
import { useView } from "../stores/view";
import { Box } from "./Box";
import { slotTransform } from "./layout";

// A paper covered in the building's symbols, slid out from under a boarded doorway.
// It glows faintly until you pick it up.
export function StrayPaper() {
    const slot = useView((s) => s.strayPaper);
    const mode = useView((s) => s.mode);
    const hallway = mode === "hallway";
    const [hovered, setHovered] = useState(false);
    const paper = useRef<MeshStandardMaterial>(null);

    useFrame(({ clock }) => {
        if (paper.current) paper.current.emissiveIntensity = 0.25 + Math.sin(clock.elapsedTime * 3) * 0.2 + (hovered ? 0.4 : 0);
    });

    // Always mounted (drei Html misbehaves when added and removed), just hidden when there
    // is no paper, or once you've picked it up and are holding it in the overlay.
    const shown = slot !== null && mode !== "operating";
    const { position, rotY } = slotTransform(slot ?? 1);

    return (
        <group position={position} rotation={[0, rotY, 0]} visible={shown}>
            <group
                position={[0.1, 0.006, 0.6]}
                rotation={[0, 0.3, 0]}
                scale={1.6}
                onClick={(e) => {
                    if (!shown) return;
                    e.stopPropagation();
                    void openStrayPaper();
                }}
                onPointerOver={(e) => {
                    if (!shown) return;
                    e.stopPropagation();
                    setHovered(true);
                    document.body.style.cursor = hallway ? "pointer" : "";
                }}
                onPointerOut={() => {
                    setHovered(false);
                    document.body.style.cursor = "";
                }}
            >
                {/* Bigger invisible target, so it is easy to click from down the hall. */}
                <mesh position={[0, 0.05, 0]}>
                    <boxGeometry args={[0.6, 0.12, 0.7]} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
                {/* A soft glow on the floor around it. */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, 0]}>
                    <circleGeometry args={[0.34, 32]} />
                    <meshBasicMaterial color="#ffe6a0" transparent opacity={0.18} depthWrite={false} />
                </mesh>
                <mesh castShadow>
                    <boxGeometry args={[0.3, 0.004, 0.4]} />
                    <meshStandardMaterial ref={paper} color="#efe9d8" emissive="#ffe6a0" />
                </mesh>
                {/* Rows of strange marks. */}
                {[0.12, 0.06, 0, -0.06, -0.12].map((z, row) =>
                    [-0.09, -0.03, 0.03, 0.09].slice(0, 2 + ((row * 3) % 3)).map((x) => (
                        <Box key={`${z}${x}`} size={[0.035, 0.002, 0.03]} position={[x, 0.003, z]} color="#3b2f25" />
                    )),
                )}
                <Html position={[0, 0.2, 0]} center zIndexRange={[5, 0]} pointerEvents="none">
                    <div className={`note-label ${hovered && hallway && shown ? "show" : ""}`}>
                        <strong>A paper from behind the planks</strong>
                        <span>Someone in there needs an Operator</span>
                    </div>
                </Html>
            </group>
        </group>
    );
}
