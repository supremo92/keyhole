import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { CanvasTexture, SRGBColorSpace, type Group, type Mesh, type MeshBasicMaterial, type PointLight } from "three";
import { glyphOf, type Word } from "../../shared/lexicon";
import { useReader } from "../lib/reader";
import { useView } from "../stores/view";
import { Box } from "./Box";
import { Cat } from "./Cat";
import { THE_CAT } from "./catTypes";
import { Furniture } from "./Furniture";
import type { Vec3 } from "./layout";
import { tagId } from "./rooms";
import { crackTexture, dampTexture, nightSky } from "./textures";

// Room-local coordinates: floor at y 0, the door at z 0, the back wall at z -6, side walls
// at x -3 and 3. The keyhole looks in from just in front of the door.

// ---------------------------------------------------------------- Shared pieces

// An Institute inventory tag. Aim the keyhole at the object and its glyph shows: that's how
// you learn what things are called here.
export function Tag({ word, position, hit, hitAt = [0, 0, 0], tagAt = [0, 0, 0] }: { word: Word; position: Vec3; hit: Vec3; hitAt?: Vec3; tagAt?: Vec3 }) {
    const id = tagId(word);
    const aimed = useView((s) => s.mode === "peeking" && s.hoveredId === id);
    const read = useReader();
    const glyph = glyphOf(word);
    const reading = read(glyph);
    return (
        <group position={position} userData={{ interactId: id }}>
            <mesh position={hitAt}>
                <boxGeometry args={hit} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            {/* The little paper tag on a string. */}
            <group position={tagAt}>
                <Box size={[0.004, 0.08, 0.004]} position={[0, 0.04, 0]} color="#ddd" />
                <Box size={[0.07, 0.1, 0.006]} position={[0, -0.04, 0]} rotation={[0, 0, 0.15]} color={aimed ? "#fff6c8" : "#efe4c4"} />
            </group>
            <Html position={[tagAt[0], tagAt[1] + 0.3, tagAt[2]]} center zIndexRange={[5, 0]} pointerEvents="none">
                <div className={`note-label tag-label ${aimed ? "show" : ""}`}>
                    <span className="tag-head">Inventory tag</span>
                    <strong className="tag-glyph">{glyph}</strong>
                    <span className={reading?.sure ? "" : "pencilled"}>{reading ? reading.word : "?"}</span>
                </div>
            </Html>
        </group>
    );
}

// Something moving at the edge of the keyhole. Gone before you can look properly.
export function Lurker({ from, to, every = [7, 14], height = 1.75 }: { from: Vec3; to: Vec3; every?: [number, number]; height?: number }) {
    const figure = useRef<Mesh>(null);
    const [firstAt] = useState(() => 2 + Math.random() * 3);
    const plan = useRef({ start: -1, next: firstAt });
    useFrame(({ clock }) => {
        const m = figure.current;
        if (!m) return;
        const t = clock.elapsedTime;
        const p = plan.current;
        if (p.start < 0 && t > p.next && useView.getState().mode === "peeking") p.start = t;
        const k = p.start < 0 ? -1 : (t - p.start) / 0.9;
        if (k > 1) {
            p.start = -1;
            p.next = t + every[0] + Math.random() * (every[1] - every[0]);
        }
        m.visible = k >= 0 && k <= 1;
        if (!m.visible) return;
        m.position.set(from[0] + (to[0] - from[0]) * k, height / 2, from[2] + (to[2] - from[2]) * k);
        (m.material as MeshBasicMaterial).opacity = Math.sin(k * Math.PI) * 0.85;
    });
    return (
        <mesh ref={figure} visible={false}>
            <capsuleGeometry args={[0.24, height - 0.48, 4, 10]} />
            <meshBasicMaterial color="#050302" transparent depthWrite={false} />
        </mesh>
    );
}

