import type { FurnitureType } from "../../shared/constants";
import { Box } from "./Box";
import { OutlineFor } from "./outline";
import type { Vec3 } from "./layout";

// Where a note rests on each piece of furniture (local space, front faces +z).
export const NOTE_SPOT: Record<FurnitureType, Vec3> = {
    table: [0, 0.785, 0],
    desk: [-0.25, 0.785, 0.02],
    bookshelf: [0, 1.945, 0],
    dresser: [0, 0.865, 0],
    stool: [0, 0.64, 0],
    armchair: [0, 0.53, 0.1],
    piano: [0.25, 1.155, -0.02],
    crate: [0, 0.705, 0],
};

const WOOD = "#8b5a2b";
const DARK_WOOD = "#5e3a1c";
const LIGHT_WOOD = "#c49a6c";
const BOOKS = ["#b5523b", "#3b6fb5", "#3e8e5a", "#d19a2a", "#8a4fb0", "#2a9d9a", "#e3d8c4"];

function Table() {
    return (
        <group>
            <Box size={[1.2, 0.08, 0.8]} position={[0, 0.74, 0]} color={WOOD} />
            {[-0.52, 0.52].flatMap((x) =>
                [-0.32, 0.32].map((z) => <Box key={`${x}${z}`} size={[0.07, 0.7, 0.07]} position={[x, 0.35, z]} color={DARK_WOOD} />),
            )}
        </group>
    );
}

function Desk() {
    return (
        <group>
            <Box size={[1.3, 0.06, 0.6]} position={[0, 0.75, 0]} color={LIGHT_WOOD} />
            <Box size={[0.06, 0.72, 0.58]} position={[-0.6, 0.36, 0]} color={WOOD} />
            <Box size={[0.42, 0.72, 0.58]} position={[0.39, 0.36, 0]} color={WOOD} />
            {[0.55, 0.3].map((y) => (
                <group key={y}>
                    <Box size={[0.36, 0.2, 0.02]} position={[0.39, y, 0.3]} color={LIGHT_WOOD} />
                    <Box size={[0.08, 0.02, 0.03]} position={[0.39, y, 0.32]} color="#c9a43b" metalness={0.6} />
                </group>
            ))}
        </group>
    );
}

function Bookshelf() {
    return (
        <group>
            <Box size={[1.0, 1.9, 0.04]} position={[0, 0.95, -0.17]} color={DARK_WOOD} />
            <Box size={[0.05, 1.9, 0.36]} position={[-0.48, 0.95, 0]} color={WOOD} />
            <Box size={[0.05, 1.9, 0.36]} position={[0.48, 0.95, 0]} color={WOOD} />
            {[0.03, 0.5, 0.98, 1.46, 1.9].map((y) => (
                <Box key={y} size={[0.95, 0.04, 0.34]} position={[0, y, 0]} color={WOOD} />
            ))}
            {[0.05, 0.52, 1.0].map((y, row) =>
                Array.from({ length: 7 }, (_, i) => {
                    const h = 0.28 + ((i * 7 + row * 3) % 5) * 0.03;
                    return (
                        <Box
                            key={`${row}-${i}`}
                            size={[0.09, h, 0.24]}
                            position={[-0.36 + i * 0.115, y + h / 2, 0.02]}
                            color={BOOKS[(i + row * 2) % BOOKS.length]}
                        />
                    );
                }),
            )}
        </group>
    );
}

function Dresser() {
    return (
        <group>
            <Box size={[1.0, 0.85, 0.5]} position={[0, 0.425, 0]} color={WOOD} />
            {[0.68, 0.43, 0.18].map((y) => (
                <group key={y}>
                    <Box size={[0.9, 0.2, 0.02]} position={[0, y, 0.255]} color={LIGHT_WOOD} />
                    <mesh position={[0, y, 0.28]}>
                        <sphereGeometry args={[0.025, 10, 10]} />
                        <meshStandardMaterial color="#c9a43b" metalness={0.6} roughness={0.3} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

function Stool() {
    return (
        <group>
            <mesh position={[0, 0.6, 0]} castShadow>
                <cylinderGeometry args={[0.25, 0.25, 0.07, 24]} />
                <meshStandardMaterial color="#b5523b" roughness={0.9} />
                <OutlineFor />
            </mesh>
            {[0, 1, 2].map((i) => {
                const a = (i / 3) * Math.PI * 2;
                return (
                    <mesh key={i} position={[Math.cos(a) * 0.16, 0.3, Math.sin(a) * 0.16]} rotation={[Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12]}>
                        <cylinderGeometry args={[0.025, 0.025, 0.6, 8]} />
                        <meshStandardMaterial color={DARK_WOOD} />
                        <OutlineFor />
                    </mesh>
                );
            })}
        </group>
    );
}

function Armchair() {
    const fabric = "#6b3fa0";
    return (
        <group>
            <Box size={[0.9, 0.4, 0.8]} position={[0, 0.2, 0]} color={fabric} />
            <Box size={[0.66, 0.12, 0.6]} position={[0, 0.46, 0.06]} color="#8a5cc4" />
            <Box size={[0.9, 0.75, 0.2]} position={[0, 0.7, -0.3]} color={fabric} />
            <Box size={[0.14, 0.32, 0.8]} position={[-0.38, 0.56, 0]} color={fabric} />
            <Box size={[0.14, 0.32, 0.8]} position={[0.38, 0.56, 0]} color={fabric} />
        </group>
    );
}

function Piano() {
    return (
        <group>
            <Box size={[1.4, 1.15, 0.55]} position={[0, 0.575, -0.05]} color="#1b1716" roughness={0.3} />
            <Box size={[1.3, 0.05, 0.25]} position={[0, 0.72, 0.33]} color="#f4f1e8" />
            {Array.from({ length: 13 }, (_, i) =>
                [1, 3, 6, 8, 10].includes(i % 12) ? (
                    <Box key={i} size={[0.05, 0.03, 0.14]} position={[-0.6 + i * 0.1, 0.755, 0.28]} color="#111" />
                ) : null,
            )}
            <Box size={[0.08, 0.72, 0.08]} position={[-0.6, 0.36, 0.33]} color="#1b1716" />
            <Box size={[0.08, 0.72, 0.08]} position={[0.6, 0.36, 0.33]} color="#1b1716" />
        </group>
    );
}

function Crate() {
    return (
        <group>
            <Box size={[0.7, 0.7, 0.7]} position={[0, 0.35, 0]} color={LIGHT_WOOD} />
            {[0.1, 0.35, 0.6].map((y) => (
                <Box key={y} size={[0.72, 0.06, 0.72]} position={[0, y, 0]} color={WOOD} />
            ))}
        </group>
    );
}

const PIECES: Record<FurnitureType, () => React.JSX.Element> = {
    table: Table,
    desk: Desk,
    bookshelf: Bookshelf,
    dresser: Dresser,
    stool: Stool,
    armchair: Armchair,
    piano: Piano,
    crate: Crate,
};

export function Furniture({ type }: { type: FurnitureType }) {
    const Piece = PIECES[type] ?? Crate;
    return <Piece />;
}
