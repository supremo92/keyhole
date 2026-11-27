import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Raycaster, Vector2, type Object3D } from "three";
import { backToNote, leaveRoom } from "../lib/flow";
import { useView } from "../stores/view";
import { sounds } from "../lib/sound";
import { AIM_NDC, CAT_ID, DOORMAT_EXIT, DOORMAT_ZONE, EXIT_ID, WRITE_ID } from "./layout";

// Walk up the parents to find the interactive thing a mesh belongs to.
function interactIdOf(object: Object3D | null): string | null {
    for (let o = object; o; o = o.parent) {
        if (typeof o.userData.interactId === "string") return o.userData.interactId;
    }
    return null;
}

// While peeking, whatever sits in the centre of the keyhole is "aimed at", and clicking
// does something (leave, go back to the note, annoy the cat); inventory tags just show their
// glyph. In the doormat strip at the bottom of the screen the mouse pointer is visible
// instead, and picks the floor icons (or anything else) directly.
export function KeyholeAim() {
    const { camera, scene } = useThree();
    const target = useThree((s) => s.events.connected) as HTMLElement | undefined;
    const raycaster = useMemo(() => new Raycaster(), []);
    const aim = useMemo(() => new Vector2(AIM_NDC[0], AIM_NDC[1]), []);
    const cursor = useRef("");

    useFrame(({ pointer, size }) => {
        const state = useView.getState();
        const { mode, hoveredId, set } = state;
        const fromBottom = ((pointer.y + 1) / 2) * size.height;
        const doormat =
            mode === "peeking" && (state.doormat ? fromBottom <= DOORMAT_EXIT : fromBottom <= DOORMAT_ZONE);
        if (doormat !== state.doormat) set({ doormat });
        let id: string | null = null;
        if (mode === "peeking") {
            raycaster.setFromCamera(doormat ? pointer : aim, camera);
            const hit = raycaster.intersectObjects(scene.children, true)[0];
            id = hit ? interactIdOf(hit.object) : null;
        }
        if (id !== hoveredId) set({ hoveredId: id });

        // Hide the pointer while looking around (the aiming ring takes its place).
        const next = mode !== "peeking" ? "" : !doormat ? "none" : id ? "pointer" : "";
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
            // Inventory tags just show their glyph; there's nothing to click.
        };
        target.addEventListener("click", click);
        return () => target.removeEventListener("click", click);
    }, [target]);

    return null;
}