// A window in the back wall onto the night. Optionally open, with snow blowing in.
function NightWindow({ x, y = 1.6, w = 1.4, h = 1.25, open = false, snow = false }: { x: number; y?: number; w?: number; h?: number; open?: boolean; snow?: boolean }) {
    const curtains = useRef<(Group | null)[]>([]);
    useFrame(({ clock }) => {
        curtains.current.forEach((c, i) => {
            if (c) c.rotation.x = open ? 0.35 + Math.sin(clock.elapsedTime * (2.3 + i) + i) * 0.25 : 0.02;
        });
    });
    const frame = "#e8e0d0";
    return (
        <group position={[x, y, -5.99]}>
            <mesh position={[0, 0, 0.002]}>
                <planeGeometry args={[w, h]} />
                <meshBasicMaterial map={nightSky(snow)} />
            </mesh>
            <Box size={[w + 0.12, 0.08, 0.08]} position={[0, h / 2, 0.03]} color={frame} />
            <Box size={[w + 0.2, 0.08, 0.18]} position={[0, -h / 2, 0.07]} color={frame} />
            <Box size={[0.08, h, 0.08]} position={[-w / 2, 0, 0.03]} color={frame} />
            <Box size={[0.08, h, 0.08]} position={[w / 2, 0, 0.03]} color={frame} />
            {/* The two casements: shut, or one swung wide open into the room. */}
            <group position={[w / 2, 0, 0.05]} rotation={[0, open ? -1.2 : 0, 0]}>
                <Box size={[w / 2, h - 0.06, 0.03]} position={[-w / 4, 0, 0]} color="#9fc4e0" opacity={0.25} />
                <Box size={[0.04, h - 0.06, 0.04]} position={[-w / 2 + 0.02, 0, 0]} color={frame} />
            </group>
            <Box size={[w / 2, h - 0.06, 0.03]} position={[-w / 4, 0, 0.05]} color="#9fc4e0" opacity={0.25} />
            {/* Curtains, flapping in the draught. */}
            {[-1, 1].map((s, i) => (
                <group key={s} ref={(g) => void (curtains.current[i] = g)} position={[s * (w / 2 + 0.15), h / 2 + 0.1, 0.12]}>
                    <Box size={[0.35, h + 0.3, 0.02]} position={[0, -(h + 0.3) / 2, 0]} color="#a8423a" />
                </group>
            ))}
            {snow && open && <Snowfall w={w} h={h} />}
            {/* Snow piling up on the sill. */}
            {snow && <Box size={[w, 0.04, 0.16]} position={[0, -h / 2 + 0.06, 0.07]} color="#f4f8fb" />}
        </group>
    );
}

// Flakes drifting in through the open window and settling on the floor.
function Snowfall({ w, h }: { w: number; h: number }) {
    const flakes = useRef<(Mesh | null)[]>([]);
    const [seeds] = useState(() => Array.from({ length: 40 }, (_, i) => ({ x: Math.random(), y: Math.random(), s: 0.4 + Math.random() * 0.6, o: i / 40 })));
    useFrame(({ clock }) => {
        flakes.current.forEach((f, i) => {
            if (!f) return;
            const seed = seeds[i];
            const k = (clock.elapsedTime * 0.18 * seed.s + seed.o) % 1;
            f.position.set((seed.x - 0.5) * w + Math.sin(k * 8 + i) * 0.15, h / 2 - seed.y * h * 0.5 - k * 1.6, k * 2.2);
        });
    });
    return (
        <>
            {seeds.map((_, i) => (
                <mesh key={i} ref={(m) => void (flakes.current[i] = m)}>
                    <sphereGeometry args={[0.012, 6, 6]} />
                    <meshBasicMaterial color="#ffffff" />
                </mesh>
            ))}
        </>
    );
}

// A soft, warm, flickering light (candles, lamps).
function Flicker({ position, color, intensity, distance = 4 }: { position: Vec3; color: string; intensity: number; distance?: number }) {
    const light = useRef<PointLight>(null);
    useFrame(({ clock }) => {
        const t = clock.elapsedTime;
        if (light.current) light.current.intensity = intensity * (0.85 + Math.sin(t * 13) * 0.06 + Math.sin(t * 7.3) * 0.06);
    });
    return <pointLight ref={light} position={position} color={color} intensity={intensity} distance={distance} decay={1.5} />;
}

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

// ---------------------------------------------------------------- Room 1: the flat

