import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Raycaster, Vector2, type Object3D } from "three";
import { leaveRoom, openNote } from "../lib/flow";
import { useView } from "../stores/view";
import { AIM_NDC } from "./layout";
import { EXIT_ID } from "./Room";

// Pixels from the bottom of the screen where the mouse pointer stays visible.
const CURSOR_ZONE = 150;

// Walk up the parents to find the interactive thing a mesh belongs to.
function interactIdOf(object: Object3D | null): string | null {
    for (let o = object; o; o = o.parent) {
        if (typeof o.userData.interactId === "string") return o.userData.interactId;
    }
    return null;
}

// While peeking, whatever sits in the centre of the keyhole is "aimed at".
// Clicking anywhere then takes out that note (or leaves, for the floor arrow).
export function KeyholeAim() {
    const { camera, scene } = useThree();
    const target = useThree((s) => s.events.connected) as HTMLElement | undefined;
    const raycaster = useMemo(() => new Raycaster(), []);
    const aim = useMemo(() => new Vector2(AIM_NDC[0], AIM_NDC[1]), []);
    const cursor = useRef("");

    useFrame(({ pointer, size }) => {
        const { mode, hoveredId, set } = useView.getState();
        let id: string | null = null;
        if (mode === "peeking") {
            raycaster.setFromCamera(aim, camera);
            const hit = raycaster.intersectObjects(scene.children, true)[0];
            id = hit ? interactIdOf(hit.object) : null;
        }
        if (id !== hoveredId) set({ hoveredId: id });

        // While peeking the mouse pointer is hidden (the keyhole's aiming ring takes its
        // place), except near the bottom of the screen where the buttons are.
        const fromBottom = ((pointer.y + 1) / 2) * size.height;
        const next = mode !== "peeking" ? "" : fromBottom > CURSOR_ZONE ? "none" : "";
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
            else void openNote(hoveredId);
        };
        target.addEventListener("click", click);
        return () => target.removeEventListener("click", click);
    }, [target]);

    return null;
}
