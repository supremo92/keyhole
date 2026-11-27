import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { useView } from "../stores/view";
import { Box } from "./Box";
import { slotTransform } from "./layout";

// How far in front of the door the paper starts (or ends), and how far under it goes.
// Both in the door's local space; z is out of the door, towards the hallway.
const NEAR_Z = 0.8;
const UNDER_Z = -0.45;
const DURATION = 1.15; // seconds

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// A real sheet of paper on the hallway floor that slides under the door (writing a note,
// putting one back) or out from under it (taking one out). Past the door it disappears
// into the dark gap and the wall behind.
export function SlidingPaper() {
    const slide = useView((s) => s.slide);
    const slot = useView((s) => s.doorSlot);
    const paper = useRef<Group>(null);

    useFrame(() => {
        if (!paper.current || !slide) return;
        const t = Math.min(1, (performance.now() - slide.startedAt) / (DURATION * 1000));
        const k = easeInOut(t);
        const z = slide.direction === "in" ? NEAR_Z + (UNDER_Z - NEAR_Z) * k : UNDER_Z + (NEAR_Z - UNDER_Z) * k;
        paper.current.position.set(Math.sin(k * Math.PI) * 0.04, 0.008, z);
        paper.current.rotation.set(0, (slide.direction === "in" ? 0.12 : -0.12) * (1 - k) + 0.03, 0);
    });

    if (!slide || slot === null) return null;
    const { position, rotY } = slotTransform(slot);

    return (
        <group position={position} rotation={[0, rotY, 0]}>
            {/* The dark gap under the door. */}
            <mesh position={[0, 0.02, 0.032]}>
                <planeGeometry args={[1.08, 0.04]} />
                <meshBasicMaterial color="#050302" />
            </mesh>
            <group ref={paper} position={[0, 0.008, slide.direction === "in" ? NEAR_Z : UNDER_Z]}>
                <Box size={[0.3, 0.004, 0.4]} color={slide.colour} roughness={0.9} />
                {[0.12, 0.07, 0.02, -0.03, -0.08].map((z) => (
                    <Box key={z} size={[0.2, 0.001, 0.008]} position={[0, 0.0025, z]} color="#7a8aa8" />
                ))}
            </group>
        </group>
    );
}