export function FlatScene({ solved, catVisits }: { solved: boolean; catVisits: boolean }) {
    const blanket = useRef<Group>(null);
    const [mugSpot] = useState(() => pick([0, 1, 2]));
    useFrame(({ clock }) => {
        // Something under the blanket is shivering. Or was.
        if (blanket.current) blanket.current.position.x = solved ? 0 : Math.sin(clock.elapsedTime * 40) * 0.008;
    });
    return (
        <group>
            <NightWindow x={0.8} open={!solved} snow />
            <Tag word="window" position={[0.8, 1.6, -5.8]} hit={[1.6, 1.4, 0.3]} tagAt={[0.85, 0.5, 0.1]} />
            {/* Snow on the floor under the window (melting, once it's shut). */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.8, 0.012, -5.4]}>
                <circleGeometry args={[solved ? 0.35 : 0.6, 24]} />
                <meshStandardMaterial color={solved ? "#8aa0b0" : "#f4f8fb"} transparent opacity={solved ? 0.4 : 0.95} />
            </mesh>

            {/* The armchair, and the blanket heap. */}
            <group position={[-1.9, 0, -3.4]} rotation={[0, 0.7, 0]}>
                <Furniture type="armchair" />
                <group ref={blanket} position={[0, 0.55, 0.05]}>
                    {solved ? (
                        <Box size={[0.4, 0.08, 0.3]} position={[0, -0.02, 0.1]} color="#4f7a5a" />
                    ) : (
                        <>
                            <Box size={[0.66, 0.42, 0.55]} position={[0, 0.15, 0]} rotation={[0.1, 0.2, 0.05]} color="#4f7a5a" />
                            <Box size={[0.5, 0.3, 0.45]} position={[0.05, 0.42, -0.05]} rotation={[-0.15, -0.3, 0.1]} color="#5d8a68" />
                        </>
                    )}
                </group>
            </group>
            {/* A side table, and a mug that is never quite where it was. */}
            <group position={[-1.1, 0, -4.2]}>
                <Box size={[0.45, 0.5, 0.45]} position={[0, 0.25, 0]} color="#8b5a2b" />
                <mesh position={[[-0.12, 0.1, 0.05][mugSpot], 0.56, [0.1, -0.1, 0.12][mugSpot]]} castShadow>
                    <cylinderGeometry args={[0.04, 0.035, 0.1, 12]} />
                    <meshStandardMaterial color="#d9e2e6" />
                </mesh>
            </group>
            {/* Standing lamp and coat stand (with a hat). */}
            <group position={[2.3, 0, -4.6]}>
                <Box size={[0.04, 1.5, 0.04]} position={[0, 0.75, 0]} color="#2f2a26" />
                <mesh position={[0, 1.6, 0]}>
                    <coneGeometry args={[0.25, 0.3, 16, 1, true]} />
                    <meshStandardMaterial color="#e8c88a" side={2} emissive="#5a4020" />
                </mesh>
                <Flicker position={[0, 1.45, 0]} color="#ffd9a0" intensity={3} />
            </group>
            <Tag word="light" position={[2.3, 0, -4.6]} hit={[0.6, 0.6, 0.6]} hitAt={[0, 1.55, 0]} tagAt={[0.2, 1.3, 0.1]} />
            <group position={[2.4, 0, -1.8]}>
                <Box size={[0.05, 1.7, 0.05]} position={[0, 0.85, 0]} color="#5e3a1c" />
                <mesh position={[0, 1.78, 0]}>
                    <cylinderGeometry args={[0.13, 0.15, 0.14, 16]} />
                    <meshStandardMaterial color="#2b2b30" />
                </mesh>
                <mesh position={[0, 1.71, 0]}>
                    <cylinderGeometry args={[0.24, 0.24, 0.015, 20]} />
                    <meshStandardMaterial color="#2b2b30" />
                </mesh>
                <Box size={[0.5, 0.7, 0.12]} position={[0, 1.25, 0.08]} color="#7a5233" />
            </group>
            <Tag word="hat" position={[2.4, 0, -1.8]} hit={[0.5, 0.35, 0.5]} hitAt={[0, 1.76, 0]} tagAt={[-0.2, 1.65, 0.1]} />
            {/* Rug. */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.4, 0.008, -2.8]}>
                <circleGeometry args={[1.0, 32]} />
                <meshStandardMaterial color="#9a5a3a" roughness={1} />
            </mesh>
            {catVisits && <Cat mood="sleep" coat={THE_CAT} position={[-0.4, 0.01, -2.6]} rotY={1.2} />}
            <Lurker from={[-3.4, 0, -5.4]} to={[-2.2, 0, -6.4]} />
        </group>
    );
}

