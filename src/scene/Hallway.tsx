import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { CanvasTexture, Color, SRGBColorSpace, type MeshBasicMaterial, type PointLight } from "three";
import { DOOR_SLOTS } from "../../shared/constants";
import { sounds } from "../lib/sound";
import { useView } from "../stores/view";
import type { ShiftState } from "../../shared/lexicon";
import { BoardedDoorway } from "./BoardedDoorway";
import { Box } from "./Box";
import { Door } from "./Door";
import { CeilingLeak, Gifts, HallCat, HallChair, Locker, NoticeBoard, TannoySpeaker, WaitingNote, WallDecay } from "./HallwayProps";
import { ROOMS } from "./rooms";
import { HALL } from "./layout";
import { wallpaper, woodFloor } from "./textures";

const LENGTH = HALL.near - HALL.far;
const MID_Z = (HALL.near + HALL.far) / 2;

const LAMP_INTENSITY = 9;
const BULB_ON = new Color("#fff2c4");
const BULB_OFF = new Color("#4a4336");

// A tired lamp: every so often it dims a little and recovers, with a faint buzz.
// Kept deliberately gentle (a small, smooth dip, never off and never rapid flashing) so it
// is comfortable for people who are sensitive to flicker.
const DIP = 0.8; // lowest brightness during a dip, as a fraction of normal

function useFlicker(enabled: boolean) {
    const light = useRef<PointLight>(null);
    const bulb = useRef<MeshBasicMaterial>(null);
    const plan = useRef<{ at: number; on: boolean }[]>([]);
    const next = useRef(6);
    const level = useRef(1);
    const target = useRef(1);

    useFrame(({ clock }, dt) => {
        if (!enabled || !light.current || !bulb.current) return;
        const t = clock.elapsedTime;
        if (plan.current.length === 0 && t > next.current) {
            // One or two slow dips, then a long wait (10-20 seconds) before the next.
            let at = t;
            const dips = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < dips; i++) {
                plan.current.push({ at, on: false });
                at += 0.35 + Math.random() * 0.3;
                plan.current.push({ at, on: true });
                at += 0.5 + Math.random() * 0.5;
            }
            next.current = at + 10 + Math.random() * 10;
        }
        while (plan.current.length && plan.current[0].at <= t) {
            const { on } = plan.current.shift()!;
            target.current = on ? 1 : DIP;
            if (!on && useView.getState().mode === "hallway") sounds.buzz(0.3, 0.02);
        }
        // Ease towards the target brightness rather than jumping.
        level.current += (target.current - level.current) * Math.min(1, dt * 4);
        light.current.intensity = LAMP_INTENSITY * level.current;
        bulb.current.color.copy(BULB_ON).lerp(BULB_OFF, (1 - level.current) / (1 - DIP) * 0.35);
    });
    return { light, bulb };
}

function Lamp({ z, flicker = false }: { z: number; flicker?: boolean }) {
    const { light, bulb } = useFlicker(flicker);
    return (
        <group position={[0, HALL.height, z]}>
            <Box size={[0.02, 0.4, 0.02]} position={[0, -0.2, 0]} color="#222" />
            <mesh position={[0, -0.48, 0]}>
                <coneGeometry args={[0.28, 0.22, 20, 1, true]} />
                <meshStandardMaterial color="#e0b44a" side={2} />
            </mesh>
            <mesh position={[0, -0.55, 0]}>
                <sphereGeometry args={[0.08, 12, 12]} />
                <meshBasicMaterial ref={bulb} color={BULB_ON} />
            </mesh>
            <pointLight ref={light} position={[0, -0.7, 0]} intensity={LAMP_INTENSITY} distance={9} decay={1.6} color="#ffd9a0" castShadow />
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

// An old enamel sign: the building explains itself, sort of.
let signTexture: CanvasTexture | null = null;
function signArt() {
    if (signTexture) return signTexture;
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 480;
    const g = c.getContext("2d")!;
    g.fillStyle = "#b8923a";
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = "#1f3a2c";
    g.fillRect(18, 18, c.width - 36, c.height - 36);
    g.strokeStyle = "#e8d9b0";
    g.lineWidth = 4;
    g.strokeRect(38, 38, c.width - 76, c.height - 76);
    g.fillStyle = "#efe2bd";
    g.textAlign = "center";
    g.font = "bold 54px Georgia, serif";
    g.fillText("THE INSTITUTE OF ROOMS", c.width / 2, 130);
    g.font = "italic 38px Georgia, serif";
    g.fillText("Night Operators: answer every note.", c.width / 2, 225);
    g.fillText("The residents are not to be seen.", c.width / 2, 285);
    g.font = "bold 30px Georgia, serif";
    g.fillStyle = "#d9b45a";
    g.fillText("THEY CAN SEE YOU. THAT IS DIFFERENT.", c.width / 2, 385);
    signTexture = new CanvasTexture(c);
    signTexture.colorSpace = SRGBColorSpace;
    signTexture.anisotropy = 8;
    return signTexture;
}

function Sign({ position, rotY }: { position: [number, number, number]; rotY: number }) {
    return (
        <group position={position} rotation={[0, rotY, 0]}>
            <Box size={[1.42, 0.68, 0.03]} color="#3a2a1a" />
            <mesh position={[0, 0, 0.017]}>
                <planeGeometry args={[1.36, 0.64]} />
                <meshStandardMaterial map={signArt()} roughness={0.35} metalness={0.1} />
            </mesh>
        </group>
    );
}

export function Hallway({ shift }: { shift: ShiftState | undefined }) {
    const doorSlots = new Set(ROOMS.map((r) => r.slot));
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
                <meshStandardMaterial color="#5e1f27" roughness={1} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, HALL.height, MID_Z]}>
                <planeGeometry args={[HALL.width, LENGTH]} />
                <meshStandardMaterial color="#d9cfbb" />
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

            <Lamp z={2} flicker />
            <Lamp z={-5} />
            <Lamp z={-11} />

            <Picture position={[-HALL.width / 2 + 0.04, 1.7, 1]} rotY={Math.PI / 2} color="#6b8fb5" />
            <Sign position={[HALL.width / 2 - 0.035, 1.75, 2.4]} rotY={-Math.PI / 2} />
            <Picture position={[HALL.width / 2 - 0.04, 1.7, -5]} rotY={-Math.PI / 2} color="#b56b6b" />

            {/* Four residents, and two doorways nobody talks about. */}
            {ROOMS.map((r) => (
                <Door key={r.id} room={r} />
            ))}
            {Array.from({ length: DOOR_SLOTS }, (_, slot) => slot)
                .filter((slot) => slot !== 0 && !doorSlots.has(slot))
                .map((slot) => (
                    <BoardedDoorway key={slot} slot={slot} />
                ))}

            <NoticeBoard />
            <Locker />
            <WaitingNote shift={shift} />
            <Gifts shift={shift} />
            <CeilingLeak />
            <WallDecay />
            <HallChair />
            <HallCat />
            <TannoySpeaker />
        </group>
    );
}
