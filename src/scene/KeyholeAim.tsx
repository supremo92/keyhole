import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Raycaster, Vector2, type Object3D } from "three";
import { backToNote, leaveRoom } from "../lib/flow";
import { sounds } from "../lib/sound";
import { useView } from "../stores/view";
import { AIM_NDC, CAT_ID, EXIT_ID, WRITE_ID } from "./layout";

// Walk up the parents to find the interactive thing a mesh belongs to.
function interactIdOf(object: Object3D | null): string | null {
    for (let o = object; o; o = o.parent) {
        if (typeof o.userData.interactId === "string") return o.userData.interactId;
    }
    return null;
}

// Extra rays in a small ring around the aim point, so things don't have to be lined up
// exactly to be picked: aiming "near" something counts.
const RING = 0.045;
const OFFSETS: [number, number][] = [[0, 0], ...Array.from({ length: 8 }, (_, i) => [Math.cos((i / 8) * Math.PI * 2) * RING, Math.sin((i / 8) * Math.PI * 2) * RING] as [number, number])];

// While peeking, the mouse turns the view and whatever sits in the middle of the keyhole is
// "aimed at". Clicking does something (leave, go back to the note, annoy the cat); inventory
// tags and crib notes just show what they say. The mouse pointer is hidden throughout.
export function KeyholeAim() {
    const { camera, scene } = useThree();
    const target = useThree((s) => s.events.connected) as HTMLElement | undefined;
    const raycaster = useMemo(() => new Raycaster(), []);
    const ray = useMemo(() => new Vector2(), []);
    const cursor = useRef("");

    useFrame(() => {
        const { mode, hoveredId, set } = useView.getState();
        let id: string | null = null;
        if (mode === "peeking") {
            // The centre ray wins if it hits something; otherwise the nearest hit in the ring.
            let best = Infinity;
            for (const [dx, dy] of OFFSETS) {
                raycaster.setFromCamera(ray.set(AIM_NDC[0] + dx, AIM_NDC[1] + dy), camera);
                const hit = raycaster.intersectObjects(scene.children, true)[0];
                const hitId = hit ? interactIdOf(hit.object) : null;
                if (!hitId) continue;
                if (dx === 0 && dy === 0) {
                    id = hitId;
                    break;
                }
                if (hit.distance < best) {
                    best = hit.distance;
                    id = hitId;
                }
            }
        }
        if (id !== hoveredId) set({ hoveredId: id });

        // No mouse pointer while peeking: the aiming ring takes its place.
        const next = mode === "peeking" ? "none" : "";
        // Compare with the real value: hover handlers elsewhere (doors) also set it.
        if (mode === "peeking" ? document.body.style.cursor !== next : cursor.current !== next) {
            document.body.style.cursor = next;
        }
        cursor.current = next;
    });

    useEffect(() => {
        if (!target) return;
        const click = () => {
            const { mode, hoveredId } = useView.getState();
            if (mode !== "peeking" || !hoveredId) return;
            if (hoveredId === EXIT_ID) void leaveRoom();
            else if (hoveredId === WRITE_ID) void backToNote();
            else if (hoveredId === CAT_ID || hoveredId === "tag:cat") sounds.meow();
            // Inventory tags and crib notes just show what they say; nothing to click.
        };
        target.addEventListener("click", click);
        return () => target.removeEventListener("click", click);
    }, [target]);

    return null;
}
