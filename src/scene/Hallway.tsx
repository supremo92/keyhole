import { DOOR_SLOTS } from "../../shared/constants";
import type { Door as DoorData } from "../../shared/types";
import { BoardedDoorway } from "./BoardedDoorway";
import { Box } from "./Box";
import { Door } from "./Door";
import { HALL } from "./layout";
import { wallpaper, woodFloor } from "./textures";

const LENGTH = HALL.near - HALL.far;
const MID_Z = (HALL.near + HALL.far) / 2;

function Lamp({ z }: { z: number }) {
    return (
        <group position={[0, HALL.height, z]}>
            <Box size={[0.02, 0.4, 0.02]} position={[0, -0.2, 0]} color="#222" />
            <mesh position={[0, -0.48, 0]}>
                <coneGeometry args={[0.28, 0.22, 20, 1, true]} />
                <meshStandardMaterial color="#e0b44a" side={2} />
            </mesh>
            <mesh position={[0, -0.55, 0]}>
                <sphereGeometry args={[0.08, 12, 12]} />
                <meshBasicMaterial color="#fff2c4" />
            </mesh>
            <pointLight position={[0, -0.7, 0]} intensity={9} distance={9} decay={1.6} color="#ffd9a0" castShadow />
        </group>
    );
}

function Picture({ position, rotY, color }: { position: [number, number, number]; rotY: number; color: string }) {
    return (
        <group position={position} rotation={[0, rotY, 0]}>
            <Box size={[0.8, 0.6, 0.04]} color="#5a3a1e" />
            <Box size={[0.66, 0.46, 0.02]} position={[0, 0, 0.02]} color={color} />
            <mesh position={[0.1, -0.05, 0.032]}>
                <circleGeometry args={[0.1, 16]} />
                <meshStandardMaterial color="#f3e2b0" />
            </mesh>
        </group>
    );
}

export function Hallway({ doors }: { doors: DoorData[] }) {
    const bySlot = new Map(doors.map((d) => [d.doorSlot, d]));
    const sideWall = wallpaper("stripes", ["#5d7a6a", "#4d6858"], [LENGTH / 1.3, 2]);
    const endWall = wallpaper("stripes", ["#5d7a6a", "#4d6858"], [HALL.width / 1.3, 2]);

    return (
        <group>
            {/* Floor, runner rug and ceiling. */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, MID_Z]} receiveShadow>
                <planeGeometry args={[HALL.width, LENGTH]} />
                <meshStandardMaterial map={woodFloor([2, LENGTH / 2])} roughness={0.7} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, MID_Z - 1]} receiveShadow>
                <planeGeometry args={[1.3, LENGTH - 4]} />
                <meshStandardMaterial color="#7d2430" roughness={1} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, HALL.height, MID_Z]}>
                <planeGeometry args={[HALL.width, LENGTH]} />
                <meshStandardMaterial color="#e9e0cf" />
            </mesh>

            {/* Walls with wallpaper above dark wood panelling. */}
            <mesh position={[-HALL.width / 2, HALL.height / 2, MID_Z]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[LENGTH, HALL.height]} />
                <meshStandardMaterial map={sideWall} />
            </mesh>
            <mesh position={[HALL.width / 2, HALL.height / 2, MID_Z]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[LENGTH, HALL.height]} />
                <meshStandardMaterial map={sideWall} />
            </mesh>
            <mesh position={[0, HALL.height / 2, HALL.far]} receiveShadow>
                <planeGeometry args={[HALL.width, HALL.height]} />
                <meshStandardMaterial map={endWall} />
            </mesh>
            <Box size={[0.03, 0.9, LENGTH]} position={[-HALL.width / 2 + 0.015, 0.45, MID_Z]} color="#3e2a1a" />
            <Box size={[0.03, 0.9, LENGTH]} position={[HALL.width / 2 - 0.015, 0.45, MID_Z]} color="#3e2a1a" />
            <Box size={[HALL.width, 0.9, 0.03]} position={[0, 0.45, HALL.far + 0.015]} color="#3e2a1a" />
            <Box size={[0.05, 0.05, LENGTH]} position={[-HALL.width / 2 + 0.03, 0.92, MID_Z]} color="#2a1c11" />
            <Box size={[0.05, 0.05, LENGTH]} position={[HALL.width / 2 - 0.03, 0.92, MID_Z]} color="#2a1c11" />

            <Lamp z={2} />
            <Lamp z={-5} />
            <Lamp z={-11} />

            <Picture position={[-HALL.width / 2 + 0.04, 1.7, 1]} rotY={Math.PI / 2} color="#6b8fb5" />
            <Picture position={[HALL.width / 2 - 0.04, 1.7, -5]} rotY={-Math.PI / 2} color="#b56b6b" />
            <Picture position={[-HALL.width / 2 + 0.04, 1.7, -9]} rotY={Math.PI / 2} color="#8fb56b" />

            {Array.from({ length: DOOR_SLOTS }, (_, slot) => {
                const door = bySlot.get(slot);
                return door ? <Door key={door.id} door={door} /> : <BoardedDoorway key={`boarded-${slot}`} slot={slot} />;
            })}
        </group>
    );
}
