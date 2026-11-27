import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState, type ReactNode } from "react";
import { CanvasTexture, SRGBColorSpace, type Group, type Mesh, type MeshBasicMaterial } from "three";
import type { RoomId, ShiftState } from "../../shared/lexicon";
import { openBoard, openLocker, openNote } from "../lib/flow";
import { sounds } from "../lib/sound";
import { useView } from "../stores/view";
import { Box } from "./Box";
import { HALL, LOCKER_Z, slotTransform, type Vec3 } from "./layout";
import { ROOMS, roomDef } from "./rooms";
import { crackTexture, dampTexture } from "./textures";

// Hover handlers for things you can click in the hallway (only while in the hallway).
function useClickable(onClick: () => void) {
    const hallway = useView((s) => s.mode === "hallway");
    const [hovered, setHovered] = useState(false);
    return {
        hovered: hovered && hallway,
        handlers: {
            onClick: (e: { stopPropagation: () => void }) => {
                e.stopPropagation();
                if (hallway) onClick();
            },
            onPointerOver: (e: { stopPropagation: () => void }) => {
                e.stopPropagation();
                setHovered(true);
                document.body.style.cursor = hallway ? "pointer" : "";
            },
            onPointerOut: () => {
                setHovered(false);
                document.body.style.cursor = "";
            },
        },
    };
}

function Label({ show, position, children }: { show: boolean; position: Vec3; children: ReactNode }) {
    return (
        // Always mounted (drei Html misbehaves when added and removed); shown with CSS.
        <Html position={position} center zIndexRange={[5, 0]} pointerEvents="none">
            <div className={`note-label ${show ? "show" : ""}`}>{children}</div>
        </Html>
    );
}

// ---------------------------------------------------------------- The notice board

let boardArt: CanvasTexture | null = null;
function noticeBoardArt() {
    if (boardArt) return boardArt;
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 660;
    const g = c.getContext("2d")!;
    g.fillStyle = "#b08455";
    g.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 4000; i++) {
        g.fillStyle = i % 2 ? "rgba(70,40,15,0.18)" : "rgba(255,230,190,0.12)";
        g.fillRect((i * 131) % c.width, (i * 197) % c.height, 3, 3);
    }
    const paper = (x: number, y: number, w: number, h: number, rot: number, colour: string, lines: string[], big = false) => {
        g.save();
        g.translate(x, y);
        g.rotate(rot);
        g.fillStyle = "rgba(0,0,0,0.25)";
        g.fillRect(-w / 2 + 6, -h / 2 + 6, w, h);
        g.fillStyle = colour;
        g.fillRect(-w / 2, -h / 2, w, h);
        g.fillStyle = "#2b2420";
        g.textAlign = "center";
        lines.forEach((t, i) => {
            g.font = i === 0 ? `bold ${big ? 30 : 24}px Georgia, serif` : "20px Georgia, serif";
            g.fillText(t, 0, -h / 2 + 42 + i * 30);
        });
        g.fillStyle = "#c0392b";
        g.beginPath();
        g.arc(0, -h / 2 + 12, 9, 0, Math.PI * 2);
        g.fill();
        g.restore();
    };
    paper(200, 190, 300, 260, -0.04, "#f3ead2", ["NIGHT OPERATOR", "Answer every note.", "Do not open the doors.", "The doors do not open.", "Peek if you must."], true);
    paper(530, 160, 240, 200, 0.05, "#fff4c7", ["NUMERALS", "⚀ ⚁ ⚂", "⚃ ⚄ ⚅"]);
    paper(830, 220, 260, 300, -0.03, "#e8f4ff", ["EMPLOYEE", "OF THE MONTH", "", "", "", "", "(again)"]);
    // The photo: it's the cat.
    g.fillStyle = "#3a3330";
    g.fillRect(745, 245, 170, 130);
    g.fillStyle = "#d9822b";
    g.fillRect(790, 280, 80, 70);
    g.beginPath();
    g.moveTo(790, 282);
    g.lineTo(800, 255);
    g.lineTo(815, 282);
    g.moveTo(845, 282);
    g.lineTo(860, 255);
    g.lineTo(870, 282);
    g.fill();
    g.fillStyle = "#9be05a";
    g.fillRect(805, 300, 12, 9);
    g.fillRect(843, 300, 12, 9);
    paper(330, 480, 380, 200, 0.03, "#ffe8ef", ["NOTICE", "Residents must not be answered", "after the bell. There is no bell."]);
    paper(760, 520, 300, 170, -0.06, "#eaffea", ["LOST", "One (1) Operator.", "If found, do not return."]);
    boardArt = new CanvasTexture(c);
    boardArt.colorSpace = SRGBColorSpace;
    boardArt.anisotropy = 8;
    return boardArt;
}

