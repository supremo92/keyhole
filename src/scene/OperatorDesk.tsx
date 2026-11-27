import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import type { Mesh } from "three";
import { useView } from "../stores/view";
import { Box } from "./Box";
import { RULEBOOK_ID, ROOM } from "./layout";
import { OUTLINE_AIMED, OUTLINE_IDLE, OutlineContext } from "./outline";

// The Operator's station, in the back-left corner of every room.
// Nobody is ever here. The Operator files your notes by following the rulebook, without
// understanding a word of them, and always seems to have just stepped out.

const WOOD = "#6b4423";
const DARK = "#3e2614";
const PAGE = "#f3ead2";

// Rising wisps of steam from a hot mug.
function Steam() {
    const puffs = useRef<(Mesh | null)[]>([]);
    useFrame(({ clock }) => {
        puffs.current.forEach((m, i) => {
            if (!m) return;
            const t = (clock.elapsedTime * 0.5 + i / 3) % 1;
            m.position.set(Math.sin(t * 6 + i) * 0.015, 0.06 + t * 0.22, 0);
            m.scale.setScalar(0.6 + t * 1.4);
            (m.material as { opacity: number }).opacity = 0.35 * (1 - t);
        });
    });
    return (
        <>
            {[0, 1, 2].map((i) => (
                <mesh key={i} ref={(m) => void (puffs.current[i] = m)}>
                    <sphereGeometry args={[0.02, 8, 8]} />
                    <meshBasicMaterial color="#ffffff" transparent depthWrite={false} />
                </mesh>
            ))}
        </>
    );
}

// The big open rulebook. It glows when the keyhole is aimed at it.
function Rulebook() {
    const aimed = useView((s) => s.mode === "peeking" && s.hoveredId === RULEBOOK_ID);
    return (
        <group position={[0.08, 0.78, 0.02]} rotation={[0, 0.25, 0]} userData={{ interactId: RULEBOOK_ID }}>
            {/* Slightly bigger invisible target, so it is easy to aim at. */}
            <mesh position={[0, 0.05, 0]}>
                <boxGeometry args={[0.6, 0.16, 0.45]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            <OutlineContext.Provider value={aimed ? OUTLINE_AIMED : OUTLINE_IDLE}>
                <Box size={[0.5, 0.07, 0.36]} position={[0, 0.035, 0]} color="#7a1f1f" />
            </OutlineContext.Provider>
            {/* Two open pages, gently curved up from the spine, with lines of tiny symbols. */}
            {[-1, 1].map((s) => (
                <group key={s} position={[s * 0.115, 0.075, 0]} rotation={[0, 0, s * -0.08]}>
                    <Box size={[0.22, 0.012, 0.33]} color={PAGE} emissive={aimed ? "#4a3f20" : "#000000"} />
                    {Array.from({ length: 7 }, (_, i) => (
                        <Box key={i} size={[0.16 - (i % 3) * 0.02, 0.002, 0.012]} position={[0, 0.007, -0.12 + i * 0.04]} color="#3b2f25" />
                    ))}
                </group>
            ))}
            <Html position={[0, 0.3, 0]} center zIndexRange={[5, 0]} pointerEvents="none">
                <div className={`note-label ${aimed ? "show" : ""}`}>
                    <strong>The Rulebook</strong>
                    <span>How everything here is decided</span>
                </div>
            </Html>
        </group>
    );
}

function Lamp() {
    return (
        <group position={[-0.32, 0.78, -0.12]}>
            <Box size={[0.14, 0.02, 0.14]} position={[0, 0.01, 0]} color="#2f4f3a" />
            <Box size={[0.02, 0.3, 0.02]} position={[0, 0.16, 0]} color="#c9a43b" metalness={0.6} />
            <mesh position={[0.06, 0.32, 0.04]} rotation={[0.4, 0, -0.6]}>
                <coneGeometry args={[0.08, 0.12, 16, 1, true]} />
                <meshStandardMaterial color="#2f4f3a" side={2} />
            </mesh>
            <mesh position={[0.08, 0.29, 0.06]}>
                <sphereGeometry args={[0.025, 10, 10]} />
                <meshBasicMaterial color="#fff2c4" />
            </mesh>
            <pointLight position={[0.12, 0.22, 0.1]} intensity={2.5} distance={2.2} decay={1.5} color="#ffcf87" />
        </group>
    );
}

function Chair({ angle }: { angle: number }) {
    return (
        // Pulled out from the desk and turned, as if someone just got up.
        <group position={[-0.2, 0, 0.6]} rotation={[0, Math.PI + angle, 0]}>
            <Box size={[0.42, 0.05, 0.4]} position={[0, 0.45, 0]} color={WOOD} />
            <Box size={[0.42, 0.45, 0.04]} position={[0, 0.7, -0.18]} color={WOOD} />
            {[-0.18, 0.18].flatMap((x) =>
                [-0.17, 0.17].map((z) => <Box key={`${x}${z}`} size={[0.04, 0.45, 0.04]} position={[x, 0.225, z]} color={DARK} />),
            )}
        </group>
    );
}

export function OperatorDesk() {
    // A slightly different scene each visit: the chair left at an angle, maybe a hot drink.
    const [{ chairAngle, hotMug }] = useState(() => ({ chairAngle: 0.3 + Math.random() * 0.9, hotMug: Math.random() < 0.6 }));
    return (
        // Against the left wall, facing into the room.
        <group position={[-ROOM.width / 2 + 0.3, 0, -5.1]} rotation={[0, Math.PI / 2, 0]}>
            {/* Desk. */}
            <Box size={[1.0, 0.05, 0.5]} position={[0, 0.755, 0]} color={WOOD} />
            <Box size={[0.05, 0.73, 0.46]} position={[-0.47, 0.365, 0]} color={DARK} />
            <Box size={[0.05, 0.73, 0.46]} position={[0.47, 0.365, 0]} color={DARK} />
            <Box size={[0.9, 0.4, 0.03]} position={[0, 0.55, -0.22]} color={DARK} />

            <Lamp />
            <Rulebook />

            {/* A tidy stack of processed paperwork, and the rubber stamp. */}
            <group position={[0.38, 0.78, -0.1]}>
                {Array.from({ length: 6 }, (_, i) => (
                    <Box key={i} size={[0.2, 0.008, 0.26]} position={[0, i * 0.009, 0]} rotation={[0, (i % 3) * 0.05 - 0.05, 0]} color={i % 2 ? "#f6f0e0" : "#ece3cc"} />
                ))}
            </group>
            <group position={[0.36, 0.78, 0.14]}>
                <Box size={[0.07, 0.03, 0.05]} position={[0, 0.015, 0]} color="#7a1f1f" />
                <Box size={[0.02, 0.06, 0.02]} position={[0, 0.06, 0]} color={DARK} />
                <mesh position={[0, 0.1, 0]}>
                    <sphereGeometry args={[0.025, 10, 10]} />
                    <meshStandardMaterial color={DARK} />
                </mesh>
            </group>

            {/* The mug. Sometimes still steaming. */}
            <group position={[-0.15, 0.78, 0.15]}>
                <mesh position={[0, 0.045, 0]} castShadow>
                    <cylinderGeometry args={[0.035, 0.032, 0.09, 14]} />
                    <meshStandardMaterial color="#e8e0d0" />
                </mesh>
                <mesh position={[0, 0.087, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.03, 14]} />
                    <meshStandardMaterial color="#4a2c17" />
                </mesh>
                {hotMug && <Steam />}
            </group>

            <Chair angle={chairAngle} />
        </group>
    );
}