// ---------------------------------------------------------------- Room 2: the party

let bannerArt: CanvasTexture | null = null;
function banner() {
    if (bannerArt) return bannerArt;
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 200;
    const g = c.getContext("2d")!;
    g.fillStyle = "#f6d34a";
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = "#c4577d";
    g.font = "bold 120px serif";
    g.textAlign = "center";
    g.fillText(`${glyphOf("cake")}  ${glyphOf("good")}  ${glyphOf("good")}`, c.width / 2, 145);
    bannerArt = new CanvasTexture(c);
    bannerArt.colorSpace = SRGBColorSpace;
    return bannerArt;
}

const PARTY = ["#e84a8a", "#4ab0e8", "#f6d34a", "#6cd17a", "#a66ce8"];

export function PartyScene({ solved }: { solved: boolean }) {
    const ball = useRef<Group>(null);
    const lights = useRef<Group>(null);
    useFrame(({ clock }) => {
        if (ball.current) ball.current.rotation.y = clock.elapsedTime * 0.8;
        if (lights.current) lights.current.rotation.y = clock.elapsedTime * 0.9;
    });
    return (
        <group>
            {/* The banner. It says something, in their script. */}
            <mesh position={[0, 2.35, -5.98]}>
                <planeGeometry args={[3, 0.55]} />
                <meshStandardMaterial map={banner()} />
            </mesh>
            {/* Bunting criss-crossing the ceiling. */}
            {[-1.5, 0, 1.5].map((z, row) =>
                Array.from({ length: 11 }, (_, i) => (
                    <mesh key={`${row}-${i}`} position={[-2.7 + i * 0.54, 2.75 - Math.sin((i / 10) * Math.PI) * 0.25, z - 2.5]} rotation={[0, 0, Math.PI]}>
                        <coneGeometry args={[0.1, 0.18, 3]} />
                        <meshStandardMaterial color={PARTY[(i + row) % PARTY.length]} />
                    </mesh>
                )),
            )}
            {/* Balloons on the ceiling; a couple have given up. */}
            {[
                [-2.2, -1.2],
                [-1.4, -4.8],
                [1.8, -4.2],
                [2.4, -2.0],
            ].map(([x, z], i) => (
                <mesh key={i} position={[x, 2.75, z]} scale={[1, 1.15, 1]}>
                    <sphereGeometry args={[0.2, 16, 16]} />
                    <meshStandardMaterial color={PARTY[i]} roughness={0.3} />
                </mesh>
            ))}
            <mesh position={[1.2, 0.08, -1.6]} scale={[1.3, 0.5, 1]}>
                <sphereGeometry args={[0.15, 12, 12]} />
                <meshStandardMaterial color={PARTY[4]} roughness={0.5} />
            </mesh>
            {/* Disco ball and its coloured lights. */}
            <group ref={ball} position={[0, 2.6, -3]}>
                <mesh>
                    <sphereGeometry args={[0.22, 12, 8]} />
                    <meshStandardMaterial color="#d8dde2" metalness={1} roughness={0.15} flatShading />
                </mesh>
            </group>
            <group ref={lights} position={[0, 2.4, -3]}>
                <pointLight position={[1.2, 0, 0]} color="#ff5fa8" intensity={6} distance={5} />
                <pointLight position={[-1.2, 0, 0]} color="#5fc2ff" intensity={6} distance={5} />
            </group>

            {/* The table, the cake, the empty chairs. */}
            <group position={[0, 0, -3.2]}>
                <Furniture type="table" />
                <Box size={[1.24, 0.01, 0.84]} position={[0, 0.785, 0]} color="#fff4f8" />
                <group position={[0, 0.79, 0]}>
                    <mesh position={[0, 0.08, 0]} castShadow>
                        <cylinderGeometry args={[0.24, 0.24, 0.16, 24, 1, false, 0, solved ? Math.PI * 1.6 : Math.PI * 2]} />
                        <meshStandardMaterial color="#f6e2c4" />
                    </mesh>
                    <mesh position={[0, 0.2, 0]}>
                        <cylinderGeometry args={[0.16, 0.16, 0.1, 24, 1, false, 0, solved ? Math.PI * 1.6 : Math.PI * 2]} />
                        <meshStandardMaterial color="#f29bc0" />
                    </mesh>
                    {[-0.06, 0, 0.06].map((x) => (
                        <group key={x} position={[x, 0.29, 0]}>
                            <Box size={[0.015, 0.08, 0.015]} color="#4ab0e8" />
                            <mesh position={[0, 0.055, 0]}>
                                <sphereGeometry args={[0.012, 8, 8]} />
                                <meshBasicMaterial color="#ffd27a" />
                            </mesh>
                        </group>
                    ))}
                    <Flicker position={[0, 0.45, 0]} color="#ffb85a" intensity={1.5} distance={2} />
                </group>
                {[-0.85, 0.85].flatMap((x) => [-0.2, 0.25].map((z) => [x, z])).map(([x, z], i) => (
                    <group key={i} position={[x, 0, z]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
                        <Box size={[0.38, 0.04, 0.36]} position={[0, 0.45, 0]} color="#e8e0d0" />
                        <Box size={[0.38, 0.4, 0.04]} position={[0, 0.68, -0.17]} color="#e8e0d0" />
                        {[-0.16, 0.16].flatMap((a) => [-0.15, 0.15].map((b) => <Box key={`${a}${b}`} size={[0.03, 0.45, 0.03]} position={[a, 0.225, b]} color="#c9bfae" />))}
                        {/* A party hat waiting on each seat. */}
                        <mesh position={[0, 0.58, 0]}>
                            <coneGeometry args={[0.07, 0.2, 14]} />
                            <meshStandardMaterial color={PARTY[i % PARTY.length]} />
                        </mesh>
                    </group>
                ))}
            </group>
            <Tag word="cake" position={[0, 0, -3.2]} hit={[0.6, 0.45, 0.6]} hitAt={[0, 0.95, 0]} tagAt={[0.3, 0.9, 0.25]} />
            <Tag word="hat" position={[0.85, 0, -2.95]} hit={[0.25, 0.3, 0.25]} hitAt={[0, 0.6, 0]} tagAt={[0.1, 0.55, 0.12]} />
            {/* The cat, asleep on the cake. Until someone asks it to move. */}
            {!solved && <Cat mood="sleep" coat={THE_CAT} position={[0, 1.08, -3.2]} rotY={0.4} interactId={tagId("cat")} />}
            {!solved && <Tag word="cat" position={[0, 0, -3.2]} hit={[0.01, 0.01, 0.01]} tagAt={[-0.3, 1.25, 0.2]} />}
            {/* Presents nobody brought. */}
            <Box size={[0.3, 0.3, 0.3]} position={[-2.3, 0.15, -5.3]} color="#4ab0e8" />
            <Box size={[0.32, 0.04, 0.04]} position={[-2.3, 0.3, -5.3]} color="#f6d34a" />
            <Box size={[0.22, 0.22, 0.22]} position={[-1.95, 0.11, -5.5]} color="#6cd17a" />
            <Lurker from={[3.4, 0, -5.6]} to={[1.6, 0, -6.4]} every={[9, 16]} />
        </group>
    );
}

// ---------------------------------------------------------------- Room 3: the office

const DRIP_AT: Vec3 = [1.6, 0, -3.4];

export function OfficeScene({ solved, catVisits }: { solved: boolean; catVisits: boolean }) {
    const chair = useRef<Group>(null);
    const tube = useRef<PointLight>(null);
    const tubeMat = useRef<MeshBasicMaterial>(null);
    const drops = useRef<(Mesh | null)[]>([]);
    const [spin] = useState(() => 0.4 + Math.random() * 0.8);
    useFrame(({ clock }, dt) => {
        const t = clock.elapsedTime;
        // The chair is still turning. Someone was just sitting in it.
        if (chair.current) chair.current.rotation.y += dt * spin * Math.max(0, 1 - t / 40);
        // The strip light can't make up its mind.
        const on = Math.sin(t * 2.1) + Math.sin(t * 17) * 0.4 > -1.1;
        if (tube.current) tube.current.intensity = on ? 7 : 0.5;
        if (tubeMat.current) tubeMat.current.color.set(on ? "#f2fff4" : "#56605a");
        drops.current.forEach((d, i) => {
            if (!d) return;
            const k = (t * 0.9 + i / 3) % 1;
            d.position.y = 2.95 - k * k * 2.6;
        });
    });
    const cabinet = (x: number, z: number, open = false) => (
        <group position={[x, 0, z]} rotation={[0, Math.PI / 2, 0]}>
            <Box size={[0.5, 1.35, 0.6]} position={[0, 0.675, 0]} color="#7d8580" metalness={0.4} />
            {[1.1, 0.75, 0.4].map((y, i) => (
                <group key={y} position={[0, y, open && i === 1 ? 0.25 : 0]}>
                    <Box size={[0.44, 0.3, 0.02]} position={[0, 0, 0.31]} color="#8e9690" metalness={0.4} />
                    <Box size={[0.1, 0.02, 0.03]} position={[0, 0.06, 0.33]} color="#c9cfd2" metalness={0.8} />
                </group>
            ))}
        </group>
    );
    return (
        <group>
            {/* Strip light on the ceiling. */}
            <Box size={[1.4, 0.06, 0.2]} position={[0, 2.95, -2.6]} color="#cfd4cc" />
            <mesh position={[0, 2.915, -2.6]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.3, 0.12]} />
                <meshBasicMaterial ref={tubeMat} color="#f2fff4" />
            </mesh>
            <pointLight ref={tube} position={[0, 2.6, -2.6]} color="#e6ffe8" intensity={7} distance={9} decay={1.4} />

            {/* Desk, typewriter, and the chair that won't stop turning. */}
            <group position={[-0.6, 0, -4.4]}>
                <Furniture type="desk" />
                <group position={[-0.15, 0.78, 0.05]}>
                    <Box size={[0.42, 0.12, 0.3]} position={[0, 0.06, 0]} color="#2f3a33" />
                    <Box size={[0.38, 0.03, 0.12]} position={[0, 0.13, 0.1]} color="#1c221e" />
                    <Box size={[0.24, 0.2, 0.004]} position={[0, 0.25, -0.08]} rotation={[-0.2, 0, 0]} color="#f8f4ea" />
                </group>
                <Box size={[0.22, 0.12, 0.3]} position={[0.4, 0.84, 0]} color="#f3ead2" />
            </group>
            <group ref={chair} position={[-0.6, 0, -3.6]}>
                <Box size={[0.45, 0.07, 0.45]} position={[0, 0.48, 0]} color="#2b3530" />
                <Box size={[0.45, 0.5, 0.06]} position={[0, 0.78, -0.2]} color="#2b3530" />
                <Box size={[0.05, 0.42, 0.05]} position={[0, 0.24, 0]} color="#888" metalness={0.7} />
                <Box size={[0.5, 0.03, 0.08]} position={[0, 0.03, 0]} color="#333" />
                <Box size={[0.08, 0.03, 0.5]} position={[0, 0.03, 0]} color="#333" />
            </group>
            {/* Filing cabinets. One drawer is open. */}
            {cabinet(-2.65, -1.6)}
            {cabinet(-2.65, -2.3, true)}
            {cabinet(-2.65, -3.0)}
            {catVisits && <Cat mood="stare" coat={THE_CAT} position={[-2.65, 1.35, -2.3]} rotY={Math.PI / 2} />}

            {/* The leak: a stain on the ceiling, drips, and a bucket. */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[DRIP_AT[0], 2.995, DRIP_AT[2]]}>
                <planeGeometry args={[1.4, 1.4]} />
                <meshBasicMaterial map={dampTexture(5)} transparent depthWrite={false} />
            </mesh>
            {[0, 1, 2].map((i) => (
                <mesh key={i} ref={(m) => void (drops.current[i] = m)} position={[DRIP_AT[0], 2.9, DRIP_AT[2]]}>
                    <sphereGeometry args={[0.02, 8, 8]} />
                    <meshStandardMaterial color="#cfe3ef" transparent opacity={0.85} />
                </mesh>
            ))}
            <Tag word="drips" position={DRIP_AT} hit={[0.25, 2.2, 0.25]} hitAt={[0, 1.7, 0]} tagAt={[0.15, 2.3, 0.1]} />
            <group position={DRIP_AT}>
                <mesh position={[0, 0.17, 0]} castShadow>
                    <cylinderGeometry args={[0.18, 0.14, 0.34, 18, 1, true]} />
                    <meshStandardMaterial color="#8a9aa6" metalness={0.6} side={2} />
                </mesh>
                <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.165, 18]} />
                    <meshStandardMaterial color="#4a6070" roughness={0.1} />
                </mesh>
            </group>
            <Tag word="bucket" position={DRIP_AT} hit={[0.45, 0.4, 0.45]} hitAt={[0, 0.18, 0]} tagAt={[-0.2, 0.42, 0.1]} />
            {/* The tally, scratched into the wall beside it. Someone has been counting. */}
            <group position={[2.98, 1.3, -3.4]} rotation={[0, -Math.PI / 2, 0]}>
                {[0, 1, 2, 3].map((i) => (
                    <Box key={i} size={[0.025, 0.32, 0.01]} position={[-0.15 + i * 0.09, 0, 0]} color="#2b2420" />
                ))}
                <Box size={[0.025, 0.46, 0.01]} position={[-0.015, 0, 0.004]} rotation={[0, 0, 1.1]} color="#2b2420" />
            </group>
            {/* Papers everywhere. */}
            {[0, 1, 2, 3, 4].map((i) => (
                <Box key={i} size={[0.21, 0.004, 0.29]} position={[0.4 + i * 0.25, 0.006, -1.6 - (i % 2) * 0.3]} rotation={[0, i * 0.7, 0]} color="#f3ead2" />
            ))}
            {solved && <Box size={[0.25, 0.3, 0.004]} position={[2.97, 1.75, -3.4]} rotation={[0, -Math.PI / 2, 0.1]} color="#fff4c7" />}
            <Lurker from={[3.4, 0, -5.0]} to={[1.8, 0, -6.4]} every={[8, 15]} />
        </group>
    );
}