export function NoticeBoard() {
    const tilt = useView((s) => s.boardTilt);
    const board = useRef<Group>(null);
    const { hovered, handlers } = useClickable(openBoard);
    // Whatever knocked it, it's still settling when you come back.
    useFrame(({ clock }) => {
        if (board.current) board.current.rotation.z += (tilt + Math.sin(clock.elapsedTime * 3) * 0.004 * Math.abs(tilt * 10) - board.current.rotation.z) * 0.05;
    });
    return (
        <group position={[0, 0, HALL.far + 0.05]}>
            <group ref={board} position={[0, 1.5, 0]} {...handlers}>
                <Box size={[2.2, 1.45, 0.06]} color="#4a3220" />
                <mesh position={[0, 0, 0.032]}>
                    <planeGeometry args={[2.05, 1.32]} />
                    <meshStandardMaterial map={noticeBoardArt()} roughness={0.9} emissive="#ffffff" emissiveIntensity={hovered ? 0.08 : 0} />
                </mesh>
            </group>
            <Label show={hovered} position={[0, 2.45, 0.2]}>
                <strong>Notice board</strong>
                <span>Instructions, numerals, and the Employee of the Month</span>
            </Label>
        </group>
    );
}

// ---------------------------------------------------------------- Your locker

export function Locker() {
    const { hovered, handlers } = useClickable(openLocker);
    const grey = "#6f7a80";
    return (
        <group position={[-HALL.width / 2 + 0.26, 0, LOCKER_Z]} rotation={[0, Math.PI / 2, 0]}>
            <group {...handlers}>
                <Box size={[0.6, 1.9, 0.5]} position={[0, 0.95, 0]} color={grey} metalness={0.5} roughness={0.5} emissive={hovered ? "#202a30" : "#000000"} />
                {[1.65, 1.6, 1.55, 1.5].map((y) => (
                    <Box key={y} size={[0.36, 0.015, 0.01]} position={[0, y, 0.255]} color="#2b3135" />
                ))}
                <Box size={[0.03, 0.18, 0.03]} position={[0.22, 1.0, 0.27]} color="#c9cfd2" metalness={0.8} />
                {/* Your name tag, in their script. */}
                <Box size={[0.22, 0.08, 0.005]} position={[0, 1.32, 0.255]} color="#f3ead2" />
                <Html position={[0, 1.32, 0.26]} center transform scale={0.12} zIndexRange={[4, 0]} pointerEvents="none">
                    <div className="locker-tag">⍝</div>
                </Html>
                {/* A dent. Someone kicked it. */}
                <Box size={[0.12, 0.1, 0.01]} position={[-0.1, 0.45, 0.25]} color="#5d676c" />
            </group>
            <Label show={hovered} position={[0, 2.15, 0.1]}>
                <strong>Your locker</strong>
                <span>Your Phrasebook and staff badge</span>
            </Label>
        </group>
    );
}

// ---------------------------------------------------------------- Notes under doors

