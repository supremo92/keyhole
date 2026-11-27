import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { useView } from "../stores/view";
import { Box } from "./Box";
import { slotTransform } from "./layout";
import { CanvasTexture, type Mesh } from "three";

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

    if (slot === null) return null;
    if (!slide) return <OperatorShadow slot={slot} />;
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

// While the Operator processes your note: lamplight appears in the gap under the door,
// and the shadow of two feet walks across, stops in the middle (the stamp comes down),
// then walks off.
// Fades from bright at the door to nothing, and softly at the sides.
let fade: CanvasTexture | null = null;
function spillFade() {
    if (fade) return fade;
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const down = g.createLinearGradient(0, 0, 0, 64);
    down.addColorStop(0, "#fff");
    down.addColorStop(1, "#000");
    g.fillStyle = down;
    g.fillRect(0, 0, 64, 64);
    const sides = g.createLinearGradient(0, 0, 64, 0);
    sides.addColorStop(0, "#000");
    sides.addColorStop(0.25, "rgba(0,0,0,0)");
    sides.addColorStop(0.75, "rgba(0,0,0,0)");
    sides.addColorStop(1, "#000");
    g.fillStyle = sides;
    g.fillRect(0, 0, 64, 64);
    fade = new CanvasTexture(c);
    return fade;
}

const PROCESS_TIME = 2.3; // seconds, matches flow.awaitReply

function OperatorShadow({ slot }: { slot: number }) {
    const since = useView((s) => s.processingSince);
    const feet = useRef<Group>(null);
    const left = useRef<Mesh>(null);
    const right = useRef<Mesh>(null);

    useFrame(() => {
        if (!feet.current || since === null) return;
        const t = Math.min(1, (performance.now() - since) / 1000 / PROCESS_TIME);
        // Walk in from the left, stand still in the middle, walk out to the right.
        const x = t < 0.35 ? -0.7 + (t / 0.35) * 0.7 : t < 0.7 ? 0 : ((t - 0.7) / 0.3) * 0.7;
        feet.current.position.x = x;
        // Only visible in the gap itself, not over the door frame.
        feet.current.visible = Math.abs(x) < 0.47;
        // Feet step alternately while walking.
        const walking = t < 0.35 || t > 0.7;
        const step = walking ? Math.sin(performance.now() / 90) * 0.03 : 0;
        if (left.current) left.current.position.x = -0.06 + step;
        if (right.current) right.current.position.x = 0.06 - step;
    });

    if (since === null) return null;
    const { position, rotY } = slotTransform(slot);
    return (
        <group position={position} rotation={[0, rotY, 0]}>
            {/* Warm light leaking through the gap. */}
            <mesh position={[0, 0.02, 0.031]}>
                <planeGeometry args={[1.08, 0.04]} />
                <meshBasicMaterial color="#ffcf87" />
            </mesh>
            {/* ...and spilling a little way across the hallway floor. */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0.2]}>
                <planeGeometry args={[1.0, 0.36]} />
                <meshBasicMaterial color="#ffcf87" alphaMap={spillFade()} transparent opacity={0.35} depthWrite={false} />
            </mesh>
            <group ref={feet} position={[-0.7, 0.02, 0.0315]}>
                <mesh ref={left}>
                    <planeGeometry args={[0.09, 0.04]} />
                    <meshBasicMaterial color="#120c08" />
                </mesh>
                <mesh ref={right}>
                    <planeGeometry args={[0.09, 0.04]} />
                    <meshBasicMaterial color="#120c08" />
                </mesh>
            </group>
        </group>
    );
}