// ---------------------------------------------------------------- Room 4: the quiet room

// A shape under a dust sheet.
function Shrouded({ position, size, rotY = 0 }: { position: Vec3; size: Vec3; rotY?: number }) {
    return (
        <group position={position} rotation={[0, rotY, 0]}>
            <Box size={size} position={[0, size[1] / 2, 0]} color="#d9d4c8" roughness={1} />
            <Box size={[size[0] + 0.12, 0.08, size[2] + 0.12]} position={[0, 0.04, 0]} color="#cfc9bb" roughness={1} />
        </group>
    );
}

export function QuietScene({ solved }: { solved: boolean }) {
    return (
        <group>
            {/* A candle on the floor: the only light. */}
            <group position={[0.4, 0, -2.6]}>
                <mesh position={[0, 0.08, 0]}>
                    <cylinderGeometry args={[0.035, 0.035, 0.16, 12]} />
                    <meshStandardMaterial color="#efe8d6" />
                </mesh>
                <mesh position={[0, 0.18, 0]}>
                    <sphereGeometry args={[0.015, 8, 8]} />
                    <meshBasicMaterial color="#ffc46a" />
                </mesh>
                <Flicker position={[0, 0.35, 0]} color="#ffb257" intensity={5} distance={5} />
            </group>
            <Tag word="light" position={[0.4, 0, -2.6]} hit={[0.3, 0.35, 0.3]} hitAt={[0, 0.15, 0]} tagAt={[0.15, 0.3, 0.05]} />

            {/* Furniture under dust sheets. */}
            <Shrouded position={[-1.8, 0, -4.6]} size={[1.2, 0.8, 0.7]} rotY={0.2} />
            <Shrouded position={[1.9, 0, -4.9]} size={[0.8, 1.5, 0.5]} rotY={-0.3} />
            <Shrouded position={[-2.2, 0, -2.0]} size={[0.6, 0.55, 0.6]} />

            {/* The covered mirror. A corner of the sheet has slipped. */}
            <group position={[0, 0, -5.9]}>
                <Box size={[0.9, 1.9, 0.06]} position={[0, 1.15, 0]} color="#3a2a1a" />
                <Box size={[0.95, 1.7, 0.03]} position={[0, 1.25, 0.05]} color="#e3ded2" roughness={1} />
                <mesh position={[0.3, 0.55, 0.07]}>
                    <planeGeometry args={[0.25, 0.25]} />
                    <meshStandardMaterial color="#0d0f12" metalness={0.9} roughness={0.05} />
                </mesh>
            </group>

            {/* A small door in the back wall, boarded over from this side too. */}
            <group position={[-1.2, 0, -5.98]}>
                <Box size={[0.6, 1.2, 0.04]} position={[0, 0.6, 0]} color="#3a2e24" />
                <Box size={[0.75, 0.1, 0.03]} position={[0, 0.8, 0.04]} rotation={[0, 0, 0.2]} color="#7a6040" />
                <Box size={[0.75, 0.1, 0.03]} position={[0, 0.4, 0.04]} rotation={[0, 0, -0.15]} color="#7a6040" />
            </group>
            <Tag word="door" position={[-1.2, 0, -5.9]} hit={[0.7, 1.3, 0.2]} hitAt={[0, 0.6, 0]} tagAt={[0.3, 1.2, 0.08]} />

            {/* The chair in the corner, facing the wall. Later, it isn't. */}
            <group position={[2.4, 0, -2.6]} rotation={[0, solved ? Math.PI * 0.85 : -Math.PI / 2 + 0.1, 0]}>
                <Box size={[0.42, 0.05, 0.4]} position={[0, 0.45, 0]} color="#4a3524" />
                <Box size={[0.42, 0.55, 0.04]} position={[0, 0.75, -0.18]} color="#4a3524" />
                {[-0.18, 0.18].flatMap((x) => [-0.17, 0.17].map((z) => <Box key={`${x}${z}`} size={[0.04, 0.45, 0.04]} position={[x, 0.225, z]} color="#2e2016" />))}
            </group>

            {/* Scratches low on the walls. */}
            {[
                [-2.99, 0.4, -3.6, Math.PI / 2],
                [2.99, 0.35, -4.4, -Math.PI / 2],
            ].map(([x, y, z, r], i) => (
                <mesh key={i} position={[x, y, z]} rotation={[0, r, 0]}>
                    <planeGeometry args={[0.6, 0.6]} />
                    <meshBasicMaterial map={crackTexture(7 + i)} transparent depthWrite={false} />
                </mesh>
            ))}

            {/* Answered: a staff badge on the floor that isn't yours. */}
            {solved && (
                <group position={[-0.5, 0.006, -1.8]} rotation={[0, 0.6, 0]}>
                    <Box size={[0.09, 0.004, 0.13]} color="#f3ead2" />
                    <Box size={[0.06, 0.002, 0.05]} position={[0, 0.003, -0.025]} color="#7a7a7a" />
                    <Box size={[0.004, 0.002, 0.4]} position={[0, 0, 0.25]} color="#3a5a8a" />
                </group>
            )}
            {solved && <Tag word="operator" position={[-0.5, 0, -1.8]} hit={[0.3, 0.1, 0.3]} tagAt={[0.1, 0.2, 0.05]} />}
            <Lurker from={[-3.4, 0, -3.5]} to={[-1.4, 0, -6.4]} every={[4, 9]} />
            <Lurker from={[3.4, 0, -1.4]} to={[3.4, 0, -4.0]} every={[10, 18]} />
        </group>
    );
}