// The waiting resident's note, slid out under their door onto the hallway floor.
export function WaitingNote({ shift }: { shift: ShiftState | undefined }) {
    const waiting = shift?.rooms.find((r) => r.status === "waiting");
    const id: RoomId = waiting?.id ?? "flat";
    const def = roomDef(id);
    const mode = useView((s) => s.mode);
    // Hidden while you're holding it (or answering it).
    const shown = !!waiting && (mode === "hallway" || mode === "moving" || mode === "board" || mode === "locker");
    const paper = useRef<Group>(null);
    const glow = useRef<MeshBasicMaterial>(null);
    const arrived = useRef<{ id: RoomId; at: number } | null>(null);
    const { hovered, handlers } = useClickable(() => void openNote(id));

    useFrame(({ clock }) => {
        if (!paper.current || !waiting) return;
        // A new note slides out from under the door when it first appears.
        if (arrived.current?.id !== id) {
            arrived.current = { id, at: clock.elapsedTime };
            sounds.slide();
        }
        const t = Math.min(1, (clock.elapsedTime - arrived.current.at) / 1.2);
        paper.current.position.z = -0.3 + (1 - (1 - t) ** 3) * 0.95;
        if (glow.current) glow.current.opacity = 0.15 + Math.sin(clock.elapsedTime * 3) * 0.08 + (hovered ? 0.2 : 0);
    });

    const { position, rotY } = slotTransform(def.slot);
    return (
        <group position={position} rotation={[0, rotY, 0]} visible={shown}>
            <group ref={paper} position={[0.05, 0.006, 0.65]} rotation={[0, 0.2, 0]} scale={1.5} {...(shown ? handlers : {})}>
                <mesh position={[0, 0.05, 0]}>
                    <boxGeometry args={[0.6, 0.12, 0.7]} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.003, 0]}>
                    <circleGeometry args={[0.32, 32]} />
                    <meshBasicMaterial ref={glow} color="#ffe6a0" transparent depthWrite={false} />
                </mesh>
                <Box size={[0.3, 0.004, 0.4]} color="#efe9d8" />
                {[0.1, 0, -0.1].map((z, i) => (
                    <Box key={z} size={[0.05 + i * 0.03, 0.002, 0.04]} position={[-0.06 + i * 0.05, 0.003, z]} color="#3b2f25" />
                ))}
            </group>
            <Label show={hovered && shown} position={[0.05, 0.45, 0.65]}>
                <strong>A note from Room {def.plate}</strong>
                <span>Pick it up</span>
            </Label>
        </group>
    );
}

// ---------------------------------------------------------------- Gifts

