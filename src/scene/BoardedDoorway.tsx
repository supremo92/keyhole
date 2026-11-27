import { Box } from "./Box";
import { DoorFrame } from "./Door";
import { slotTransform } from "./layout";

const PLANKS = [
    { y: 1.85, rz: 0.14 },
    { y: 1.35, rz: -0.2 },
    { y: 0.85, rz: 0.1 },
    { y: 0.4, rz: -0.12 },
];

// A doorway the Institute boarded up long ago. Nobody says why.
export function BoardedDoorway({ slot }: { slot: number }) {
    const { position, rotY } = slotTransform(slot);
    return (
        <group position={position} rotation={[0, rotY, 0]}>
            <DoorFrame color="#5b4a3a" />
            <Box size={[1.1, 2.2, 0.02]} position={[0, 1.1, 0.012]} color="#140f0b" />
            {PLANKS.map((p, i) => (
                <group key={i} position={[0, p.y, 0.06]} rotation={[0, 0, p.rz]}>
                    <Box size={[1.4, 0.17, 0.04]} color="#9c7a4f" />
                    <Box size={[0.03, 0.03, 0.01]} position={[-0.6, 0, 0.025]} color="#333" metalness={0.8} />
                    <Box size={[0.03, 0.03, 0.01]} position={[0.6, 0, 0.025]} color="#333" metalness={0.8} />
                </group>
            ))}
        </group>
    );
}
