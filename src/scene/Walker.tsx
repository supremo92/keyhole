import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useView } from "../stores/view";

const SPEED = 4.5; // metres per second while a key is held
const WHEEL = 0.006; // metres per pixel of scroll

// Walk along the hallway with the scroll wheel, W/S or the arrow keys.
export function Walker() {
    const keys = useRef(new Set<string>());
    const target = useThree((s) => s.events.connected) as HTMLElement | undefined;

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            keys.current.add(e.key.toLowerCase());
        };
        const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
        const blur = () => keys.current.clear();
        window.addEventListener("keydown", down);
        window.addEventListener("keyup", up);
        window.addEventListener("blur", blur);
        return () => {
            window.removeEventListener("keydown", down);
            window.removeEventListener("keyup", up);
            window.removeEventListener("blur", blur);
        };
    }, []);

    useEffect(() => {
        if (!target) return;
        const wheel = (e: WheelEvent) => {
            const { mode, hallZ, walkTo } = useView.getState();
            if (mode !== "hallway") return;
            e.preventDefault();
            walkTo(hallZ + e.deltaY * WHEEL);
        };
        target.addEventListener("wheel", wheel, { passive: false });
        return () => target.removeEventListener("wheel", wheel);
    }, [target]);

    useFrame((_, dt) => {
        const { mode, hallZ, walkTo } = useView.getState();
        if (mode !== "hallway") return;
        const k = keys.current;
        const dir =
            (k.has("w") || k.has("arrowup") ? -1 : 0) + (k.has("s") || k.has("arrowdown") ? 1 : 0);
        if (dir !== 0) walkTo(hallZ + dir * SPEED * Math.min(dt, 0.05));
    });

    return null;
}