function GiftModel({ id }: { id: RoomId }) {
    const balloon = useRef<Group>(null);
    useFrame(({ clock }) => {
        if (balloon.current) balloon.current.position.y = 0.9 + Math.sin(clock.elapsedTime * 1.3) * 0.05;
    });
    switch (id) {
        case "flat":
            return (
                <group>
                    <mesh position={[0, 0.06, 0]} castShadow>
                        <cylinderGeometry args={[0.05, 0.045, 0.12, 14]} />
                        <meshStandardMaterial color="#c0392b" />
                    </mesh>
                    <mesh position={[0, 0.115, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[0.042, 14]} />
                        <meshStandardMaterial color="#5a3418" />
                    </mesh>
                </group>
            );
        case "party":
            return (
                <group>
                    <Box size={[0.004, 0.85, 0.004]} position={[0, 0.43, 0]} color="#eeeeee" />
                    <group ref={balloon} position={[0, 0.9, 0]}>
                        <mesh scale={[1, 1.15, 1]} castShadow>
                            <sphereGeometry args={[0.14, 20, 20]} />
                            <meshStandardMaterial color="#e84a8a" roughness={0.3} />
                        </mesh>
                    </group>
                </group>
            );
        case "office":
            return (
                <group rotation={[-Math.PI / 2, 0, 0.4]} position={[0, 0.004, 0]}>
                    <mesh>
                        <torusGeometry args={[0.04, 0.004, 6, 20, Math.PI * 1.6]} />
                        <meshStandardMaterial color="#c9cfd2" metalness={0.8} />
                    </mesh>
                </group>
            );
        case "quiet":
            return <Box size={[0.025, 0.035, 0.025]} position={[0, 0.018, 0]} color="#f4f0e2" roughness={0.3} />;
    }
}

// Once you've answered a resident, they leave something outside their door.
export function Gifts({ shift }: { shift: ShiftState | undefined }) {
    return (
        <>
            {ROOMS.map((r) => (
                <Gift key={r.id} id={r.id} shown={shift?.rooms.find((x) => x.id === r.id)?.status === "solved"} />
            ))}
        </>
    );
}

function Gift({ id, shown }: { id: RoomId; shown: boolean }) {
    const def = roomDef(id);
    const { position, rotY } = slotTransform(def.slot);
    const hallway = useView((s) => s.mode === "hallway");
    const [hovered, setHovered] = useState(false);
    return (
        <group position={position} rotation={[0, rotY, 0]} visible={shown}>
            <group
                position={[-0.45, 0, 0.35]}
                onPointerOver={() => shown && setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <mesh position={[0, 0.15, 0]}>
                    <boxGeometry args={[0.3, 0.3, 0.3]} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
                <GiftModel id={id} />
            </group>
            <Label show={hovered && hallway && shown} position={[-0.45, id === "party" ? 1.25 : 0.4, 0.35]}>
                <strong>Left outside Room {def.plate}</strong>
                <span>{def.gift}</span>
            </Label>
        </group>
    );
}

// ---------------------------------------------------------------- Decay

const LEAK: Vec3 = [-0.7, HALL.height, -5.4];

// A crack in the ceiling, dripping into a spreading puddle.
export function CeilingLeak() {
    const drop = useRef<Mesh>(null);
    const ripple = useRef<Mesh>(null);
    const t0 = useRef(0);
    useFrame(({ clock }) => {
        const t = clock.elapsedTime;
        const period = 1.6;
        const phase = (t % period) / period;
        if (drop.current) {
            // Swells at the crack, then falls.
            const fall = Math.max(0, (phase - 0.5) / 0.5);
            drop.current.position.y = LEAK[1] - 0.04 - fall * fall * (LEAK[1] - 0.05);
            drop.current.scale.setScalar(phase < 0.5 ? 0.4 + phase : 1);
        }
        // Landed: a ripple, and (if you're nearby) the sound.
        if (Math.floor(t / period) !== t0.current) {
            t0.current = Math.floor(t / period);
            const { hallZ, mode } = useView.getState();
            if (mode === "hallway" && Math.abs(hallZ - LEAK[2]) < 7) sounds.drip();
        }
        if (ripple.current) {
            const r = (phase + 0.0) % 1;
            ripple.current.scale.setScalar(0.2 + r * 1.2);
            (ripple.current.material as MeshBasicMaterial).opacity = 0.35 * (1 - r);
        }
    });
    return (
        <group>
            <mesh rotation={[Math.PI / 2, 0, 0.6]} position={[LEAK[0], LEAK[1] - 0.005, LEAK[2]]}>
                <planeGeometry args={[0.9, 0.9]} />
                <meshBasicMaterial map={crackTexture(3)} transparent depthWrite={false} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[LEAK[0], LEAK[1] - 0.004, LEAK[2]]}>
                <planeGeometry args={[1.6, 1.6]} />
                <meshBasicMaterial map={dampTexture(2)} transparent depthWrite={false} />
            </mesh>
            <mesh ref={drop} position={[LEAK[0], LEAK[1] - 0.04, LEAK[2]]}>
                <sphereGeometry args={[0.018, 10, 10]} />
                <meshStandardMaterial color="#cfe3ef" roughness={0.1} transparent opacity={0.8} />
            </mesh>
            {/* The puddle, and its ripple. */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[LEAK[0], 0.008, LEAK[2]]}>
                <circleGeometry args={[0.38, 32]} />
                <meshStandardMaterial color="#1c2a30" roughness={0.05} metalness={0.4} transparent opacity={0.55} />
            </mesh>
            <mesh ref={ripple} rotation={[-Math.PI / 2, 0, 0]} position={[LEAK[0], 0.01, LEAK[2]]}>
                <ringGeometry args={[0.1, 0.115, 32]} />
                <meshBasicMaterial color="#cfe3ef" transparent depthWrite={false} />
            </mesh>
        </group>
    );
}

// Cracks and water stains on the walls.
function Decal({ map, position, rotY, size }: { map: CanvasTexture; position: Vec3; rotY: number; size: [number, number] }) {
    return (
        <mesh position={position} rotation={[0, rotY, 0]}>
            <planeGeometry args={size} />
            <meshBasicMaterial map={map} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
    );
}

export function WallDecay() {
    const L = -HALL.width / 2 + 0.012;
    const R = HALL.width / 2 - 0.012;
    return (
        <>
            <Decal map={crackTexture(1)} position={[L, 2.2, -1.2]} rotY={Math.PI / 2} size={[0.8, 1.2]} />
            <Decal map={crackTexture(2)} position={[R, 1.6, -9.0]} rotY={-Math.PI / 2} size={[0.7, 1.4]} />
            <Decal map={crackTexture(4)} position={[0.9, 2.3, HALL.far + 0.02]} rotY={0} size={[0.6, 0.9]} />
            <Decal map={dampTexture(1)} position={[R, 2.5, 0.2]} rotY={-Math.PI / 2} size={[1.6, 1.2]} />
            <Decal map={dampTexture(3)} position={[L, 2.4, -10.5]} rotY={Math.PI / 2} size={[1.8, 1.4]} />
            <Decal map={dampTexture(4)} position={[L, 0.6, -6.0]} rotY={Math.PI / 2} size={[1.2, 0.8]} />
            {/* A strip of wallpaper peeling away from the wall. */}
            <group position={[R - 0.01, 2.2, -0.9]} rotation={[0, -Math.PI / 2, 0]}>
                <mesh position={[0, -0.2, 0.06]} rotation={[0.5, 0, 0.1]}>
                    <planeGeometry args={[0.28, 0.5]} />
                    <meshStandardMaterial color="#6d8a78" side={2} />
                </mesh>
            </group>
        </>
    );
}

// A plain wooden chair. It doesn't stay where you left it.
const CHAIR_SPOTS: { pos: Vec3; rot: number }[] = [
    { pos: [1.5, 0, 0.6], rot: -2.2 },
    { pos: [-1.45, 0, -9.4], rot: 1.4 },
    // In the middle of the corridor, facing the notice board.
    { pos: [0, 0, -11.6], rot: Math.PI },
];

export function HallChair() {
    const spot = CHAIR_SPOTS[useView((s) => s.chairSpot)];
    const wood = "#5e3a1c";
    return (
        <group position={spot.pos} rotation={[0, spot.rot, 0]}>
            <Box size={[0.42, 0.05, 0.4]} position={[0, 0.45, 0]} color={wood} />
            <Box size={[0.42, 0.45, 0.04]} position={[0, 0.7, -0.18]} color={wood} />
            {[-0.18, 0.18].flatMap((x) =>
                [-0.17, 0.17].map((z) => <Box key={`${x}${z}`} size={[0.04, 0.45, 0.04]} position={[x, 0.225, z]} color="#3e2614" />),
            )}
        </group>
    );
}

// The Institute's tannoy speaker, high on the wall.
export function TannoySpeaker() {
    return (
        <group position={[HALL.width / 2 - 0.08, 2.6, 4.2]} rotation={[0, -Math.PI / 2, 0]}>
            <Box size={[0.3, 0.22, 0.12]} color="#d8d2c2" />
            {[-0.06, 0, 0.06].map((y) => (
                <Box key={y} size={[0.22, 0.02, 0.01]} position={[0, y, 0.062]} color="#3a342c" />
            ))}
        </group>
    );
}
