import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import { Shape, type MeshBasicMaterial } from "three";
import { useView } from "../stores/view";
import { EXIT_ID, WRITE_ID, type Vec3 } from "./layout";

// Two glowing icons on the floor just inside the door, shown when you look down
// at the doormat: an arrow back to the hallway, and a letter for writing a note.

const arrowShape = (() => {
    const s = new Shape();
    s.moveTo(0, 0.2);
    s.lineTo(0.16, 0.03);
    s.lineTo(0.06, 0.03);
    s.lineTo(0.06, -0.18);
    s.lineTo(-0.06, -0.18);
    s.lineTo(-0.06, 0.03);
    s.lineTo(-0.16, 0.03);
    s.closePath();
    return s;
})();

function FloorIcon({ id, position, label, children }: { id: string; position: Vec3; label: string; children: (color: string) => ReactNode }) {
    const aimed = useView((s) => s.mode === "peeking" && s.hoveredId === id);
    const glow = useRef<MeshBasicMaterial>(null);
    useFrame(({ clock }) => {
        if (glow.current) glow.current.opacity = aimed ? 0.5 : 0.18 + Math.sin(clock.elapsedTime * 3) * 0.1;
    });
    const color = aimed ? "#fff3b0" : "#f3d27a";

    return (
        <group position={position} userData={{ interactId: id }}>
            {/* A soft glowing disc underneath, which is also the click target. */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
                <circleGeometry args={[0.19, 32]} />
                <meshBasicMaterial ref={glow} color={color} transparent depthWrite={false} />
            </mesh>
            <group scale={aimed ? 1.15 : 1}>{children(color)}</group>
            <Html position={[0, 0.16, 0]} center zIndexRange={[5, 0]} pointerEvents="none">
                <div className={`note-label ${aimed ? "show" : ""}`}>
                    <strong>{label}</strong>
                </div>
            </Html>
        </group>
    );
}

export function DoormatIcons() {
    return (
        <>
            <FloorIcon id={EXIT_ID} position={[-0.24, 0.012, -0.6]} label="Leave">
                {(color) => (
                    // Lying flat, pointing back towards the door.
                    <mesh rotation={[-Math.PI / 2, 0, Math.PI]} position={[0, 0.002, 0]} scale={0.75}>
                        <shapeGeometry args={[arrowShape]} />
                        <meshBasicMaterial color={color} />
                    </mesh>
                )}
            </FloorIcon>
            <FloorIcon id={WRITE_ID} position={[0.24, 0.012, -0.6]} label="Write a note">
                {(color) => (
                    // A little letter: a sheet of paper with a few written lines.
                    <group rotation={[-Math.PI / 2, 0, 0.15]} position={[0, 0.002, 0]} scale={0.75}>
                        <mesh>
                            <planeGeometry args={[0.26, 0.32]} />
                            <meshBasicMaterial color={color} />
                        </mesh>
                        {[0.09, 0.04, -0.01, -0.06].map((y, i) => (
                            <mesh key={y} position={[i === 3 ? -0.03 : 0, y, 0.001]}>
                                <planeGeometry args={[i === 3 ? 0.12 : 0.18, 0.014]} />
                                <meshBasicMaterial color="#8a6a2a" />
                            </mesh>
                        ))}
                    </group>
                )}
            </FloorIcon>
        </>
    );
}
