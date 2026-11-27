import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3, type Group } from "three";
import { useView } from "../stores/view";
import { Box } from "./Box";
import { CAT_ID, type Vec3 } from "./layout";
import type { CatCoat, CatMood } from "./catTypes";
import { OutlineContext } from "./outline";

// The building's cat, drawn in one of its moods (see catPlan.ts).
// A thin dark cartoon outline for the cat (separate from the furniture's gold one).
const CAT_OUTLINE = { color: "#1a120c", thickness: 1.5 };
const NOSE = "#e48a9a";
const MUZZLE = "#efe6d8";
// Built at real-cat size, then scaled up a little so it reads through the keyhole.
const CAT_SCALE = 1.4;

const camWorld = new Vector3();
const headWorld = new Vector3();

// The head turns to follow the camera, which (while peeking) means looking at you.
function useWatchCamera(strength = 1) {
    const head = useRef<Group>(null);
    useFrame(({ camera }) => {
        const h = head.current;
        if (!h?.parent) return;
        camera.getWorldPosition(camWorld);
        h.getWorldPosition(headWorld);
        // Work out the direction in the parent's space, then turn the head that way (limited).
        h.parent.worldToLocal(camWorld);
        const local = h.parent.worldToLocal(headWorld.clone());
        const dx = camWorld.x - local.x;
        const dy = camWorld.y - local.y;
        const dz = camWorld.z - local.z;
        const yaw = Math.max(-1.3, Math.min(1.3, Math.atan2(dx, dz))) * strength;
        const pitch = Math.max(-0.6, Math.min(0.6, -Math.atan2(dy, Math.hypot(dx, dz)))) * strength;
        h.rotation.y += (yaw - h.rotation.y) * 0.1;
        h.rotation.x += (pitch - h.rotation.x) * 0.1;
    });
    return head;
}

function Ears({ coat }: { coat: CatCoat }) {
    return (
        <>
            {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 0.045, 0.075, -0.01]} rotation={[0, 0, -s * 0.25]} castShadow>
                    <coneGeometry args={[0.03, 0.06, 4]} />
                    <meshStandardMaterial color={coat.dark} roughness={0.9} />
                </mesh>
            ))}
        </>
    );
}

