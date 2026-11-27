import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Raycaster, Vector2, type Object3D } from "three";
import { leaveRoom, openNote } from "../lib/flow";
import { useView } from "../stores/view";
import { AIM_NDC } from "./layout";
import { EXIT_ID } from "./Room";

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

    useFrame(() => {
        const { mode, hoveredId, set } = useView.getState();
        let id: string | null = null;
        if (mode === "peeking") {
            raycaster.setFromCamera(aim, camera);
            const hit = raycaster.intersectObjects(scene.children, true)[0];
            id = hit ? interactIdOf(hit.object) : null;
        }
        if (id !== hoveredId) {
            set({ hoveredId: id });
            document.body.style.cursor = id ? "pointer" : "";
        }
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