function OpenEyes({ coat, blink }: { coat: CatCoat; blink: React.RefObject<Group | null> }) {
    return (
        <group ref={blink} position={[0, 0.012, 0.061]}>
            {[-1, 1].map((s) => (
                <group key={s} position={[s * 0.035, 0, 0]}>
                    <mesh>
                        <boxGeometry args={[0.032, 0.026, 0.004]} />
                        <meshStandardMaterial color={coat.eyes} emissive={coat.eyes} emissiveIntensity={0.9} />
                    </mesh>
                    {/* Slit pupil. */}
                    <mesh position={[0, 0, 0.003]}>
                        <boxGeometry args={[0.006, 0.024, 0.002]} />
                        <meshBasicMaterial color="#000" />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

function SittingCat({ coat, swat }: { coat: CatCoat; swat: boolean }) {
    const head = useWatchCamera();
    const paw = useRef<Group>(null);
    const tail = useRef<Group>(null);
    const blink = useRef<Group>(null);
    const swatStart = useRef<number | null>(null);

    useFrame(({ clock }) => {
        const t = clock.elapsedTime;
        if (tail.current) tail.current.rotation.y = Math.sin(t * 1.6) * 0.35;
        // A slow blink every few seconds.
        if (blink.current) blink.current.scale.y = t % 4.3 < 0.12 ? 0.1 : 1;
        // The swat: the paw lifts, hangs there menacingly, then sweeps sideways.
        // Timed from when the swat starts, so the sweep lines up with the note falling.
        if (swat) swatStart.current ??= t;
        else swatStart.current = null;
        if (paw.current) {
            const p = swatStart.current === null ? -1 : (t - swatStart.current) * 1.4;
            const lift = p < 0 ? 0 : Math.min(1, p * 2);
            const sweep = p > 0.8 && p < 1.2 ? Math.sin(((p - 0.8) / 0.4) * Math.PI) : 0;
            paw.current.rotation.x += (-lift * 1.1 - paw.current.rotation.x) * 0.3;
            paw.current.rotation.z = sweep * 0.9;
        }
    });

    return (
        <group>
            {/* Haunches and body. */}
            <Box size={[0.2, 0.1, 0.22]} position={[0, 0.05, -0.03]} color={coat.fur} roughness={0.95} />
            <Box size={[0.15, 0.2, 0.15]} position={[0, 0.15, 0]} rotation={[-0.25, 0, 0]} color={coat.fur} roughness={0.95} />
            {/* Front legs: the right one is the paw that swats. */}
            <Box size={[0.04, 0.14, 0.04]} position={[-0.04, 0.07, 0.07]} color={coat.fur} />
            <group ref={paw} position={[0.04, 0.14, 0.07]}>
                <Box size={[0.04, 0.14, 0.04]} position={[0, -0.07, 0]} color={coat.fur} />
                <Box size={[0.045, 0.02, 0.05]} position={[0, -0.135, 0.008]} color={coat.dark} />
            </group>
            {/* Head. */}
            <group ref={head} position={[0, 0.3, 0.04]}>
                <Box size={[0.15, 0.12, 0.12]} color={coat.fur} roughness={0.95} />
                <Box size={[0.07, 0.045, 0.03]} position={[0, -0.03, 0.065]} color={MUZZLE} />
                <Box size={[0.02, 0.014, 0.01]} position={[0, -0.012, 0.081]} color={NOSE} />
                <Ears coat={coat} />
                <OpenEyes coat={coat} blink={blink} />
            </group>
            {/* Tail, curling round on the surface. */}
            <group ref={tail} position={[0, 0.02, -0.14]}>
                <Box size={[0.035, 0.035, 0.16]} position={[0.03, 0, -0.06]} rotation={[0, 0.5, 0]} color={coat.dark} />
                <Box size={[0.035, 0.035, 0.12]} position={[0.11, 0, -0.06]} rotation={[0, -0.7, 0]} color={coat.dark} />
            </group>
        </group>
    );
}

function SleepingCat({ coat }: { coat: CatCoat }) {
    const body = useRef<Group>(null);
    const peeking = useView((s) => s.mode === "peeking");
    useFrame(({ clock }) => {
        if (body.current) body.current.scale.y = 1 + Math.sin(clock.elapsedTime * 1.8) * 0.07;
    });
    return (
        <group>
            <group ref={body}>
                <Box size={[0.28, 0.1, 0.22]} position={[0, 0.05, 0]} color={coat.fur} roughness={0.95} />
                <Box size={[0.2, 0.05, 0.16]} position={[-0.02, 0.11, -0.01]} color={coat.fur} roughness={0.95} />
            </group>
            {/* Head resting on its paws, eyes shut. */}
            <group position={[0.12, 0.08, 0.09]} rotation={[0.1, 0.6, 0.15]}>
                <Box size={[0.13, 0.1, 0.11]} color={coat.fur} roughness={0.95} />
                <Box size={[0.02, 0.014, 0.01]} position={[0, -0.01, 0.058]} color={NOSE} />
                <Ears coat={coat} />
                {[-1, 1].map((s) => (
                    <Box key={s} size={[0.03, 0.005, 0.004]} position={[s * 0.032, 0.012, 0.056]} color="#1a120c" />
                ))}
            </group>
            {/* Tail wrapped round the front. */}
            <Box size={[0.26, 0.035, 0.035]} position={[0, 0.02, 0.125]} rotation={[0, 0.15, 0]} color={coat.dark} />
            <Html position={[0.1, 0.32, 0]} center zIndexRange={[4, 0]} pointerEvents="none">
                <div className={`cat-zzz ${peeking ? "show" : ""}`}><span>z</span><span>z</span><span>z</span></div>
            </Html>
        </group>
    );
}

// Labels that float over the cat when the keyhole is aimed at it.
const CAT_LINES: Record<CatMood, string> = {
    sleep: "Asleep on your paperwork.",
    stare: "It has been watching the keyhole for some time.",
    knock: "It is maintaining eye contact.",
};

export function Cat({
    mood,
    coat,
    position = [0, 0, 0],
    rotY = 0,
    swat = false,
    interactId = CAT_ID,
}: {
    mood: CatMood;
    coat: CatCoat;
    position?: Vec3;
    rotY?: number;
    swat?: boolean;
    // A room can give the cat an inventory tag instead (see RoomScenes).
    interactId?: string;
}) {
    const aimed = useView((s) => s.mode === "peeking" && s.hoveredId === CAT_ID);
    return (
        <group position={position} rotation={[0, rotY, 0]} scale={CAT_SCALE} userData={{ interactId }}>
            <OutlineContext.Provider value={CAT_OUTLINE}>
                {mood === "sleep" ? <SleepingCat coat={coat} /> : <SittingCat coat={coat} swat={swat} />}
            </OutlineContext.Provider>
            <Html position={[0, mood === "sleep" ? 0.42 : 0.55, 0]} center zIndexRange={[5, 0]} pointerEvents="none">
                <div className={`note-label ${aimed ? "show" : ""}`}>
                    <strong>The cat</strong>
                    <span>{CAT_LINES[mood]}</span>
                </div>
            </Html>
        </group>
    );
}
